# 👁 EmotiScan — Full-Stack Face Emotion Recognition

Real-time AI emotion detection with a **FastAPI backend**, **React frontend**, **WebSocket streaming**, and **SQLite persistence** — all containerised with Docker.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          React Frontend (Vite + Tailwind)            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │   │
│  │  │VideoFeed │ │Emotion   │ │  EmotionChart         │ │   │
│  │  │+Canvas   │ │Panel     │ │  (Recharts live graph)│ │   │
│  │  └────┬─────┘ └──────────┘ └──────────────────────┘ │   │
│  │       │ WebSocket frames (JPEG base64 @ ~15fps)       │   │
│  └───────┼─────────────────────────────────────────────┘   │
└──────────┼──────────────────────────────────────────────────┘
           │ ws://localhost:8000/ws/{session_id}
           ▼
┌──────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                            │
│  ┌──────────────────┐   ┌──────────────────────────────────┐ │
│  │  WebSocket       │   │  REST API                        │ │
│  │  /ws/{sid}       │   │  POST /sessions                  │ │
│  │                  │   │  GET  /sessions                  │ │
│  │  ┌────────────┐  │   │  GET  /sessions/{id}/summary     │ │
│  │  │ EmotionDe- │  │   │  GET  /stats/global              │ │
│  │  │ tector     │  │   │  DELETE /sessions/{id}           │ │
│  │  │ (DeepFace) │  │   └──────────────────────────────────┘ │
│  │  └────────────┘  │                                        │
│  └──────────────────┘                                        │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐                                         │
│  │  aiosqlite DB   │  (sessions + emotion_records tables)    │
│  │  emotiscan.db   │                                         │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Option A — Docker Compose (recommended)

```bash
git clone <repo>
cd face-emotion-ai

docker-compose up --build
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:8000
- API Docs → http://localhost:8000/docs

---

### Option B — Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (new terminal):
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 📁 Project Structure

```
face-emotion-ai/
├── backend/
│   ├── main.py          # FastAPI app + WebSocket endpoint
│   ├── detector.py      # DeepFace emotion analysis engine
│   ├── database.py      # Async SQLite layer (aiosqlite)
│   ├── schemas.py       # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Root layout
│   │   ├── main.jsx              # Entry point
│   │   ├── index.css             # Global cyberpunk theme
│   │   ├── hooks/
│   │   │   └── useEmotionSocket.js  # WS + camera + canvas hook
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── VideoFeed.jsx        # Webcam + canvas overlay
│   │       ├── EmotionPanel.jsx     # Dominant + 7-emotion bars
│   │       ├── EmotionChart.jsx     # Recharts live area graph
│   │       ├── SessionStats.jsx     # FPS, proc ms, faces
│   │       ├── EventLog.jsx         # Timestamped log feed
│   │       ├── SessionHistory.jsx   # Past sessions + summaries
│   │       └── GlobalStats.jsx      # DB-wide metrics
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 🧠 AI Model Stack

| Component        | Technology                    | Purpose                         |
|------------------|-------------------------------|----------------------------------|
| Face Detection   | OpenCV (Haar Cascade)         | Fast face localisation           |
| Emotion Analysis | DeepFace (FER2013-trained)    | 7-class emotion classification   |
| Transport        | WebSocket (base64 JPEG)       | Low-latency frame streaming      |
| Inference        | TensorFlow / Keras backend    | Neural net execution             |

**7 emotions detected:** angry · disgusted · fearful · happy · neutral · sad · surprised

---

## 🔌 API Reference

| Method | Endpoint                        | Description                 |
|--------|---------------------------------|-----------------------------|
| GET    | `/health`                       | Service health check        |
| POST   | `/sessions`                     | Create new session          |
| GET    | `/sessions`                     | List all sessions           |
| GET    | `/sessions/{id}`                | Session + records           |
| GET    | `/sessions/{id}/summary`        | Emotion frequency summary   |
| DELETE | `/sessions/{id}`                | Delete session + records    |
| GET    | `/stats/global`                 | DB-wide aggregate stats     |
| WS     | `/ws/{session_id}`              | Real-time detection stream  |

Full interactive docs at **http://localhost:8000/docs** (Swagger UI).

---

## ⚙️ WebSocket Protocol

**Client → Server** (every frame):
```json
{ "type": "frame", "image": "data:image/jpeg;base64,..." }
```

**Server → Client** (per frame):
```json
{
  "type": "detection",
  "frame_id": 142,
  "fps": 14.3,
  "proc_ms": 68.2,
  "face_count": 1,
  "faces": [{
    "box": { "x": 120, "y": 80, "width": 200, "height": 220 },
    "dominant_emotion": "happy",
    "dominant_emoji": "😄",
    "dominant_color": "#ffd166",
    "confidence": 0.9231,
    "emotions": {
      "happy": 0.9231, "neutral": 0.0412, "sad": 0.0201,
      "angry": 0.0089, "fearful": 0.0045, "disgusted": 0.0014, "surprised": 0.0008
    }
  }],
  "timestamp": "2025-03-27T10:42:00.123Z"
}
```

---

## 🔒 Privacy

All processing happens **100% locally**. Frames are decoded in memory on the backend and never written to disk. Only aggregated emotion labels and confidence scores are persisted in SQLite.

---

## 📦 Tech Stack Summary

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Recharts        |
| Transport  | WebSocket (native browser API)                |
| Backend    | FastAPI, Uvicorn, Python 3.11                 |
| AI/ML      | DeepFace, TensorFlow, OpenCV                  |
| Database   | SQLite via aiosqlite (async)                  |
| Container  | Docker, Docker Compose, Nginx                 |
