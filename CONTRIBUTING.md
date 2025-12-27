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
│  APPS: Tasks • Databases • Messages • Calendar • Finance • Web     │
│  Location: apps/{app}/readme.md                                     │
│  Defines: schema, actions, params, returns                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CONNECTORS: todoist • linear • postgres • copilot • imessage      │
│  Location: connectors/{connector}/                                  │
│    - readme.md: auth config                                         │
│    - {app}.yaml: action→executor mappings                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EXECUTORS: rest: • graphql: • sql: • applescript: • command:      │
│  Location: AgentOS Core (Rust)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

| Layer | What | Location |
|-------|------|----------|
| **App** | Capability with unified schema | `apps/{app}/readme.md` |
| **Connector** | Service implementation | `connectors/{connector}/` |
| **Executor** | Protocol handler (Rust) | AgentOS Core |

---

## Security: No Shell Scripts

**`run:` blocks are not supported.** Connectors use declarative executor blocks only:

| Executor | Use Case |
|----------|----------|
| `rest:` | REST APIs |
| `graphql:` | GraphQL APIs |
| `sql:` | Database queries |
| `applescript:` | macOS automation |
| `command:` | CLI tools (user-approved via firewall grants) |

This ensures credentials never leave Rust core and all operations go through the firewall.

---

## Directory Structure

```
apps/
  tasks/readme.md         # Schema + actions
  databases/readme.md
  messages/readme.md
  ...

connectors/
  todoist/
    readme.md             # Auth config
    tasks.yaml            # Maps API → Tasks schema
  postgres/
    readme.md
    databases.yaml        # Maps API → Databases schema
  ...
```

**Filesystem is source of truth.** If `connectors/postgres/databases.yaml` exists, Postgres implements Databases.

---

## Adding a Connector

1. Create `connectors/{name}/readme.md` with auth config
2. Add `icon.svg` or `icon.png`
3. Add `{app}.yaml` for each app it implements

**See existing connectors for format.** Example: `connectors/todoist/` or `connectors/postgres/`.

---

## Adding an App

Most apps already exist. Only add new ones for genuinely new capability types.

1. Create `apps/{name}/readme.md` with schema + actions
2. Add `icon.svg`

**See existing apps for format.** Example: `apps/tasks/` or `apps/databases/`.

---

## Executor Quick Reference

**Look at existing connector YAMLs for real examples.** Here's the basic syntax:

### `rest:`
```yaml
rest:
  method: GET
  url: https://api.example.com/{{params.id}}
  body: { field: "{{params.value}}" }
```

### `graphql:`
```yaml
graphql:
  query: "query { items { id name } }"
  variables: { limit: "{{params.limit}}" }
```

### `sql:`
```yaml
sql:
  query: "SELECT * FROM table LIMIT {{params.limit}}"
```

### `command:`

Run CLI tools. Security is handled by the firewall (built-in rules + user grants).

```yaml
command:
  binary: tree
  args:
    - "-L"
    - "2"
    - "{{params.path}}"
  timeout: 30  # seconds, optional
```

**How it works:**
- Firewall blocks shells/interpreters/sudo by default (built-in rules)
- Other binaries prompt user on first use: "Allow `tree` to run?"
- User clicks **Always Allow** → grant saved, future calls auto-approved
- Grants are per-app (App A can use `rm`, App B might not)

**Blocked by firewall** (built-in rules, enabled by default):
- Shells: `sh`, `bash`, `zsh`, `fish`
- Interpreters: `python`, `node`, `ruby`, `perl`
- Privilege escalation: `sudo`, `su`, `doas`

**User-controlled** (via firewall grants):
- `ls`, `cat`, `tree`, `rm`, `cp`, `mv`, `mkdir`
- `ffmpeg`, `yt-dlp`, `pandoc`, `pdftotext`
- Any other CLI tool on user's system

### Chained Executors
```yaml
action:
  - graphql: { query: "..." }
    as: step1
  - rest:
      url: "https://api.example.com/{{step1.data.id}}"
```

---

## Schema Conventions

- **Flat structure** — no nested `metadata` objects
- **snake_case** — `created_at`, `parent_id`
- **Universal fields** — `id`, `connector`, `account`, `created_at`, `updated_at`, `url`
- **Connectors return what they have** — schema is the max, connectors are subsets

---

## Credentials

Connectors never see credential values. Auth config in `readme.md` only specifies WHERE credentials go:

```yaml
auth:
  type: api_key
  header: Authorization
  prefix: "Bearer "
```

AgentOS injects the actual value at runtime.
