// app/scorecard/[sessionId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { fetchScorecard, Scorecard } from "@/lib/api-client";

export default function ScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  useEffect(() => {
    const loadScorecard = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const data = await fetchScorecard(sessionId, token);
          setScorecard(data);
        }
      } catch (error) {
        console.error("Failed to load scorecard", error);
      } finally {
        setLoading(false);
      }
    };
    loadScorecard();
  }, [sessionId]);

  const handleGenerateRoadmap = async () => {
    if (!scorecard) return;
    setGeneratingRoadmap(true);
    // Real flow routes to the roadmap page which fetches it, or triggers generation here
    router.push(`/roadmap/${scorecard.id}`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading your results...</div>;
  if (!scorecard) return <div className="flex h-screen items-center justify-center text-red-500">Failed to load scorecard.</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 mt-10 space-y-8">
      <div className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Interview Scorecard</h1>
          <p className="text-gray-500">Session ID: {sessionId}</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-black text-blue-600">{scorecard.overallScore}<span className="text-2xl text-gray-400">/100</span></div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mt-1">Overall Score</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-xl border">
          <h3 className="text-gray-500 font-semibold mb-1">Technical Score</h3>
          <p className="text-3xl font-bold">{scorecard.technicalScore}</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl border">
          <h3 className="text-gray-500 font-semibold mb-1">Communication Score</h3>
          <p className="text-3xl font-bold">{scorecard.communicationScore}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4 text-green-700">Strong Areas</h2>
          <ul className="space-y-2">
            {scorecard.strongAreas.map((area, i) => (
              <li key={i} className="flex gap-2 text-gray-700">
                <span>✅</span> {area}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4 text-red-700">Areas for Improvement</h2>
          <ul className="space-y-2">
            {scorecard.weakAreas.map((area, i) => (
              <li key={i} className="flex gap-2 text-gray-700">
                <span>⚠️</span> {area}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Detailed Feedback</h2>
        <div className="space-y-4">
          {scorecard.detailedFeedback.map((feedback, i) => (
            <div key={i} className="bg-white border p-4 rounded-lg shadow-sm">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mb-2">
                {feedback.momentRef}
              </span>
              <p className="text-gray-800">{feedback.comment}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 border-t">
        <button
          onClick={handleGenerateRoadmap}
          disabled={generatingRoadmap}
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          {generatingRoadmap ? "Analyzing gaps..." : "Generate Custom Learning Roadmap"}
        </button>
      </div>
    </div>
  );
}