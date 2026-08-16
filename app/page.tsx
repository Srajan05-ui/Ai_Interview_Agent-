// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-blue-200">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="text-xl font-black tracking-tighter">InterviewIQ</div>
        <div className="space-x-4">
          <button onClick={() => router.push("/b2b")} className="text-sm font-medium text-gray-600 hover:text-black">
            For Bootcamps
          </button>
          <button onClick={handleCTA} className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium">
            {user ? "Go to Dashboard" : "Sign In"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-4xl mx-auto text-center pt-24 pb-16 px-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
        >
          Ace your AI & ML engineering interviews.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
        >
          Upload your resume. Practice with an adaptive AI interviewer. Get rubric-based scorecards and custom learning roadmaps.
        </motion.p>
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleCTA}
          className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all"
        >
          Start Mock Interview
        </motion.button>
      </header>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why InterviewIQ?</h2>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-6 font-semibold w-1/3">Feature</th>
                <th className="p-6 font-semibold w-1/3 border-l text-gray-400">Generic AI Bots</th>
                <th className="p-6 font-semibold w-1/3 border-l text-blue-600">InterviewIQ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-6 font-medium">Adaptive Questioning</td>
                <td className="p-6 border-l text-gray-500">Random branch logic</td>
                <td className="p-6 border-l font-medium">Curriculum-aware mastery tracking</td>
              </tr>
              <tr>
                <td className="p-6 font-medium">Feedback Style</td>
                <td className="p-6 border-l text-gray-500">Generic "Good job!"</td>
                <td className="p-6 border-l font-medium">Cited moments & strict rubrics</td>
              </tr>
              <tr>
                <td className="p-6 font-medium">Anti-Cheat</td>
                <td className="p-6 border-l text-gray-500">None</td>
                <td className="p-6 border-l font-medium">Tab switch & screen-share proctoring</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}