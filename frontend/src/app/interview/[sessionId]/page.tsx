// app/interview/[sessionId]/page.tsx
"use client";

import { useInterviewRest } from "@/hooks/useInterviewRest";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { endInterview } from "@/lib/api-client";

import AdaptiveReasonBadge from "@/components/interview/AdaptiveReasonBadge";
import TranscriptPanel from "@/components/interview/TranscriptPanel";
import TopicProgressMap from "@/components/interview/TopicProgressMap";
import MediaControls from "@/components/interview/MediaControls";
import CodeEditorPanel from "@/components/interview/CodeEditorPanel";

export default function InterviewRoomPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [textInput, setTextInput] = useState("");
  const [localCheatWarning, setLocalCheatWarning] = useState(false);
  const [ending, setEnding] = useState(false);
  const router = useRouter();
  
  // Dev toggle to test Phase 4 layout. In production, this maps to session.interviewType
  const [isCodingMode, setIsCodingMode] = useState(true);

  const {
    liveTranscript,
    currentQuestion,
    conceptGraph,
    isCheatWarning,
    sendEvent
  } = useInterviewRest(sessionId);

  const { flagCheat } = useAntiCheat(sessionId, () => setLocalCheatWarning(true));

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    sendEvent("text_answer", textInput);
    setTextInput("");
  };

  const handleCodeSubmit = (language: string, code: string) => {
    sendEvent("code_submission", { language, code });
  };

  const handleEndInterview = async () => {
    setEnding(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      
      const { scorecardId } = await endInterview(sessionId, "user_ended", token);
      if (scorecardId) {
        router.push(`/scorecard/${sessionId}`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to end interview", error);
      setEnding(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden selection:bg-purple-500/30 relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none -z-10" />

      {/* Left Column: Progress & Concept Map */}
      <aside className="w-1/4 backdrop-blur-md bg-white/5 border-r border-white/10 p-6 flex flex-col z-10 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Interview Progress</h2>
        <TopicProgressMap conceptGraph={conceptGraph} />
        
        {/* Dev Toggle for Testing */}
        <div className="mt-auto border-t border-white/10 pt-6">
          <label className="flex items-center gap-3 text-sm text-zinc-400 cursor-pointer hover:text-white transition-colors">
            <input 
              type="checkbox" 
              checked={isCodingMode} 
              onChange={(e) => setIsCodingMode(e.target.checked)} 
              className="rounded bg-black border-white/20 text-purple-500 focus:ring-purple-500/50"
            />
            Toggle Coding Mode (Dev)
          </label>
        </div>
      </aside>

      {/* Center/Right Column: Main Interview Stage */}
      <main className="flex-1 flex flex-col relative z-10">
        
        {/* Anti-Cheat Warning Modal Trigger */}
        {(isCheatWarning || localCheatWarning) && (
          <div className="absolute top-0 left-0 w-full bg-red-600/90 backdrop-blur-md text-white p-3 text-center text-sm z-50 font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <span className="animate-pulse">⚠️</span> Warning: Tab switch or screen sharing interruption detected. Further violations will terminate the session.
          </div>
        )}

        {/* Top bar: Media Controls & End Button */}
        <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-6">
           <div className="text-zinc-400 font-mono text-sm">Session: {sessionId}</div>
           <div className="flex items-center gap-6">
             <MediaControls onScreenShareStop={() => flagCheat("screen_share_stopped")} />
             <button
               onClick={handleEndInterview}
               disabled={ending}
               className="bg-red-500/20 text-red-400 border border-red-500/30 px-5 py-2.5 rounded-xl font-bold hover:bg-red-500/30 hover:text-red-300 transition-all disabled:opacity-50"
             >
               {ending ? "Ending..." : "End Interview"}
             </button>
           </div>
        </header>

        {/* Question Area */}
        <section className="p-8 flex-1 overflow-y-auto flex flex-col relative">
          {currentQuestion ? (
            <div className="w-full max-w-4xl mx-auto flex flex-col h-full space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl">
                <AdaptiveReasonBadge reason={currentQuestion.adaptiveReason} />
                <h1 className="text-3xl font-medium leading-relaxed mt-4 text-white">
                  {currentQuestion.text}
                </h1>
                <div className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-full mt-4 font-bold tracking-wider uppercase">
                  Topic: {currentQuestion.topic}
                </div>
              </div>

              {/* Code Editor rendered conditionally */}
              {isCodingMode && (
                <div className="flex-1 min-h-[400px] backdrop-blur-xl bg-white/5 border border-white/10 p-4 rounded-3xl shadow-2xl overflow-hidden">
                  <CodeEditorPanel onSubmit={handleCodeSubmit} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full items-center justify-center text-zinc-500 gap-4">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              Waiting for AI to generate the first question...
            </div>
          )}
        </section>

        {/* Bottom Area: Transcript & Input */}
        <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <TranscriptPanel liveTranscript={liveTranscript} />

            {/* Temporary Text Input for Phase 2 Testing */}
            <form onSubmit={handleTextSubmit} className="flex gap-4">
              <input 
                type="text" 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your answer (text fallback)..." 
                className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
              <button 
                type="submit"
                className="bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                Send Answer &rarr;
              </button>
            </form>
          </div>
        </footer>
      </main>
    </div>
  );
}