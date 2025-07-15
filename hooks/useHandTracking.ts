import React, { useState, useEffect, useRef } from 'react';
import { HandLandmarks, Landmark } from '../types';
import { GAME_CONSTANTS } from '../constants';

// This is a global type from the loaded MediaPipe script
declare const Hands: any;

const emptyLandmarks: HandLandmarks = Array(21).fill({ x: 0, y: 0, z: 0 });

export const useHandTracking = () => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [leftHand, setLeftHand] = useState<HandLandmarks>(emptyLandmarks);
  const [rightHand, setRightHand] = useState<HandLandmarks>(emptyLandmarks);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leftHandHistory = useRef<HandLandmarks[]>([]);
  const rightHandHistory = useRef<HandLandmarks[]>([]);

  const smoothLandmarks = (newLandmarks: HandLandmarks, history: React.MutableRefObject<HandLandmarks[]>) => {
    if (history.current.length === 0) {
      history.current.push(newLandmarks);
      return newLandmarks;
    }
    const lastLandmarks = history.current[history.current.length - 1];
    const smoothed: HandLandmarks = newLandmarks.map((newLm, i) => {
      const oldLm = lastLandmarks[i];
      const sensitivity = GAME_CONSTANTS.HAND_TRACKING_SENSITIVITY;
      return {
        x: oldLm.x * (1 - sensitivity) + newLm.x * sensitivity,
        y: oldLm.y * (1 - sensitivity) + newLm.y * sensitivity,
        z: oldLm.z * (1 - sensitivity) + newLm.z * sensitivity,
      };
    });
    history.current.push(smoothed);
    if (history.current.length > 5) {
      history.current.shift();
    }
    return smoothed;
  };

  useEffect(() => {
    const video = document.createElement('video');
    video.style.display = 'none';
    setVideoElement(video);
    
    let hands: any;

    const onResults = (results: any) => {
      let foundLeft = false;
      let foundRight = false;

      if (results.multiHandedness && results.multiHandLandmarks) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
          const classification = results.multiHandedness[i];
          const isRightHand = classification.label === 'Right';
          const landmarks = results.multiHandLandmarks[i];

          if (classification.score > GAME_CONSTANTS.HAND_CONFIDENCE_THRESHOLD) {
             if (isRightHand) {
              setRightHand(smoothLandmarks(landmarks, rightHandHistory));
              foundRight = true;
            } else {
              setLeftHand(smoothLandmarks(landmarks, leftHandHistory));
              foundLeft = true;
            }
          }
        }
      }
      
      if (!foundLeft) setLeftHand(emptyLandmarks);
      if (!foundRight) setRightHand(emptyLandmarks);
      
      if (isLoading) setIsLoading(false);
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        video.srcObject = stream;
        video.play();

        hands = new Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);
        
        const camera = new window.Camera(video, {
            onFrame: async () => {
                await hands.send({ image: video });
            },
            width: 1280,
            height: 720
        });
        camera.start();

      } catch (err) {
        console.error("Camera access error:", err);
        setError("Camera access is required to play. Please allow camera access and refresh the page.");
        setIsLoading(false);
      }
    };
    
    startCamera();

    return () => {
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      if(hands) {
        hands.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoElement, leftHand, rightHand, isLoading, error };
};
