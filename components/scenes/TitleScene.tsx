
import React, { useRef } from 'react';
import { Button } from '../ui/Button';

interface TitleSceneProps {
  onStart: (file?: File) => void;
}

export const TitleScene: React.FC<TitleSceneProps> = ({ onStart }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onStart(file);
    }
  };

  const handleCustomStartClick = () => {
    fileInputRef.current?.click();
  };


  return (
    <div className="flex flex-col items-center justify-center text-center animate-fadeIn text-text-main">
      <h1 className="text-7xl md:text-8xl font-title text-primary drop-shadow-[0_0_12px_rgba(104,225,253,0.8)]">
        HandBeat
      </h1>
      <p className="mt-4 max-w-lg font-heading text-lg text-text-sub">
        A new rhythm game experience. Use your hands to hit the notes.
      </p>
      <p className="mt-2 text-sm text-text-sub/70">
        (Requires a webcam and good lighting)
      </p>
      <div className="mt-12 flex flex-col gap-4">
        <Button onClick={() => onStart()} className="animate-pulse">
          Start Game (Preset)
        </Button>
        <Button onClick={handleCustomStartClick} variant="secondary">
          Play Custom Song
        </Button>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".mp3"
            className="hidden"
        />
      </div>
       <footer className="absolute bottom-4 text-xs text-text-sub/50">
        Powered by MediaPipe, Three.js, and Tone.js
      </footer>
    </div>
  );
};