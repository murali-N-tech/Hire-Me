from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn
from services.resume_parser import process_resume
from services.emotion_detector import process_emotion_frame

app = FastAPI(
    title="HireAI Machine Learning API",
    description="Microservice for handling Resume NLP and Facial Expression Deep Learning",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "HireAI ML Service is running."}

@app.post("/api/ml/parse-resume")
async def api_parse_resume(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    file_bytes = await file.read()
    result = process_resume(file_bytes)
    
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
        
    return result

@app.post("/api/ml/detect-emotion")
async def api_detect_emotion(file: UploadFile = File(...)):
    # The frontend will send webcam frames as image files (e.g., JPEG/PNG)
    file_bytes = await file.read()
    result = process_emotion_frame(file_bytes)
    
    if result["status"] == "error":
        # We return a 200 with an error status rather than a 400 so the frontend stream doesn't crash if a face is temporarily lost
        return {"emotion": "Unknown", "confidence_score": 0.0, "message": result["message"]}
        
    return result

if __name__ == "__main__":
    # Run the server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)