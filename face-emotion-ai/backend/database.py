"""
Database — Async SQLite storage for sessions & emotion records
"""
import json
import sqlite3
from datetime import datetime
from typing import Optional
import aiosqlite

DB_PATH = "emotiscan.db"

CREATE_SESSIONS = """
CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    created_at  TEXT NOT NULL,
    closed_at   TEXT,
    total_frames INTEGER DEFAULT 0,
    total_faces  INTEGER DEFAULT 0
);
"""

CREATE_RECORDS = """
CREATE TABLE IF NOT EXISTS emotion_records (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id       TEXT NOT NULL,
    timestamp        TEXT NOT NULL,
    dominant_emotion TEXT NOT NULL,
    emotions_json    TEXT NOT NULL,
    face_count       INTEGER DEFAULT 1,
    fps              REAL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
"""


class Database:
    def __init__(self):
        self._conn: Optional[aiosqlite.Connection] = None

    async def init(self):
        self._conn = await aiosqlite.connect(DB_PATH)
        self._conn.row_factory = aiosqlite.Row
        await self._conn.execute(CREATE_SESSIONS)
        await self._conn.execute(CREATE_RECORDS)
        await self._conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_records_session ON emotion_records(session_id)"
        )
        await self._conn.commit()

    async def close(self):
        if self._conn:
            await self._conn.close()

    # ── Sessions ──────────────────────────────────────────────────────────────
    async def create_session(self, session_id: str) -> dict:
        now = datetime.utcnow().isoformat()
        await self._conn.execute(
            "INSERT INTO sessions (id, created_at) VALUES (?, ?)",
            (session_id, now),
        )
        await self._conn.commit()
        return {"id": session_id, "created_at": now}

    async def close_session(self, session_id: str):
        now = datetime.utcnow().isoformat()
        # Update frame / face totals
        await self._conn.execute(
            """UPDATE sessions SET closed_at = ?,
               total_frames = (SELECT COUNT(*) FROM emotion_records WHERE session_id = ?),
               total_faces  = (SELECT COALESCE(SUM(face_count),0) FROM emotion_records WHERE session_id = ?)
               WHERE id = ?""",
            (now, session_id, session_id, session_id),
        )
        await self._conn.commit()

    async def get_session(self, session_id: str) -> Optional[dict]:
        async with self._conn.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None

    async def get_sessions(self, limit: int = 20) -> list[dict]:
        async with self._conn.execute(
            "SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?", (limit,)
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

    async def delete_session(self, session_id: str):
        await self._conn.execute(
            "DELETE FROM emotion_records WHERE session_id = ?", (session_id,)
        )
        await self._conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        await self._conn.commit()

    # ── Records ───────────────────────────────────────────────────────────────
    async def insert_record(
        self,
        session_id: str,
        dominant_emotion: str,
        emotions: dict,
        face_count: int = 1,
        fps: float = 0,
    ):
        now = datetime.utcnow().isoformat()
        await self._conn.execute(
            """INSERT INTO emotion_records
               (session_id, timestamp, dominant_emotion, emotions_json, face_count, fps)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (session_id, now, dominant_emotion, json.dumps(emotions), face_count, fps),
        )
        await self._conn.commit()

    async def get_session_records(self, session_id: str, limit: int = 500) -> list[dict]:
        async with self._conn.execute(
            """SELECT * FROM emotion_records
               WHERE session_id = ?
               ORDER BY timestamp DESC LIMIT ?""",
            (session_id, limit),
        ) as cur:
            rows = await cur.fetchall()
            result = []
            for r in rows:
                d = dict(r)
                d["emotions"] = json.loads(d.pop("emotions_json"))
                result.append(d)
            return result

    async def get_emotion_summary(self, session_id: str) -> dict:
        async with self._conn.execute(
            """SELECT dominant_emotion, COUNT(*) as count
               FROM emotion_records
               WHERE session_id = ?
               GROUP BY dominant_emotion
               ORDER BY count DESC""",
            (session_id,),
        ) as cur:
            rows = await cur.fetchall()
            return {r["dominant_emotion"]: r["count"] for r in rows}

    async def get_global_stats(self) -> dict:
        async with self._conn.execute(
            "SELECT COUNT(*) as total_sessions FROM sessions"
        ) as cur:
            sessions_row = await cur.fetchone()

        async with self._conn.execute(
            "SELECT COUNT(*) as total_records FROM emotion_records"
        ) as cur:
            records_row = await cur.fetchone()

        async with self._conn.execute(
            """SELECT dominant_emotion, COUNT(*) as count
               FROM emotion_records
               GROUP BY dominant_emotion
               ORDER BY count DESC LIMIT 1"""
        ) as cur:
            top_row = await cur.fetchone()

        return {
            "total_sessions": sessions_row["total_sessions"] if sessions_row else 0,
            "total_records":  records_row["total_records"] if records_row else 0,
            "most_detected":  top_row["dominant_emotion"] if top_row else "N/A",
        }
