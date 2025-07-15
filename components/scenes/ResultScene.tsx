
import React from 'react';
import { GameResult, Judgement } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ResultSceneProps {
  result: GameResult;
  onRestart: () => void;
}

const judgementColors: Record<Judgement, string> = {
  [Judgement.PERFECT]: 'text-success',
  [Judgement.GREAT]: 'text-primary',
  [Judgement.GOOD]: 'text-warning',
  [Judgement.MISS]: 'text-error',
};

export const ResultScene: React.FC<ResultSceneProps> = ({ result, onRestart }) => {
  return (
    <div className="animate-fadeIn w-full max-w-2xl px-4">
      <Card className="p-8">
        <h1 className="text-5xl font-title text-center text-primary mb-2">Result</h1>
        <div className="mt-6 text-center">
          <p className="text-xl font-heading text-text-sub">SCORE</p>
          <p className="text-6xl font-title text-text-main">{result.score.toLocaleString()}</p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
          <div>
            <p className="text-xl font-heading text-text-sub">MAX COMBO</p>
            <p className="text-4xl font-title text-text-main">{result.maxCombo}</p>
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(result.judgements).map(([judgement, count]) => (
              <div key={judgement} className="flex justify-between items-baseline px-4">
                <p className={`text-xl font-title ${judgementColors[judgement as Judgement]}`}>
                  {judgement}
                </p>
                <p className="text-2xl font-body text-text-main">{count}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 text-center">
          <Button onClick={onRestart}>
            Play Again
          </Button>
        </div>
      </Card>
    </div>
  );
};
