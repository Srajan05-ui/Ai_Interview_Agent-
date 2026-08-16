// lib/api-client.ts

export interface ResumeUploadResponse {
  resumeId: string;
  atsScore: number;
  atsSubscores: {
    formatting: number;
    keywordMatch: number;
    structure: number;
    impactQuantification: number;
  };
  suggestions: Array<{ section: string; issue: string; suggestion: string }>;
  parsedSkills: string[];
}

export interface Scorecard {
  id: string;
  sessionId: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  topicBreakdown: Array<{ topic: string; score: number; verdict: "strong" | "weak" }>;
  strongAreas: string[];
  weakAreas: string[];
  detailedFeedback: Array<{ momentRef: string; comment: string }>;
}

export interface Roadmap {
  id: string;
  scorecardId: string;
  topics: Array<{
    topic: string;
    order: number;
    resources: Array<{ title: string; url: string; type: string }>;
  }>;
}

// Phase 6: History Types matching Design Doc §5
export interface HistorySession {
  id: string;
  date: string;
  type: string;
  overallScore: number;
  companyStyle: string;
}

export const uploadResume = async (
  file: File,
  token: string,
  jobDescription?: string
): Promise<ResumeUploadResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    resumeId: "mock-uuid-1234-5678",
    atsScore: 82,
    atsSubscores: { formatting: 90, keywordMatch: 75, structure: 85, impactQuantification: 70 },
    suggestions: [
      { section: "Experience", issue: "Bullets lack metrics", suggestion: "Add measurable impact, e.g., 'reduced latency by 30%'" },
      { section: "Skills", issue: "Missing core AI frameworks", suggestion: "Include LangChain or LlamaIndex if you have experience with them" }
    ],
    parsedSkills: ["Next.js", "TypeScript", "Tailwind CSS", "React", "Figma"]
  };
};

export const fetchScorecard = async (sessionId: string, token: string): Promise<Scorecard> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    id: "mock-scorecard-uuid",
    sessionId,
    overallScore: 85,
    technicalScore: 88,
    communicationScore: 82,
    topicBreakdown: [
      { topic: "Vector Databases", score: 90, verdict: "strong" },
      { topic: "RAG Architecture", score: 85, verdict: "strong" },
      { topic: "Agentic AI", score: 65, verdict: "weak" }
    ],
    strongAreas: ["Excellent understanding of vector embeddings", "Clear communication pace"],
    weakAreas: ["Struggled with multi-agent orchestration concepts", "Code complexity analysis was brief"],
    detailedFeedback: [
      { momentRef: "Turn 3 (Vector Indexing)", comment: "You clearly explained HNSW, but did not contrast it with IVF." },
      { momentRef: "Turn 6 (Coding)", comment: "Your Python solution was O(n), which is optimal, but you used inconsistent variable casing." }
    ]
  };
};

export const generateRoadmap = async (scorecardId: string, token: string): Promise<Roadmap> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    id: "mock-roadmap-uuid",
    scorecardId,
    topics: [
      {
        topic: "Agentic AI & Orchestration",
        order: 1,
        resources: [
          { title: "LangChain Agents Documentation", url: "#", type: "Reading" },
          { title: "Building Multi-Agent Workflows", url: "#", type: "Video" }
        ]
      },
      {
        topic: "Advanced Indexing (IVF vs HNSW)",
        order: 2,
        resources: [
          { title: "Pinecone: Vector Indexes Explained", url: "#", type: "Reading" }
        ]
      }
    ]
  };
};

export const fetchHistory = async (userId: string, token: string): Promise<HistorySession[]> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return [
    { id: "sess-01", date: "2026-08-10T10:00:00Z", type: "technical", overallScore: 72, companyStyle: "generic" },
    { id: "sess-02", date: "2026-08-12T14:30:00Z", type: "coding", overallScore: 78, companyStyle: "startup" },
    { id: "sess-03", date: "2026-08-14T09:15:00Z", type: "technical", overallScore: 85, companyStyle: "google" },
    { id: "sess-04", date: "2026-08-16T16:45:00Z", type: "technical", overallScore: 89, companyStyle: "amazon" },
  ];
};