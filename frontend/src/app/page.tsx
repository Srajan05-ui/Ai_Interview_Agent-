// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

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
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 overflow-hidden relative">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-900/30 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">InterviewIQ</span>
        </div>
        <div className="space-x-4 flex items-center">
          <button onClick={() => router.push("/b2b")} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">
            For Bootcamps
          </button>
          <button onClick={handleCTA} className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white/20 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {user ? "Go to Dashboard" : "Sign In"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-5xl mx-auto text-center pt-32 pb-20 px-6">
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 leading-tight">
          Ace your <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">AI & ML</span><br /> engineering interviews.
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 leading-relaxed">
          Upload your resume. Practice with an adaptive AI interviewer. Get rubric-based scorecards and custom learning roadmaps.
        </p>
        
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <button 
            onClick={handleCTA}
            className="group relative inline-flex items-center justify-center bg-white text-black px-10 py-5 rounded-full text-xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]"
          >
            <span>Start Mock Interview</span>
            <span className="ml-3 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </button>
        </div>
      </header>

      {/* Comparison Table */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
        <h2 className="text-4xl font-bold text-center mb-16 text-white drop-shadow-lg">Why InterviewIQ?</h2>
        
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/40 border-b border-white/10">
              <tr>
                <th className="p-8 font-bold text-lg text-white w-1/3 uppercase tracking-wider">Feature</th>
                <th className="p-8 font-bold text-lg border-l border-white/10 text-zinc-500 w-1/3 uppercase tracking-wider">Generic AI Bots</th>
                <th className="p-8 font-bold text-lg border-l border-white/10 text-blue-400 w-1/3 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">InterviewIQ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-lg">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-8 font-semibold text-zinc-200">Adaptive Questioning</td>
                <td className="p-8 border-l border-white/10 text-zinc-600">Random branch logic</td>
                <td className="p-8 border-l border-white/10 font-bold text-white flex items-center gap-3">
                  <span className="text-blue-500">✓</span> Curriculum-aware mastery tracking
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors bg-black/20">
                <td className="p-8 font-semibold text-zinc-200">Feedback Style</td>
                <td className="p-8 border-l border-white/10 text-zinc-600">Generic "Good job!"</td>
                <td className="p-8 border-l border-white/10 font-bold text-white flex items-center gap-3">
                  <span className="text-purple-500">✓</span> Cited moments & strict rubrics
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-8 font-semibold text-zinc-200">Anti-Cheat</td>
                <td className="p-8 border-l border-white/10 text-zinc-600">None</td>
                <td className="p-8 border-l border-white/10 font-bold text-white flex items-center gap-3">
                  <span className="text-pink-500">✓</span> Tab switch & screen-share proctoring
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer Grid gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none -z-10" />
    </div>
  );
}