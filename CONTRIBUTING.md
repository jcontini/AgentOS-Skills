# Contributing to AgentOS Integrations

## Mental Model

```
┌─────────────────────────────────────────────────────────────────────┐
│  INTERFACES: MCP Server • HTTP API • CarPlay • Widgets • ...       │
│  (All call into the same AgentOS Core)                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  APPS: Tasks • Books • Messages • Calendar • Finance • Databases   │
│  Location: apps/{app}/                                              │
│    - readme.md: schema, actions, params, returns                    │
│    - schema.sql: database tables (optional, for data apps)          │
│    - icon.svg: app icon                                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CONNECTORS: todoist • linear • goodreads • hardcover • postgres   │
│  Location: connectors/{connector}/                                  │
│    - readme.md: auth config                                         │
│    - {app}.yaml: action→executor mappings with transforms          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EXECUTORS: rest: • graphql: • sql: • csv: • command: • app:       │
│  Location: AgentOS Core (Rust)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

| Layer | What | Location |
|-------|------|----------|
| **App** | Capability with unified schema | `apps/{app}/` |
| **Connector** | Service implementation + transforms | `connectors/{connector}/` |
| **Executor** | Protocol handler (Rust) | AgentOS Core |

---

## Two Types of Apps

### 1. Pass-through Apps (e.g., Tasks, Calendar)
Data lives in external services. AgentOS queries them directly.

```
User → AgentOS → Linear API → Response
```

### 2. Data Apps (e.g., Books, Movies, Music)
Data is imported into a local SQLite database for unified access.

```
User → AgentOS → Local SQLite → Response
                     ↑
         Import from Goodreads CSV
         Sync with Hardcover API
```

**Data apps have:**
- `schema.sql` — defines database tables
- Per-app database at `~/.agentos/data/{app}.db`
- Auto-generated CRUD actions (list, get, create, update, delete)
- Custom import/sync actions via connectors

---

## App Structure

### Pass-through App
```
apps/tasks/
  readme.md     # Schema + actions
  icon.svg
```

### Data App
```
apps/books/
  readme.md     # Schema + actions
  schema.sql    # Database tables ← triggers per-app DB creation
  icon.svg
```

When `schema.sql` exists, AgentOS automatically:
1. Creates `~/.agentos/data/{app}.db`
2. Runs the schema SQL
3. Exposes CRUD actions (list, get, create, update, delete)

---

## Adding a Data App

### 1. Create the App

**`apps/books/schema.sql`**
```sql
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors JSON,
  isbn TEXT,
  status TEXT NOT NULL,  -- want_to_read, reading, read, dnf
  rating INTEGER,
  review TEXT,
  date_added TEXT,
  date_finished TEXT,
  source_connector TEXT NOT NULL,
  source_id TEXT NOT NULL,
  UNIQUE(source_connector, source_id)
);
```

**`apps/books/readme.md`**
```markdown
# Books

Track your reading library across services.

## Schema
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| title | string | Book title |
| authors | array | List of author names |
| status | enum | want_to_read, reading, read, dnf |
| rating | integer | 1-5 stars |
| ... | ... | ... |

## Actions
- **list** — List books with filters
- **get** — Get a single book
- **create** — Add a book
- **update** — Update a book
- **delete** — Remove a book
- **import** — Import from a connector (Goodreads CSV, etc.)
- **sync** — Sync with a connector (Hardcover API, etc.)
```

### 2. Create Connectors

**`connectors/goodreads/books.yaml`** — Import from CSV
```yaml
actions:
  import:
    csv:
      path: "{{params.path}}"
      response:
        mapping:
          goodreads_id: "[].Book Id"
          title: "[].Title"
          authors: "[].Author | to_array"
          isbn: "[].ISBN | strip_quotes"
          isbn13: "[].ISBN13 | strip_quotes"
          rating: "[].My Rating | to_int"
          status: |
            [].Exclusive Shelf == 'read' ? 'read' :
            [].Exclusive Shelf == 'currently-reading' ? 'reading' : 'want_to_read'
          date_added: "[].Date Added"
          date_finished: "[].Date Read"
          review: "[].My Review"
          source_connector: "'goodreads'"
          source_id: "[].Book Id"
    app:
      action: upsert
      table: books
      on_conflict: [source_connector, source_id]
