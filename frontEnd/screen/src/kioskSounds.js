/** Short success / error beeps via Web Audio (no asset files). */
function playTone({ frequency, durationMs, type = 'sine', gain = 0.08 }) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.stop(now + durationMs / 1000 + 0.02);
    setTimeout(() => ctx.close().catch(() => {}), durationMs + 100);
  } catch {
    // Audio optional — ignore failures (autoplay policies, etc.)
  }
}

export function playSuccessSound() {
  playTone({ frequency: 880, durationMs: 120 });
  setTimeout(() => playTone({ frequency: 1175, durationMs: 140 }), 110);
}

export function playErrorSound() {
  playTone({ frequency: 220, durationMs: 220, type: 'square', gain: 0.05 });
}
