// app/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { fetchHistory, HistorySession } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const data = await fetchHistory(user.userId, token);
          setSessions(data);
        }
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) loadHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
          Loading interview history...
        </div>
      </div>
    );
  }

  // Remove chart data as score is no longer provided in history list

  return (
    <div className="max-w-5xl mx-auto p-8 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Interview History
          </h1>
          <p className="text-zinc-400 mt-2">Track your progress and review past scorecards.</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-black/50 border border-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/5 active:scale-95 transition-all shadow-lg"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          

          {/* Session List */}
          <div className="col-span-1 lg:col-span-3 backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">Past Sessions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-zinc-400 border-b border-white/10">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Style</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {sessions.map((session) => (
                    <tr key={session.sessionId} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-medium text-zinc-200">
                        {new Date(session.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 capitalize text-zinc-300">{session.interviewType}</td>
                      <td className="p-4 capitalize text-zinc-300">{session.companyStyle || "N/A"}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          session.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          session.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {session.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => router.push(`/scorecard/${session.sessionId}`)}
                          className="text-purple-400 font-medium hover:text-purple-300 transition-colors opacity-80 group-hover:opacity-100"
                        >
                          View Scorecard &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-24 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="bg-purple-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl opacity-50">📊</span>
          </div>
          <p className="text-zinc-400 mb-6 text-lg">No past interviews found.</p>
          <button 
            onClick={() => router.push('/resume')}
            className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Start Your First Interview
          </button>
        </div>
      )}
    </div>
  );
}