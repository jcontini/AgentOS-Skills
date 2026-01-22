/**
 * Wallpaper Picker Component
 * 
 * Displays available wallpapers from the current theme and allows selection.
 * Persists choice to localStorage and notifies the desktop to update.
 * 
 * @example
 * ```yaml
 * - component: wallpaper-picker
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

interface ThemeData {
  id: string;
  name: string;
  default_wallpaper?: string;
  wallpapers: string[];
}

interface WallpaperPickerProps {
  /** Theme ID to show wallpapers for (defaults to macos9) */
  themeId?: string;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const WALLPAPER_STORAGE_KEY = 'agentos:wallpaper';

// =============================================================================
// Component
// =============================================================================

export function WallpaperPicker({ themeId = 'macos9', className = '' }: WallpaperPickerProps) {
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(() => {
    return localStorage.getItem(WALLPAPER_STORAGE_KEY);
  });

  // Fetch theme data
  useEffect(() => {
    let cancelled = false;
    
    fetch(`/api/themes/${themeId}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load theme')))
      .then(data => {
        if (!cancelled) {
          setTheme(data);
          // If no selection, use theme default
          if (!selected && data.default_wallpaper) {
            setSelected(data.default_wallpaper);
          }
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    
    return () => { cancelled = true; };
  }, [themeId, selected]);

  // Handle wallpaper selection
  const handleSelect = useCallback((wallpaper: string) => {
    setSelected(wallpaper);
    localStorage.setItem(WALLPAPER_STORAGE_KEY, wallpaper);
    
    // Dispatch custom event so Desktop can update immediately
    window.dispatchEvent(new CustomEvent('wallpaper-changed', { 
      detail: { wallpaper } 
    }));
  }, []);

  // Extract display name from path (e.g., "wallpapers/quantum-foam.jpg" → "Quantum Foam")
  const getDisplayName = (path: string): string => {
    const filename = path.split('/').pop() || path;
    const name = filename.replace(/\.[^.]+$/, ''); // Remove extension
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Loading state
  if (loading) {
    return (
      <div className={`wallpaper-picker wallpaper-picker--loading ${className}`}>
        <div className="wallpaper-picker-loading">
          <div className="progress-bar" role="progressbar" aria-label="Loading wallpapers..." />
          <span>Loading wallpapers...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !theme) {
    return (
      <div className={`wallpaper-picker wallpaper-picker--error ${className}`}>
        <div className="wallpaper-picker-error">
          <span>⚠</span>
          <span>{error || 'No theme data'}</span>
        </div>
      </div>
    );
  }

  // No wallpapers
  if (theme.wallpapers.length === 0) {
    return (
      <div className={`wallpaper-picker wallpaper-picker--empty ${className}`}>
        <div className="wallpaper-picker-empty">
          <span>No wallpapers available for this theme</span>
        </div>
      </div>
    );
  }

  // Wallpaper list
  return (
    <div className={`wallpaper-picker ${className}`}>
      {theme.wallpapers.map(wallpaper => {
        const isSelected = wallpaper === selected;
        const isDefault = wallpaper === theme.default_wallpaper;
        
        return (
          <button
            key={wallpaper}
            className={`wallpaper-item ${isSelected ? 'wallpaper-item--selected' : ''}`}
            onClick={() => handleSelect(wallpaper)}
            type="button"
          >
            <img 
              src={`/themes/${themeId}/${wallpaper}`}
              alt={getDisplayName(wallpaper)}
              className="wallpaper-item-thumbnail"
              loading="lazy"
            />
            <span className="wallpaper-item-name">
              {getDisplayName(wallpaper)}
              {isDefault && <span className="wallpaper-item-default"> (Default)</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default WallpaperPicker;
