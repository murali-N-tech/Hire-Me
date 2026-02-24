import numpy as np
import cv2
from tensorflow.keras.models import load_model

# Load the model without compiling to bypass Keras 3 optimizer argument errors
emotion_model = load_model("models/emotion_model.h5", compile=False)

# Standard emotion labels
EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

def process_emotion_frame(image_bytes):
    """Processes a webcam frame and predicts the emotion."""
    try:
        # 1. Convert bytes to numpy array, then to OpenCV image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"status": "error", "message": "Could not decode image."}
        
        # 2. Convert to grayscale (most emotion models expect grayscale)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 3. Use OpenCV's built-in Haar Cascade to detect the face
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

        if len(faces) == 0:
            return {"status": "error", "message": "No face detected in frame"}

        # Process the first face found
        x, y, w, h = faces[0]
        roi_gray = gray[y:y+h, x:x+w]
        
        # 4. Resize to 48x48, normalize, and reshape for the model
        roi_gray = cv2.resize(roi_gray, (48, 48))
        roi_gray = roi_gray / 255.0
        roi_gray = np.reshape(roi_gray, (1, 48, 48, 1))
        
        # 5. Predict emotion
        prediction = emotion_model.predict(roi_gray)
        max_index = int(np.argmax(prediction))
        predicted_emotion = EMOTION_LABELS[max_index]
        confidence = float(np.max(prediction))

        return {
            "status": "success",
            "emotion": predicted_emotion,
            "confidence_score": confidence
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}