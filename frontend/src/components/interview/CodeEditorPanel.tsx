// components/interview/CodeEditorPanel.tsx
import { useState } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorPanelProps {
  onSubmit: (language: string, code: string) => void;
}

export default function CodeEditorPanel({ onSubmit }: CodeEditorPanelProps) {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) setCode(value);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/40 rounded-2xl border border-white/10 shadow-inner">
      <div className="flex justify-between items-center bg-black/60 px-6 py-3 border-b border-white/10">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button
          onClick={() => onSubmit(language, code)}
          className="bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-2 rounded-xl text-sm font-bold hover:bg-green-500/30 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]"
        >
          Run & Submit Code
        </button>
      </div>
      <div className="flex-1 min-h-[300px]">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            wordWrap: "on",
            padding: { top: 20 },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        />
      </div>
    </div>
  );
}