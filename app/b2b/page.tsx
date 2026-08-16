// app/b2b/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function B2BPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-gray-800">
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto border-b border-gray-800">
        <div className="text-xl font-black tracking-tighter text-white">InterviewIQ <span className="text-gray-500">for Teams</span></div>
        <button onClick={() => router.push("/")} className="text-sm font-medium text-gray-400 hover:text-white">
          Back to Main Site
        </button>
      </nav>

      <header className="max-w-4xl mx-auto text-center pt-32 pb-20 px-6">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Scale mock interviews for your entire cohort.
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Give every student in your bootcamp or university instant, rubric-based technical interviews without burning out your mentors.
        </p>
        <button className="bg-white text-black px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-200 transition-colors">
          Contact Sales
        </button>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-800">
        <div>
          <h3 className="text-xl font-bold mb-3">Custom Curriculums</h3>
          <p className="text-gray-400">Lock the AI to only test concepts covered in your specific syllabus to ensure relevant practice.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3">Cohort Analytics</h3>
          <p className="text-gray-400">See aggregate data on where your students are struggling so you can adjust your lectures.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3">Strict Proctoring</h3>
          <p className="text-gray-400">Enforce full-screen, screen-share, and tab-tracking for high-stakes capstone evaluations.</p>
        </div>
      </section>
    </div>
  );
}