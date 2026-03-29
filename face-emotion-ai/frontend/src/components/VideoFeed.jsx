import React, { useRef, useEffect } from 'react'

export default function VideoFeed({ onMount, isLive, onStart, onStop, onSnapshot, status }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      onMount(videoRef.current, canvasRef.current)
    }
  }, [])

  return (
    <div className="panel" style={{ padding: 16 }}>
      <div className="panel-title">◈ LIVE FEED — FACIAL ANALYSIS STREAM</div>

      {/* Video container */}
      <div style={{
        position: 'relative',
        background: '#000',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        aspectRatio: '4/3',
        width: '100%',
      }}>
        {/* Corner brackets */}
        {['tl','tr','bl','br'].map(c => (
          <div key={c} style={{
            position: 'absolute',
            width: 24, height: 24,
            zIndex: 10, pointerEvents: 'none',
            ...(c.includes('t') ? { top: 8 } : { bottom: 8 }),
            ...(c.includes('l') ? { left: 8 } : { right: 8 }),
            borderTop:    c.includes('t') ? '2px solid var(--accent)' : 'none',
            borderBottom: c.includes('b') ? '2px solid var(--accent)' : 'none',
            borderLeft:   c.includes('l') ? '2px solid var(--accent)' : 'none',
            borderRight:  c.includes('r') ? '2px solid var(--accent)' : 'none',
          }} />
        ))}

        {/* Scan line */}
        {isLive && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.8), transparent)',
            animation: 'scanLine 3s ease-in-out infinite',
            zIndex: 5, pointerEvents: 'none',
          }} />
        )}

        {/* Video element (mirrored) */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{
            display: 'block', width: '100%', height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />

        {/* Canvas overlay (also mirrored to match video) */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            transform: 'scaleX(-1)',
            pointerEvents: 'none',
          }}
        />

        {/* Idle overlay */}
        {status === 'idle' || status === 'stopped' ? (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, color: 'var(--dim)',
            fontFamily: 'Share Tech Mono', fontSize: '0.75rem', letterSpacing: 3,
          }}>
            <div style={{ fontSize: 48, filter: 'grayscale(1) opacity(0.3)' }}>👁</div>
            <div>CAMERA OFFLINE</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--border)' }}>
              PRESS START TO INITIALIZE FEED
            </div>
          </div>
        ) : null}

        {/* Connecting overlay */}
        {status === 'connecting' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, color: '#f4a261',
            fontFamily: 'Share Tech Mono', fontSize: '0.75rem', letterSpacing: 3,
            background: 'rgba(2,8,16,0.7)',
          }}>
            <div style={{ fontSize: 36, animation: 'pulseGlow 1s ease-in-out infinite' }}>⟳</div>
            <div>INITIALIZING…</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <button
          className="cyber-btn"
          style={{ flex: 1 }}
          disabled={isLive || status === 'connecting'}
          onClick={onStart}
        >
          ▶ START
        </button>
        <button
          className="cyber-btn danger"
          style={{ flex: 1 }}
          disabled={!isLive}
          onClick={onStop}
        >
          ■ STOP
        </button>
        <button
          className="cyber-btn success"
          style={{ flex: 1 }}
          disabled={!isLive}
          onClick={onSnapshot}
        >
          ◉ SNAP
        </button>
      </div>
    </div>
  )
}
