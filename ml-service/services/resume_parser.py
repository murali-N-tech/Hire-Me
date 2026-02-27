import pickle
import io
import re
import PyPDF2
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity


# ---------------------------------------------------
# Load Trained ML Models (Role Classifier)
# ---------------------------------------------------
with open("models/tfidf.pkl", "rb") as f:
    trained_vectorizer = pickle.load(f)

with open("models/resume_model.pkl", "rb") as f:
    resume_model = pickle.load(f)


# ---------------------------------------------------
# PDF Text Extraction
# ---------------------------------------------------
def extract_text_from_pdf(pdf_bytes):
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    text = ""

    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + " "

    return text.lower()


# ---------------------------------------------------
# Clean Text
# ---------------------------------------------------
def clean_text(text):
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()


# ---------------------------------------------------
# Keyword Match Score (Jobscan Style Logic)
# ---------------------------------------------------
def calculate_keyword_score(resume_text, jd_text):

    # 1️⃣ Filter JD words (remove stopwords + short words)
    jd_words = [
        w for w in jd_text.split()
        if w not in ENGLISH_STOP_WORDS and len(w) > 2
    ]

    # 2️⃣ Count word frequency (importance detection)
    jd_word_counts = Counter(jd_words)

    # 3️⃣ Extract Top 30 important JD keywords
    top_jd_keywords = [
        word for word, count in jd_word_counts.most_common(30)
    ]

    if not top_jd_keywords:
        return 0.0

    # 4️⃣ Soft Matching
    # Example: "develop" matches "developed"
    matched_keywords = [
        kw for kw in top_jd_keywords
        if kw in resume_text
    ]

    score = (len(matched_keywords) / len(top_jd_keywords)) * 100

    return round(score, 2)


# ---------------------------------------------------
# TF-IDF Cosine Similarity Score (Scaled Like Real ATS)
# ---------------------------------------------------
def calculate_similarity_score(resume_text, jd_text):

    vectorizer = TfidfVectorizer(stop_words='english')

    tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])

    raw_similarity = cosine_similarity(
        tfidf_matrix[0:1],
        tfidf_matrix[1:2]
    )[0][0]

    # 🔥 Scaling Factor:
    # 0.45 raw similarity is actually strong in NLP.
    # Scale ×2.0 to make it more realistic for users.
    scaled_similarity = min(raw_similarity * 2.0, 1.0)

    return round(scaled_similarity * 100, 2)


# ---------------------------------------------------
# Final ATS Weighted Score
# ---------------------------------------------------
def calculate_final_ats(resume_text, jd_text):

    keyword_score = calculate_keyword_score(resume_text, jd_text)
    similarity_score = calculate_similarity_score(resume_text, jd_text)

    # 50% Keyword + 50% Semantic Similarity
    final_score = (0.5 * keyword_score) + (0.5 * similarity_score)

    return {
        "keywordScore": keyword_score,
        "similarityScore": similarity_score,
        "finalATSScore": round(final_score, 2)
    }


# ---------------------------------------------------
# Main Processing Function
# ---------------------------------------------------
def process_resume(pdf_bytes, jd_text):

    try:
        # 1️⃣ Extract Resume Text
        raw_text = extract_text_from_pdf(pdf_bytes)

        cleaned_resume = clean_text(raw_text)
        cleaned_jd = clean_text(jd_text)

        # 2️⃣ Predict Role using trained ML model
        vectorized_text = trained_vectorizer.transform([cleaned_resume])
        predicted_role = resume_model.predict(vectorized_text)[0]

        # 3️⃣ Calculate ATS Scores
        ats_scores = calculate_final_ats(cleaned_resume, cleaned_jd)

        return {
            "status": "success",
            "predictedRole": str(predicted_role),
            "atsScore": ats_scores["finalATSScore"],
            "keywordScore": ats_scores["keywordScore"],
            "similarityScore": ats_scores["similarityScore"],
            "extractedLength": len(cleaned_resume)
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }