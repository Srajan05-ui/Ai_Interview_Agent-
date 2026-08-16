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
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user.displayName}</h1>
        <p className="text-gray-500">Target Role: <span className="font-medium text-gray-900">{user.targetRole || 'AI Engineer'}</span></p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Start Card */}
        <div className="bg-white p-8 rounded-2xl border shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
          <div className="bg-blue-100 p-3 rounded-xl mb-6">
            <span className="text-2xl">🎙️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">New Interview</h2>
          <p className="text-gray-600 mb-8 flex-1">
            Upload a fresh resume and job description to start a new adaptive mock interview session.
          </p>
          <button 
            onClick={() => router.push("/resume")}
            className="w-full bg-black text-white font-semibold py-3 rounded-xl"
          >
            Start Setup &rarr;
          </button>
        </div>

        {/* History Card */}
        <div className="bg-white p-8 rounded-2xl border shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
          <div className="bg-purple-100 p-3 rounded-xl mb-6">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Session History</h2>
          <p className="text-gray-600 mb-8 flex-1">
            Review your past scorecards, track your technical growth, and revisit your custom learning roadmaps.
          </p>
          <button 
            onClick={() => router.push("/history")}
            className="w-full bg-gray-100 text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
          >
            View History &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}