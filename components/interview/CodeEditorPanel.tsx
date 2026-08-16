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
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white shadow-sm mt-4">
      <div className="flex justify-between items-center bg-gray-100 px-4 py-2 border-b">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-white border rounded px-2 py-1 text-sm font-medium outline-none"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button
          onClick={() => onSubmit(language, code)}
          className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          Submit Code
        </button>
      </div>
      <div className="flex-1 min-h-[300px]">
        <Editor
          height="100%"
          language={language}
          theme="vs-light"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}