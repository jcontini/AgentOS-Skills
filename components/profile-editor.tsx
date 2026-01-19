/**
 * Profile Editor Component
 * 
 * Split view for managing context profiles:
 * - Left: list of profile files
 * - Right: markdown preview of selected profile
 * - Button to open in external editor
 * 
 * @example
 * ```yaml
 * - component: profile-editor
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Tauri Integration (via window.agentOS exposed by main app)
// =============================================================================

declare global {
  interface Window {
    agentOS?: {
      openFolderDialog: (title?: string) => Promise<string | null>
      openFileDialog: (options?: {
        title?: string
        multiple?: boolean
        filters?: Array<{ name: string; extensions: string[] }>
      }) => Promise<string | string[] | null>
      openInEditor: (path: string) => Promise<void>
    }
  }
}

// =============================================================================
// Types
// =============================================================================

interface ProfileFile {
  path: string;
  name: string;
  enabled: boolean;
}

interface ProfileEditorProps {
  className?: string;
}

// =============================================================================
// Markdown Renderer (inline to avoid import issues)
// =============================================================================

function renderMarkdown(content: string): string {
  let html = escapeHtml(content);

  // Code blocks (must be first to prevent inner parsing)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langAttr = lang ? ` data-language="${lang}"` : '';
    return `<pre class="markdown-code-block"${langAttr}><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="markdown-code">$1</code>');

  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6 class="markdown-h6">$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5 class="markdown-h5">$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4 class="markdown-h4">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="markdown-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="markdown-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="markdown-h1">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="markdown-link" target="_blank" rel="noopener">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="markdown-blockquote">$1</blockquote>');

  // Unordered lists
  html = html.replace(/^[\*\-] (.+)$/gm, '<li class="markdown-li">$1</li>');
  html = html.replace(/(<li class="markdown-li">.*<\/li>\n?)+/g, '<ul class="markdown-ul">$&</ul>');

  // Paragraphs
  html = html.replace(/^(?!<[huplo]|<bl|<hr|<pre|<li)(.+)$/gm, '<p class="markdown-p">$1</p>');

  // Clean up
  html = html.replace(/\n\n+/g, '\n');

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

// =============================================================================
// Component
// =============================================================================

export function ProfileEditor({ className = '' }: ProfileEditorProps) {
  const [profiles, setProfiles] = useState<ProfileFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile files from settings
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch('/api/settings?category=privacy');
        if (!response.ok) throw new Error('Failed to fetch settings');
        
        const data = await response.json();
        const profileSetting = data.settings?.find((s: any) => s.key === 'profile_files');
        const paths = (profileSetting?.value as string[]) || [];
        
        // Convert paths to profile objects
        const profileList: ProfileFile[] = paths.map(path => ({
          path,
          name: path.split('/').pop()?.replace(/\.md$/, '') || path,
          enabled: true,
        }));
        
        setProfiles(profileList);
        
        // Auto-select first profile
        if (profileList.length > 0 && !selectedPath) {
          setSelectedPath(profileList[0].path);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profiles');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfiles();
  }, []);

  // Load selected profile content
  useEffect(() => {
    if (!selectedPath) {
      setContent('');
      return;
    }

    async function loadContent() {
      setContentLoading(true);
      try {
        const response = await fetch(`/api/files/read?path=${encodeURIComponent(selectedPath)}`);
        if (!response.ok) throw new Error('Failed to read file');
        
        const data = await response.json();
        setContent(data.content || '');
      } catch (err) {
        setContent(`*Error loading profile: ${err instanceof Error ? err.message : 'Unknown error'}*`);
      } finally {
        setContentLoading(false);
      }
    }
    
    loadContent();
  }, [selectedPath]);

  // Add a new profile file
  const handleAddProfile = useCallback(async () => {
    if (window.agentOS?.openFileDialog) {
      const selected = await window.agentOS.openFileDialog({
        multiple: true,
        title: 'Select Profile Files',
        filters: [
          { name: 'Markdown', extensions: ['md', 'markdown'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      
      if (selected) {
        const newFiles = Array.isArray(selected) ? selected : [selected];
        const existingPaths = profiles.map(p => p.path);
        const uniqueNew = newFiles.filter(f => !existingPaths.includes(f));
        
        if (uniqueNew.length > 0) {
          // Update the setting
          const allPaths = [...existingPaths, ...uniqueNew];
          await fetch('/api/tools/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'Settings',
              arguments: { action: 'set', key: 'profile_files', value: allPaths }
            })
          });
          
          // Update local state
          const newProfiles = uniqueNew.map(path => ({
            path,
            name: path.split('/').pop()?.replace(/\.md$/, '') || path,
            enabled: true,
          }));
          setProfiles([...profiles, ...newProfiles]);
          
          // Select the first new one
          if (uniqueNew.length > 0) {
            setSelectedPath(uniqueNew[0]);
          }
        }
      }
    } else {
      alert('Native file picker not available. Add profiles from the Privacy settings tab.');
    }
  }, [profiles]);

  // Remove a profile
  const handleRemoveProfile = useCallback(async (path: string) => {
    const newPaths = profiles.filter(p => p.path !== path).map(p => p.path);
    
    await fetch('/api/tools/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'Settings',
        arguments: { action: 'set', key: 'profile_files', value: newPaths }
      })
    });
    
    setProfiles(profiles.filter(p => p.path !== path));
    
    if (selectedPath === path) {
      setSelectedPath(newPaths.length > 0 ? newPaths[0] : null);
    }
  }, [profiles, selectedPath]);

  // Open in external editor
  const handleOpenInEditor = useCallback(async () => {
    if (!selectedPath) return;
    
    if (window.agentOS?.openInEditor) {
      await window.agentOS.openInEditor(selectedPath);
    } else {
      // Fallback: try to open via shell
      window.open(`file://${selectedPath}`, '_blank');
    }
  }, [selectedPath]);

  // Loading state
  if (loading) {
    return (
      <div className={`profile-editor profile-editor--loading ${className}`}>
        <div className="profile-editor-loading">
          <div className="progress-bar" role="progressbar" aria-label="Loading profiles..." />
          <span>Loading profiles...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`profile-editor profile-editor--error ${className}`}>
        <div className="profile-editor-error">
          <span className="profile-editor-error-icon">⚠</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const selectedProfile = profiles.find(p => p.path === selectedPath);

  return (
    <div className={`profile-editor ${className}`}>
      {/* Left pane: profile list */}
      <div className="profile-editor-list">
        <div className="profile-editor-list-header">
          <span className="profile-editor-list-title">Profiles</span>
          <div className="profile-editor-header-buttons">
            <button 
              className="profile-editor-remove-btn"
              onClick={() => selectedPath && handleRemoveProfile(selectedPath)}
              disabled={!selectedPath}
              title="Remove selected profile"
            >
              −
            </button>
            <button 
              className="profile-editor-add-btn"
              onClick={handleAddProfile}
              title="Add profile file"
            >
              +
            </button>
          </div>
        </div>
        
        {profiles.length === 0 ? (
          <div className="profile-editor-empty">
            <p>No profile files configured.</p>
            <p>Add markdown files that describe your preferences to help AI assistants understand your context.</p>
            <button onClick={handleAddProfile}>Add Profile</button>
          </div>
        ) : (
          <ul className="profile-editor-profiles">
            {profiles.map(profile => (
              <li 
                key={profile.path}
                className={`profile-editor-profile ${selectedPath === profile.path ? 'selected' : ''}`}
                onClick={() => setSelectedPath(profile.path)}
              >
                <span className="profile-editor-profile-name">{profile.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right pane: preview */}
      <div className="profile-editor-preview">
        {selectedPath ? (
          <>
            <div className="profile-editor-preview-header">
              <span className="profile-editor-preview-title">
                {selectedProfile?.name || 'Profile'}
              </span>
              <button 
                className="profile-editor-edit-btn"
                onClick={handleOpenInEditor}
                title="Open in external editor"
              >
                Edit
              </button>
            </div>
            <div className="profile-editor-preview-content">
              {contentLoading ? (
                <div className="profile-editor-content-loading">
                  <div className="progress-bar" role="progressbar" />
                </div>
              ) : (
                <div 
                  className="markdown"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              )}
            </div>
            <div className="profile-editor-preview-footer">
              <span className="profile-editor-path">{selectedPath}</span>
            </div>
          </>
        ) : (
          <div className="profile-editor-no-selection">
            <p>Select a profile to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileEditor;
