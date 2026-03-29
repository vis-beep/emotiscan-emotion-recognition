import { useRef, useState, useCallback, useEffect } from 'react'

const WS_URL = 'ws://localhost:8000/ws'
const API_URL = 'http://localhost:8000'

export function useEmotionSocket() {
  const wsRef            = useRef(null)
  const videoRef         = useRef(null)
  const canvasRef        = useRef(null)
  const offscreenRef     = useRef(null)   // for frame capture
  const animRef          = useRef(null)
  const sessionIdRef     = useRef(null)
  const frameCountRef    = useRef(0)
  const pendingRef       = useRef(false)  // prevent frame pile-up

  const [status,      setStatus]      = useState('idle')      // idle | connecting | live | error | stopped
  const [faces,       setFaces]       = useState([])
  const [fps,         setFps]         = useState(0)
  const [procMs,      setProcMs]      = useState(0)
  const [frameCount,  setFrameCount]  = useState(0)
  const [sessionId,   setSessionId]   = useState(null)
  const [logs,        setLogs]        = useState([])
  const [sessionList, setSessionList] = useState([])

  const addLog = useCallback((msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString('en-GB')
    setLogs(prev => [{ ts, msg, type, id: Date.now() + Math.random() }, ...prev].slice(0, 80))
  }, [])

  // ── Fetch session history ────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/sessions`)
      const data = await res.json()
      setSessionList(data.sessions || [])
    } catch { /* backend not ready yet */ }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // ── Start ────────────────────────────────────────────────────────────────
  const start = useCallback(async (videoElement, canvasElement) => {
    if (status === 'live') return

    videoRef.current  = videoElement
    canvasRef.current = canvasElement

    setStatus('connecting')
    addLog('Requesting camera access…', 'info')

    // 1. Get webcam stream
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      videoElement.srcObject = stream
      await videoElement.play()
      addLog('Camera stream active', 'success')
    } catch (err) {
      setStatus('error')
      addLog(`Camera error: ${err.message}`, 'error')
      return
    }

    // 2. Create server session
    let sid
    try {
      const res = await fetch(`${API_URL}/sessions`, { method: 'POST' })
      const data = await res.json()
      sid = data.session_id
      sessionIdRef.current = sid
      setSessionId(sid)
      addLog(`Session created: ${sid.slice(0, 8)}…`, 'success')
    } catch (err) {
      addLog(`Backend unreachable: ${err.message}`, 'error')
      setStatus('error')
      return
    }

    // 3. Open WebSocket
    const ws = new WebSocket(`${WS_URL}/${sid}`)
    wsRef.current = ws

    ws.onopen = () => {
      addLog('WebSocket connected ✓', 'success')
      setStatus('live')
      startFrameLoop()
    }

    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data)
      if (data.type === 'pong') return
      if (data.type === 'detection') {
        pendingRef.current = false
        frameCountRef.current = data.frame_id
        setFrameCount(data.frame_id)
        setFps(data.fps)
        setProcMs(data.proc_ms)
        setFaces(data.faces || [])
        drawOverlay(canvasElement, videoElement, data.faces || [])
      }
      if (data.type === 'error') {
        addLog(`Server: ${data.message}`, 'warn')
        pendingRef.current = false
      }
    }

    ws.onclose = () => {
      addLog('WebSocket closed', 'info')
      stopFrameLoop()
      setStatus('stopped')
      fetchSessions()
    }

    ws.onerror = (e) => {
      addLog('WebSocket error — is the backend running?', 'error')
      setStatus('error')
    }
  }, [status, addLog, fetchSessions])

  // ── Stop ─────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    stopFrameLoop()
    wsRef.current?.close()
    const stream = videoRef.current?.srcObject
    if (stream) stream.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    setFaces([])
    setStatus('stopped')
    addLog('Session ended', 'info')
  }, [addLog])

  // ── Frame capture loop ───────────────────────────────────────────────────
  function startFrameLoop() {
    const capture = () => {
      animRef.current = requestAnimationFrame(capture)
      if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== 1) return
      if (pendingRef.current) return  // throttle: wait for server response

      const video = videoRef.current
      if (video.readyState < 2) return

      // Draw mirrored frame to offscreen canvas
      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement('canvas')
      }
      const oc = offscreenRef.current
      oc.width  = video.videoWidth  || 640
      oc.height = video.videoHeight || 480
      const octx = oc.getContext('2d')
      octx.save()
      octx.scale(-1, 1)
      octx.drawImage(video, -oc.width, 0)
      octx.restore()

      const b64 = oc.toDataURL('image/jpeg', 0.7)
      pendingRef.current = true
      wsRef.current.send(JSON.stringify({ type: 'frame', image: b64 }))
    }
    animRef.current = requestAnimationFrame(capture)
  }

  function stopFrameLoop() {
    if (animRef.current) cancelAnimationFrame(animRef.current)
  }

  // ── Canvas overlay drawing ────────────────────────────────────────────────
  function drawOverlay(canvas, video, faces) {
    if (!canvas || !video) return
    const w = video.videoWidth  || 640
    const h = video.videoHeight || 480
    canvas.width  = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    faces.forEach(face => {
      const { x, y, width: fw, height: fh } = face.box
      const color = face.dominant_color || '#00d4ff'

      // Bounding box
      ctx.strokeStyle = color
      ctx.lineWidth   = 2
      ctx.shadowColor = color
      ctx.shadowBlur  = 14
      ctx.strokeRect(x, y, fw, fh)
      ctx.shadowBlur  = 0

      // Corner accents
      const cl = 18
      ctx.lineWidth   = 3
      ctx.strokeStyle = '#00ff9d'
      ctx.shadowColor = '#00ff9d'
      ctx.shadowBlur  = 8
      ;[
        [x,        y,        1, 0,  0, 1],
        [x+fw,     y,       -1, 0,  0, 1],
        [x,        y+fh,     1, 0,  0,-1],
        [x+fw,     y+fh,    -1, 0,  0,-1],
      ].forEach(([px, py, dx1, dy1, dx2, dy2]) => {
        ctx.beginPath()
        ctx.moveTo(px + dx1*cl, py + dy1*cl)
        ctx.lineTo(px,          py          )
        ctx.lineTo(px + dx2*cl, py + dy2*cl)
        ctx.stroke()
      })
      ctx.shadowBlur = 0

      // Face landmarks (dots)
      if (face.landmarks) {
        ctx.fillStyle = `${color}88`
        face.landmarks.forEach(([lx, ly]) => {
          ctx.beginPath()
          ctx.arc(lx, ly, 2, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      // Label
      const label = `${face.dominant_emotion?.toUpperCase()} ${Math.round((face.confidence||0)*100)}%`
      ctx.font      = 'bold 13px Rajdhani, sans-serif'
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur  = 10
      ctx.fillText(label, x + 4, y - 8)
      ctx.shadowBlur = 0
    })
  }

  // ── Snapshot ─────────────────────────────────────────────────────────────
  const snapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    const merged = document.createElement('canvas')
    merged.width  = canvas.width  || 640
    merged.height = canvas.height || 480
    const mctx = merged.getContext('2d')
    mctx.save()
    mctx.scale(-1, 1)
    mctx.drawImage(video, -merged.width, 0)
    mctx.restore()
    mctx.drawImage(canvas, 0, 0)
    const link = document.createElement('a')
    link.href     = merged.toDataURL('image/png')
    link.download = `emotiscan_${Date.now()}.png`
    link.click()
    addLog('Snapshot saved', 'success')
  }, [addLog])

  return {
    start, stop, snapshot, fetchSessions,
    status, faces, fps, procMs, frameCount,
    sessionId, logs, sessionList,
    isLive: status === 'live',
  }
}
