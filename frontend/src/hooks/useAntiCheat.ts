import { useEffect } from "react";

/**
 * Hook to detect tab switching and screen sharing stops.
 * Calls the `onCheatDetected` callback when suspicious activity occurs.
 */
export function useAntiCheat(sessionId: string, onCheatDetected: () => void) {
  useEffect(() => {
    // Detect tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        console.warn(`[AntiCheat] Tab switch detected for session ${sessionId}`);
        onCheatDetected();
      }
    };

    // Detect window blurring
    const handleBlur = () => {
      console.warn(`[AntiCheat] Window unfocused for session ${sessionId}`);
      onCheatDetected();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [sessionId, onCheatDetected]);

  const flagCheat = (reason: string) => {
    console.warn(`[AntiCheat] Manual flag: ${reason} for session ${sessionId}`);
    onCheatDetected();
  };

  return { flagCheat };
}
