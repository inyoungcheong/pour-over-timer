/**
 * Pour-over Coffee Timer - Main Application
 * Manages timer state, countdown, phase transitions, settings, and UI updates.
 */
const App = (() => {
  // --- State ---
  const state = {
    settings: { bloom: 40, pour: 5, wait: 10 },
    currentPhase: 'bloom', // 'bloom' | 'pour' | 'wait'
    secondsRemaining: 40,
    isRunning: false,
    isPaused: false,
    intervalId: null,
    phaseStartTime: null,
    phaseDuration: null,
  };

  // --- DOM Elements ---
  let els = {};

  function cacheDom() {
    els = {
      phaseName: document.getElementById('phaseName'),
      timerDigits: document.getElementById('timerDigits'),
      btnStart: document.getElementById('btnStart'),
      btnPause: document.getElementById('btnPause'),
      btnStop: document.getElementById('btnStop'),
      settingBloom: document.getElementById('settingBloom'),
      settingPour: document.getElementById('settingPour'),
      settingWait: document.getElementById('settingWait'),
      settings: document.getElementById('settings'),
    };
  }

  // --- Settings ---
  function loadSettings() {
    const saved = localStorage.getItem('pourover-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state.settings.bloom = clamp(parsed.bloom || 40, 1, 300);
        state.settings.pour = clamp(parsed.pour || 5, 1, 300);
        state.settings.wait = clamp(parsed.wait || 10, 1, 300);
      } catch (e) {
        // Use defaults
      }
    }
    // Reflect in inputs
    els.settingBloom.value = state.settings.bloom;
    els.settingPour.value = state.settings.pour;
    els.settingWait.value = state.settings.wait;
    // Update initial display
    state.secondsRemaining = state.settings.bloom;
    updateTimerDisplay();
  }

  function saveSettings() {
    localStorage.setItem('pourover-settings', JSON.stringify(state.settings));
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function handleSettingChange(phase, value) {
    const num = clamp(parseInt(value) || 1, 1, 300);
    state.settings[phase] = num;
    saveSettings();
    if (!state.isRunning) {
      state.secondsRemaining = state.settings[state.currentPhase];
      updateTimerDisplay();
    }
  }

  function setSettingsDisabled(disabled) {
    const inputs = els.settings.querySelectorAll('input');
    const btns = els.settings.querySelectorAll('.setting-btn');
    inputs.forEach(inp => inp.disabled = disabled);
    btns.forEach(btn => btn.disabled = disabled);
  }

  // --- Timer Logic ---
  function startTimer() {
    if (state.isRunning && !state.isPaused) return;

    // Initialize AudioContext on first interaction
    AudioManager.init();

    if (!state.isRunning) {
      // Fresh start
      state.currentPhase = 'bloom';
      state.secondsRemaining = state.settings.bloom;
      state.phaseDuration = state.settings.bloom;
      state.isRunning = true;
      state.isPaused = false;
      AudioManager.playTransition('start', 'bloom');
    } else if (state.isPaused) {
      // Resume from pause
      state.isPaused = false;
    }

    state.phaseStartTime = Date.now() - ((state.phaseDuration - state.secondsRemaining) * 1000);

    state.intervalId = setInterval(tick, 100); // Check every 100ms for accuracy

    updatePhaseDisplay();
    updateTimerDisplay();
    updateButtons();
    setSettingsDisabled(true);
  }

  function pauseTimer() {
    if (!state.isRunning || state.isPaused) return;

    state.isPaused = true;
    clearInterval(state.intervalId);
    state.intervalId = null;

    updateButtons();
  }

  function stopTimer() {
    state.isRunning = false;
    state.isPaused = false;
    clearInterval(state.intervalId);
    state.intervalId = null;

    state.currentPhase = 'bloom';
    state.secondsRemaining = state.settings.bloom;

    updatePhaseDisplay();
    updateTimerDisplay();
    updateButtons();
    setSettingsDisabled(false);
  }

  function tick() {
    if (state.isPaused) return;

    const elapsed = (Date.now() - state.phaseStartTime) / 1000;
    state.secondsRemaining = Math.max(0, state.phaseDuration - elapsed);

    if (state.secondsRemaining <= 0) {
      advancePhase();
    }

    updateTimerDisplay();
  }

  function advancePhase() {
    const prevPhase = state.currentPhase;
    let nextPhase;

    if (state.currentPhase === 'bloom') {
      nextPhase = 'pour';
    } else if (state.currentPhase === 'pour') {
      nextPhase = 'wait';
    } else {
      nextPhase = 'pour';
    }

    // Play transition sound
    AudioManager.playTransition(prevPhase, nextPhase);

    state.currentPhase = nextPhase;
    state.phaseDuration = state.settings[nextPhase];
    state.secondsRemaining = state.phaseDuration;
    state.phaseStartTime = Date.now();

    updatePhaseDisplay();
  }

  // --- Display Updates ---
  function updateTimerDisplay() {
    const total = Math.ceil(state.secondsRemaining);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    els.timerDigits.textContent =
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function updatePhaseDisplay() {
    const names = { bloom: 'Bloom', pour: 'Pour', wait: 'Wait' };
    els.phaseName.textContent = names[state.currentPhase];
    els.phaseName.setAttribute('data-phase', state.currentPhase);

    // Trigger animation
    els.phaseName.classList.remove('transitioning');
    // Force reflow
    void els.phaseName.offsetWidth;
    els.phaseName.classList.add('transitioning');
  }

  function updateButtons() {
    if (!state.isRunning) {
      els.btnStart.textContent = 'Start';
      els.btnStart.disabled = false;
      els.btnPause.disabled = true;
      els.btnPause.textContent = 'Pause';
      els.btnStop.disabled = true;
    } else if (state.isPaused) {
      els.btnStart.textContent = 'Resume';
      els.btnStart.disabled = false;
      els.btnPause.disabled = true;
      els.btnStop.disabled = false;
    } else {
      els.btnStart.disabled = true;
      els.btnPause.disabled = false;
      els.btnPause.textContent = 'Pause';
      els.btnStop.disabled = false;
    }
  }

  // --- Event Binding ---
  function bindEvents() {
    els.btnStart.addEventListener('click', startTimer);
    els.btnPause.addEventListener('click', pauseTimer);
    els.btnStop.addEventListener('click', stopTimer);

    // Settings inputs
    ['bloom', 'pour', 'wait'].forEach(phase => {
      const input = els[`setting${phase.charAt(0).toUpperCase() + phase.slice(1)}`];
      input.addEventListener('change', () => {
        input.value = clamp(parseInt(input.value) || 1, 1, 300);
        handleSettingChange(phase, input.value);
      });
    });

    // +/- buttons
    document.querySelectorAll('.setting-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target || target.disabled) return;
        const phase = target.id.replace('setting', '').toLowerCase();
        let val = parseInt(target.value) || 1;
        if (btn.classList.contains('setting-btn--plus')) {
          val = Math.min(300, val + 1);
        } else {
          val = Math.max(1, val - 1);
        }
        target.value = val;
        handleSettingChange(phase, val);
      });
    });
  }

  // --- Initialize ---
  function init() {
    cacheDom();
    loadSettings();
    bindEvents();
    updatePhaseDisplay();
    updateButtons();
    loadSVGIllustration();
  }

  // --- Load SVG Illustration ---
  function loadSVGIllustration() {
    const container = document.getElementById('coffeeIllustration');
    if (!container) return;

    fetch('assets/slow.svg')
      .then(res => res.text())
      .then(svg => {
        container.innerHTML = svg;
      })
      .catch(() => {
        // SVG load failed, leave empty
      });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { state };
})();
