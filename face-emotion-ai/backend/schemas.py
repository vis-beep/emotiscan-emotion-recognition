"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime


class SessionCreate(BaseModel):
    label: Optional[str] = None


class EmotionRecord(BaseModel):
    session_id: str
    dominant_emotion: str
    emotions: Dict[str, float]
    face_count: int = 1
    fps: float = 0.0
    timestamp: Optional[datetime] = None


class SessionSummary(BaseModel):
    session_id: str
    total_frames: int
    total_faces: int
    created_at: str
    closed_at: Optional[str]
