/**
 * Post Item Component
 * 
 * Renders a single post in a list view (Reddit, HN, Twitter, etc.).
 * Uses primitives for theme-agnostic styling.
 */

import React from 'react';

interface PostItemProps {
  /** Post ID */
  id: string;
  /** Post title (may be empty for comments/tweets) */
  title?: string;
  /** Post body/content */
  content?: string;
  /** Author username */
  author?: string;
  /** Community/subreddit name */
  community?: string;
  /** Score (upvotes - downvotes) */
  score?: number;
  /** Number of comments */
  commentCount?: number;
  /** Permalink URL */
  url?: string;
  /** Publication timestamp */
  publishedAt?: string;
}

/**
 * Format relative time (e.g., "5h ago", "2d ago")
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function PostItem({
  id,
  title,
  content,
  author,
  community,
  score,
  commentCount,
  url,
  publishedAt,
}: PostItemProps) {
  // Use title if available, otherwise truncate content
  const displayTitle = title || (content ? content.slice(0, 100) + (content.length > 100 ? '...' : '') : 'Untitled');
  
  // Build meta items array for clean separator handling
  const metaItems: string[] = [];
  if (community) metaItems.push(`r/${community}`);
  if (author) metaItems.push(`by ${author}`);
  if (publishedAt) metaItems.push(formatRelativeTime(publishedAt));
  if (commentCount !== undefined) metaItems.push(`${commentCount} comments`);
  
  return (
    <div
      style={{ 
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '6px 0', 
        borderBottom: '1px solid var(--border-color, #ccc)',
        overflow: 'hidden',
      }}
    >
      {/* Score on left - with arrow to indicate votes */}
      {score !== undefined && (
        <div
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '36px',
            paddingTop: '2px',
            color: 'var(--text-secondary, #666)',
            fontSize: '12px',
          }}
        >
          <span style={{ fontSize: '10px', lineHeight: 1 }}>▲</span>
          <span style={{ fontWeight: 'bold' }}>{score}</span>
        </div>
      )}
      
      {/* Content */}
      <div
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {/* Title/link */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            textDecoration: 'none',
            color: 'var(--link-color, #0066cc)',
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayTitle}
        </a>
        
        {/* Meta line: community, author, time, comments */}
        <div
          style={{ 
            color: 'var(--text-secondary, #666)',
            fontSize: '11px',
          }}
        >
          {metaItems.join(' · ')}
        </div>
      </div>
    </div>
  );
}

export default PostItem;
