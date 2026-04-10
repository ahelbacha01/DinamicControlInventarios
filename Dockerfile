# Multi-stage build for backend (FastAPI) and frontend (Vue 3)

# Stage 1: Build Vue 3 frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY package*.json ./

RUN npm ci --only=production && \
    npm ci --only=dev

COPY . .

RUN npm run build

# Stage 2: Python backend runtime
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for pyodbc
RUN apt-get update && apt-get install -y --no-install-recommends \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY main.py .

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./static

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/departamentosCencosud', timeout=5)" || exit 1

# Run FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
