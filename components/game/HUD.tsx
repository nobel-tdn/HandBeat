import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Judgement } from '../../types';

interface HUDProps {
  score: number;
  combo: number;
  judgement: { judgement: Judgement; id: number } | null;
  progress: number;
}

const judgementColors: Record<Judgement, string> = {
  [Judgement.PERFECT]: 'text-success',
  [Judgement.GREAT]: 'text-primary',
  [Judgement.GOOD]: 'text-warning',
  [Judgement.MISS]: 'text-error',
};

const JudgementPopup: React.FC<{ judgement: Judgement }> = ({ judgement }) => {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center text-5xl font-title pointer-events-none animate-pop ${judgementColors[judgement]}`}
      style={{ textShadow: '0 0 10px currentColor' }}
    >
      {judgement === Judgement.MISS ? judgement : `${judgement}!`}
    </div>
  );
};

export const HUD: React.FC<HUDProps> = ({ score, combo, judgement, progress }) => {
  const [displayedJudgement, setDisplayedJudgement] = useState<{ judgement: Judgement; id: number } | null>(null);

  useEffect(() => {
    if (judgement) {
      setDisplayedJudgement(judgement);
    }
  }, [judgement]);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-8 flex flex-col justify-between">
      {/* Top Section */}
      <div className="flex justify-between items-start gap-4">
        <Card className="min-w-[200px]">
          <h2 className="font-heading text-text-sub text-lg">SCORE</h2>
          <p className="font-title text-4xl text-text-main">{score.toLocaleString()}</p>
        </Card>
      </div>

      {/* Center Section for Judgement */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-32">
        {displayedJudgement && (
          <JudgementPopup
            key={displayedJudgement.id}
            judgement={displayedJudgement.judgement}
          />
        )}
      </div>

      {/* Bottom Section */}
      <div className="flex justify-center items-end gap-4">
         <Card className="text-center">
          <h2 className="font-heading text-text-sub text-lg">COMBO</h2>
          <p className="font-title text-6xl text-accent" style={{ textShadow: '0 0 8px #FF6B8A' }}>{combo}</p>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-surface-alt/50">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};
