// app/dashboard/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null; // AuthProvider handles the redirect

  return (
    <div className="max-w-5xl mx-auto p-8 mt-10">
      <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Welcome back, {user.displayName || 'Guest'}
        </h1>
        <p className="text-zinc-400">Target Role: <span className="font-medium text-white">{/* @ts-ignore */} {user.targetRole || 'AI Engineer'}</span></p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Start Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col items-start hover:bg-white/10 hover:scale-[1.02] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="bg-blue-500/20 p-4 rounded-xl mb-6 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <span className="text-2xl">🎙️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">New Interview</h2>
          <p className="text-zinc-400 mb-8 flex-1">
            Upload a fresh resume and job description to start a new adaptive mock interview session.
          </p>
          <button 
            onClick={() => router.push("/resume")}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
          >
            Start Setup &rarr;
          </button>
        </div>

        {/* History Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col items-start hover:bg-white/10 hover:scale-[1.02] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="bg-purple-500/20 p-4 rounded-xl mb-6 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Session History</h2>
          <p className="text-zinc-400 mb-8 flex-1">
            Review your past scorecards, track your technical growth, and revisit your custom learning roadmaps.
          </p>
          <button 
            onClick={() => router.push("/history")}
            className="w-full bg-zinc-900 border border-zinc-800 text-white font-semibold py-3 rounded-xl hover:bg-zinc-800 transition-all active:scale-95"
          >
            View History &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}