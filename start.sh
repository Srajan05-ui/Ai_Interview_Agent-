#!/bin/bash
# Start Next.js standalone server in background on port 3000
cd /app/frontend && PORT=3000 node server.js &

# Start FastAPI (Uvicorn) on the main port
cd /app && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
