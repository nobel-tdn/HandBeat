
import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import * as Tone from 'tone';
import { HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { GameResult, Judgement, ActiveNote, HandLandmarks, Chart } from '../../types';
import { judgeNote } from '../../game/judgement';
import { LANE_X_POSITIONS, NOTE_APPEAR_Z, JUDGEMENT_LINE_Z, NOTE_DESPAWN_Z, HAND_POINTER_INDEX, SCORE_VALUES, JUDGEMENT_TIMING } from '../../constants';
import { HUD } from './HUD';

interface GameCanvasProps {
  video: HTMLVideoElement;
  handLandmarker: HandLandmarker;
  onGameEnd: (result: GameResult) => void;
  chart: Chart;
  audioUrl: string;
}

interface HudState {
    score: number;
    combo: number;
    judgement: { judgement: Judgement, id: number } | null;
    progress: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ video, handLandmarker, onGameEnd, chart, audioUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hudData, setHudData] = useState<HudState>({
      score: 0,
      combo: 0,
      judgement: null,
      progress: 0,
  });
  
  useEffect(() => {
    if (!canvasRef.current || !video || !handLandmarker) return;

    console.log("GameCanvas: Initializing.");

    // --- STATE & SETUP ---
    const gameState = {
        activeNotes: new Map<string, ActiveNote>(),
        noteMeshes: new Map<string, THREE.Object3D>(),
        handMarkers: [] as THREE.Group[],
        judgements: { [Judgement.PERFECT]: 0, [Judgement.GREAT]: 0, [Judgement.GOOD]: 0, [Judgement.MISS]: 0 },
        lastVideoTime: -1,
        score: 0,
        combo: 0,
        maxCombo: 0,
        isFinished: false,
        isAudioReady: false,
    };

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0, 10, 5);
    scene.add(dirLight);

    const laneMaterial = new THREE.LineBasicMaterial({ color: 0x68E1FD, transparent: true, opacity: 0.3 });
    LANE_X_POSITIONS.forEach(x => {
        const points = [new THREE.Vector3(x - 1, 0, NOTE_APPEAR_Z), new THREE.Vector3(x - 1, 0, NOTE_DESPAWN_Z)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        scene.add(new THREE.Line(geometry, laneMaterial));
        const points2 = [new THREE.Vector3(x + 1, 0, NOTE_APPEAR_Z), new THREE.Vector3(x + 1, 0, NOTE_DESPAWN_Z)];
        const geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
        scene.add(new THREE.Line(geometry2, laneMaterial));
    });
    
    const judgementLineGeom = new THREE.PlaneGeometry(10, 0.1);
    const judgementLineMat = new THREE.MeshBasicMaterial({ color: 0xFF6B8A, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const judgementLine = new THREE.Mesh(judgementLineGeom, judgementLineMat);
    judgementLine.position.set(0,0,JUDGEMENT_LINE_Z);
    judgementLine.rotation.x = Math.PI / 2;
    scene.add(judgementLine);

    // Redesigned Hand Markers
    for (let i = 0; i < 2; i++) {
        const markerGroup = new THREE.Group();
        const newColor = 0x00C8FF; // A deeper, more vivid cyan
        const newColorRgba = 'rgba(0, 200, 255, ';

        // A small, bright core dot with the primary color
        const centerDotGeom = new THREE.SphereGeometry(0.08, 16, 16);
        const centerDotMat = new THREE.MeshBasicMaterial({ color: newColor });
        const centerDot = new THREE.Mesh(centerDotGeom, centerDotMat);
        
        // Procedurally generate a canvas texture for a soft glow
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d')!;
        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0, 
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        gradient.addColorStop(0.1, newColorRgba + '1.0)');
        gradient.addColorStop(0.4, newColorRgba + '0.5)');
        gradient.addColorStop(1, newColorRgba + '0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
        });
        const glowSprite = new THREE.Sprite(spriteMat);
        glowSprite.scale.set(1.2, 1.2, 1.2);

        markerGroup.add(centerDot);
        markerGroup.add(glowSprite);

        markerGroup.visible = false;
        scene.add(markerGroup);
        gameState.handMarkers.push(markerGroup);
    }
    
    const noteMaterial = new THREE.MeshStandardMaterial({ color: 0x68E1FD, emissive: 0x68E1FD, emissiveIntensity: 1 });

    // --- JUDGEMENT LOGIC ---
    const handleJudgement = (judgement: Judgement, noteId: string) => {
      if (!gameState.activeNotes.has(noteId)) return;

      if (judgement !== Judgement.MISS) {
        gameState.combo++;
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
        gameState.score += SCORE_VALUES[judgement] * (1 + Math.floor(gameState.combo / 10) * 0.1);
      } else {
        gameState.combo = 0;
      }
      gameState.judgements[judgement]++;
      
      setHudData(prev => ({
          score: gameState.score,
          combo: gameState.combo,
          judgement: { judgement, id: Date.now() },
          progress: prev.progress,
      }));

      const mesh = gameState.noteMeshes.get(noteId);
      if(mesh) {
          scene.remove(mesh);
          gameState.noteMeshes.delete(noteId);
      }
      gameState.activeNotes.delete(noteId);
    };

    // --- AUDIO & NOTE SCHEDULING ---
    const player = new Tone.Player({
      url: audioUrl,
      onload: () => {
        console.log("Audio loaded. Setting up transport for chart:", chart.title);
        Tone.Transport.bpm.value = chart.bpm;
        const songDuration = player.buffer.duration;
        Tone.Transport.loopStart = 0;
        Tone.Transport.loopEnd = songDuration;
        Tone.Transport.loop = false;

        const beatDuration = 60 / chart.bpm;
        const travelSpeed = 5; // units per beat
        const travelBeats = Math.abs(NOTE_APPEAR_Z - JUDGEMENT_LINE_Z) / travelSpeed;

        chart.notes.forEach(note => {
            const spawnTime = (note.beat - travelBeats) * beatDuration - chart.offset;
            
            Tone.Transport.scheduleOnce((time) => {
                const noteMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.2), noteMaterial);
                noteMesh.position.set(LANE_X_POSITIONS[note.lane], 0.1, NOTE_APPEAR_Z);
                scene.add(noteMesh);
                gameState.noteMeshes.set(note.id, noteMesh);

                const noteStartTime = note.beat * beatDuration;
                gameState.activeNotes.set(note.id, {
                    note: note,
                    startTime: noteStartTime,
                    endTime: (note.type === 'hold' ? (noteStartTime + note.duration * beatDuration) : noteStartTime),
                });
            }, spawnTime > 0 ? spawnTime : 0);
        });

        player.sync().start(0, chart.offset);
        Tone.Transport.start();
        gameState.isAudioReady = true;
        console.log("Transport started.");
      },
      onerror: (err) => console.error("Failed to load audio:", err),
    }).toDestination();
    

    // --- GAME LOOP ---
    let animationFrameId: number;
    const gameLoop = () => {
        if (gameState.isFinished) return;
        animationFrameId = requestAnimationFrame(gameLoop);

        // Hand tracking
        let handLandmarks: HandLandmarks | undefined;
        if (video.readyState >= 2 && video.currentTime !== gameState.lastVideoTime) {
          const results = handLandmarker.detectForVideo(video, performance.now());
          handLandmarks = results.landmarks;
          gameState.lastVideoTime = video.currentTime;
        }

        // Update visuals
        gameState.handMarkers.forEach((marker, i) => {
            const hand = handLandmarks?.[i]?.[HAND_POINTER_INDEX];
            marker.visible = !!hand;
            if (hand) {
                const handX = (0.5 - hand.x) * 10;
                const handY = (0.5 - hand.y) * 10;
                marker.position.set(handX, handY, JUDGEMENT_LINE_Z);
            }
        });

        if (gameState.isAudioReady) {
            const transportTime = Tone.Transport.seconds;
            
            for (const [id, activeNote] of gameState.activeNotes.entries()) {
                const { note, startTime } = activeNote;
                const beatDuration = 60 / chart.bpm;
                const beatsToJudgement = (note.beat - (transportTime / beatDuration));
                const travelSpeed = 5; // units per beat
                
                const zPos = JUDGEMENT_LINE_Z - beatsToJudgement * travelSpeed;

                const mesh = gameState.noteMeshes.get(id);
                if (mesh) mesh.position.z = zPos;

                // Check for judgement or miss
                const timeError = transportTime - startTime;
                if (timeError >= -JUDGEMENT_TIMING.GOOD) { // Only check if close
                    const result = judgeNote(activeNote, handLandmarks, transportTime);
                    if (result) {
                        handleJudgement(result, id);
                    } else if (timeError > JUDGEMENT_TIMING.MISS) { // Past miss window
                        handleJudgement(Judgement.MISS, id);
                    }
                }
            }

            const duration = player.buffer.duration;
            const progress = duration > 0 ? (transportTime / duration) * 100 : 0;
            setHudData(prev => ({ ...prev, progress }));

            if (transportTime >= duration && gameState.activeNotes.size === 0 && !gameState.isFinished) {
                gameState.isFinished = true;
                console.log("Game finished!");
                onGameEnd({ score: Math.round(gameState.score), maxCombo: gameState.maxCombo, judgements: gameState.judgements });
            }
        }
        
        renderer.render(scene, camera);
    };
    
    // --- START & CLEANUP ---
    Tone.start();
    gameLoop();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        console.log("GameCanvas: Cleaning up.");
        gameState.isFinished = true;
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        
        Tone.Transport.stop();
        Tone.Transport.cancel();
        player?.dispose();
        renderer?.dispose();
        
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    };
  }, [video, handLandmarker, onGameEnd, chart, audioUrl]);

  return (
    <div className="w-full h-full relative">
       <canvas ref={canvasRef} className="w-full h-full" />
       <HUD score={Math.round(hudData.score)} combo={hudData.combo} judgement={hudData.judgement} progress={hudData.progress} />
    </div>
  );
};
