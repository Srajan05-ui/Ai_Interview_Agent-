// components/interview/TopicProgressMap.tsx

interface TopicProgressMapProps {
  conceptGraph: Record<string, string>;
}

export default function TopicProgressMap({ conceptGraph }: TopicProgressMapProps) {
  const topics = Object.keys(conceptGraph);

  if (topics.length === 0) {
    return (
      <div className="text-sm text-zinc-500 flex items-center gap-2 mt-4">
        <span className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        Waiting for concept graph data...
      </div>
    );
  }

  const getColor = (status: string) => {
    switch (status) {
      case "strong": return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
      case "weak": return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
      case "not_covered": return "bg-white/20";
      default: return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]";
    }
  };

  return (
    <div className="mt-4 space-y-6">
      {topics.map((topic) => (
        <div key={topic} className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
            <span className="text-zinc-300">{topic.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="text-blue-300/80">{conceptGraph[topic].replace('_', ' ')}</span>
          </div>
          <div className="h-2 w-full bg-black/50 border border-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-out ${getColor(conceptGraph[topic])}`}
              style={{ width: conceptGraph[topic] === "not_covered" ? "10%" : "100%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}