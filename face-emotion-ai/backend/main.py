"""
EmotiScan Backend — FastAPI + WebSocket Real-Time Emotion Detection
"""
import asyncio
import base64
import json
import time
import uuid
from datetime import datetime
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from detector import EmotionDetector
from database import Database
from schemas import SessionCreate, EmotionRecord

# ─── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="EmotiScan API",
    description="Real-Time Face Emotion Recognition System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = EmotionDetector()
db = Database()

# ─── Startup / Shutdown ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await db.init()
    print("✅ Database initialized")
    print("✅ EmotiScan API ready at http://localhost:8000")

@app.on_event("shutdown")
async def shutdown():
    await db.close()

# ─── REST Endpoints ────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "service": "EmotiScan API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "detector_ready": detector.is_ready(),
    }


@app.post("/sessions")
async def create_session():
    session_id = str(uuid.uuid4())
    session = await db.create_session(session_id)
    return {"session_id": session_id, "created_at": session["created_at"]}


@app.get("/sessions")
async def list_sessions(limit: int = 20):
    sessions = await db.get_sessions(limit)
    return {"sessions": sessions}


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = await db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    records = await db.get_session_records(session_id)
    return {"session": session, "records": records}


@app.get("/sessions/{session_id}/summary")
async def get_session_summary(session_id: str):
    session = await db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    summary = await db.get_emotion_summary(session_id)
    return {"session_id": session_id, "summary": summary}


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    await db.delete_session(session_id)
    return {"deleted": session_id}


@app.get("/stats/global")
async def global_stats():
    stats = await db.get_global_stats()
    return stats


# ─── WebSocket ────────────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, ws: WebSocket):
        await ws.accept()
        self.active[session_id] = ws

    def disconnect(self, session_id: str):
        self.active.pop(session_id, None)

    async def send(self, session_id: str, data: dict):
        ws = self.active.get(session_id)
        if ws:
            await ws.send_json(data)


manager = ConnectionManager()


@app.websocket("/ws/{session_id}")
async def emotion_websocket(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    frame_count = 0
    start_time = time.time()
    print(f"🔌 WebSocket connected: session={session_id}")

    try:
        while True:
            # Receive frame from client
            raw = await websocket.receive_text()
            data = json.loads(raw)

            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if data.get("type") != "frame":
                continue

            frame_count += 1
            t0 = time.time()

            # Decode base64 image
            img_b64 = data["image"].split(",")[-1]  # strip data URL prefix
            img_bytes = base64.b64decode(img_b64)
            img_arr = np.frombuffer(img_bytes, dtype=np.uint8)
            frame = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)

            if frame is None:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid frame data"
                })
                continue

            # Detect emotions
            result = detector.analyze(frame)

            proc_ms = round((time.time() - t0) * 1000, 1)
            elapsed = round(time.time() - start_time, 1)
            fps = round(frame_count / elapsed, 1) if elapsed > 0 else 0

            # Build response
            response = {
                "type":       "detection",
                "frame_id":   frame_count,
                "fps":        fps,
                "proc_ms":    proc_ms,
                "faces":      result.get("faces", []),
                "face_count": len(result.get("faces", [])),
                "timestamp":  datetime.utcnow().isoformat(),
            }

            await websocket.send_json(response)

            # Persist to DB (every 5th frame to reduce I/O)
            if frame_count % 5 == 0 and result.get("faces"):
                dominant = result["faces"][0].get("dominant_emotion")
                emotions = result["faces"][0].get("emotions", {})
                if dominant:
                    await db.insert_record(
                        session_id=session_id,
                        dominant_emotion=dominant,
                        emotions=emotions,
                        face_count=len(result["faces"]),
                        fps=fps,
                    )

    except WebSocketDisconnect:
        manager.disconnect(session_id)
        await db.close_session(session_id)
        print(f"🔌 WebSocket disconnected: session={session_id} frames={frame_count}")
    except Exception as e:
        print(f"❌ WebSocket error [{session_id}]: {e}")
        manager.disconnect(session_id)
