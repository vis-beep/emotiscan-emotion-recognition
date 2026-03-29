import React from 'react'

const TYPE_COLORS = {
  info:    'var(--dim)',
  success: 'var(--accent3)',
  warn:    '#f4a261',
  error:   'var(--accent2)',
}

export default function EventLog({ logs }) {
  return (
    <div className="panel" style={{ padding: 16 }}>
      <div className="panel-title">◈ EVENT LOG</div>
      <div style={{
        height: 120,
        overflowY: 'auto',
        fontFamily: 'Share Tech Mono',
        fontSize: '0.62rem',
        lineHeight: 2,
        color: 'var(--dim)',
      }}>
        {logs.length === 0 && (
          <div style={{ color: 'var(--border)', letterSpacing: 2 }}>NO EVENTS YET…</div>
        )}
        {logs.map(log => (
          <div key={log.id} style={{ color: TYPE_COLORS[log.type] || 'var(--dim)' }}>
            <span style={{ color: 'var(--border)' }}>[{log.ts}]</span> {log.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
