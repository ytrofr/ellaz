import type { AudioPort, SfxName } from "./types";

// Wave-1 audio: a tiny WebAudio synth for crisp, offline, zero-asset SFX.
// (Howler + audio sprites is the documented upgrade for sampled sound.)
// The AudioContext starts suspended on iOS and is resumed on the first user
// gesture via unlock().
type Tone = { freq: number; dur: number; type: OscillatorType; gain?: number };

const VOICES: Record<SfxName, Tone[]> = {
  tap: [{ freq: 440, dur: 0.06, type: "sine" }],
  flip: [{ freq: 600, dur: 0.07, type: "triangle" }],
  pop: [{ freq: 320, dur: 0.09, type: "square", gain: 0.15 }],
  success: [
    { freq: 660, dur: 0.09, type: "sine" },
    { freq: 880, dur: 0.11, type: "sine" },
  ],
  win: [
    { freq: 523, dur: 0.12, type: "sine" },
    { freq: 659, dur: 0.12, type: "sine" },
    { freq: 784, dur: 0.18, type: "sine" },
  ],
  fail: [{ freq: 180, dur: 0.18, type: "sawtooth", gain: 0.12 }],
};

const MUTE_KEY = "ellaz:muted";

class WebAudioPort implements AudioPort {
  private ctx: AudioContext | null = null;
  private _muted: boolean;
  private listeners = new Set<(m: boolean) => void>();

  constructor() {
    let saved = false;
    try {
      saved = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      /* ignore */
    }
    this._muted = saved;
  }

  get muted() {
    return this._muted;
  }

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  unlock(): void {
    const ctx = this.ensureCtx();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  toggleMute(): void {
    this._muted = !this._muted;
    try {
      localStorage.setItem(MUTE_KEY, this._muted ? "1" : "0");
    } catch {
      /* ignore */
    }
    this.listeners.forEach((cb) => cb(this._muted));
  }

  onMuteChange(cb: (m: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  play(name: SfxName): void {
    if (this._muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const tones = VOICES[name];
    let when = ctx.currentTime;
    for (const tone of tones) {
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = tone.type;
        osc.frequency.value = tone.freq;
        const peak = tone.gain ?? 0.2;
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(peak, when + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, when + tone.dur);
        osc.connect(g).connect(ctx.destination);
        osc.start(when);
        osc.stop(when + tone.dur + 0.02);
        when += tone.dur * 0.85;
      } catch {
        /* ignore a single failed tone */
      }
    }
  }
}

// One shared audio port for the whole app (mute state is global).
export const audioPort: AudioPort = new WebAudioPort();
