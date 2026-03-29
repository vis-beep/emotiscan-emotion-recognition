"""
EmotionDetector — DeepFace-powered face emotion analysis
"""
import cv2
import numpy as np
from typing import Any

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("⚠️  DeepFace not available — using OpenCV fallback")


EMOTIONS = ["angry", "disgusted", "fearful", "happy", "neutral", "sad", "surprised"]

EMOTION_EMOJIS = {
    "angry":     "😡",
    "disgusted": "🤢",
    "fearful":   "😨",
    "happy":     "😄",
    "neutral":   "😐",
    "sad":       "😢",
    "surprised": "😲",
}

EMOTION_COLORS = {
    "angry":     "#ef233c",
    "disgusted": "#4a7c59",
    "fearful":   "#7b2d8b",
    "happy":     "#ffd166",
    "neutral":   "#00d4ff",
    "sad":       "#118ab2",
    "surprised": "#f4a261",
}


class EmotionDetector:
    def __init__(self):
        self._ready = False
        self._face_cascade = None
        self._init()

    def _init(self):
        # Always load OpenCV cascade as fast fallback detector
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self._face_cascade = cv2.CascadeClassifier(cascade_path)

        if DEEPFACE_AVAILABLE:
            # Warm up DeepFace on a dummy frame
            try:
                dummy = np.zeros((48, 48, 3), dtype=np.uint8)
                DeepFace.analyze(
                    dummy,
                    actions=["emotion"],
                    enforce_detection=False,
                    silent=True,
                )
                print("✅ DeepFace model loaded")
            except Exception as e:
                print(f"⚠️  DeepFace warmup warning: {e}")
        else:
            print("ℹ️  Running with OpenCV-only detection")

        self._ready = True

    def is_ready(self) -> bool:
        return self._ready

    def analyze(self, frame: np.ndarray) -> dict:
        """
        Analyze frame and return faces with emotion data.
        Falls back to OpenCV + simulated emotions if DeepFace unavailable.
        """
        if DEEPFACE_AVAILABLE:
            return self._analyze_deepface(frame)
        return self._analyze_opencv_fallback(frame)

    def _analyze_deepface(self, frame: np.ndarray) -> dict:
        try:
            results = DeepFace.analyze(
                frame,
                actions=["emotion"],
                enforce_detection=False,
                detector_backend="opencv",
                silent=True,
            )

            if not isinstance(results, list):
                results = [results]

            faces = []
            for r in results:
                region = r.get("region", {})
                emotions_raw = r.get("emotion", {})

                # Normalize to lowercase keys
                emotions = {k.lower(): round(v / 100, 4) for k, v in emotions_raw.items()}
                dominant = max(emotions, key=emotions.get)

                faces.append({
                    "box": {
                        "x":      region.get("x", 0),
                        "y":      region.get("y", 0),
                        "width":  region.get("w", 0),
                        "height": region.get("h", 0),
                    },
                    "dominant_emotion": dominant,
                    "dominant_emoji":   EMOTION_EMOJIS.get(dominant, "🙂"),
                    "dominant_color":   EMOTION_COLORS.get(dominant, "#ffffff"),
                    "confidence":       round(emotions.get(dominant, 0), 4),
                    "emotions":         emotions,
                })

            return {"faces": faces}

        except Exception as e:
            # Graceful degradation: detect faces with OpenCV, return uniform emotions
            print(f"DeepFace error (using fallback): {e}")
            return self._analyze_opencv_fallback(frame)

    def _analyze_opencv_fallback(self, frame: np.ndarray) -> dict:
        """OpenCV Haar cascade detection + uniform emotion distribution as placeholder."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        detected = self._face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
        )

        faces = []
        for (x, y, w, h) in detected:
            # Placeholder: uniform-ish distribution
            emotions = {e: round(1.0 / len(EMOTIONS), 4) for e in EMOTIONS}
            emotions["neutral"] = 0.5  # bias neutral as unknown
            total = sum(emotions.values())
            emotions = {k: round(v / total, 4) for k, v in emotions.items()}
            dominant = "neutral"

            faces.append({
                "box": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                "dominant_emotion": dominant,
                "dominant_emoji":   EMOTION_EMOJIS[dominant],
                "dominant_color":   EMOTION_COLORS[dominant],
                "confidence":       emotions[dominant],
                "emotions":         emotions,
            })

        return {"faces": faces}
