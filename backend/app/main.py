from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
from fastapi.responses import StreamingResponse
from app.api.v1 import auth, resume, interview, history, scorecard, roadmap
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

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Reverse proxy all non-API requests to Next.js standalone server on port 3000
NEXTJS_URL = os.getenv("NEXTJS_URL", "http://127.0.0.1:3000")

@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
async def proxy_to_nextjs(request: Request, full_path: str):
    """Proxy frontend requests to the Next.js standalone server."""
    # Don't proxy API routes (they're handled by the routers above)
    if full_path.startswith("api/"):
        return {"error": "Not found"}, 404

    url = f"{NEXTJS_URL}/{full_path}"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                url,
                headers={key: value for key, value in request.headers.items() if key.lower() != "host"},
                params=dict(request.query_params),
                follow_redirects=True,
                timeout=10.0,
            )
            return StreamingResponse(
                iter([resp.content]),
                status_code=resp.status_code,
                headers=dict(resp.headers),
            )
        except httpx.ConnectError:
            # Next.js server not yet started, return a simple page
            return StreamingResponse(
                iter([b"<html><body><h1>Starting up...</h1><script>setTimeout(()=>location.reload(),2000)</script></body></html>"]),
                status_code=503,
                media_type="text/html",
            )
