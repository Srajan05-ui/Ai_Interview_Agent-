// components/interview/TranscriptPanel.tsx
import { motion, AnimatePresence } from "framer-motion";

interface TranscriptPanelProps {
  liveTranscript: string;
}

export default function TranscriptPanel({ liveTranscript }: TranscriptPanelProps) {
  return (
    <div className="mb-4 min-h-[48px] p-4 bg-gray-50 border border-gray-100 rounded-lg">
      <AnimatePresence mode="wait">
        {liveTranscript ? (
          <motion.p
            key="transcript-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-gray-700 italic tracking-wide"
          >
            "{liveTranscript}"
          </motion.p>
        ) : (
          <motion.p
            key="transcript-idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-gray-400 italic"
          >
            Listening to your answer...
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}