```

**`connectors/hardcover/books.yaml`** — Sync with API
```yaml
actions:
  sync:
    # Step 1: Get books from local DB that need syncing
    - app:
        action: list
        table: books
        where:
          hardcover_id: null
      as: local_books
    
    # Step 2: For each book, search Hardcover and link
    - foreach: "{{local_books}}"
      graphql:
        query: |
          query($title: String!) {
            search(query: $title, query_type: "books", per_page: 1) {
              results
            }
          }
        variables:
          title: "{{item.title}}"
      as: search_result
    
    # Step 3: Push to Hardcover
    - graphql:
        query: |
          mutation($book_id: Int!, $status_id: Int!) {
            insert_user_book(object: {book_id: $book_id, status_id: $status_id}) {
              id
            }
          }
        variables:
          book_id: "{{search_result.results[0].id}}"
          status_id: |
            {{item.status}} == 'read' ? 3 :
            {{item.status}} == 'reading' ? 2 : 1
```

---

## Connector Structure

```
connectors/goodreads/
  readme.md       # Auth config (if any)
  icon.svg
  books.yaml      # Implements Books app
```

**One YAML per app.** If `connectors/hardcover/books.yaml` exists, Hardcover implements Books.

---

## Executors

### `rest:` — REST APIs
```yaml
rest:
  method: GET
  url: https://api.example.com/{{params.id}}
  body: { field: "{{params.value}}" }
  response:
    mapping:
      id: ".id"
      title: ".name"
```

### `graphql:` — GraphQL APIs
```yaml
graphql:
  query: "query { items { id name } }"
  variables: { limit: "{{params.limit}}" }
  response:
    root: "data.items"
    mapping:
      id: "[].id"
      title: "[].name"
```

### `sql:` — Database queries
```yaml
sql:
  query: "SELECT * FROM table WHERE id = {{params.id}}"
```

### `csv:` — CSV file import
```yaml
csv:
  path: "{{params.path}}"
  response:
    mapping:
      title: "[].Column Name"
      value: "[].Other Column | transform"
```

### `app:` — Per-app database operations
```yaml
# List with filters
app:
  action: list
  table: books
  where:
    status: "{{params.status}}"
  limit: "{{params.limit}}"

# Upsert (insert or update)
app:
  action: upsert
  table: books
  on_conflict: [source_connector, source_id]
```

### `command:` — CLI tools (firewall-controlled)
```yaml
command:
  binary: tree
  args: ["-L", "2", "{{params.path}}"]
  timeout: 30
```

### Chained Executors
```yaml
action:
  - graphql: { query: "..." }
    as: step1
  - rest:
      url: "https://api.example.com/{{step1.data.id}}"
```

---

## Response Mapping

All executors support `response.mapping` to transform data to the app schema.

### Syntax
```yaml
mapping:
  # Direct field mapping
  id: ".id"
  title: ".name"
  
  # Array mapping (use [] prefix)
  items: "[].id"
  
  # Transforms (pipe syntax)
  authors: "[].author | to_array"
  isbn: "[].isbn | strip_quotes"
  
  # Conditionals
  status: ".completed ? 'done' : 'open'"
  
  # Complex conditionals
  priority: |
    .priority == 'urgent' ? 1 :
    .priority == 'high' ? 2 :
    .priority == 'medium' ? 3 : 4
  
  # Static values
  connector: "'goodreads'"
```

### Built-in Transforms
| Transform | Description |
|-----------|-------------|
| `to_array` | Wrap single value in array |
| `to_int` | Convert to integer |
| `strip_quotes` | Remove `="..."` wrapper (common in CSV exports) |
| `trim` | Remove whitespace |
| `lowercase` | Convert to lowercase |
| `uppercase` | Convert to uppercase |
| `default:value` | Use value if null/empty |

---

## Security: No Shell Scripts

**`run:` blocks are not supported.** Connectors use declarative executor blocks only.

| Executor | Use Case |
|----------|----------|
| `rest:` | REST APIs |
| `graphql:` | GraphQL APIs |
| `sql:` | Database queries |
| `csv:` | File imports |
| `app:` | Local database operations |
| `command:` | CLI tools (user-approved via firewall) |

This ensures:
- Credentials never leave Rust core
- All operations go through the firewall
- No arbitrary code execution

---

## Schema Conventions

- **Flat structure** — no nested `metadata` objects
- **snake_case** — `created_at`, `parent_id`
- **Universal fields** — `id`, `source_connector`, `source_id`, `created_at`, `updated_at`
- **Connectors map to schema** — transforms happen in connector YAML

---

## Credentials

Connectors never see credential values. Auth config in `readme.md` specifies WHERE credentials go:

```yaml
auth:
  type: api_key
  header: Authorization
  prefix: "Bearer "
