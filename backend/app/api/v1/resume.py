from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models import Resume
from app.schemas import ResumeUploadResponse, AtsSubscores, Suggestion
from app.api.v1.auth import verify_firebase_token
from app.services.resume_parser import extract_text_from_upload
from app.services.ats_scorer import analyze_resume
import os
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    jobDescription: str = Form(None),
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # Validate file type
    filename = file.filename or ""
    if not (filename.lower().endswith(".pdf") or filename.lower().endswith(".docx")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF and DOCX files are supported.")

    try:
        # Read file bytes
        file_bytes = await file.read()
        
        # Parse text
        resume_text = extract_text_from_upload(file_bytes, filename)
        if not resume_text:
            raise ValueError("No readable text found in the file.")
            
        # Analyze with LLM
        ats_result = await analyze_resume(resume_text, jobDescription)
        
        # Save file locally as mock for S3 (since this is $0 budget MVP phase 1)
        upload_dir = "./uploads"
        os.makedirs(upload_dir, exist_ok=True)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_bytes)
            
        file_url = f"/uploads/{unique_filename}"  # In future, this would be an S3 URL

        # Create DB record
        resume_record = Resume(
            user_id=uid,
            file_url=file_url,
            parsed_skills=ats_result.get("parsedSkills", []),
            ats_score=ats_result.get("atsScore", 0),
            ats_subscores=ats_result.get("atsSubscores", {}),
            suggestions=ats_result.get("suggestions", []),
            created_at=datetime.utcnow()
        )
        
        db.add(resume_record)
        await db.commit()
        await db.refresh(resume_record)
        
        # Format response
        return ResumeUploadResponse(
            resumeId=resume_record.id,
            atsScore=resume_record.ats_score,
            atsSubscores=AtsSubscores(**resume_record.ats_subscores),
            suggestions=[Suggestion(**s) for s in resume_record.suggestions],
            parsedSkills=resume_record.parsed_skills
        )

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error processing resume: {str(e)}")
