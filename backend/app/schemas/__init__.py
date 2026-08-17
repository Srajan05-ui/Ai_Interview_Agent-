from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class Suggestion(BaseModel):
    section: str
    issue: str
    suggestion: str

class AtsSubscores(BaseModel):
    formatting: int
    keywordMatch: int
    structure: int
    impactQuantification: int

class ResumeUploadResponse(BaseModel):
    resumeId: str
    atsScore: int
    atsSubscores: AtsSubscores
    suggestions: List[Suggestion]
    parsedSkills: List[str]

class UserResponse(BaseModel):
    userId: str = Field(..., alias="id")
    email: str
    displayName: str = Field(..., alias="display_name")
    authProvider: str = Field(..., alias="auth_provider")
    profileComplete: bool
    targetRole: Optional[str] = Field(None, alias="target_role")
    experienceLevel: Optional[str] = Field(None, alias="experience_level")
    createdAt: datetime = Field(..., alias="created_at")

    class Config:
        populate_by_name = True
        from_attributes = True

class InterviewStartRequest(BaseModel):
    resumeId: Optional[str] = None
    interviewType: str
    companyStyle: Optional[str] = None
    language: str = "en"

class InterviewStartResponse(BaseModel):
    sessionId: str
    wsUrl: str

class InterviewEndRequest(BaseModel):
    reason: str

class InterviewEndResponse(BaseModel):
    status: str
    scorecardId: Optional[str] = None

class FeedbackItem(BaseModel):
    category: str
    feedback: str

class SpiderChartData(BaseModel):
    problemSolving: int
    communication: int
    technicalAccuracy: int
    codeQuality: int
    systemDesign: int

class ScorecardResponse(BaseModel):
    overallScore: int
    spiderChart: SpiderChartData
    strengths: List[FeedbackItem]
    weaknesses: List[FeedbackItem]
