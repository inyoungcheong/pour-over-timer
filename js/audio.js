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
   * Play a clear ping sound at the given frequency
   */
  function playPing(freq, volume) {
    const c = getContext();
    const now = c.currentTime;
    const v = volume || 0.35;

    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(v, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(now);
    osc.stop(now + 0.3);
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
    } else if (from === 'bloom' && to === 'pour') {
      playPing(880);   // A5 - bloom ends
    } else if (from === 'pour' && to === 'wait') {
      playPing(660);   // E5 - pour ends
    } else if (from === 'wait' && to === 'pour') {
      playPing(784);   // G5 - wait ends
    }
  }

  return { init, playTransition };
})();
