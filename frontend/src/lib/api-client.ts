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
  overallScore: number;
  spiderChart: {
    problemSolving: number;
    communication: number;
    technicalAccuracy: number;
    codeQuality: number;
    systemDesign: number;
  };
  strengths: Array<{ category: string; feedback: string }>;
  weaknesses: Array<{ category: string; feedback: string }>;
}

export interface Roadmap {
  modules: Array<{
    title: string;
    description: string;
    priority: string;
    resources: string[];
  }>;
}

// Phase 6: History Types matching Design Doc §5
export interface HistorySession {
  sessionId: string;
  date: string;
  interviewType: string;
  companyStyle: string;
  status: string;
  durationMinutes: number | null;
}

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
};

export const uploadResume = async (
  file: File,
  token: string,
  jobDescription?: string
): Promise<ResumeUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  if (jobDescription) {
    formData.append("jobDescription", jobDescription);
  }

  const res = await fetch(`${getBaseUrl()}/resume/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  
  if (!res.ok) {
    throw new Error('Failed to upload resume');
  }
  return res.json();
};

export const fetchScorecard = async (sessionId: string, token: string): Promise<Scorecard> => {
  const res = await fetch(`${getBaseUrl()}/scorecard/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch scorecard');
  }
  return res.json();
};

export const generateRoadmap = async (scorecardId: string, token: string): Promise<Roadmap> => {
  const res = await fetch(`${getBaseUrl()}/roadmap/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ scorecardId })
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch roadmap');
  }
  return res.json();
};

export const fetchHistory = async (userId: string, token: string): Promise<HistorySession[]> => {
  const res = await fetch(`${getBaseUrl()}/history`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch history');
  }
  return res.json();
};

export const startInterview = async (
  token: string,
  data: {
    resumeId: string | null;
    interviewType: string;
    companyStyle: string;
    language: string;
  }
): Promise<{ sessionId: string; wsUrl: string }> => {
  const res = await fetch(`${getBaseUrl()}/interview/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    throw new Error('Failed to start interview');
  }
  return res.json();
};

export const endInterview = async (
  sessionId: string,
  reason: string,
  token: string
): Promise<{ status: string; scorecardId: string | null }> => {
  const res = await fetch(`${getBaseUrl()}/interview/${sessionId}/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  
  if (!res.ok) {
    throw new Error('Failed to end interview');
  }
  return res.json();
};