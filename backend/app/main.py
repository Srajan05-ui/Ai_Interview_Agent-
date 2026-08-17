from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from app.api.v1 import auth, resume, interview, history, scorecard, roadmap
from app.ws import interview as interview_ws
from app.db.session import engine, Base

app = FastAPI(
    title="InterviewIQ Backend API",
    description="Backend API for AI Interview Agent",
    version="1.0.0"
)

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with actual frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(resume.router, prefix="/api/v1/resume", tags=["Resume"])
app.include_router(interview.router, prefix="/api/v1/interview", tags=["Interview"])
app.include_router(history.router, prefix="/api/v1/history", tags=["History"])
app.include_router(scorecard.router, prefix="/api/v1/scorecard", tags=["Scorecard"])
app.include_router(roadmap.router, prefix="/api/v1/roadmap", tags=["Roadmap"])
app.include_router(interview_ws.router, prefix="/ws/interview", tags=["WebSocket Interview"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Serve SPA statically if the directory exists
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")

if os.path.exists(STATIC_DIR):
    app.mount("/_next", StaticFiles(directory=os.path.join(STATIC_DIR, "_next")), name="next_static")
    
    # Catch-all route to serve the index.html or other static files
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # SPA fallback
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
