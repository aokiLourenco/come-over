"use client";

// Every sound is synthesized, so there are no audio files to license or load.
type Name = "knock" | "door" | "cheer" | "pop" | "whack" | "crack" | "candy" | "seal" | "paper" | "cord" | "disco" | "scratch" | "sparkle";

class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  private audio() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(c: AudioContext, freq: number, at: number, dur: number, gain: number, type: OscillatorType = "sine", toFreq?: number) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime + at);
    if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, c.currentTime + at + dur);
    g.gain.setValueAtTime(gain, c.currentTime + at);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + at);
    o.stop(c.currentTime + at + dur + 0.02);
  }

  private noise(c: AudioContext, at: number, dur: number, gain: number, freq: number, q = 1) {
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime + at);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
    s.connect(f).connect(g).connect(c.destination);
    s.start(c.currentTime + at);
  }

  play(name: Name) {
    if (this.muted) return;
    const c = this.audio();
    if (!c) return;
    switch (name) {
      case "knock":
        this.tone(c, 190, 0, 0.09, 0.5, "triangle", 90);
        this.noise(c, 0, 0.05, 0.25, 700);
        break;
      case "door":
        this.tone(c, 110, 0, 0.7, 0.1, "sawtooth", 170);
        this.noise(c, 0.1, 0.5, 0.05, 1600, 4);
        break;
      case "cheer":
        this.noise(c, 0, 1.2, 0.12, 1800, 0.5);
        [523, 659, 784, 1047].forEach((f, i) => this.tone(c, f, i * 0.07, 0.3, 0.09, "triangle"));
        break;
      case "pop":
        this.noise(c, 0, 0.16, 0.8, 1400, 0.4);
        this.tone(c, 240, 0, 0.14, 0.5, "square", 60);
        break;
      case "whack":
        this.noise(c, 0, 0.1, 0.5, 900, 0.7);
        this.tone(c, 140, 0, 0.12, 0.4, "triangle", 70);
        break;
      case "crack":
        this.noise(c, 0, 0.3, 0.7, 2400, 0.6);
        this.tone(c, 120, 0, 0.25, 0.5, "sawtooth", 40);
        break;
      case "candy":
        for (let i = 0; i < 12; i++) this.tone(c, 1800 + Math.random() * 1800, i * 0.06, 0.04, 0.07, "triangle");
        break;
      case "seal":
        this.noise(c, 0, 0.12, 0.5, 3000, 1);
        this.tone(c, 500, 0, 0.08, 0.2, "square", 180);
        break;
      case "paper":
        this.noise(c, 0, 0.45, 0.12, 4200, 0.7);
        break;
      case "cord":
        this.tone(c, 1500, 0, 0.03, 0.2, "square");
        this.tone(c, 900, 0.08, 0.03, 0.2, "square");
        break;
      case "disco":
        for (let i = 0; i < 8; i++) {
          const t = i * 0.3;
          this.tone(c, 150, t, 0.16, 0.5, "sine", 45);
          this.noise(c, t + 0.15, 0.05, 0.12, 8000, 1);
          this.tone(c, [55, 55, 82, 73][i % 4], t + 0.15, 0.14, 0.18, "sawtooth");
        }
        break;
      case "scratch":
        this.noise(c, 0, 0.08, 0.05, 5200, 0.8);
        break;
      case "sparkle":
        [1319, 1568, 2093].forEach((f, i) => this.tone(c, f, i * 0.08, 0.3, 0.07, "sine"));
        break;
    }
  }
}

export const sfx = new Sfx();
