/**
 * Terminal Line
 * 
 * Renders a single activity as terminal-style output.
 * Shows entity.operation as the "command", request params as args,
 * and response/error as output.
 */

import React from 'react'

interface TerminalLineProps {
  entity?: string
  operation?: string
  connector?: string
  request?: Record<string, unknown>
  response?: unknown
  status?: number
  error?: string
  timestamp?: string
  pending?: boolean
}

export default function TerminalLine({
  entity,
  operation,
  connector,
  request,
  response,
  status,
  error,
  timestamp,
  pending,
}: TerminalLineProps) {
  // Format the "command" from entity.operation
  const command = entity && operation ? `${entity}.${operation}` : entity || 'unknown'
  
  // Extract params from request
  const params = request?.params as Record<string, unknown> | undefined
  const argsString = params ? formatArgs(params) : ''
  
  // Format timestamp
  const time = timestamp ? new Date(timestamp).toLocaleTimeString() : ''
  
  return (
    <div style={styles.container}>
      {/* Command line */}
      <div style={styles.commandLine}>
        <span style={styles.prompt}>$</span>
        <span style={styles.command}>{command}</span>
        {argsString && <span style={styles.args}>{argsString}</span>}
        {connector && <span style={styles.connector}>via {connector}</span>}
        <span style={styles.timestamp}>{time}</span>
      </div>
      
      {/* Output */}
      <div style={styles.output}>
        {pending && (
          <div style={styles.pending}>
            <span style={styles.spinner}>⠋</span>
            <span>Running...</span>
          </div>
        )}
        
        {error && (
          <div style={styles.error}>
            <span style={styles.errorLabel}>error:</span> {error}
          </div>
        )}
        
        {!pending && !error && response !== undefined && (
          <div style={styles.response}>
            {formatResponse(response, status)}
          </div>
        )}
      </div>
    </div>
  )
}

/** Format request params as command-line args */
function formatArgs(params: Record<string, unknown>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.length > 50) {
      parts.push(`--${key}="${value.slice(0, 47)}..."`)
    } else if (typeof value === 'string') {
      parts.push(`--${key}="${value}"`)
    } else if (value !== undefined && value !== null) {
      parts.push(`--${key}=${JSON.stringify(value)}`)
    }
  }
  return parts.join(' ')
}

/** Format response for display */
function formatResponse(response: unknown, status?: number): React.ReactNode {
  const statusText = status ? `[${status}] ` : ''
  
  if (Array.isArray(response)) {
    // Array response - show count and first few items
    const count = response.length
    const preview = response.slice(0, 3).map((item, i) => {
      const title = (item as Record<string, unknown>)?.title || 
                    (item as Record<string, unknown>)?.name ||
                    JSON.stringify(item).slice(0, 50)
      return (
        <div key={i} style={styles.arrayItem}>
          {i + 1}. {String(title)}
        </div>
      )
    })
    
    return (
      <>
        <div style={styles.statusLine}>
          {statusText}<span style={styles.success}>{count} results</span>
        </div>
        {preview}
        {count > 3 && (
          <div style={styles.muted}>... and {count - 3} more</div>
        )}
      </>
    )
  }
  
  if (typeof response === 'object' && response !== null) {
    // Object response - show key fields
    const obj = response as Record<string, unknown>
    const title = obj.title || obj.name
    const content = obj.content || obj.description || obj.body
    
    return (
      <>
        {statusText && <span style={styles.statusLine}>{statusText}</span>}
        {title && <div style={styles.title}>{String(title)}</div>}
        {content && (
          <div style={styles.content}>
            {String(content).slice(0, 200)}
            {String(content).length > 200 && '...'}
          </div>
        )}
        {!title && !content && (
          <div style={styles.json}>
            {JSON.stringify(response, null, 2).slice(0, 300)}
          </div>
        )}
      </>
    )
  }
  
  // Primitive response
  return <div>{statusText}{String(response)}</div>
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderBottom: '1px solid #2a2a4a',
    paddingBottom: '8px',
    marginBottom: '4px',
  },
  commandLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  prompt: {
    color: '#7fdbca',
    fontWeight: 'bold',
  },
  command: {
    color: '#c792ea',
    fontWeight: 'bold',
  },
  args: {
    color: '#addb67',
    wordBreak: 'break-all',
  },
  connector: {
    color: '#666',
    fontSize: '10px',
  },
  timestamp: {
    marginLeft: 'auto',
    color: '#666',
    fontSize: '10px',
  },
  output: {
    marginTop: '4px',
    marginLeft: '16px',
    color: '#e0e0e0',
  },
  pending: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#ffd866',
  },
  spinner: {
    animation: 'spin 0.6s infinite linear',
  },
  error: {
    color: '#ff6b6b',
  },
  errorLabel: {
    fontWeight: 'bold',
  },
  response: {
    color: '#e0e0e0',
  },
  statusLine: {
    color: '#666',
  },
  success: {
    color: '#7fdbca',
  },
  title: {
    color: '#82aaff',
    fontWeight: 'bold',
  },
  content: {
    color: '#888',
    whiteSpace: 'pre-wrap',
    marginTop: '4px',
  },
  arrayItem: {
    color: '#888',
    marginLeft: '8px',
  },
  muted: {
    color: '#666',
    fontStyle: 'italic',
    marginLeft: '8px',
  },
  json: {
    color: '#888',
    whiteSpace: 'pre',
    fontFamily: 'inherit',
    fontSize: '11px',
  },
}
