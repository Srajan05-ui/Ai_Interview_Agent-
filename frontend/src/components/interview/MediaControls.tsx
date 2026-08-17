// components/interview/MediaControls.tsx
"use client";

import { useState } from "react";

interface MediaControlsProps {
  onScreenShareStop: () => void;
}

export default function MediaControls({ onScreenShareStop }: MediaControlsProps) {
  const [micActive, setMicActive] = useState(false);
  const [camActive, setCamActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);

  const toggleMic = async () => {
    if (!micActive) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicActive(true);
      } catch (err) {
        alert("Microphone permission denied.");
      }
    } else {
      setMicActive(false);
      // Logic to actually stop the media tracks will go here
    }
  };

  const toggleCam = async () => {
    if (!camActive) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setCamActive(true);
      } catch (err) {
        alert("Camera permission denied.");
      }
    } else {
      setCamActive(false);
    }
  };

  const toggleScreen = async () => {
    if (!screenActive) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenActive(true);

        // Detect if user clicks "Stop Sharing" from the browser's native floating bar
        stream.getVideoTracks()[0].onended = () => {
          setScreenActive(false);
          onScreenShareStop();
        };
      } catch (err) {
        console.warn("Screen share cancelled by user.");
      }
    } else {
      setScreenActive(false);
    }
  };

  return (
    <div className="flex gap-4">
      <button 
        onClick={toggleMic}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
          micActive 
            ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
            : 'bg-black/40 text-zinc-400 border-white/10 hover:bg-white/5 hover:text-white'
        }`}
      >
        {micActive ? "🎙️ Mic On" : "🎤 Mic Off"}
      </button>
      
      <button 
        onClick={toggleCam}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
          camActive 
            ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
            : 'bg-black/40 text-zinc-400 border-white/10 hover:bg-white/5 hover:text-white'
        }`}
      >
        {camActive ? "📹 Cam On" : "📷 Cam Off"}
      </button>
      
      <button 
        onClick={toggleScreen}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
          screenActive 
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
            : 'bg-black/40 text-zinc-400 border-white/10 hover:bg-white/5 hover:text-white'
        }`}
      >
        {screenActive ? "💻 Sharing Screen" : "🖥️ Share Screen"}
      </button>
    </div>
  );
}