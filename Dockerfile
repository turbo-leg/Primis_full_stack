# Railway Backend Deployment
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install additional production dependencies
RUN pip install --no-cache-dir gunicorn

# Copy backend application
COPY backend/ .

# Create directories
RUN mkdir -p uploads qr_codes

# Expose port (Railway uses PORT env variable)
EXPOSE 8000

# Run with single worker for free tier (512MB RAM limit)
# For production with more RAM, increase workers: --workers 2-4
CMD ["sh", "-c", "gunicorn app.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --timeout 120"]
