
import { Chart, NoteType, SwipeDirection, Note } from '../types';
import { LANE_COUNT } from '../constants';
import * as Tone from 'tone';

export const sampleChart: Chart = {
  title: "Future Funk",
  artist: "Virtual Beatmaker",
  bpm: 128,
  offset: 0,
  audioSrc: 'https://cdn.jsdelivr.net/gh/kchap/HandBeatAssets/future_funk.mp3',
  notes: [
    { id: 'n1', type: NoteType.TAP, lane: 0, beat: 4 },
    { id: 'n2', type: NoteType.TAP, lane: 1, beat: 4.5 },
    { id: 'n3', type: NoteType.TAP, lane: 2, beat: 5 },
    { id: 'n4', type: NoteType.TAP, lane: 3, beat: 5.5 },
    { id: 'n5', type: NoteType.TAP, lane: 1, beat: 6 },
    { id: 'n6', type: NoteType.TAP, lane: 2, beat: 6 },
    { id: 'n7', type: NoteType.TAP, lane: 0, beat: 7 },
    { id: 'n8', type: NoteType.TAP, lane: 3, beat: 7.5 },
    
    { id: 'n9', type: NoteType.TAP, lane: 0, beat: 8 },
    { id: 'n10', type: NoteType.TAP, lane: 1, beat: 8 },
    { id: 'n11', type: NoteType.TAP, lane: 2, beat: 9 },
    { id: 'n12', type: NoteType.TAP, lane: 3, beat: 9 },

    { id: 'n13', type: NoteType.TAP, lane: 0, beat: 10 },
    { id: 'n14', type: NoteType.TAP, lane: 3, beat: 10.5 },
    { id: 'n15', type: NoteType.TAP, lane: 1, beat: 11 },
    { id: 'n16', type: NoteType.TAP, lane: 2, beat: 11.5 },

    { id: 'n17', type: NoteType.TAP, lane: 0, beat: 12 },
    { id: 'n18', type: NoteType.TAP, lane: 1, beat: 12.5 },
    { id: 'n19', type: NoteType.TAP, lane: 2, beat: 13 },
    { id: 'n20', type: NoteType.TAP, lane: 3, beat: 13.5 },
    { id: 'n21', type: NoteType.TAP, lane: 0, beat: 14 },
    { id: 'n22', type: NoteType.TAP, lane: 3, beat: 14 },
    { id: 'n23', type: NoteType.TAP, lane: 1, beat: 15 },
    { id: 'n24', type: NoteType.TAP, lane: 2, beat: 15.5 },

    { id: 'n25', type: NoteType.TAP, lane: 0, beat: 16 },
    { id: 'n26', type: NoteType.TAP, lane: 1, beat: 16 },
    { id: 'n27', type: NoteType.TAP, lane: 2, beat: 16 },
    { id: 'n28', type: NoteType.TAP, lane: 3, beat: 16 },
  ]
};

/**
 * Analyzes an AudioBuffer to detect onsets (beats) and generates a musical chart.
 * This is a simplified implementation of onset detection.
 * @param buffer The audio buffer to analyze.
 * @param bpm The tempo to use for quantization.
 * @param songName The name of the song.
 * @returns A promise that resolves to a Chart object.
 */
export async function generateChart(buffer: Tone.ToneAudioBuffer, bpm: number, songName: string): Promise<Chart> {
    const notes: Note[] = [];
    const offlineCtx = new Tone.OfflineContext(buffer.numberOfChannels, buffer.duration, buffer.sampleRate);
    
    // Filter the audio to emphasize rhythmic elements (kick, snare)
    const filter = new Tone.Filter(200, "lowpass").toDestination();
    const player = new Tone.Player(buffer.get() as AudioBuffer).connect(filter);
    
    player.start(0);
    const renderedBuffer = await offlineCtx.render();
    const data = renderedBuffer.getChannelData(0);

    // --- Onset Detection ---
    // This is a very basic peak-picking algorithm. More advanced methods exist,
    // but this is a good starting point for client-side analysis.
    const onsets: number[] = [];
    const threshold = 0.08; // Sensitivity for beat detection
    const minTimeGap = 60 / bpm / 4; // Minimum time between notes (16th notes)
    let lastOnset = -Infinity;

    for (let i = 1; i < data.length - 1; i++) {
        // Find a local maximum (a peak)
        if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > threshold) {
            const timestamp = i / renderedBuffer.sampleRate;
            if (timestamp - lastOnset > minTimeGap) {
                onsets.push(timestamp);
                lastOnset = timestamp;
            }
        }
    }
    
    // --- Quantize and Create Notes ---
    const uniqueBeats = new Set<number>();
    onsets.forEach(time => {
        const beat = (time * bpm) / 60;
        // Quantize to the nearest 16th note to make the rhythm feel more natural
        const quantizedBeat = Math.round(beat * 4) / 4;
        uniqueBeats.add(quantizedBeat);
    });

    let lastLane = -1;
    Array.from(uniqueBeats).sort((a,b) => a - b).forEach(beat => {
        if(beat < 4) return; // Add a small lead-in time
        
        let lane = Math.floor(Math.random() * LANE_COUNT);
        // Avoid placing notes in the same lane consecutively too often
        if (lane === lastLane && Math.random() > 0.3) {
            lane = (lane + 1) % LANE_COUNT;
        }
        
        notes.push({
            id: `gen-${beat}`,
            type: NoteType.TAP,
            lane,
            beat: beat,
        });
        lastLane = lane;
    });
    
    console.log(`Generated ${notes.length} notes from audio analysis.`);

    return {
        title: songName.replace(/\.mp3/i, ''),
        artist: "You!",
        bpm,
        offset: 0,
        audioSrc: '', // This will be handled by the object URL
        notes
    };
}
