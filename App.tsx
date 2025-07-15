
import React, { useState, useCallback } from 'react';
import { TitleScene } from './components/scenes/TitleScene';
import { GamePlayScene } from './components/scenes/GamePlayScene';
import { ResultScene } from './components/scenes/ResultScene';
import { Scene, GameResult } from './types';

const App: React.FC = () => {
  const [scene, setScene] = useState<Scene>(Scene.TITLE);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [customFile, setCustomFile] = useState<File | null>(null);

  const handleGameStart = useCallback((file?: File) => {
    if (file) {
      setCustomFile(file);
    }
    setScene(Scene.GAMEPLAY);
  }, []);

  const handleGameEnd = useCallback((result: GameResult) => {
    setGameResult(result);
    setScene(Scene.RESULT);
  }, []);

  const handleRestart = useCallback(() => {
    setGameResult(null);
    setCustomFile(null);
    setScene(Scene.TITLE);
  }, []);

  const renderScene = () => {
    switch (scene) {
      case Scene.GAMEPLAY:
        return <GamePlayScene onGameEnd={handleGameEnd} customFile={customFile} />;
      case Scene.RESULT:
        return gameResult && <ResultScene result={gameResult} onRestart={handleRestart} />;
      case Scene.TITLE:
      default:
        return <TitleScene onStart={handleGameStart} />;
    }
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-surface flex items-center justify-center">
      {renderScene()}
    </main>
  );
};

export default App;