# Notes App

Displays notes, documents, and text content.

## Vision

The Notes app shows AI-created and retrieved notes, documents, and text content. A simple, focused interface for reading and displaying written content.

## Capabilities

| Capability | Description |
|------------|-------------|
| `note_list` | List notes with search |
| `note_get` | Get full note content |
| `note_create` | Create a new note |

---

## Schemas

### `note_list`

```typescript
// Input
{
  folder_id?: string,
  query?: string,
  limit?: number
}

// Output
{
  notes: {
    id: string               // required
    title: string            // required
    snippet?: string         // preview text
    folder?: {
      id: string
      name: string
    }
    created_at: string
    modified_at: string
    is_pinned?: boolean
  }[]
}
```

### `note_get`

```typescript
// Input
{ id: string }

// Output
{
  id: string
  title: string
  content: string            // markdown or plain text
  folder?: { id: string, name: string }
  created_at: string
  modified_at: string
}
```

---

## Example Connectors

- **Apple Notes** — macOS/iOS notes
- **Notion** — Workspace documents
- **Obsidian** — Markdown vault
- **Bear** — macOS notes app
