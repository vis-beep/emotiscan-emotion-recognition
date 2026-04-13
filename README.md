# 👁 EmotiScan — Real-Time Face Emotion Recognition System

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.16-FF6F00?logo=tensorflow&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-4.10-5C3EE8?logo=opencv&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

> A full-stack AI-powered application that detects and classifies **7 human emotions in real time** using your webcam — built with FastAPI, React, DeepFace, WebSocket streaming, and SQLite persistence.

---

## 📸 Features

- 🎥 **Live webcam feed** with real-time face detection overlay
- 🧠 **AI emotion analysis** using DeepFace (FER2013-trained model)
- 📡 **WebSocket streaming** — low-latency frame-by-frame processing
- 📊 **Live emotion graph** — Recharts area chart updating in real time
- 🗄️ **Session history** — all sessions and emotion records saved to SQLite
- 📈 **Global stats** — total sessions, records, and most detected emotion
- 📷 **Snapshot** — save any frame with detection overlay as PNG
- 🔒 **100% local** — no data ever leaves your device
- 🐳 **Docker support** — one command to run everything

---

## 🎭 Emotions Detected

| Emoji | Emotion   |
|-------|-----------|
| 😄    | Happy     |
| 😢    | Sad       |
| 😡    | Angry     |
| 😨    | Fearful   |
| 🤢    | Disgusted |
| 😲    | Surprised |
| 😐    | Neutral   |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│         React Frontend (Vite + Tailwind + Recharts)         │
│   VideoFeed │ EmotionPanel │ LiveChart │ SessionHistory      │
└──────────────────┬──────────────────────────────────────────┘
                   │  WebSocket (JPEG frames @ ~15fps)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                           │
│   WebSocket /ws/{session_id}   │   REST API /sessions       │
│          EmotionDetector (DeepFace + OpenCV)                │
│                   aiosqlite Database                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, Recharts          |
| Backend     | FastAPI, Uvicorn, Python 3.11                   |
| AI / ML     | DeepFace, TensorFlow 2.16, OpenCV               |
| Transport   | WebSocket (native browser API)                  |
| Database    | SQLite via aiosqlite (async)                    |
| Container   | Docker, Docker Compose, Nginx                   |

---

## 📁 Project Structure

```
face-emotion-ai/
│
├── backend/
│   ├── main.py              # FastAPI app + WebSocket endpoint
│   ├── detector.py          # DeepFace emotion analysis engine
│   ├── database.py          # Async SQLite layer (aiosqlite)
│   ├── schemas.py           # Pydantic request/response models
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                        # Root layout
│   │   ├── main.jsx                       # Entry point
│   │   ├── index.css                      # Global cyberpunk theme
│   │   ├── hooks/
│   │   │   └── useEmotionSocket.js        # WebSocket + camera hook
│   │   └── components/
│   │       ├── Header.jsx                 # Top status bar
│   │       ├── VideoFeed.jsx              # Webcam + canvas overlay
│   │       ├── EmotionPanel.jsx           # Dominant emotion + bars
│   │       ├── EmotionChart.jsx           # Live Recharts area graph
│   │       ├── SessionStats.jsx           # FPS, proc ms, face count
│   │       ├── EventLog.jsx               # Timestamped event feed
│   │       ├── SessionHistory.jsx         # Past sessions from API
│   │       └── GlobalStats.jsx            # DB-wide metrics
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

| Tool        | Version  | Download                        |
|-------------|----------|---------------------------------|
| Python      | 3.11     | https://python.org/downloads    |
| Node.js     | 20+      | https://nodejs.org              |
| Git         | Latest   | https://git-scm.com             |
| Docker      | Optional | https://docker.com              |

---

### Option A — Run with Docker (Easiest)

```bash
git clone https://github.com/yourusername/emotiscan-emotion-recognition.git
cd emotiscan-emotion-recognition
docker-compose up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |

---

### Option B — Run Locally (Development)

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/emotiscan-emotion-recognition.git
cd emotiscan-emotion-recognition
```

**2. Start the Backend**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate — Mac/Linux:
source venv/bin/activate

# Activate — Windows:
venv\Scripts\activate

# Install dependencies
pip install numpy --only-binary :all:
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

✅ Backend running at `http://localhost:8000`

