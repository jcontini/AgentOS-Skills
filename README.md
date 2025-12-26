# AgentOS Integrations

Open-source apps and connectors for [AgentOS](https://github.com/jcontini/agentos).

## Mental Model

```
┌─────────────────────────────────────────────────────────────────────┐
│  INTERFACES: MCP Server • HTTP API • CarPlay • Widgets • ...       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  APPS: Tasks • Databases • Messages • Calendar • Finance • Web     │
│  Location: apps/{app}/readme.md                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CONNECTORS: todoist • linear • postgres • copilot • imessage      │
│  Location: connectors/{connector}/                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EXECUTORS: rest: • graphql: • sql: • applescript: • swift:        │
│  Location: AgentOS Core (Rust)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Structure

```
apps/                    # Capabilities with unified schemas
  tasks/readme.md        # Schema + actions (list, create, complete...)
  databases/readme.md    # Schema + actions (query, tables, describe...)
  messages/readme.md
  ...

connectors/              # Service implementations  
  todoist/
    readme.md            # Auth config + connector info
    tasks.yaml           # Maps Todoist API → Tasks schema
  postgres/
    readme.md
    databases.yaml       # Maps Postgres → Databases schema
  ...
```

## Core Concepts

| Layer | What | Examples |
|-------|------|----------|
| **App** | Capability with unified schema | Tasks, Databases, Messages |
| **Connector** | Service that implements app(s) | todoist, postgres, linear |
| **Executor** | Protocol handler (Rust) | `rest:`, `sql:`, `graphql:` |

### How It Works

```
AI calls: Tasks(action: "list", connector: "todoist")
    ↓
AgentOS loads: connectors/todoist/tasks.yaml
    ↓
Executes: rest: block with injected credentials
    ↓
Returns: Unified task schema
```

## Current Apps

| App | Connectors |
|-----|------------|
| Tasks | todoist, linear |
| Messages | imessage, whatsapp, cursor |
| Databases | postgres, sqlite, mysql |
| Calendar | apple |
| Contacts | apple |
| Finance | copilot |
| Web | exa, firecrawl |

## Development

```bash
git clone https://github.com/jcontini/agentos-integrations
cd agentos-integrations
git config core.hooksPath .githooks
```

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for:
- App schema definition
- Connector YAML format  
- Executor blocks (rest, graphql, sql, applescript)
- Security architecture

## License

MIT
