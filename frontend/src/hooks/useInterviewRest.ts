import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { fetchAuthSession } from "@/lib/api-client";

export function useInterviewRest(sessionId: string) {
  const [liveTranscript, setLiveTranscript] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [conceptGraph, setConceptGraph] = useState<any>({});
  const [isCheatWarning, setIsCheatWarning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchState = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/interview/${sessionId}/state`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.question) setCurrentQuestion(data.question);
        if (data.graph) setConceptGraph(data.graph);
        if (data.audioBase64) playAudio(data.audioBase64);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    fetchState();
  }, [sessionId]);

  const sendEvent = async (type: string, data: any) => {
    try {
      // Optimistically update transcript if text
      if (type === "text_answer") {
        setLiveTranscript(data);
      }

      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/interview/${sessionId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type, data })
      });
      
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.question) setCurrentQuestion(responseData.question);
        if (responseData.graph) setConceptGraph(responseData.graph);
        if (responseData.audioBase64) playAudio(responseData.audioBase64);
        if (responseData.transcript_final) setLiveTranscript(responseData.transcript_final);
      }
    } catch (e) {
      console.error("Failed to send answer", e);
    }
  };

  const playAudio = (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new window.AudioContext();
      }
      const audioCtx = audioContextRef.current;
      
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      
      audioCtx.decodeAudioData(bytes.buffer, (buffer) => {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
      });
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  return {
    liveTranscript,
    currentQuestion,
    conceptGraph,
    isCheatWarning,
    sendEvent
  };
}
