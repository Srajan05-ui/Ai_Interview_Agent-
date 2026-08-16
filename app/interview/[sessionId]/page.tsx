// app/interview/[sessionId]/page.tsx
"use client";

import { useInterviewSocket } from "@/hooks/useInterviewSocket";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useParams } from "next/navigation";
import { useState } from "react";

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
  
  // Dev toggle to test Phase 4 layout. In production, this maps to session.interviewType
  const [isCodingMode, setIsCodingMode] = useState(true);

  const {
    liveTranscript,
    currentQuestion,
    conceptGraph,
    isCheatWarning,
    sendEvent
  } = useInterviewSocket(sessionId);

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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Column: Progress & Concept Map */}
      <aside className="w-1/4 bg-white border-r p-6 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Interview Progress</h2>
        <TopicProgressMap conceptGraph={conceptGraph} />
        
        {/* Dev Toggle for Testing */}
        <div className="mt-auto border-t pt-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isCodingMode} 
              onChange={(e) => setIsCodingMode(e.target.checked)} 
              className="rounded"
            />
            Toggle Coding Mode (Dev)
          </label>
        </div>
      </aside>

      {/* Center/Right Column: Main Interview Stage */}
      <main className="flex-1 flex flex-col relative">
        
        {/* Anti-Cheat Warning Modal Trigger */}
        {(isCheatWarning || localCheatWarning) && (
          <div className="absolute top-0 left-0 w-full bg-red-600 text-white p-2 text-center text-sm z-50">
            ⚠️ Warning: Tab switch or screen sharing interruption detected. Further violations will terminate the session.
          </div>
        )}

        {/* Top bar: Media Controls */}
        <header className="h-16 border-b bg-white flex items-center justify-end px-6">
           <MediaControls onScreenShareStop={() => flagCheat("screen_share_stopped")} />
        </header>

        {/* Question Area */}
        <section className="p-8 flex-1 overflow-y-auto flex flex-col">
          {currentQuestion ? (
            <div className="w-full max-w-4xl mx-auto flex flex-col h-full space-y-4">
              <div>
                <AdaptiveReasonBadge reason={currentQuestion.adaptiveReason} />
                <h1 className="text-2xl font-medium leading-relaxed mt-2">
                  {currentQuestion.text}
                </h1>
                <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-3">
                  Topic: {currentQuestion.topic}
                </div>
              </div>

              {/* Code Editor rendered conditionally */}
              {isCodingMode && (
                <div className="flex-1 min-h-[400px]">
                  <CodeEditorPanel onSubmit={handleCodeSubmit} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Waiting for AI to generate the first question...
            </div>
          )}
        </section>

        {/* Bottom Area: Transcript & Input */}
        <footer className="border-t bg-white p-6">
          <div className="max-w-4xl mx-auto">
            <TranscriptPanel liveTranscript={liveTranscript} />

            {/* Temporary Text Input for Phase 2 Testing */}
            <form onSubmit={handleTextSubmit} className="flex gap-4">
              <input 
                type="text" 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your answer (text fallback)..." 
                className="flex-1 border rounded-lg p-3 bg-gray-50 outline-none focus:border-blue-500"
              />
              <button 
                type="submit"
                className="bg-black text-white px-6 py-3 rounded-lg font-medium"
              >
                Send Answer
              </button>
            </form>
          </div>
        </footer>
      </main>
    </div>
  );
}