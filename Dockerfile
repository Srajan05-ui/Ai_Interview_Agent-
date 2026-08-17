# Stage 1: Build the Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI backend + Next.js standalone server
FROM python:3.11-slim
WORKDIR /app

# Install Node.js 20 in the Python image (needed for Next.js standalone server)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy the Next.js standalone server from Stage 1
COPY --from=frontend-builder /app/frontend/.next/standalone/frontend ./frontend
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Expose port
ENV PORT=8000
EXPOSE $PORT

# Start script: run Next.js on port 3000 and FastAPI on $PORT
# FastAPI will reverse-proxy or we use a simple supervisor approach
COPY <<'EOF' /app/start.sh
#!/bin/bash
# Start Next.js standalone server in background on port 3000
cd /app/frontend && PORT=3000 node server.js &

# Start FastAPI (Uvicorn) on the main port
cd /app && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
EOF

RUN chmod +x /app/start.sh
CMD ["/bin/bash", "/app/start.sh"]
