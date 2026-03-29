import React from 'react'

export default function SessionStats({ fps, procMs, frameCount, sessionId, faces }) {
  const stats = [
    { label: 'FPS',       value: fps,                  color: 'var(--accent)' },
    { label: 'PROC MS',   value: `${procMs}ms`,         color: 'var(--accent3)' },
    { label: 'FACES',     value: faces?.length ?? 0,   color: '#f4a261' },
    { label: 'FRAMES',    value: frameCount,            color: 'var(--text)' },
  ]

  return (
    <div className="panel" style={{ padding: 16 }}>
      <div className="panel-title">◈ SESSION METRICS</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            border: '1px solid var(--border)',
            padding: '10px 12px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'Share Tech Mono', fontSize: '1.3rem',
              color: s.color, textShadow: `0 0 14px ${s.color}55`,
            }}>
              {s.value}
            </div>
            <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.58rem', color: 'var(--dim)', marginTop: 3, letterSpacing: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {sessionId && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: 'rgba(0,212,255,0.04)', border: '1px solid var(--border)',
          fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: 'var(--dim)',
          wordBreak: 'break-all',
        }}>
          <span style={{ color: 'var(--accent)' }}>SID:</span> {sessionId}
        </div>
      )}
    </div>
  )
}
