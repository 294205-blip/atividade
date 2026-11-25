export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private droneStarted = false;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.46, this.ctx.currentTime, 0.04);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.46;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (!this.droneStarted) {
      this.startHorrorDrone();
    }
  }

  private startHorrorDrone(): void {
    if (!this.ctx || !this.masterGain) return;
    this.droneStarted = true;
    const now = this.ctx.currentTime;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.0, now);
    this.droneGain.connect(this.masterGain);

    // Eerie minor second / tritone sub-bass horror drone
    const freqs = [55.0, 58.27, 82.41];
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(195, now);
    filter.connect(this.droneGain);

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(f, now);
      g.gain.value = idx === 0 ? 0.048 : 0.032;
      osc.connect(g);
      g.connect(filter);
      osc.start();
    });

    // Continuous looping realistic rain hiss
    const sampleCount = this.ctx.sampleRate * 2;
    const rainBuf = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
    const ch = rainBuf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < sampleCount; i++) {
      const white = Math.random() * 2 - 1;
      // Brown/pinkish smoothing for natural rain timbre
      ch[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = ch[i];
      ch[i] *= 2.4;
    }
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = rainBuf;
    rainSrc.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(1350, now);
    rainFilter.Q.setValueAtTime(0.55, now);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, now);
    rainSrc.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    rainSrc.start();
  }

  public setAmbientActive(active: boolean, rainIntensity = 1): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(active ? 0.4 : 0.0, now, 0.45);
    }
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(active ? 0.14 * rainIntensity : 0.0, now, 0.5);
    }
  }

  public playFootstep(biome: 'forest' | 'cemetery' | 'chapel' | 'asylum' | 'mansion' | 'lab' | 'crypt'): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    if (biome === 'forest' || biome === 'cemetery') {
      // Wet mud/gravel crunch
      this.playNoise(0.055, 680 + Math.random() * 180, 'bandpass', 0.09);
      this.createOsc('sine', 78 + Math.random() * 14, 0.05, 0.06);
    } else if (biome === 'mansion') {
      // Creaking hollow floorboards
      this.playNoise(0.05, 420 + Math.random() * 130, 'lowpass', 0.085);
      this.createOsc('triangle', 96 + Math.random() * 18, 0.075, 0.075);
    } else if (biome === 'asylum' || biome === 'lab') {
      // Hollow wet concrete/tile tap
      this.playNoise(0.04, 1150 + Math.random() * 220, 'bandpass', 0.075);
      this.createOsc('triangle', 125 + Math.random() * 20, 0.055, 0.07);
    } else {
      // Heavy damp stone (chapel / crypt)
      this.playNoise(0.05, 520 + Math.random() * 140, 'lowpass', 0.095);
      this.createOsc('sine', 92 + Math.random() * 12, 0.06, 0.08);
    }
  }

  private createOsc(
    type: OscillatorType,
    freq: number,
    dur: number,
    vol = 0.25
  ): { osc: OscillatorNode; gain: GainNode } | null {
    if (!this.ctx || !this.masterGain || this.muted) return null;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
    return { osc, gain };
  }

  private playNoise(dur: number, filterFreq: number, filterType: BiquadFilterType, vol = 0.2): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const sampleCount = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  public playUiClick(): void {
    this.unlock();
    const res = this.createOsc('triangle', 320, 0.09, 0.14);
    if (res && this.ctx) {
      res.osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.08);
    }
  }

  public playJump(isDouble: boolean): void {
    if (!this.ctx) return;
    this.playNoise(0.08, 700, 'bandpass', 0.14);
    const startFreq = isDouble ? 240 : 150;
    const endFreq = isDouble ? 420 : 280;
    const res = this.createOsc('triangle', startFreq, 0.13, 0.14);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.12);
    }
  }

  public playLand(intensity: number): void {
    if (!this.ctx) return;
    const clamped = Math.min(1, Math.max(0.2, intensity));
    const res = this.createOsc('sine', 88, 0.12, 0.24 * clamped);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(34, this.ctx.currentTime + 0.11);
    }
    this.playNoise(0.09, 260, 'lowpass', 0.16 * clamped);
  }

  public playDash(): void {
    if (!this.ctx) return;
    this.playNoise(0.2, 950, 'bandpass', 0.25);
    const res = this.createOsc('sine', 260, 0.18, 0.12);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(95, this.ctx.currentTime + 0.17);
    }
  }

  public playSlash(comboStep: number): void {
    if (!this.ctx) return;
    const base = 780 + comboStep * 150;
    this.playNoise(0.11, base + 600, 'bandpass', 0.24);
    const res = this.createOsc('sawtooth', base, 0.1, 0.1);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.09);
    }
  }

  public playHit(heavy: boolean): void {
    if (!this.ctx) return;
    const res = this.createOsc('square', heavy ? 115 : 160, heavy ? 0.18 : 0.12, heavy ? 0.24 : 0.17);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(38, this.ctx.currentTime + (heavy ? 0.17 : 0.11));
    }
    this.playNoise(heavy ? 0.15 : 0.09, heavy ? 700 : 1100, 'lowpass', heavy ? 0.3 : 0.2);
  }

  public playDeflect(): void {
    if (!this.ctx) return;
    const res = this.createOsc('sine', 840, 0.22, 0.22);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.12);
    }
  }

  public playFlare(): void {
    if (!this.ctx) return;
    // Blinding lantern flare burst
    this.playNoise(0.32, 2400, 'highpass', 0.22);
    const res = this.createOsc('sine', 520, 0.4, 0.18);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(1180, this.ctx.currentTime + 0.18);
    }
  }

  public playPlayerHurt(): void {
    if (!this.ctx) return;
    const res = this.createOsc('sawtooth', 145, 0.28, 0.28);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(48, this.ctx.currentTime + 0.26);
    }
    this.playNoise(0.22, 520, 'lowpass', 0.26);
  }

  public playHeartbeat(): void {
    if (!this.ctx) return;
    const lub = this.createOsc('sine', 64, 0.12, 0.28);
    if (lub) lub.osc.frequency.exponentialRampToValueAtTime(36, this.ctx.currentTime + 0.1);
    setTimeout(() => {
      if (!this.ctx) return;
      const dub = this.createOsc('sine', 56, 0.14, 0.22);
      if (dub) dub.osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.12);
    }, 150);
  }

  public playThunder(): void {
    if (!this.ctx) return;
    this.playNoise(1.1, 180, 'lowpass', 0.35);
    const res = this.createOsc('sine', 58, 0.9, 0.22);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.85);
    }
  }

  public playPagePickup(index: number): void {
    if (!this.ctx) return;
    // Haunted music-box minor interval
    const minorScale = [440, 493.88, 523.25, 659.25, 698.46, 880];
    const freq = minorScale[index % minorScale.length];
    this.createOsc('sine', freq, 0.42, 0.18);
    setTimeout(() => {
      this.createOsc('sine', freq * 1.189, 0.38, 0.1);
    }, 65);
  }

  public playOilPickup(): void {
    if (!this.ctx) return;
    const res = this.createOsc('triangle', 310, 0.22, 0.16);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(540, this.ctx.currentTime + 0.2);
    }
  }

  public playHeal(): void {
    if (!this.ctx) return;
    [329.63, 392.0, 493.88].forEach((f, i) => {
      setTimeout(() => {
        this.createOsc('sine', f, 0.36, 0.15);
      }, i * 65);
    });
  }

  public playCheckpoint(): void {
    if (!this.ctx) return;
    // Warm match-strike + relief chime
    this.playNoise(0.14, 2100, 'bandpass', 0.18);
    const chord = [261.63, 311.13, 392.0, 523.25];
    chord.forEach((f, i) => {
      setTimeout(() => {
        this.createOsc('triangle', f, 0.55, 0.13);
      }, i * 75);
    });
  }

  public playMonsterShriek(): void {
    if (!this.ctx) return;
    const res = this.createOsc('sawtooth', 240, 0.34, 0.17);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(610, this.ctx.currentTime + 0.16);
      res.osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.33);
    }
    this.playNoise(0.24, 1600, 'bandpass', 0.14);
  }

  public playWardenSlam(): void {
    if (!this.ctx) return;
    const res = this.createOsc('sine', 85, 0.45, 0.38);
    if (res) {
      res.osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.42);
    }
    this.playNoise(0.32, 360, 'lowpass', 0.32);
  }

  public playVictory(): void {
    if (!this.ctx) return;
    // Dawn relief chord
    const dawn = [293.66, 369.99, 440.0, 587.33, 739.99];
    dawn.forEach((f, i) => {
      setTimeout(() => {
        this.createOsc('triangle', f, 0.85, 0.18);
        this.createOsc('sine', f * 0.5, 0.95, 0.11);
      }, i * 120);
    });
  }

  public playGameOver(): void {
    if (!this.ctx) return;
    const notes = [220.0, 207.65, 174.61, 130.81];
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.createOsc('sawtooth', f, 0.65, 0.14);
      }, i * 180);
    });
  }
}