**3. Start the Frontend** (open a new terminal)
```bash
cd frontend
npm install
npm run dev
```

✅ Frontend running at `http://localhost:5173`

**4. Open in browser**

Visit `http://localhost:5173`, click **▶ START**, allow camera access — the app starts immediately.

---

## 🔌 API Reference

| Method   | Endpoint                      | Description                      |
|----------|-------------------------------|----------------------------------|
| `GET`    | `/health`                     | Service health check             |
| `POST`   | `/sessions`                   | Create a new session             |
| `GET`    | `/sessions`                   | List all sessions                |
| `GET`    | `/sessions/{id}`              | Get session details and records  |
| `GET`    | `/sessions/{id}/summary`      | Emotion frequency summary        |
| `DELETE` | `/sessions/{id}`              | Delete session and its records   |
| `GET`    | `/stats/global`               | DB-wide aggregate statistics     |
| `WS`     | `/ws/{session_id}`            | Real-time emotion detection feed |

Full interactive Swagger docs at **`http://localhost:8000/docs`**

---

## 📡 WebSocket Protocol

**Client → Server** (each frame):
```json
{
  "type": "frame",
  "image": "data:image/jpeg;base64,..."
}
```

**Server → Client** (per frame response):
```json
{
  "type": "detection",
  "frame_id": 142,
  "fps": 14.3,
  "proc_ms": 68.2,
  "face_count": 1,
  "faces": [
    {
      "box": { "x": 120, "y": 80, "width": 200, "height": 220 },
      "dominant_emotion": "happy",
      "dominant_emoji": "😄",
      "dominant_color": "#ffd166",
      "confidence": 0.9231,
      "emotions": {
        "happy": 0.9231,
        "neutral": 0.0412,
        "sad": 0.0201,
        "angry": 0.0089,
        "fearful": 0.0045,
        "disgusted": 0.0014,
        "surprised": 0.0008
      }
    }
  ],
  "timestamp": "2026-03-29T10:42:00.123Z"
}
```

---

## 🗄️ Database Schema

**sessions**
```sql
CREATE TABLE sessions (
    id            TEXT PRIMARY KEY,
    created_at    TEXT NOT NULL,
    closed_at     TEXT,
    total_frames  INTEGER DEFAULT 0,
    total_faces   INTEGER DEFAULT 0
);
```

**emotion_records**
```sql
CREATE TABLE emotion_records (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id        TEXT NOT NULL,
    timestamp         TEXT NOT NULL,
    dominant_emotion  TEXT NOT NULL,
    emotions_json     TEXT NOT NULL,
    face_count        INTEGER DEFAULT 1,
    fps               REAL DEFAULT 0
);
```

---

## ⚠️ Troubleshooting

| Problem | Fix |
|---|---|
| `numpy` install fails | Run `pip install numpy --only-binary :all:` first |
| Camera not working | Use Chrome or Edge — not Firefox |
| Frontend can't reach backend | Confirm backend is running on port 8000 |
| `venv\Scripts\activate` blocked | Run `Set-ExecutionPolicy RemoteSigned` in PowerShell as Admin |
| Python version error | Install Python 3.11 specifically — not 3.12, 3.13, or 3.14 |
| DeepFace slow on first run | Normal — AI model downloads on first use (approx 300MB) |

---

## 🔒 Privacy

All processing is **100% local** on your machine:
- Frames are decoded in memory and never written to disk
- No images or video are sent to any external server
- Only emotion labels and confidence scores are saved to your local SQLite database


---

## 🙌 Acknowledgements

- [DeepFace](https://github.com/serengil/deepface) — Face analysis library by Sefik Ilkin Serengil
- [FER2013](https://www.kaggle.com/datasets/msambare/fer2013) — Facial emotion dataset
- [FastAPI](https://fastapi.tiangolo.com) — Modern Python web framework
- [Vite](https://vitejs.dev) — Fast React development build tool

---

<div align="center">
  Developed by **Vishnu Badiger**
  <strong>Built with ❤️ using FastAPI + React + DeepFace + WebSocket</strong>
</div>
[README (3).md](https://github.com/user-attachments/files/26327528/README.3.md)
