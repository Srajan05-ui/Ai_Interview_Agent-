// hooks/useAntiCheat.ts
import { useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";

export const useAntiCheat = (sessionId: string, onWarningLocal: () => void) => {
  
  const flagCheat = useCallback(async (eventType: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Mocking the backend call to Srajan's API: POST /api/v1/interview/:sessionId/flag
      console.warn(`Anti-cheat flagged: ${eventType}`);
      onWarningLocal();

      /* 
      // Real implementation for later:
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/interview/${sessionId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventType, timestamp: new Date().toISOString() })
      });
      */
    } catch (error) {
      console.error("Failed to flag cheat event", error);
    }
  }, [sessionId, onWarningLocal]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flagCheat("tab_switch");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [flagCheat]);

  return { flagCheat };
};