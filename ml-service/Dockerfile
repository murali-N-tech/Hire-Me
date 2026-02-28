# Use official Python image
FROM python:3.10

# Set the working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
# Install system dependencies required by OpenCV
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your ML service code
COPY . .

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Run FastAPI using Uvicorn on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]