```

AgentOS injects the actual value at runtime.

---

## Example: Building a Movies App

### 1. Define the app schema

**`apps/movies/schema.sql`**
```sql
CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  directors JSON,
  status TEXT NOT NULL,  -- watchlist, watching, watched
  rating INTEGER,
  review TEXT,
  source_connector TEXT NOT NULL,
  source_id TEXT NOT NULL,
  UNIQUE(source_connector, source_id)
);
```

### 2. Add Letterboxd connector

**`connectors/letterboxd/movies.yaml`**
```yaml
actions:
  import:
    csv:
      path: "{{params.path}}"
      response:
        mapping:
          title: "[].Name"
          year: "[].Year | to_int"
          rating: "[].Rating | to_int"
          status: "'watched'"
          source_connector: "'letterboxd'"
          source_id: "[].Letterboxd URI"
    app:
      action: upsert
      table: movies
      on_conflict: [source_connector, source_id]
```

### 3. Done!

Users can now:
```
Import my Letterboxd data from ~/Downloads/letterboxd.csv
List all movies I've watched
```

No Rust code needed. The connector defines all the Letterboxd-specific logic.

---

## Testing

### Philosophy

**Tests live with the code they test.** Each app and connector can include its own tests. This scales to thousands of apps without bloating the core repo.

| What | Where | Tests |
|------|-------|-------|
| AgentOS Core | `agentos/` repo | Generic executor tests, MCP protocol, UI |
| Apps | `integrations/apps/{app}/` | Schema validation, CRUD operations |
| Connectors | `integrations/connectors/{connector}/` | Import/sync, field mapping |

### Directory Structure

```
integrations/
  apps/
    books/
      schema.sql
      readme.md
      icon.svg
      tests/                          ← App tests
        books.test.ts
        fixtures/
          sample-books.json
          
  connectors/
    goodreads/
      books.yaml
      readme.md
      tests/                          ← Connector tests
        import.test.ts
        fixtures/
          goodreads-export.csv        ← Sample data for tests
          
    hardcover/
      books.yaml
      tests/
        sync.test.ts
        
  tests/                              ← Shared test infrastructure
    utils/
      mcp-client.ts                   ← MCP test client
      fixtures.ts                     ← Common helpers
    setup.ts                          ← Global test setup
    tsconfig.json
    
  package.json                        ← Test dependencies (vitest, etc.)
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific app
npm test -- apps/books

# Run tests for a specific connector
npm test -- connectors/goodreads

# Run with verbose output
npm test -- --reporter=verbose

# Watch mode during development
npm test -- --watch
```

### What to Test

#### App Tests (`apps/{app}/tests/`)

Test that the app's schema and CRUD work correctly:

```typescript
// apps/books/tests/books.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AgentOS } from '../../../tests/utils/mcp-client';

describe('Books App', () => {
  let aos: AgentOS;

  beforeAll(async () => {
    aos = await AgentOS.connect();
  });

  afterAll(async () => {
    await aos.disconnect();
  });

  describe('CRUD', () => {
    it('can create a book', async () => {
      const book = await aos.call('Books', {
        action: 'create',
        params: {
          title: '[TEST] My Book',
          authors: ['Test Author'],
          status: 'want_to_read',
        },
      });

      expect(book.id).toBeDefined();
      expect(book.title).toBe('[TEST] My Book');

      // Cleanup
      await aos.call('Books', { action: 'delete', params: { id: book.id } });
    });

    it('can list books with filters', async () => {
      const books = await aos.call('Books', {
        action: 'list',
        params: { status: 'read', limit: 10 },
      });

      expect(Array.isArray(books)).toBe(true);
      books.forEach(book => {
        expect(book.status).toBe('read');
      });
    });
  });

  describe('Schema Validation', () => {
    it('requires title field', async () => {
      await expect(
        aos.call('Books', {
          action: 'create',
          params: { status: 'reading' }, // missing title
        })
      ).rejects.toThrow();
    });

    it('validates status enum', async () => {
      await expect(
        aos.call('Books', {
          action: 'create',
          params: { title: 'Test', status: 'invalid_status' },
        })
      ).rejects.toThrow();
    });
  });
});
```

#### Connector Tests (`connectors/{connector}/tests/`)

Test that the connector correctly imports/syncs data:

```typescript
// connectors/goodreads/tests/import.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AgentOS } from '../../../tests/utils/mcp-client';
import path from 'path';

describe('Goodreads Connector', () => {
  let aos: AgentOS;
  const fixtureDir = path.join(__dirname, 'fixtures');

  beforeAll(async () => {
    aos = await AgentOS.connect();
  });

  afterAll(async () => {
    await aos.disconnect();
  });

  describe('CSV Import', () => {
    it('imports books from Goodreads CSV', async () => {
      const csvPath = path.join(fixtureDir, 'goodreads-export.csv');
      
      const result = await aos.call('Books', {
        action: 'import',
        connector: 'goodreads',
        params: { path: csvPath, dry_run: true },
      });

      expect(result.imported).toBeGreaterThan(0);
      expect(result.errors).toEqual([]);
    });

    it('maps Goodreads fields correctly', async () => {
      const csvPath = path.join(fixtureDir, 'goodreads-export.csv');
      
      // Import with dry_run: false to actually insert
      await aos.call('Books', {
        action: 'import',
        connector: 'goodreads',
        params: { path: csvPath },
      });

      // Verify a known book was imported correctly
      const books = await aos.call('Books', {
        action: 'list',
        params: { limit: 100 },
      });

      const testBook = books.find(b => b.source_id === '12345'); // Known ID from fixture
      expect(testBook).toBeDefined();
      expect(testBook.source_connector).toBe('goodreads');
      expect(testBook.title).toBe('Expected Title');
      expect(testBook.isbn).toBe('0123456789');
    });

    it('handles ISBN with quotes wrapper', async () => {
      // Goodreads CSVs have ISBNs like ="0123456789"
      const csvPath = path.join(fixtureDir, 'goodreads-isbn-quotes.csv');
      
      await aos.call('Books', {
        action: 'import',
        connector: 'goodreads',
        params: { path: csvPath },
      });

      const books = await aos.call('Books', { action: 'list' });
      const book = books.find(b => b.source_id === 'isbn-test');
      
      expect(book.isbn).toBe('0123456789'); // Quotes stripped
    });

    it('maps shelf to status correctly', async () => {
      const csvPath = path.join(fixtureDir, 'goodreads-shelves.csv');
      
      await aos.call('Books', {
        action: 'import',
        connector: 'goodreads',
        params: { path: csvPath },
      });

      const books = await aos.call('Books', { action: 'list' });
      
      expect(books.find(b => b.source_id === 'shelf-read').status).toBe('read');
      expect(books.find(b => b.source_id === 'shelf-reading').status).toBe('reading');
      expect(books.find(b => b.source_id === 'shelf-toread').status).toBe('want_to_read');
    });
  });
});
```

### Test Fixtures

Place sample data in `tests/fixtures/` within each connector:

```
connectors/goodreads/tests/fixtures/
  goodreads-export.csv          # Full sample export
  goodreads-isbn-quotes.csv     # Edge case: ISBN formatting
  goodreads-shelves.csv         # Edge case: shelf mapping
  goodreads-empty.csv           # Edge case: empty file
```

**Fixture Best Practices:**
- Use small, focused fixtures (5-10 records max)
- Include edge cases (empty values, special characters)
- Use `[TEST]` prefix in titles for easy cleanup
- Don't commit real user data

### Shared Test Utilities

The `tests/utils/` directory provides common helpers:

```typescript
// tests/utils/mcp-client.ts
export class AgentOS {
  static async connect(): Promise<AgentOS>;
  async disconnect(): Promise<void>;
  async call(tool: string, args: object): Promise<any>;
}

// tests/utils/fixtures.ts
export const TEST_PREFIX = '[TEST]';
export function testId(): string;                    // Generate unique test ID
export function isTestData(str: string): boolean;   // Check if test data
export async function cleanup(aos: AgentOS): Promise<void>;  // Remove test data
```

### Test Environment

Tests run against a separate test database:
- Location: `~/.agentos/data/test/{app}.db`
- Set via: `AGENTOS_ENV=test`

This ensures tests don't affect your real data.

### Writing Good Tests

1. **Test behavior, not implementation** — Test what the connector does, not how
2. **Use fixtures** — Don't rely on external APIs in tests
3. **Clean up after** — Delete test data created during tests
4. **Test edge cases** — Empty files, missing fields, special characters
5. **Keep tests fast** — Use small fixtures, mock external calls

### CI Integration

Tests run automatically on PR:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm test
```

### Adding Tests to Your Contribution

When contributing an app or connector:

1. Create `tests/` directory in your app/connector folder
2. Add at least one test file (`*.test.ts`)
3. Include fixture files if needed
4. Run `npm test -- {your-path}` to verify
5. Tests must pass before merge
