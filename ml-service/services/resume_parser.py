import pickle
import io
import PyPDF2

# Load the models into memory when the service starts
with open("models/tfidf.pkl", "rb") as f:
    tfidf_vectorizer = pickle.load(f)

with open("models/resume_model.pkl", "rb") as f:
    resume_model = pickle.load(f)

def extract_text_from_pdf(pdf_bytes):
    """Extracts raw text from a PDF byte stream."""
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + " "
    return text

def process_resume(pdf_bytes):
    """Processes the PDF and runs it through the ML pipeline."""
    try:
        # 1. Extract text
        raw_text = extract_text_from_pdf(pdf_bytes)
        
        # 2. Vectorize using your loaded TF-IDF model
        vectorized_text = tfidf_vectorizer.transform([raw_text])
        
        # 3. Predict category or score using your resume model
        prediction = resume_model.predict(vectorized_text)
        
        # Note: Adjust the return structure based on what your specific model outputs (e.g., classification vs regression)
        return {
            "status": "success",
            "prediction": str(prediction[0]),
            "extracted_length": len(raw_text)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}