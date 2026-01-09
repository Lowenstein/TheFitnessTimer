import { IntervalType } from '../types';

let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

// Ensure context is running (must be called on user interaction like 'Play')
export const ensureAudioContext = () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
};

export const playCountdown = (nextType: IntervalType | 'FINISHED') => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Sound profile based on what is COMING UP
    switch (nextType) {
        case IntervalType.WORK:
            // Sharp, urgent high blips for Work
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, t); // A5
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
            break;

        case IntervalType.REST:
            // Softer, lower blips for Rest
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, t); // A4
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.15);
            break;

        case 'FINISHED':
            // High-pitched rapid ticks
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, t);
            gain.gain.setValueAtTime(0.05, t);
            osc.start(t);
            osc.stop(t + 0.05);
            break;

        default: // PREP, COOLDOWN
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(660, t); // E5
            gain.gain.setValueAtTime(0.05, t);
            osc.start(t);
            osc.stop(t + 0.1);
            break;
    }
};

export const playTransition = (newType: IntervalType | 'FINISHED') => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (newType === 'FINISHED') {
        // Victory Fanfare
        osc.type = 'triangle';
        // Arpeggio
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, t + 0.3); // C6
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 1.0);
        
        osc.start(t);
        osc.stop(t + 1.0);
        return;
    }

    switch (newType) {
        case IntervalType.WORK:
            // "GO!" sound - Rising siren/whistle effect
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
            
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.4);
            
            osc.start(t);
            osc.stop(t + 0.4);
            break;

        case IntervalType.REST:
            // "Relax" sound - Descending chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.exponentialRampToValueAtTime(220, t + 0.4);
            
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.5);
            
            osc.start(t);
            osc.stop(t + 0.5);
            break;

        default:
            // Generic change
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
            break;
    }
};