
import { Judgement } from './types';

export const JUDGEMENT_TIMING: Record<Judgement, number> = {
  [Judgement.PERFECT]: 0.05, // ±50ms
  [Judgement.GREAT]: 0.1,    // ±100ms
  [Judgement.GOOD]: 0.15,   // ±150ms
  [Judgement.MISS]: 0.2,     // > ±200ms
};

export const SCORE_VALUES: Record<Judgement, number> = {
  [Judgement.PERFECT]: 100,
  [Judgement.GREAT]: 70,
  [Judgement.GOOD]: 40,
  [Judgement.MISS]: 0,
};

export const LANE_COUNT = 4;
export const LANE_WIDTH = 2;
export const LANE_X_POSITIONS = [-3, -1, 1, 3];

export const NOTE_APPEAR_Z = -20;
export const JUDGEMENT_LINE_Z = 1.5;
export const NOTE_DESPAWN_Z = 3;

export const HAND_POINTER_INDEX = 8; // Index finger tip landmark