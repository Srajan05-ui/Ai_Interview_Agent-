// components/interview/TopicProgressMap.tsx
import { motion } from "framer-motion";

interface TopicProgressMapProps {
  conceptGraph: Record<string, string>;
}

export default function TopicProgressMap({ conceptGraph }: TopicProgressMapProps) {
  const topics = Object.keys(conceptGraph);

  if (topics.length === 0) {
    return (
      <div className="text-sm text-gray-400 mt-4">
        Waiting for concept graph data...
      </div>
    );
  }

  const getColor = (status: string) => {
    switch (status) {
      case "strong": return "bg-green-500";
      case "weak": return "bg-red-400";
      case "not_covered": return "bg-gray-200";
      default: return "bg-blue-400";
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {topics.map((topic) => (
        <div key={topic} className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-medium text-gray-600">
            <span className="capitalize">{topic.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="capitalize text-gray-400">{conceptGraph[topic].replace('_', ' ')}</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: conceptGraph[topic] === "not_covered" ? "10%" : "100%" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`h-full ${getColor(conceptGraph[topic])}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}