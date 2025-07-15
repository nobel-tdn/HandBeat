
import { ActiveNote, HandLandmarks, Judgement, NoteType } from '../types';
import { JUDGEMENT_TIMING, HAND_POINTER_INDEX, LANE_X_POSITIONS, LANE_WIDTH } from '../constants';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

function getHandDistance(hand: NormalizedLandmark[], noteLane: number): number {
    if (!hand || !hand[HAND_POINTER_INDEX]) return Infinity;
    
    const pointer = hand[HAND_POINTER_INDEX];
    // Map normalized coords (0-1) to game space.
    // X: 0.5 is center. Y: not as important for this game.
    const handX = (0.5 - pointer.x) * 10;
    
    const laneX = LANE_X_POSITIONS[noteLane];
    
    return Math.abs(handX - laneX);
}


export function judgeNote(
    activeNote: ActiveNote, 
    hands: HandLandmarks | undefined,
    currentTime: number
): Judgement | null {
    const { note, startTime } = activeNote;
    const timeError = currentTime - startTime;

    if (!hands || hands.length === 0) {
        return null; // Can't judge if no hands are visible
    }

    let isHit = false;
    for (const hand of hands) {
        const distance = getHandDistance(hand, note.lane);
        if (distance < LANE_WIDTH / 2) {
            isHit = true;
            break;
        }
    }

    if (!isHit) {
        return null;
    }

    // For now, we only implement TAP notes, so we just check timing.
    if (note.type === NoteType.TAP) {
        const absTimeError = Math.abs(timeError);
        if (absTimeError <= JUDGEMENT_TIMING.PERFECT) return Judgement.PERFECT;
        if (absTimeError <= JUDGEMENT_TIMING.GREAT) return Judgement.GREAT;
        if (absTimeError <= JUDGEMENT_TIMING.GOOD) return Judgement.GOOD;
    }
    
    // Future: implement swipe and hold logic here

    return null; // Hit the note, but outside any timing window
}