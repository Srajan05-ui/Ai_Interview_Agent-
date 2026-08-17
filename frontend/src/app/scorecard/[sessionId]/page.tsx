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
    router.push(`/roadmap/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
          Loading your interview results...
        </div>
      </div>
    );
  }
  if (!scorecard) return <div className="flex h-screen items-center justify-center text-red-400">Failed to load scorecard.</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Glow effect in background of header */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
        
        <div className="flex justify-between items-end border-b border-white/10 pb-6 relative z-10">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Interview Scorecard
            </h1>
            <p className="text-zinc-400">Session ID: <span className="font-mono text-zinc-300">{sessionId}</span></p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {scorecard.overallScore}<span className="text-2xl text-zinc-500">/100</span>
            </div>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2">Overall Score</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
          <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center group hover:border-blue-500/30 transition-all">
            <h3 className="text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-xs">Problem Solving</h3>
            <p className="text-3xl font-bold text-white">{scorecard.spiderChart.problemSolving}</p>
          </div>
          <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center group hover:border-purple-500/30 transition-all">
            <h3 className="text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-xs">Communication</h3>
            <p className="text-3xl font-bold text-white">{scorecard.spiderChart.communication}</p>
          </div>
          <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center group hover:border-green-500/30 transition-all">
            <h3 className="text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-xs">Tech Accuracy</h3>
            <p className="text-3xl font-bold text-white">{scorecard.spiderChart.technicalAccuracy}</p>
          </div>
          <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center group hover:border-yellow-500/30 transition-all">
            <h3 className="text-zinc-400 font-semibold mb-1 uppercase tracking-wider text-xs">System Design</h3>
            <p className="text-3xl font-bold text-white">{scorecard.spiderChart.systemDesign}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center gap-3">
            <span className="bg-green-500/20 p-2 rounded-lg">✅</span> Strong Areas
          </h2>
          <ul className="space-y-4">
            {scorecard.strengths.map((area, i) => (
              <li key={i} className="flex gap-3 text-zinc-300 items-start">
                <span className="text-green-500 mt-1">•</span> 
                <span className="leading-relaxed"><strong>{area.category}:</strong> {area.feedback}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-yellow-400 flex items-center gap-3">
            <span className="bg-yellow-500/20 p-2 rounded-lg">⚠️</span> Needs Improvement
          </h2>
          <ul className="space-y-4">
            {scorecard.weaknesses.map((area, i) => (
              <li key={i} className="flex gap-3 text-zinc-300 items-start">
                <span className="text-yellow-500 mt-1">•</span> 
                <span className="leading-relaxed"><strong>{area.category}:</strong> {area.feedback}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={handleGenerateRoadmap}
        disabled={generatingRoadmap}
        className="w-full bg-white text-black py-5 rounded-2xl font-bold text-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
      >
        {generatingRoadmap ? (
          <span className="animate-pulse">Loading roadmap...</span>
        ) : (
          <>
            <span>Generate Custom Learning Roadmap</span>
            <span className="text-2xl">🗺️</span>
          </>
        )}
      </button>
    </div>
  );
}