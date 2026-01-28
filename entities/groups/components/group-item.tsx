/**
 * Group Item Component
 * 
 * Renders a single group in a list view (Facebook Groups, Reddit subreddits, etc.).
 * Shows name, member count, privacy, and description preview.
 */

import React from 'react';

interface GroupItemProps {
  /** Group ID */
  id: string;
  /** Group name */
  name?: string;
  /** Group description */
  description?: string;
  /** Member count as string (e.g., "2.3K", "78,000") */
  memberCount?: string;
  /** Parsed member count as integer */
  memberCountNumeric?: number | null;
  /** Privacy setting */
  privacy?: string;
  /** Group URL */
  url?: string;
}

/**
 * Format privacy label
 */
function formatPrivacy(privacy?: string): string {
  switch (privacy) {
    case 'OPEN':
      return 'Public';
    case 'CLOSED':
      return 'Closed';
    case 'SECRET':
      return 'Secret';
    default:
      return '';
  }
}

export function GroupItem({
  id,
  name,
  description,
  memberCount,
  memberCountNumeric,
  privacy,
  url,
}: GroupItemProps) {
  // Truncate description for preview
  const descriptionPreview = description 
    ? (description.length > 150 ? description.slice(0, 150) + '...' : description)
    : '';
  
  return (
    <div className="group-item">
      <div className="group-item__content">
        {/* Name/link */}
        {name && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group-item__name"
          >
            {name}
          </a>
        )}
        
        {/* Meta line: member count, privacy */}
        <div className="group-item__meta">
          {memberCount && (
            <span className="group-item__members">
              {memberCount} members
            </span>
          )}
          {privacy && (
            <>
              <span className="group-item__separator">•</span>
              <span className={`group-item__privacy group-item__privacy--${privacy.toLowerCase()}`}>
                {formatPrivacy(privacy)}
              </span>
            </>
          )}
        </div>
        
        {/* Description preview */}
        {descriptionPreview && (
          <div className="group-item__description">
            {descriptionPreview}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupItem;
