
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { GameResult, Chart } from '../../types';
import { GameCanvas } from '../game/GameCanvas';
import { sampleChart, generateChart } from '../../game/chart';

interface GamePlaySceneProps {
  onGameEnd: (result: GameResult) => void;
  customFile?: File | null;
}

export const GamePlayScene: React.FC<GamePlaySceneProps> = ({ onGameEnd, customFile }) => {
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const [chart, setChart] = useState<Chart | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const customAudioURL = useRef<string | null>(null);

  const cleanupCustomUrl = () => {
      if (customAudioURL.current) {
          URL.revokeObjectURL(customAudioURL.current);
          customAudioURL.current = null;
      }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoadingMessage('Loading Vision AI Model...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
        setHandLandmarker(landmarker);

        setLoadingMessage('Requesting Camera Access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
      
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (customFile) {
            setLoadingMessage('Loading custom audio...');
            const url = URL.createObjectURL(customFile);
            customAudioURL.current = url; // Store for cleanup
            
            await Tone.start();
            const player = new Tone.Player(url);
            await Tone.loaded(); // Wait for the player to load the buffer

            setLoadingMessage('Analyzing rhythm...');
            // Assuming a default BPM for analysis, can be improved later
            const generatedChart = await generateChart(player.buffer, 128, customFile.name); 
            setChart(generatedChart);
            setAudioUrl(url);

            player.dispose();
        } else {
            setChart(sampleChart);
            setAudioUrl(sampleChart.audioSrc);
        }

      } catch (error) {
        console.error('Initialization failed:', error);
        setLoadingMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    initialize();

    return () => {
        cleanupCustomUrl();
    };
  }, [customFile]);

  const onVideoReady = useCallback(() => {
      if(handLandmarker && chart && audioUrl) {
          setIsReady(true);
      }
  }, [handLandmarker, chart, audioUrl]);

   useEffect(() => {
      if (handLandmarker && chart && audioUrl && videoRef.current?.readyState === 4) {
          setIsReady(true);
      }
  }, [handLandmarker, chart, audioUrl, videoRef.current?.readyState]);


  return (
    <div className="w-full h-full relative">
      <video 
        ref={videoRef} 
        onLoadedData={onVideoReady}
        autoPlay 
        playsInline 
        className="absolute top-0 left-0 w-16 h-9 opacity-0 -z-10 transform scale-x-[-1]"
      ></video>
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface z-50">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 font-heading text-lg text-text-sub">{loadingMessage}</p>
        </div>
      )}
      {isReady && handLandmarker && videoRef.current && chart && audioUrl && (
         <GameCanvas
          video={videoRef.current}
          handLandmarker={handLandmarker}
          onGameEnd={onGameEnd}
          chart={chart}
          audioUrl={audioUrl}
        />
      )}
    </div>
  );
};
