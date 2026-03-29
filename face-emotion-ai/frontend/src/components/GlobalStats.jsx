import React, { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8000'

export default function GlobalStats() {
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [gs, hs] = await Promise.all([
          fetch(`${API_URL}/stats/global`).then(r => r.json()),
          fetch(`${API_URL}/health`).then(r => r.json()),
        ])
        setStats(gs)
        setHealth(hs)
      } catch { /* backend offline */ }
    }
    fetchAll()
    const id = setInterval(fetchAll, 10000)
    return () => clearInterval(id)
  }, [])

  const isOnline = !!health

  return (
    <div className="panel" style={{ padding: 16 }}>
      <div className="panel-title">◈ SYSTEM STATUS</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <StatusRow label="BACKEND API" value={isOnline ? 'ONLINE' : 'OFFLINE'}
          color={isOnline ? 'var(--accent3)' : 'var(--accent2)'} />
        <StatusRow label="DETECTOR"
          value={health?.detector_ready ? 'READY' : 'LOADING'}
          color={health?.detector_ready ? 'var(--accent3)' : '#f4a261'} />
        <StatusRow label="DATABASE" value={isOnline ? 'CONNECTED' : '—'}
          color={isOnline ? 'var(--accent3)' : 'var(--dim)'} />

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <MiniStat label="SESSIONS" value={stats?.total_sessions ?? '—'} />
          <MiniStat label="RECORDS"  value={stats?.total_records  ?? '—'} />
          <MiniStat label="TOP EMOTION" value={stats?.most_detected ?? '—'} />
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem', color: 'var(--dim)', letterSpacing: 2 }}>
        {label}
      </span>
      <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem', color,
        textShadow: `0 0 10px ${color}55` }}>
        {value}
      </span>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div style={{ textAlign: 'center', border: '1px solid var(--border)', padding: '8px 4px' }}>
      <div style={{ fontFamily: 'Share Tech Mono', fontSize: '1rem', color: 'var(--accent)' }}>
        {value}
      </div>
      <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: 'var(--dim)',
        letterSpacing: 1, marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}
