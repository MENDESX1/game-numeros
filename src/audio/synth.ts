let audioCtx: AudioContext | null = null;
let musicInterval: any = null;
let globalVolume = 0.8; // Scales between 0.0 and 1.0 based on config.volume (0-100)

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SynthAudio = {
  setVolume(vol: number) {
    globalVolume = Math.max(0, Math.min(100, vol)) / 100;
  },

  vibrate(ms: number) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Ignore iframe constraint errors
      }
    }
  },

  playClick(enabled: boolean) {
    if (!enabled || globalVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.1 * globalVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  },

  playMatch(enabled: boolean, comboCount = 1) {
    if (!enabled || globalVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch increases slightly with higher combos for a reward feeling!
      const baseFreq = 300 + comboCount * 25;
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(baseFreq * 2.5, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15 * globalVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, ctx.currentTime + 0.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.2);

      this.vibrate(20);
    } catch (e) {
      console.warn('Audio match error:', e);
    }
  },

  playFail(enabled: boolean) {
    if (!enabled || globalVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12 * globalVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);

      this.vibrate(80);
    } catch (e) {
      console.warn('Audio fail error:', e);
    }
  },

  playExplosion(enabled: boolean) {
    if (!enabled || globalVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      // Generate noise buffer
      const bufferSize = ctx.sampleRate * 0.4; // 0.4 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, ctx.currentTime);
      noiseFilter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3 * globalVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, ctx.currentTime + 0.4);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(gain);
      gain.connect(ctx.destination);

      noiseNode.start();
      noiseNode.stop(ctx.currentTime + 0.4);

      // Low bass rumble
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.4);
      oscGain.gain.setValueAtTime(0.2 * globalVolume, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, ctx.currentTime + 0.4);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);

      this.vibrate(150);
    } catch (e) {
      console.warn('Audio explosion error:', e);
    }
  },

  playIceBreak(enabled: boolean) {
    if (!enabled || globalVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.1 * globalVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);

      this.vibrate(30);
    } catch (e) {
      console.warn('Audio ice break error:', e);
    }
  },

  playUnlock(enabled: boolean) {
    if (!enabled || globalVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc1.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08); // C#
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.16); // E

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.08);
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.1 * globalVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, ctx.currentTime + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);

      this.vibrate(40);
    } catch (e) {
      console.warn('Audio unlock error:', e);
    }
  },

  playLevelUp(enabled: boolean) {
    if (!enabled || globalVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Arpeggio C Major
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12 * globalVolume, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, ctx.currentTime + i * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.25);
      });

      this.vibrate(100);
    } catch (e) {
      console.warn('Audio level up error:', e);
    }
  },

  playCoin(enabled: boolean) {
    if (!enabled || globalVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6

      gain.gain.setValueAtTime(0.12 * globalVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);

      this.vibrate(15);
    } catch (e) {
      console.warn('Audio coin error:', e);
    }
  },

  playShuffle(enabled: boolean) {
    if (!enabled || globalVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      // Rapid succession of 5 notes to sound like a digital shuffle
      const notes = [440, 554, 659, 880, 1108];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);

        gain.gain.setValueAtTime(0.08 * globalVolume, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.005 * globalVolume, ctx.currentTime + i * 0.05 + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.1);
      });

      this.vibrate(30);
    } catch (e) {
      console.warn('Audio shuffle error:', e);
    }
  },

  startMusic(enabled: boolean) {
    if (musicInterval) clearInterval(musicInterval);
    if (!enabled || globalVolume <= 0) return;

    // Soft, hypnotic pentatonic sequence that sound like a chime/bell
    const pentatonic = [220.00, 246.94, 277.18, 329.63, 369.99, 440.00, 493.88, 554.37, 659.25, 739.99]; // A major pentatonic
    let step = 0;

    musicInterval = setInterval(() => {
      try {
        if (globalVolume <= 0) return;
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') return;

        // Play random note or chord
        const noteIdx = Math.floor(Math.random() * pentatonic.length);
        const freq = pentatonic[noteIdx];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03 * globalVolume, ctx.currentTime + 0.1); // slow attack
        gain.gain.exponentialRampToValueAtTime(0.001 * globalVolume, ctx.currentTime + 2.5); // long decay

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 2.5);

        // Every 4 beats, play a soft second note (dyad/interval)
        if (step % 4 === 0) {
          const companionFreq = pentatonic[(noteIdx + (Math.random() > 0.5 ? 2 : 4)) % pentatonic.length];
          const oscCompanion = ctx.createOscillator();
          const gainCompanion = ctx.createGain();

          oscCompanion.type = 'sine';
          oscCompanion.frequency.setValueAtTime(companionFreq, ctx.currentTime + 0.5);

          gainCompanion.gain.setValueAtTime(0.0, ctx.currentTime + 0.5);
          gainCompanion.gain.linearRampToValueAtTime(0.02 * globalVolume, ctx.currentTime + 0.6);
          gainCompanion.gain.exponentialRampToValueAtTime(0.001 * globalVolume, ctx.currentTime + 3.0);

          oscCompanion.connect(gainCompanion);
          gainCompanion.connect(ctx.destination);

          oscCompanion.start(ctx.currentTime + 0.5);
          oscCompanion.stop(ctx.currentTime + 3.0);
        }

        step++;
      } catch (e) {
        // Safe fail
      }
    }, 2800); // Zen speed
  },

  stopMusic() {
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
  }
};
