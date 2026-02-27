from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from services.resume_parser import process_resume
from services.emotion_detector import process_emotion_frame

# ---------------------------------------------------
# Initialize FastAPI App
# ---------------------------------------------------
app = FastAPI(
    title="HireAI Machine Learning API",
    description="Microservice for Resume NLP & ATS Scoring & Emotion Detection",
    version="2.0.0"
)

# ---------------------------------------------------
# CORS Configuration (For MERN Frontend)
# ---------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------
# Root Endpoint
# ---------------------------------------------------
@app.get("/")
def read_root():
    return {
        "message": "HireAI ML Service is running.",
        "status": "success"
    }

# ---------------------------------------------------
# Resume Parsing + ATS Scoring Endpoint
# ---------------------------------------------------
@app.post("/api/ml/parse-resume")
async def api_parse_resume(
    file: UploadFile = File(...),
    jobDescription: str = Form(...)
):
    try:
        # Validate file type
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported."
            )

        # Validate JD text
        if not jobDescription.strip():
            raise HTTPException(
                status_code=400,
                detail="Job Description cannot be empty."
            )

        # Read resume file
        file_bytes = await file.read()

        # Process Resume with JD
        result = process_resume(file_bytes, jobDescription)

        if result.get("status") == "error":
            raise HTTPException(
                status_code=500,
                detail=result.get("message", "Resume processing failed.")
            )

        return JSONResponse(content=result)

    except HTTPException as http_err:
        raise http_err

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

# ---------------------------------------------------
# Emotion Detection Endpoint (Webcam Stream)
# ---------------------------------------------------
@app.post("/api/ml/detect-emotion")
async def api_detect_emotion(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()

        result = process_emotion_frame(file_bytes)

        if result.get("status") == "error":
            # Return safe response (avoid crashing frontend stream)
            return {
                "emotion": "Unknown",
                "confidence_score": 0.0,
                "message": result.get("message", "Face not detected.")
            }

        return JSONResponse(content=result)

    except Exception as e:
        return {
            "emotion": "Unknown",
            "confidence_score": 0.0,
            "message": f"Processing error: {str(e)}"
        }

# ---------------------------------------------------
# Run Server
# ---------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "main:app",  # FIXED: Changed from "app:app" to "main:app"
        host="0.0.0.0",
        port=8000,
        reload=True
    )