// components/interview/TranscriptPanel.tsx
interface TranscriptPanelProps {
  liveTranscript: string;
}

export default function TranscriptPanel({ liveTranscript }: TranscriptPanelProps) {
  return (
    <div className="mb-4 min-h-[60px] p-4 bg-black/50 border border-white/10 rounded-xl flex items-center shadow-inner">
      {liveTranscript ? (
        <p className="text-purple-300 italic tracking-wide animate-in fade-in duration-300">
          "{liveTranscript}"
        </p>
      ) : (
        <p className="text-zinc-500 italic flex items-center gap-2 animate-in fade-in duration-300">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          Listening to your answer...
        </p>
      )}
    </div>
  );
}