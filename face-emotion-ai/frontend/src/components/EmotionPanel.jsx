import React from 'react'

const EMOTION_EMOJIS = {
  angry: '😡', disgusted: '🤢', fearful: '😨',
  happy: '😄', neutral: '😐', sad: '😢', surprised: '😲',
}

const EMOTION_COLORS = {
  angry: '#ef233c', disgusted: '#4a7c59', fearful: '#7b2d8b',
  happy: '#ffd166', neutral: '#00d4ff', sad: '#118ab2', surprised: '#f4a261',
}

const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']

export default function EmotionPanel({ faces }) {
  const face = faces?.[0]
  const dominant = face?.dominant_emotion
  const confidence = face?.confidence || 0
  const emotions = face?.emotions || {}
  const color = EMOTION_COLORS[dominant] || 'var(--accent)'

  return (
    <div className="panel" style={{ padding: 16 }}>
      <div className="panel-title">◈ EMOTION ANALYSIS</div>

      {/* Dominant display */}
      <div style={{
        textAlign: 'center',
        padding: '12px 0 18px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: '3.5rem', lineHeight: 1, marginBottom: 8,
          filter: dominant ? `drop-shadow(0 0 16px ${color}88)` : 'none',
          transition: 'all 0.4s',
        }}>
          {dominant ? EMOTION_EMOJIS[dominant] : '—'}
        </div>
        <div style={{
          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.4rem',
          letterSpacing: 5, color, textShadow: `0 0 20px ${color}66`,
          textTransform: 'uppercase', transition: 'all 0.4s',
        }}>
          {dominant || 'NO FACE'}
        </div>
        <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.7rem', color: 'var(--dim)', marginTop: 4 }}>
          {dominant
            ? `CONFIDENCE: ${(confidence * 100).toFixed(1)}%`
            : faces?.length === 0 ? 'SCANNING…' : 'AWAITING FEED'}
        </div>
        {faces?.length > 1 && (
          <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: '#f4a261', marginTop: 4 }}>
            +{faces.length - 1} MORE FACE{faces.length > 2 ? 'S' : ''} DETECTED
          </div>
        )}
      </div>

      {/* Emotion bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {EMOTIONS.map(em => {
          const val = (emotions[em] || 0) * 100
          const c = EMOTION_COLORS[em]
          const isTop = em === dominant
          return (
            <div key={em} style={{
              display: 'grid',
              gridTemplateColumns: '88px 1fr 44px',
              alignItems: 'center', gap: 8,
              opacity: dominant && !isTop ? 0.6 : 1,
              transition: 'opacity 0.3s',
            }}>
              <div style={{
                fontFamily: 'Rajdhani', fontWeight: isTop ? 700 : 500,
                fontSize: '0.78rem', letterSpacing: 1, textTransform: 'uppercase',
                color: isTop ? c : 'var(--text)',
              }}>
                {EMOTION_EMOJIS[em]} {em}
              </div>
              <div style={{
                height: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${val.toFixed(1)}%`,
                  background: c,
                  boxShadow: isTop ? `0 0 10px ${c}88` : 'none',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{
                fontFamily: 'Share Tech Mono', fontSize: '0.68rem',
                color: isTop ? c : 'var(--dim)', textAlign: 'right',
              }}>
                {val.toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
