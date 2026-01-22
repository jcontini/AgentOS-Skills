# Readme App

Displays documentation, manuals, and help content.

## Vision

The Readme app is where AI pulls up its manuals — documentation for plugins, APIs, and system help. A reference interface for AI to display and share documentation with users.

## Use Cases

- Plugin documentation and usage guides
- API reference for connected services
- System help and troubleshooting
- Configuration guides
- FAQ and common questions

## Capabilities

| Capability | Description |
|------------|-------------|
| `doc_list` | List available documentation |
| `doc_get` | Get documentation content |
| `doc_search` | Search across documentation |

---

## Schemas

### `doc_list`

```typescript
// Input
{
  category?: string,         // "plugins", "api", "help", etc.
  limit?: number
}

// Output
{
  docs: {
    id: string               // required
    title: string            // required
    category: string
    summary?: string
    url?: string
    updated_at?: string
  }[]
}
```

### `doc_get`

```typescript
// Input
{ id: string }

// Output
{
  id: string
  title: string
  content: string            // markdown
  category: string
  sections?: {
    title: string
    anchor: string
  }[]
  related?: string[]         // IDs of related docs
}
```

### `doc_search`

```typescript
// Input
{
  query: string,
  category?: string,
  limit?: number
}

// Output
{
  results: {
    id: string
    title: string
    snippet: string          // matching excerpt
    category: string
    score: number
  }[]
}
```

---

## Example Sources

- Plugin readme.md files
- AgentOS documentation
- Connected API documentation
- User-added reference materials
