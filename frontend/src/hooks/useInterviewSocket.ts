// hooks/useInterviewSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';

// Types matching Design Doc §6
type WSEventType = 
  | 'transcript_partial' 
  | 'transcript_final' 
  | 'question_generated' 
  | 'ai_audio_chunk' 
  | 'concept_graph_update' 
  | 'session_terminated';

interface IncomingEvent {
  type: WSEventType;
  data: any; 
}

export const useInterviewSocket = (sessionId: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  
  // Expose these specific states to your UI components
  const [liveTranscript, setLiveTranscript] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<{ text: string, topic: string, adaptiveReason: string } | null>(null);
  const [conceptGraph, setConceptGraph] = useState<Record<string, string>>({});
  const [isCheatWarning, setIsCheatWarning] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    // Connect to the backend WS URL defined in .env.local
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_BASE_URL}/interview/${sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('Connected to Interview Room');

    ws.onmessage = (event) => {
      const parsed: IncomingEvent = JSON.parse(event.data);
      
      switch (parsed.type) {
        case 'transcript_partial':
          setLiveTranscript(parsed.data);
          break;
        case 'transcript_final':
          setLiveTranscript(''); // Reset partial, handle final text 
          break;
        case 'question_generated':
          setCurrentQuestion({
            text: parsed.data.questionText,
            topic: parsed.data.topic,
            adaptiveReason: parsed.data.adaptiveReason
          });
          break;
        case 'concept_graph_update':
          setConceptGraph(parsed.data);
          break;
        case 'session_terminated':
          if (parsed.data.reason === 'cheat_detected') setIsCheatWarning(true);
          break;
        // AI Audio chunk handling will be added in Phase 3
      }
    };

    ws.onclose = () => console.log('Disconnected from Interview Room');
    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [sessionId]);

  // Function to send data back to Srajan's server
  const sendEvent = useCallback((type: 'text_answer' | 'audio_chunk' | 'code_submission' | 'end_turn', data?: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  return {
    liveTranscript,
    currentQuestion,
    conceptGraph,
    isCheatWarning,
    sendEvent
  };
};