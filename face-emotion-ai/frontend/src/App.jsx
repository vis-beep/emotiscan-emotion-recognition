import React, { useRef, useCallback } from 'react'
import Header        from './components/Header.jsx'
import VideoFeed     from './components/VideoFeed.jsx'
import EmotionPanel  from './components/EmotionPanel.jsx'
import EmotionChart  from './components/EmotionChart.jsx'
import SessionStats  from './components/SessionStats.jsx'
import EventLog      from './components/EventLog.jsx'
import SessionHistory from './components/SessionHistory.jsx'
import GlobalStats   from './components/GlobalStats.jsx'
import { useEmotionSocket } from './hooks/useEmotionSocket.js'

export default function App() {
  const {
    start, stop, snapshot, fetchSessions,
    status, faces, fps, procMs, frameCount,
    sessionId, logs, sessionList, isLive,
  } = useEmotionSocket()

  // Refs forwarded to the hook via onMount
  const videoElRef  = useRef(null)
  const canvasElRef = useRef(null)

  const handleMount = useCallback((video, canvas) => {
    videoElRef.current  = video
    canvasElRef.current = canvas
  }, [])

  const handleStart = () => {
    if (videoElRef.current && canvasElRef.current) {
      start(videoElRef.current, canvasElRef.current)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
      <Header
        status={status} fps={fps}
        frameCount={frameCount} sessionId={sessionId}
      />

      <main style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <VideoFeed
              onMount={handleMount}
              isLive={isLive}
              status={status}
              onStart={handleStart}
              onStop={stop}
              onSnapshot={snapshot}
            />
            <EmotionChart faces={faces} isLive={isLive} />
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EmotionPanel  faces={faces} />
            <SessionStats  fps={fps} procMs={procMs} frameCount={frameCount} sessionId={sessionId} faces={faces} />
            <EventLog      logs={logs} />
            <GlobalStats />
          </div>
        </div>

        {/* Bottom row - session history */}
        <SessionHistory sessions={sessionList} onRefresh={fetchSessions} />
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 2,
        padding: '10px 24px',
        background: 'rgba(5,14,26,0.95)',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'Share Tech Mono', fontSize: '0.58rem', color: 'var(--border)',
        letterSpacing: 2,
      }}>
        <span>EMOTISCAN v1.0.0 · FASTAPI + REACT + DEEPFACE + WEBSOCKET</span>
        <span>ALL PROCESSING IS LOCAL · NO DATA LEAVES YOUR DEVICE</span>
      </footer>
    </div>
  )
}
