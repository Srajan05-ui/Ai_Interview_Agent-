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

  if (loading) return <div className="flex h-screen items-center justify-center">Loading interview history...</div>;

  // Format data for Recharts
  const chartData = sessions.map(session => ({
    name: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: session.overallScore
  }));

  return (
    <div className="max-w-5xl mx-auto p-8 mt-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Interview History</h1>
          <p className="text-gray-500 mt-1">Track your progress and review past scorecards.</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-200"
        >
          Back to Dashboard
        </button>
      </div>

      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Trend Chart */}
          <div className="col-span-1 lg:col-span-3 bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold mb-6">Overall Score Trend</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#000000" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#000000', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#3B82F6', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Session List */}
          <div className="col-span-1 lg:col-span-3">
            <h2 className="text-xl font-bold mb-4">Past Sessions</h2>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-sm text-gray-500 border-b">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Style</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">
                        {new Date(session.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 capitalize">{session.type}</td>
                      <td className="p-4 capitalize">{session.companyStyle}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          session.overallScore >= 80 ? 'bg-green-100 text-green-800' : 
                          session.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {session.overallScore}/100
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => router.push(`/scorecard/${session.id}`)}
                          className="text-blue-600 font-medium hover:underline"
                        >
                          View Scorecard
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
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed">
          <p className="text-gray-500 mb-4">No past interviews found.</p>
          <button 
            onClick={() => router.push('/resume')}
            className="bg-black text-white px-6 py-2 rounded-lg font-medium"
          >
            Start Your First Interview
          </button>
        </div>
      )}
    </div>
  );
}