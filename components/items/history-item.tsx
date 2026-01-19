/**
 * History Item Component
 * 
 * Displays a browsing history entry for both search and read operations.
 * Shows operation type, title/query, URL (if read), timestamp, and source.
 * 
 * @example
 * ```yaml
 * - component: list
 *   data:
 *     source: activities
 *     entity: webpage
 *   item_component: items/history-item
 *   item_props:
 *     operation: "{{operation}}"
 *     title: "{{response.title}}"
 *     query: "{{request.params.query}}"
 *     url: "{{request.params.url}}"
 *     connector: "{{connector}}"
 *     timestamp: "{{created_at}}"
 * ```
 */

import React from 'react';
import { Text } from '../text';

interface HistoryItemProps {
  /** Operation type: 'search' or 'read' */
  operation?: string;
  /** Page title (for read operations) */
  title?: string;
  /** Search query (for search operations) */
  query?: string;
  /** URL (for read operations) */
  url?: string;
  /** Plugin/connector that handled this */
  connector?: string;
  /** When this activity occurred */
  timestamp?: string;
}

export function HistoryItem({
  operation,
  title,
  query,
  url,
  connector,
  timestamp,
}: HistoryItemProps) {
  const isSearch = operation === 'search';
  const displayTitle = isSearch ? query : title;
  const icon = isSearch ? '🔍' : '📄';
  
  // Format timestamp nicely
  const formattedTime = formatTimestamp(timestamp);
  
  return (
    <div className="history-item">
      <span className="history-item-icon">{icon}</span>
      <div className="history-item-content">
        <Text
          variant="body"
          overflow="ellipsis"
          maxLines={1}
          className="history-item-title"
        >
          {displayTitle || 'Untitled'}
        </Text>
        {url && !isSearch && (
          <Text 
            variant="url" 
            overflow="ellipsis" 
            maxLines={1} 
            className="history-item-url"
          >
            {url}
          </Text>
        )}
        <div className="history-item-meta">
          <Text variant="caption" className="history-item-time">
            {formattedTime}
          </Text>
          {connector && (
            <Text variant="caption" className="history-item-source">
              via {connector}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format ISO timestamp to human-readable format
 */
function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Relative time for recent items
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Absolute date for older items
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

export default HistoryItem;
