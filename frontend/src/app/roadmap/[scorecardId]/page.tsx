// app/roadmap/[sessionId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { generateRoadmap, Roadmap } from "@/lib/api-client";

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  // Using the param name from the URL path, assuming we might change the folder to [sessionId]
  // If the folder is still [scorecardId], this param matches that. We'll map it logically.
  const sessionId = (params.sessionId || params.scorecardId) as string;
  
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const data = await generateRoadmap(sessionId, token);
          setRoadmap(data);
        }
      } catch (error) {
        console.error("Failed to generate roadmap", error);
      } finally {
        setLoading(false);
      }
    };
    loadRoadmap();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-4" />
          Generating your custom AI engineering roadmap...
        </div>
      </div>
    );
  }
  if (!roadmap) return <div className="flex h-screen items-center justify-center text-red-500">Failed to generate roadmap.</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={() => router.back()} 
        className="text-sm text-zinc-400 hover:text-white mb-8 flex items-center transition-colors"
      >
        &larr; Back to Scorecard
      </button>

      <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
        Your Learning Roadmap
      </h1>
      <p className="text-zinc-400 mb-10 text-lg">
        Targeted modules based on your weak areas from the last interview.
      </p>

      <div className="space-y-8 relative">
        {/* Connecting line for roadmap */}
        <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-transparent -z-10" />

        {roadmap.modules.map((module, i) => (
          <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all group">
            <div className="bg-black/40 px-8 py-5 border-b border-white/10 flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(168,85,247,0.5)] shrink-0">
                  {i + 1}
                </div>
                <h2 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">{module.title}</h2>
              </div>
              <span className={`text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full whitespace-nowrap ${
                module.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                module.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {module.priority} Priority
              </span>
            </div>
            
            <div className="p-8">
              <p className="text-zinc-300 mb-6 leading-relaxed">{module.description}</p>
              
              <h3 className="text-zinc-400 font-semibold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                <span className="text-purple-400">📚</span> Resources
              </h3>
              <ul className="space-y-4">
                {module.resources.map((resource, j) => (
                  <li key={j} className="flex justify-between items-center group/item bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors">
                    <p className="font-semibold text-zinc-200 group-hover/item:text-blue-400 transition-colors mb-1 pr-6">
                      {resource}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => router.push("/dashboard")} 
        className="mt-16 w-full bg-black/50 border border-white/10 text-white py-5 rounded-2xl font-bold hover:bg-white/5 transition-all text-lg"
      >
        Return to Dashboard
      </button>
    </div>
  );
}