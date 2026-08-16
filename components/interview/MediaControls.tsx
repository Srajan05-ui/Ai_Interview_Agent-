// components/interview/MediaControls.tsx
"use client";

import { useState, useCallback } from "react";

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
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${micActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
      >
        {micActive ? "🎙️ Mic On" : "🎤 Mic Off"}
      </button>
      
      <button 
        onClick={toggleCam}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${camActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
      >
        {camActive ? "📹 Cam On" : "📷 Cam Off"}
      </button>
      
      <button 
        onClick={toggleScreen}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${screenActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
      >
        {screenActive ? "💻 Sharing Screen" : "🖥️ Share Screen"}
      </button>
    </div>
  );
}