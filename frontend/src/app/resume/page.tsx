// app/resume/page.tsx
"use client";

import { useState } from "react";
import { uploadResume, ResumeUploadResponse } from "@/lib/api-client";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeUploadResponse | null>(null);
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const data = await uploadResume(file, token, jobDescription);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Upload failed. Check the console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
        Interview Setup
      </h1>
      
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl">
        {!result ? (
          <form onSubmit={handleUpload} className="space-y-8">
            <div>
              <label className="block text-sm font-medium mb-3 text-zinc-300">Resume Document</label>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mb-4 text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
                />
                <p className="text-sm text-zinc-500">Upload your PDF or DOCX</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-zinc-300">Target Job Description (Optional)</label>
              <textarea
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
              />
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing Resume & Job Description..." : "Analyze & Continue"}
            </button>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/20">
              <h2 className="text-3xl font-bold text-green-400 mb-4">ATS Match Score: {result.atsScore}/100</h2>
              <div className="grid grid-cols-2 gap-4 mt-4 text-zinc-300">
                <p><strong className="text-white">Formatting:</strong> {result.atsSubscores.formatting}</p>
                <p><strong className="text-white">Keywords:</strong> {result.atsSubscores.keywordMatch}</p>
                <p><strong className="text-white">Structure:</strong> {result.atsSubscores.structure}</p>
                <p><strong className="text-white">Impact:</strong> {result.atsSubscores.impactQuantification}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">Top Skills Detected</h3>
              <div className="flex flex-wrap gap-2">
                {result.parsedSkills.map((skill) => (
                  <span key={skill} className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-4 py-1.5 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">Improvement Suggestions</h3>
              <ul className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="bg-black/50 border border-white/10 p-5 rounded-xl shadow-sm">
                    <p className="font-medium text-red-400 mb-1">{s.section} - {s.issue}</p>
                    <p className="text-zinc-300 text-sm">💡 {s.suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => router.push(`/interview/setup?resumeId=${result.resumeId}`)}
              className="w-full bg-white text-black font-semibold py-4 rounded-xl mt-6 hover:bg-gray-200 active:scale-95 transition-all"
            >
              Configure Interview Parameters &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}