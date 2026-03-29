import React from 'react'

const STATUS_MAP = {
  idle:        { label: 'STANDBY',    color: 'var(--dim)' },
  connecting:  { label: 'CONNECTING', color: '#f4a261' },
  live:        { label: 'LIVE',       color: 'var(--accent3)' },
  stopped:     { label: 'STOPPED',    color: 'var(--dim)' },
  error:       { label: 'ERROR',      color: 'var(--accent2)' },
}

export default function Header({ status, fps, frameCount, sessionId }) {
  const s = STATUS_MAP[status] || STATUS_MAP.idle

  return (
    <header style={{
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'rgba(5,14,26,0.95)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Sweep line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        animation: 'pulseGlow 3s ease-in-out infinite',
      }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40,
          border: '2px solid var(--accent)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          boxShadow: '0 0 20px rgba(0,212,255,0.4)',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }}>👁</div>
        <div>
          <div className="glow-text" style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '1.5rem', fontWeight: 700, letterSpacing: 5,
          }}>
            EMOTI<span style={{ color: 'var(--accent2)' }}>SCAN</span>
          </div>
          <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: 'var(--dim)', letterSpacing: 2 }}>
            REAL-TIME FACE EMOTION RECOGNITION SYSTEM
          </div>
        </div>
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontFamily: 'Share Tech Mono', fontSize: '0.7rem' }}>
        <Pill label="STATUS" value={s.label} color={s.color} blink={status === 'live'} />
        <Pill label="FPS" value={fps} color="var(--accent)" />
        <Pill label="FRAMES" value={frameCount.toLocaleString()} color="var(--text)" />
        {sessionId && (
          <Pill label="SESSION" value={sessionId.slice(0, 8) + '…'} color="var(--dim)" />
        )}
      </div>
    </header>
  )
}

function Pill({ label, value, color, blink }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <div style={{ color: 'var(--dim)', fontSize: '0.55rem', letterSpacing: 2 }}>{label}</div>
      <div style={{ color, display: 'flex', alignItems: 'center', gap: 5 }}>
        {blink && (
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
            animation: 'blink 1s steps(1) infinite',
          }} />
        )}
        {value}
      </div>
    </div>
  )
}
