/**
 * Terminal Output Container
 * 
 * Displays activities as terminal output with a retro terminal aesthetic.
 * Dark background, monospace font, scrollable output area.
 */

import React, { ReactNode } from 'react'

interface TerminalOutputProps {
  /** Pre-rendered terminal lines */
  children?: ReactNode
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
}

export default function TerminalOutput({ children, loading, error }: TerminalOutputProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.dot} data-color="red" />
        <span style={styles.dot} data-color="yellow" />
        <span style={styles.dot} data-color="green" />
        <span style={styles.headerTitle}>agent@agentos ~ %</span>
      </div>
      <div style={styles.output}>
        {loading && (
          <div style={styles.line}>
            <span style={styles.prompt}>$</span>
            <span style={styles.command}>loading...</span>
            <span style={styles.cursor}>▋</span>
          </div>
        )}
        {error && (
          <div style={styles.line}>
            <span style={styles.error}>error: {error}</span>
          </div>
        )}
        {!loading && !error && !children && (
          <div style={styles.line}>
            <span style={styles.prompt}>$</span>
            <span style={styles.muted}>No activity yet. Waiting for AI...</span>
            <span style={styles.cursor}>▋</span>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1a1a2e',
    fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
    fontSize: '12px',
    color: '#e0e0e0',
    borderRadius: '0 0 4px 4px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: '#2a2a4a',
    borderBottom: '1px solid #3a3a5a',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#666',
  },
  headerTitle: {
    marginLeft: '8px',
    color: '#888',
    fontSize: '11px',
  },
  output: {
    flex: 1,
    padding: '12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  line: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  prompt: {
    color: '#7fdbca',
    fontWeight: 'bold',
  },
  command: {
    color: '#c792ea',
  },
  muted: {
    color: '#666',
    fontStyle: 'italic',
  },
  error: {
    color: '#ff6b6b',
  },
  cursor: {
    color: '#7fdbca',
    animation: 'blink 1s infinite',
  },
}
