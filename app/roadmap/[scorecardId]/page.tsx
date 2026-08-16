// app/roadmap/[scorecardId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { generateRoadmap, Roadmap } from "@/lib/api-client";

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const scorecardId = params.scorecardId as string;
  
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const data = await generateRoadmap(scorecardId, token);
          setRoadmap(data);
        }
      } catch (error) {
        console.error("Failed to generate roadmap", error);
      } finally {
        setLoading(false);
      }
    };
    loadRoadmap();
  }, [scorecardId]);

  if (loading) return <div className="flex h-screen items-center justify-center">Generating your custom AI engineering roadmap...</div>;
  if (!roadmap) return <div className="flex h-screen items-center justify-center text-red-500">Failed to generate roadmap.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 mt-10">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black mb-6">
        &larr; Back to Scorecard
      </button>

      <h1 className="text-3xl font-bold mb-2">Your Learning Roadmap</h1>
      <p className="text-gray-500 mb-8">Targeted resources based on your weak areas from the last interview.</p>

      <div className="space-y-8">
        {roadmap.topics.sort((a, b) => a.order - b.order).map((topic, i) => (
          <div key={i} className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b flex items-center gap-4">
              <div className="bg-black text-white h-8 w-8 rounded-full flex items-center justify-center font-bold">
                {topic.order}
              </div>
              <h2 className="text-xl font-bold">{topic.topic}</h2>
            </div>
            <ul className="p-6 space-y-4">
              {topic.resources.map((resource, j) => (
                <li key={j} className="flex justify-between items-center group border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {resource.title}
                    </p>
                    <span className="text-xs text-gray-500 uppercase font-medium bg-gray-100 px-2 py-1 rounded">
                      {resource.type}
                    </span>
                  </div>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-medium hover:underline">
                    View Resource &rarr;
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <button onClick={() => router.push("/dashboard")} className="mt-12 w-full bg-gray-100 text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">
        Return to Dashboard
      </button>
    </div>
  );
}