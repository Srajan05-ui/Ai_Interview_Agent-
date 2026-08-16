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
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Upload Resume</h1>
      
      {!result ? (
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-4"
            />
            <p className="text-sm text-gray-500">Upload your PDF or DOCX</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Job Description (Optional)</label>
            <textarea
              className="w-full border rounded-md p-3"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
            />
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? "Analyzing Resume..." : "Upload & Analyze"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h2 className="text-2xl font-bold text-green-800 mb-2">ATS Score: {result.atsScore}/100</h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <p><strong>Formatting:</strong> {result.atsSubscores.formatting}</p>
              <p><strong>Keywords:</strong> {result.atsSubscores.keywordMatch}</p>
              <p><strong>Structure:</strong> {result.atsSubscores.structure}</p>
              <p><strong>Impact:</strong> {result.atsSubscores.impactQuantification}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Top Skills Detected</h3>
            <div className="flex flex-wrap gap-2">
              {result.parsedSkills.map((skill) => (
                <span key={skill} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Improvement Suggestions</h3>
            <ul className="space-y-3">
              {result.suggestions.map((s, i) => (
                <li key={i} className="bg-white border p-4 rounded-md shadow-sm">
                  <p className="font-medium text-red-600">{s.section} - {s.issue}</p>
                  <p className="text-gray-700 mt-1">💡 {s.suggestion}</p>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => router.push(`/interview/setup?resumeId=${result.resumeId}`)}
            className="w-full bg-black text-white px-6 py-3 rounded-md mt-6"
          >
            Proceed to Interview Setup
          </button>
        </div>
      )}
    </div>
  );
}