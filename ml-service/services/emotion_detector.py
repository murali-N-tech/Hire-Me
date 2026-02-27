import numpy as np
import cv2
from tensorflow.keras.models import load_model
from ultralytics import YOLO

# 1. Load the Emotion Model
emotion_model = load_model("models/emotion_model.h5", compile=False)
EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# 🔥 FIX 1: Upgrade to the "Small" model (It will auto-download on first run)
yolo_model = YOLO("yolov8s.pt") 

# Items that will trigger a cheating flag
BANNED_ITEMS = ['cell phone', 'remote', 'laptop', 'tablet', 'book']

def process_emotion_frame(image_bytes):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"status": "error", "message": "Could not decode image."}

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # ==========================================
        # 🔥 FIX 2: Raise confidence to 0.35 to stop hallucinations
        # ==========================================
        results = yolo_model.predict(img_rgb, conf=0.35, verbose=False)
        
        for r in results:
            for box in r.boxes:
                class_id = int(box.cls[0].item())
                class_name = yolo_model.names[class_id]
                confidence = float(box.conf[0].item())
                
                print(f"[YOLO Vision] Detected: {class_name} (Confidence: {confidence:.2f})")

                if class_name in BANNED_ITEMS:
                    print(f"🚨 PROCTORING FLAG TRIGGERED: {class_name.upper()} DETECTED!")
                    return {
                        "status": "success",
                        "emotion": "Flagged",
                        "confidence_score": 0.0,
                        "proctoring_flag": f"Unauthorized Device Detected: {class_name.capitalize()}"
                    }

        # ==========================================
        # PROCTORING LAYER 2: FACE COUNT & EMOTION
        # ==========================================
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

        face_count = len(faces)

        if face_count == 0:
            return {
                "status": "success", 
                "emotion": "Away", 
                "confidence_score": 0.0,
                "proctoring_flag": "No face detected"
            }

        proctoring_flag = "Multiple people detected" if face_count > 1 else "Clear"

        if face_count > 0:
            x, y, w, h = faces[0]
            roi_gray = gray[y:y+h, x:x+w]
            roi_gray = cv2.resize(roi_gray, (48, 48)) / 255.0
            roi_gray = np.reshape(roi_gray, (1, 48, 48, 1))
            
            prediction = emotion_model.predict(roi_gray, verbose=0)
            max_index = int(np.argmax(prediction))
            predicted_emotion = EMOTION_LABELS[max_index]
            face_confidence = float(np.max(prediction))
        else:
            predicted_emotion = "Unknown"
            face_confidence = 0.0

        return {
            "status": "success",
            "emotion": predicted_emotion,
            "confidence_score": round(face_confidence * 100, 2),
            "proctoring_flag": proctoring_flag
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}