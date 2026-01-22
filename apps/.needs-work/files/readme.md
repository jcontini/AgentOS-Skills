# Files App

Displays files, folders, and cloud storage.

## Capabilities

| Capability | Description |
|------------|-------------|
| `file_list` | List files from cloud storage |

---

## Schemas

### `file_list`

List files from cloud storage (Google Drive, Dropbox, Box, OneDrive, iCloud, local filesystem).

```typescript
// Input
{
  folder_id?: string,        // parent folder (null = root)
  path?: string,             // alternative: navigate by path "/Documents/Work"
  query?: string,            // search filename/content
  mime_type?: string,        // filter by type
  owner?: string,            // filter by owner
  shared_with_me?: boolean,
  trashed?: boolean,
  limit?: number
}

// Output
{
  files: {
    id: string               // required (provider-specific ID)
    name: string             // required (filename)
    mime_type: string        // required
    type: 'file' | 'folder'  // required
    size?: number            // bytes (null for folders)
    
    // Paths & URLs
    path: string             // required - full path "/Documents/Work/report.pdf"
    url?: string             // web view URL (opens in browser)
    download_url?: string    // direct download
    thumbnail_url?: string   // preview image
    
    // Hierarchy
    parent_id?: string
    parent_path?: string     // "/Documents/Work"
    
    // Provider info
    provider: 'google-drive' | 'dropbox' | 'box' | 'onedrive' | 'icloud' | 'local'
    
    // Timestamps
    created_at: string
    modified_at: string
    
    // Ownership & sharing
    owner?: {                // → can link to contact_get
      id?: string
      name: string
      email?: string
    }
    shared_with?: {
      id?: string
      name: string
      email?: string
      role: 'viewer' | 'commenter' | 'editor' | 'owner'
    }[]
    is_shared: boolean       // is this file/folder shared?
    share_link?: string      // public share URL if shared
    
    // Flags
    is_starred?: boolean
    is_trashed?: boolean
    
    // Provider-specific
    version?: string         // file version ID
    revision_count?: number  // number of versions
  }[]
  
  // Folder context
  current_folder?: {
    id: string
    name: string
    path: string
  }
}
```

---

## Cross-References

| Field | Links to |
|-------|----------|
| `owner.email` | `contact_list(search: email)` |
| `shared_with[].email` | `contact_list(search: email)` |
| `url` | `web_read(url)` |
| `parent_path` | `collection_get(item_type: 'file')` |

---

## Example Connectors

- **Google Drive** — Google cloud storage
- **Dropbox** — Cross-platform cloud storage
- **iCloud Drive** — Apple cloud storage
- **OneDrive** — Microsoft cloud storage
- **Local Filesystem** — macOS/Linux files
