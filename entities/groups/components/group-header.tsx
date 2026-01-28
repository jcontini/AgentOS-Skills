/**
 * Group Header Component
 * 
 * Displays the header for a single group view with name, description,
 * member count, privacy setting, and visit link.
 * 
 * @example
 * ```yaml
 * - component: group-header
 *   props:
 *     name: "{{activity.response.name}}"
 *     description: "{{activity.response.description}}"
 *     memberCount: "{{activity.response.member_count}}"
 *     memberCountNumeric: "{{activity.response.member_count_numeric}}"
 *     privacy: "{{activity.response.privacy}}"
 *     url: "{{activity.response.url}}"
 * ```
 */

import React from 'react';

export interface GroupHeaderProps {
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
  /** Additional CSS class */
  className?: string;
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
      return 'Public';
  }
}

export function GroupHeader({
  name,
  description,
  memberCount,
  memberCountNumeric,
  privacy,
  url,
  className = '',
}: GroupHeaderProps) {
  return (
    <div className={`group-header ${className}`.trim()}>
      {name && (
        <h1 className="group-header__name">{name}</h1>
      )}
      
      <div className="group-header__meta">
        {/* Member count */}
        {memberCount && (
          <span className="group-header__members">
            <span className="group-header__members-value">{memberCount}</span>
            <span className="group-header__members-label"> members</span>
          </span>
        )}
        
        {/* Privacy badge */}
        {privacy && (
          <>
            <span className="group-header__separator">•</span>
            <span className={`group-header__privacy group-header__privacy--${privacy.toLowerCase()}`}>
              {formatPrivacy(privacy)}
            </span>
          </>
        )}
      </div>
      
      {/* Description */}
      {description && (
        <div className="group-header__description">
          {description}
        </div>
      )}
      
      {/* Visit link */}
      {url && (
        <div className="group-header__actions">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group-header__visit"
          >
            Visit Group →
          </a>
        </div>
      )}
    </div>
  );
}

export default GroupHeader;
