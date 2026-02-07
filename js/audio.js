/**
 * Audio module - generates notification sounds for phase transitions
 * using Web Audio API. Unified sound style: clear, audible pings.
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

  function init() {
    getContext();
  }

  /**
   * Singing bowl — two slightly detuned sines that create a warm shimmer.
   * Used when pour phase begins (water hitting the grounds).
   */
  function playBowl() {
    const c = getContext();
    const now = c.currentTime;
    const base = 528;     // C5-ish, warm
    const detune = 2;     // slight beat frequency for shimmer

    [base, base + detune].forEach(freq => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    });
  }

  /**
   * Wood knock — short, muted triangle-wave tap.
   * Used when wait phase begins (put the kettle down, be still).
   */
  function playKnock() {
    const c = getContext();
    const now = c.currentTime;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 280;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Rising melody - Timer start / Bloom start
   * 3-note ascending melody (C→E→G), clear and audible
   */
  function playStartMelody() {
    const c = getContext();
    const now = c.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5
    const gap = 0.15;

    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startAt = now + i * gap;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.3, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.2);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(startAt);
      osc.stop(startAt + 0.25);
    });
  }

  /**
   * Play the appropriate sound for a phase transition
   */
  function playTransition(from, to) {
    if (from === 'start') {
      playStartMelody();
    } else if (to === 'pour') {
      playBowl();    // singing bowl shimmer — pour begins
    } else if (to === 'wait') {
      playKnock();   // wood knock — wait begins
    }
  }

  return { init, playTransition };
})();
