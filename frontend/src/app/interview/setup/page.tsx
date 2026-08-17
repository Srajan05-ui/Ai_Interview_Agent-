"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startInterview } from "@/lib/api-client";
import { auth } from "@/lib/firebase";

export default function InterviewSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resumeId");
  
  const [duration, setDuration] = useState("30");
  const [difficulty, setDifficulty] = useState("medium");
  const [focusArea, setFocusArea] = useState("fullstack");
  const [language, setLanguage] = useState("en");
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      
      const { sessionId } = await startInterview(token, {
        resumeId: resumeId,
        interviewType: focusArea,
        companyStyle: difficulty,
        language: language
      });
      
      router.push(`/interview/${sessionId}`);
    } catch (error) {
      console.error("Failed to start interview", error);
      setStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
        Configure Your Interview
      </h1>
      <p className="text-zinc-400 mb-8">
        Customize the parameters for your adaptive mock interview. The AI will tailor the questions based on these settings.
      </p>
      
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-10 rounded-3xl shadow-2xl space-y-8">
        
        {resumeId && (
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center space-x-3">
            <span className="text-green-400 text-xl">✓</span>
            <p className="text-green-400 font-medium">Resume {resumeId} successfully linked to this session.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-3 text-zinc-300">Interview Duration</label>
            <div className="grid grid-cols-3 gap-3">
              {["15", "30", "45"].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`py-3 rounded-xl border font-medium transition-all ${
                    duration === mins 
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                      : "bg-black/50 border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium mb-3 text-zinc-300">Difficulty Level</label>
            <div className="grid grid-cols-3 gap-3">
              {["easy", "medium", "hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-3 rounded-xl border font-medium transition-all capitalize ${
                    difficulty === level 
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                      : "bg-black/50 border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Focus Area */}
        <div>
          <label className="block text-sm font-medium mb-3 text-zinc-300">Primary Focus Area</label>
          <select 
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
          >
            <option value="frontend">Frontend Engineering (React, Next.js, CSS)</option>
            <option value="backend">Backend Engineering (Node, Python, System Design)</option>
            <option value="fullstack">Full Stack (End-to-end web development)</option>
            <option value="behavioral">Behavioral & Leadership</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium mb-3 text-zinc-300">Interview Language</label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
          >
            <option value="en">English (US)</option>
            <option value="es">Spanish (Español)</option>
            <option value="fr">French (Français)</option>
            <option value="de">German (Deutsch)</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="zh">Chinese (中文)</option>
          </select>
        </div>

        <div className="pt-6 border-t border-white/10">
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full bg-white text-black font-bold py-5 rounded-xl text-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-3"
          >
            {starting ? (
              <span className="animate-pulse">Provisioning Interview Environment...</span>
            ) : (
              <span>Enter Interview Room &rarr;</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
