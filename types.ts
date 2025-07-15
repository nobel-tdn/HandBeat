
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

export enum Scene {
  TITLE,
  GAMEPLAY,
  RESULT,
}

export enum NoteType {
  TAP = 'tap',
  SWIPE = 'swipe',
  HOLD = 'hold',
}

export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
}

export interface BaseNote {
  type: NoteType;
  lane: number;
  beat: number;
  id: string;
}

export interface TapNote extends BaseNote {
  type: NoteType.TAP;
}

export interface SwipeNote extends BaseNote {
  type: NoteType.SWIPE;
  dir: SwipeDirection;
}

export interface HoldNote extends BaseNote {
  type: NoteType.HOLD;
  duration: number; // in beats
}

export type Note = TapNote | SwipeNote | HoldNote;

export interface Chart {
  bpm: number;
  offset: number;
  notes: Note[];
  audioSrc: string;
  title: string;
  artist: string;
}

export enum Judgement {
  PERFECT = 'PERFECT',
  GREAT = 'GREAT',
  GOOD = 'GOOD',
  MISS = 'MISS',
}

export type HandLandmarks = NormalizedLandmark[][];

export interface GameResult {
  score: number;
  maxCombo: number;
  judgements: Record<Judgement, number>;
}

export interface ActiveNote {
  note: Note;
  startTime: number;
  endTime: number;
  isHolding?: boolean;
  holdProgress?: number;
}
