import React, { useState, useEffect, useRef } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const EMOTION_COLORS = {
  happy:     '#ffd166',
  sad:       '#118ab2',
  angry:     '#ef233c',
  fearful:   '#7b2d8b',
  disgusted: '#4a7c59',
  surprised: '#f4a261',
  neutral:   '#00d4ff',
}

const MAX_POINTS = 40

export default function EmotionChart({ faces, isLive }) {
  const [data, setData] = useState([])
  const tickRef = useRef(0)

  useEffect(() => {
    if (!isLive) return
    const emotions = faces?.[0]?.emotions || {}
    tickRef.current++

    const point = {
      t: tickRef.current,
      ...Object.fromEntries(
        Object.entries(emotions).map(([k, v]) => [k, +(v * 100).toFixed(1)])
      ),
    }

    setData(prev => [...prev.slice(-MAX_POINTS + 1), point])
  }, [faces, isLive])

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--border)',
        padding: '10px 14px', fontFamily: 'Share Tech Mono', fontSize: '0.68rem',
      }}>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
            {p.name.toUpperCase()}: {p.value?.toFixed(1)}%
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="panel" style={{ padding: 16 }}>
      <div className="panel-title">◈ EMOTION TIMELINE — LIVE GRAPH</div>

      {data.length < 2 ? (
        <div style={{
          height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Share Tech Mono', fontSize: '0.7rem', color: 'var(--dim)', letterSpacing: 2,
        }}>
          {isLive ? 'COLLECTING DATA…' : 'START SESSION TO VIEW GRAPH'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              {Object.entries(EMOTION_COLORS).map(([name, color]) => (
                <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,32,64,0.8)" />
            <XAxis dataKey="t" tick={false} axisLine={{ stroke: 'var(--border)' }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'var(--dim)', fontSize: 9, fontFamily: 'Share Tech Mono' }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', paddingTop: 8 }}
              formatter={(v) => <span style={{ color: EMOTION_COLORS[v] }}>{v.toUpperCase()}</span>}
            />
            {Object.entries(EMOTION_COLORS).map(([name, color]) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#grad-${name})`}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
