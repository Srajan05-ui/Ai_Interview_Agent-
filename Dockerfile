# Stage 1: Build the Next.js frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# We already set output: 'export' in next.config.mjs
RUN npm run build

# Stage 2: Build the FastAPI backend and serve static files
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (e.g. for PyMuPDF)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy built frontend from Stage 1 to a directory that FastAPI will serve
COPY --from=frontend-builder /app/frontend/out ./static

# Expose port (default 8000, but can be overridden by Render via $PORT)
ENV PORT=8000
EXPOSE $PORT

# Start Uvicorn
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
