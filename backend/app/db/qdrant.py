import os
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from pydantic import BaseModel
import uuid

# Hybrid approach: Try to connect to cloud, fallback to in-memory if keys missing
qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")

if qdrant_url and qdrant_api_key:
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
else:
    # Use in-memory for testing without setup
    client = QdrantClient(":memory:")

COLLECTION_NAME = "question_bank"

def init_qdrant():
    """Initializes the collection and seeds some basic questions."""
    collections = client.get_collections().collections
    if not any(c.name == COLLECTION_NAME for c in collections):
        # We assume 1536 dims for standard embedding models, or 768. 
        # Using 3 for dummy vectors since we won't embed actively in this mock.
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=3, distance=Distance.COSINE),
        )
        # Seed basic questions
        seed_questions = [
            {"topic": "python", "difficulty": "easy", "text": "What is the difference between a list and a tuple in Python?"},
            {"topic": "rag", "difficulty": "medium", "text": "Explain the concept of chunking in RAG pipelines and why it is important."},
            {"topic": "databases", "difficulty": "hard", "text": "How do you handle race conditions in a highly concurrent PostgreSQL setup?"}
        ]
        
        points = []
        for q in seed_questions:
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=[0.1, 0.2, 0.3], # Dummy vector
                    payload=q
                )
            )
        client.upsert(collection_name=COLLECTION_NAME, points=points)

def get_qdrant_client():
    return client

# Run init on import (for Phase 2 testing ease)
try:
    init_qdrant()
except Exception as e:
    print(f"Warning: Qdrant init failed: {e}")
