/**
 * Plugin List Component
 * 
 * Displays installed plugins in a master-detail view:
 * - Left: Detailed table with columns (Name, Operations, Utilities, Status)
 * - Right: Selected plugin details (description, operation/utility lists)
 * 
 * Uses the classic Finder/Explorer detailed list pattern with selection.
 * 
 * @example
 * ```yaml
 * - component: plugin-list
 * ```
 */

import React, { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';

// =============================================================================
// Types
// =============================================================================

interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  operations: string[];
  utilities: string[];
}

interface PluginListProps {
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// API Helpers
// =============================================================================

async function fetchPlugins(): Promise<Plugin[]> {
  const response = await fetch('/api/plugins');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch plugins: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.plugins || [];
}

async function setPluginEnabled(pluginId: string, enabled: boolean): Promise<void> {
  const action = enabled ? 'enable_plugin' : 'disable_plugin';
  
  const response = await fetch('/api/tools/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'Settings',
      arguments: { action, plugin: pluginId }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to ${action}: ${response.statusText}`);
  }
}

// =============================================================================
// Detail Panel Component
// =============================================================================

interface PluginDetailProps {
  plugin: Plugin | null;
  onToggle: (plugin: Plugin) => void;
  updating: boolean;
}

function PluginDetail({ plugin, onToggle, updating }: PluginDetailProps) {
  if (!plugin) {
    return (
      <div className="plugin-detail plugin-detail--empty">
        <span className="plugin-detail-empty-text">Select a plugin to view details</span>
      </div>
    );
  }

  return (
    <div className="plugin-detail">
      <div className="plugin-detail-header">
        <h3 className="plugin-detail-name">{plugin.name}</h3>
        <label className="plugin-detail-toggle">
          <input
            type="checkbox"
            checked={plugin.enabled}
            disabled={updating}
            onChange={() => onToggle(plugin)}
          />
          <span>{plugin.enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>
      
      {plugin.description && (
        <p className="plugin-detail-description">{plugin.description}</p>
      )}
      
      {plugin.operations.length > 0 && (
        <fieldset className="plugin-detail-section">
          <legend>Operations ({plugin.operations.length})</legend>
          <ul className="plugin-detail-list">
            {plugin.operations.map(op => (
              <li key={op} className="plugin-detail-list-item">{op}</li>
            ))}
          </ul>
        </fieldset>
      )}
      
      {plugin.utilities.length > 0 && (
        <fieldset className="plugin-detail-section">
          <legend>Utilities ({plugin.utilities.length})</legend>
          <ul className="plugin-detail-list">
            {plugin.utilities.map(util => (
              <li key={util} className="plugin-detail-list-item">{util}</li>
            ))}
          </ul>
        </fieldset>
      )}
      
      {plugin.operations.length === 0 && plugin.utilities.length === 0 && (
        <p className="plugin-detail-no-tools">No operations or utilities</p>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PluginList({ className = '' }: PluginListProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Fetch plugins on mount
  useEffect(() => {
    let cancelled = false;
    
    fetchPlugins()
      .then(data => {
        if (!cancelled) {
          setPlugins(data);
          setLoading(false);
          // Auto-select first plugin
          if (data.length > 0) {
            setSelectedId(data[0].id);
          }
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    
    return () => { cancelled = true; };
  }, []);

  // Handle toggle
  const handleToggle = useCallback(async (plugin: Plugin) => {
    const newEnabled = !plugin.enabled;
    setUpdating(plugin.id);
    
    try {
      await setPluginEnabled(plugin.id, newEnabled);
      setPlugins(prev => prev.map(p => 
        p.id === plugin.id ? { ...p, enabled: newEnabled } : p
      ));
    } catch (err) {
      console.error('Failed to update plugin:', err);
    } finally {
      setUpdating(null);
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTableElement>) => {
    if (plugins.length === 0) return;
    
    const currentIndex = plugins.findIndex(p => p.id === selectedId);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < plugins.length - 1) {
          setSelectedId(plugins[currentIndex + 1].id);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setSelectedId(plugins[currentIndex - 1].id);
        }
        break;
      case 'Home':
        e.preventDefault();
        setSelectedId(plugins[0].id);
        break;
      case 'End':
        e.preventDefault();
        setSelectedId(plugins[plugins.length - 1].id);
        break;
      case ' ':
        e.preventDefault();
        const selected = plugins.find(p => p.id === selectedId);
        if (selected) {
          handleToggle(selected);
        }
        break;
    }
  }, [plugins, selectedId, handleToggle]);

  const selectedPlugin = plugins.find(p => p.id === selectedId) ?? null;

  // Loading state
  if (loading) {
    return (
      <div className={`plugin-list plugin-list--loading ${className}`}>
        <div className="plugin-list-loading">
          <div className="progress-bar" role="progressbar" aria-label="Loading plugins..." />
          <span className="plugin-list-loading-text">Loading plugins...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`plugin-list plugin-list--error ${className}`}>
        <div className="plugin-list-error">
          <span className="plugin-list-error-icon">⚠</span>
          <span className="plugin-list-error-text">{error}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (plugins.length === 0) {
    return (
      <div className={`plugin-list plugin-list--empty ${className}`}>
        <div className="plugin-list-empty">
          <span className="plugin-list-empty-text">No plugins installed</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`plugin-list plugin-list--master-detail ${className}`}>
      {/* Master: Table list */}
      <div className="plugin-list-master">
        <table 
          ref={tableRef}
          className="detailed"
          role="grid"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label="Installed plugins"
        >
          <thead>
            <tr>
              <th style={{ width: '24px' }}></th>
              <th>Name</th>
              <th style={{ width: '80px' }}>Ops</th>
              <th style={{ width: '80px' }}>Utils</th>
            </tr>
          </thead>
          <tbody>
            {plugins.map(plugin => (
              <tr
                key={plugin.id}
                aria-selected={plugin.id === selectedId}
                onClick={() => setSelectedId(plugin.id)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={plugin.enabled}
                    disabled={updating === plugin.id}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggle(plugin);
                    }}
                    aria-label={`Enable ${plugin.name}`}
                  />
                </td>
                <td>
                  <span className={plugin.enabled ? '' : 'plugin-disabled'}>
                    {plugin.name}
                  </span>
                </td>
                <td>{plugin.operations.length || '—'}</td>
                <td>{plugin.utilities.length || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail: Selected plugin info */}
      <div className="plugin-list-detail">
        <PluginDetail 
          plugin={selectedPlugin}
          onToggle={handleToggle}
          updating={updating === selectedPlugin?.id}
        />
      </div>
    </div>
  );
}

export default PluginList;
