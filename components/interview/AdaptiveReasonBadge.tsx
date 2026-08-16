// components/interview/AdaptiveReasonBadge.tsx
import { motion } from "framer-motion";

export default function AdaptiveReasonBadge({ reason }: { reason?: string }) {
  if (!reason) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
    >
      <span className="text-base">✨</span>
      {reason}
    </motion.div>
  );
}