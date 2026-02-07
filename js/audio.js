/**
 * Audio module - generates distinct notification sounds for each phase transition
 * using Web Audio API. Each transition has a unique sound character.
 */
const AudioManager = (() => {
  let ctx = null;

  function getContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  // Initialize AudioContext on first user interaction (browser autoplay policy)
  function init() {
    getContext();
  }

  /**
   * Water drop "tok" sound - Bloom → Pour transition
   * High frequency with quick decay + slight detuning for liquid feel
   */
  function playWaterDrop() {
    const c = getContext();
    const now = c.currentTime;

    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const gain = c.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1800, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1600, now);
    osc2.frequency.exponentialRampToValueAtTime(350, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(c.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }

  /**
   * Wood knock sound - Pour → Wait transition
   * Noise burst through bandpass filter for woodblock texture
   */
  function playWoodKnock() {
    const c = getContext();
    const now = c.currentTime;
    const duration = 0.08;

    // Create noise buffer
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }

    const noise = c.createBufferSource();
    noise.buffer = buffer;

    const bandpass = c.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 820;
    bandpass.Q.value = 8;

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(c.destination);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  /**
   * Soft ping - Wait → Pour transition
   * Single sine wave, very short and minimal
   */
  function playSoftPing() {
    const c = getContext();
    const now = c.currentTime;

    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1047; // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Rising melody - Timer start / Bloom start
   * 3-note ascending melody (C→E→G)
   */
  function playStartMelody() {
    const c = getContext();
    const now = c.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5
    const noteLength = 0.12;
    const gap = 0.14;

    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startAt = now + i * gap;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.2, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + noteLength);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(startAt);
      osc.stop(startAt + noteLength + 0.05);
    });
  }

  /**
   * Play the appropriate sound for a phase transition
   * @param {string} from - Previous phase ('start', 'bloom', 'pour', 'wait')
   * @param {string} to - Next phase ('bloom', 'pour', 'wait')
   */
  function playTransition(from, to) {
    if (from === 'start') {
      playStartMelody();
    } else if (from === 'bloom' && to === 'pour') {
      playWaterDrop();
    } else if (from === 'pour' && to === 'wait') {
      playWoodKnock();
    } else if (from === 'wait' && to === 'pour') {
      playSoftPing();
    }
  }

  return { init, playTransition, playStartMelody, playWaterDrop, playWoodKnock, playSoftPing };
})();
