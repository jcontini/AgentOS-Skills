# Player App

Displays music, podcasts, audiobooks, and media playback.

## Vision

The Player app shows media history, now playing, and listening statistics. A window into AI's media-related activities and user listening history.

## Capabilities

| Capability | Description |
|------------|-------------|
| `media_history` | List recently played media |
| `media_now_playing` | Get currently playing track |
| `media_top` | Get top tracks/artists/albums |

---

## Schemas

### `media_history`

```typescript
// Input
{
  type?: 'track' | 'podcast' | 'audiobook' | 'all',
  limit?: number,
  after?: string             // date filter
}

// Output
{
  items: {
    id: string               // required
    type: 'track' | 'podcast' | 'audiobook'
    title: string            // required
    artist?: string
    album?: string
    artwork?: string         // image URL
    duration_ms: number
    played_at: string
    progress_ms?: number     // for partially played
    url?: string             // link to source
    // For audiobooks
    book?: {
      title: string
      author: string
      isbn?: string          // → links to books app
    }
    // For podcasts
    show?: {
      name: string
      publisher?: string
    }
  }[]
}
```

### `media_now_playing`

```typescript
// Input
{}

// Output
{
  id: string
  type: 'track' | 'podcast' | 'audiobook'
  title: string
  artist?: string
  album?: string
  artwork?: string
  duration_ms: number
  progress_ms: number
  is_playing: boolean
  provider: string           // "spotify", "apple-music", etc.
}
```

### `media_top`

```typescript
// Input
{
  type: 'tracks' | 'artists' | 'albums',
  time_range?: 'week' | 'month' | 'year' | 'all',
  limit?: number
}

// Output
{
  items: {
    rank: number
    id: string
    name: string
    artist?: string          // for tracks/albums
    artwork?: string
    play_count?: number
  }[]
}
```

---

## Cross-References

| Field | Links to |
|-------|----------|
| `book.isbn` | `book_list(isbn)` |
| `url` | `web_read(url)` |

---

## Example Connectors

- **Spotify** — Music streaming
- **Apple Music** — Apple streaming
- **Audible** — Audiobooks
- **Pocket Casts** — Podcasts
- **Overcast** — Podcasts
