import React, { useState } from 'react'

const EMOTION_EMOJIS = {
  angry:'😡', disgusted:'🤢', fearful:'😨',
  happy:'😄', neutral:'😐', sad:'😢', surprised:'😲',
}

const EMOTION_COLORS = {
  angry:'#ef233c', disgusted:'#4a7c59', fearful:'#7b2d8b',
  happy:'#ffd166', neutral:'#00d4ff', sad:'#118ab2', surprised:'#f4a261',
}

const API_URL = 'http://localhost:8000'

export default function SessionHistory({ sessions, onRefresh }) {
  const [expanded, setExpanded] = useState(null)
  const [summaries, setSummaries] = useState({})
  const [deleting, setDeleting]   = useState(null)

  async function loadSummary(sid) {
    if (summaries[sid]) { setExpanded(expanded === sid ? null : sid); return }
    try {
      const res = await fetch(`${API_URL}/sessions/${sid}/summary`)
      const d   = await res.json()
      setSummaries(prev => ({ ...prev, [sid]: d.summary }))
      setExpanded(sid)
    } catch { setExpanded(expanded === sid ? null : sid) }
  }

  async function deleteSession(sid) {
    setDeleting(sid)
    try {
      await fetch(`${API_URL}/sessions/${sid}`, { method: 'DELETE' })
      await onRefresh()
      setSummaries(prev => { const n = {...prev}; delete n[sid]; return n })
      if (expanded === sid) setExpanded(null)
    } finally { setDeleting(null) }
  }

  function fmt(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
  }

  return (
    <div className="panel" style={{ padding: 16 }}>
      <div className="panel-title" style={{ justifyContent: 'space-between' }}>
        <span>◈ SESSION HISTORY</span>
        <button
          className="cyber-btn"
          style={{ padding: '2px 10px', fontSize: '0.6rem', letterSpacing: 1 }}
          onClick={onRefresh}
        >
          ↺ REFRESH
        </button>
      </div>

      {sessions.length === 0 ? (
        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem', color: 'var(--border)', letterSpacing: 2, padding: '10px 0' }}>
          NO SESSIONS RECORDED YET
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
          {sessions.map(s => (
            <div key={s.id} style={{ border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              {/* Row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', cursor: 'pointer',
              }} onClick={() => loadSummary(s.id)}>
                <div>
                  <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.62rem', color: 'var(--accent)' }}>
                    {s.id.slice(0, 12)}…
                  </div>
                  <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.58rem', color: 'var(--dim)', marginTop: 2 }}>
                    {fmt(s.created_at)} → {fmt(s.closed_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: 'var(--text)' }}>
                    {s.total_frames ?? '—'} frames
                  </div>
                  <button
                    className="cyber-btn danger"
                    style={{ padding: '2px 8px', fontSize: '0.6rem' }}
                    disabled={deleting === s.id}
                    onClick={e => { e.stopPropagation(); deleteSession(s.id) }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Expanded summary */}
              {expanded === s.id && summaries[s.id] && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '10px 12px',
                  display: 'flex', flexWrap: 'wrap', gap: 8,
                }}>
                  {Object.entries(summaries[s.id])
                    .sort((a,b) => b[1]-a[1])
                    .map(([em, cnt]) => (
                      <div key={em} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'Share Tech Mono', fontSize: '0.62rem',
                        color: EMOTION_COLORS[em] || 'var(--text)',
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${EMOTION_COLORS[em] || 'var(--border)'}44`,
                        padding: '3px 8px',
                      }}>
                        {EMOTION_EMOJIS[em]} {em} ×{cnt}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
