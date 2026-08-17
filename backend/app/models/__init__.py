from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    auth_provider = Column(String, nullable=False)
    target_role = Column(String, nullable=True)
    experience_level = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    file_url = Column(String, nullable=False)
    parsed_skills = Column(JSON, nullable=True)  # array of strings
    parsed_experience = Column(JSON, nullable=True)
    ats_score = Column(Integer, nullable=True)
    ats_subscores = Column(JSON, nullable=True)
    suggestions = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=True)
    interview_type = Column(String, nullable=False) # "technical" or "coding"
    company_style = Column(String, nullable=True)
    language = Column(String, nullable=False, default="en")
    status = Column(String, nullable=False, default="in_progress")
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    concept_graph_snapshot = Column(JSON, nullable=True)

class InterviewTurn(Base):
    __tablename__ = "interview_turns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    turn_index = Column(Integer, nullable=False)
    question_text = Column(String, nullable=False)
    question_topic = Column(String, nullable=False)
    question_difficulty = Column(String, nullable=False)
    adaptive_reason = Column(String, nullable=False)
    candidate_answer_text = Column(String, nullable=True)
    candidate_code = Column(String, nullable=True)
    turn_score = Column(Integer, nullable=True)
    turn_feedback = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Scorecard(Base):
    __tablename__ = "scorecards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("interview_sessions.id"), unique=True, nullable=False)
    overall_score = Column(Integer, nullable=False)
    technical_score = Column(Integer, nullable=False)
    communication_score = Column(Integer, nullable=False)
    topic_breakdown = Column(JSON, nullable=False)
    strong_areas = Column(JSON, nullable=False)
    weak_areas = Column(JSON, nullable=False)
    detailed_feedback = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scorecard_id = Column(String, ForeignKey("scorecards.id"), nullable=False)
    topics = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
