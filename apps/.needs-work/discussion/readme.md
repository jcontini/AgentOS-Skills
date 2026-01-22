# Discussion App

Displays threads, posts, and comments from communities and social platforms.

## Capabilities

| Capability | Description |
|------------|-------------|
| `thread_list` | List threads/posts from a community |
| `thread_get` | Get thread with comments |
| `thread_search` | Search across communities |

---

## Schemas

### `thread_list`

List threads/posts from a community (subreddit, channel, page, etc).

```typescript
// Input
{
  community?: string,        // subreddit name, channel ID, page ID
  sort?: 'hot' | 'new' | 'top' | 'rising',
  query?: string,            // search within community
  limit?: number
}

// Output (unified across Reddit, HN, YouTube, Facebook, Twitter, LinkedIn)
{
  threads: {
    id: string               // required
    type: 'post' | 'story' | 'video' | 'tweet' | 'article'
    title?: string           // Reddit/HN have titles, comments don't
    content?: string         // text/HTML body
    url?: string             // permalink to original
    external_url?: string    // linked URL (for link posts)
    author: {                // required
      id?: string
      name: string           // required (username/display name)
      avatar?: string        // profile image URL
      profile_url?: string   // → can link to web_read
    }
    community?: {            // container (subreddit, channel, page)
      id?: string
      name: string
      url?: string
    }
    timestamp: string        // required (ISO datetime)
    edited_at?: string
    engagement: {
      score?: number         // Reddit/HN: upvotes - downvotes
      upvotes?: number       // Reddit (if available separately)
      downvotes?: number
      likes?: number         // YouTube/Facebook/Twitter
      reactions?: {          // Facebook-style
        like?: number
        love?: number
        wow?: number
      }
      views?: number         // YouTube, Twitter
      comment_count: number  // required
      shares?: number        // retweets, reposts
    }
    media?: {
      type: 'image' | 'video' | 'link' | 'poll'
      url: string
      thumbnail?: string
    }[]
    is_pinned?: boolean
    is_locked?: boolean
  }[]
}
```

### `thread_get`

Get a thread with its comments.

```typescript
// Input
{ 
  id: string,                // thread/post ID
  sort?: 'best' | 'top' | 'new' | 'controversial',
  comment_limit?: number
}

// Output
{
  // Thread fields (same as thread_list item)
  id: string
  type: 'post' | 'story' | 'video' | 'tweet' | 'article'
  title?: string
  content?: string
  url?: string
  author: { id?: string, name: string, avatar?: string, profile_url?: string }
  community?: { id?: string, name: string, url?: string }
  timestamp: string
  engagement: { score?: number, likes?: number, comment_count: number, ... }
  
  // Comments (nested tree structure)
  comments: Comment[]
}

// Comment structure (recursive)
interface Comment {
  id: string                 // required
  content: string            // required (text/HTML)
  author: {
    id?: string
    name: string             // required
    avatar?: string
    profile_url?: string
  }
  timestamp: string          // required
  edited_at?: string
  parent_id?: string         // for flat lists that need reconstruction
  depth: number              // nesting level (0 = top-level)
  engagement: {
    score?: number           // Reddit/HN
    likes?: number           // YouTube/Facebook
    upvotes?: number
    downvotes?: number
  }
  replies?: Comment[]        // nested children
  is_deleted?: boolean
  is_collapsed?: boolean     // below score threshold
  is_author?: boolean        // comment is by thread author (OP)
}
```

### `thread_search`

Search across communities/platforms.

```typescript
// Input
{
  query: string,             // required
  community?: string,        // limit to specific community
  sort?: 'relevance' | 'new' | 'top',
  time_filter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all',
  limit?: number
}

// Output (same as thread_list)
{
  threads: Thread[]
}
```

---

## Cross-References

| Field | Links to |
|-------|----------|
| `author.profile_url` | `web_read(url)` |
| `url` | `web_read(url)` (full page) |
| `external_url` | `web_read(url)` (linked content) |
| `comment.author.profile_url` | `web_read(url)` |

---

## Example Connectors

- **Reddit** — Community forums
- **Hacker News** — Tech discussion
- **YouTube Comments** — Video discussions
- **Twitter/X** — Microblogging
- **LinkedIn** — Professional posts
