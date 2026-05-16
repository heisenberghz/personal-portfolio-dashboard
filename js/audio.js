export function setupAudio() {
  let ctx = null;
  let masterGain = null;
  let oscillators = [];
  let isPlaying = false;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    const layers = [
      { freq: 55, type: 'sine', gain: 0.12 },
      { freq: 82.5, type: 'sine', gain: 0.08 },
      { freq: 110, type: 'sine', gain: 0.06 },
      { freq: 165, type: 'sine', gain: 0.04 },
      { freq: 220, type: 'sine', gain: 0.02 },
      { freq: 55, type: 'triangle', gain: 0.03 },
    ];

    layers.forEach((layer) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = layer.type;
      osc.frequency.value = layer.freq;

      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 1;

      gain.gain.value = layer.gain;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();

      oscillators.push({ osc, gain, filter, baseFreq: layer.freq });
    });

    modulateOscillators();
  }

  function modulateOscillators() {
    if (!ctx || !isPlaying) return;

    oscillators.forEach((o, i) => {
      const drift = Math.sin(Date.now() * 0.0003 + i * 1.5) * 0.5;
      o.osc.frequency.setTargetAtTime(o.baseFreq + drift, ctx.currentTime, 0.5);
      o.filter.frequency.setTargetAtTime(300 + Math.sin(Date.now() * 0.0005 + i) * 150, ctx.currentTime, 0.3);
    });

    requestAnimationFrame(modulateOscillators);
  }

  function play() {
    init();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setTargetAtTime(0.6, ctx.currentTime, 0.8);
    isPlaying = true;
    modulateOscillators();
  }

  function stop() {
    if (!ctx) return;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    isPlaying = false;
  }

  function toggle() {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }

  return { play, stop, toggle, get isPlaying() { return isPlaying; } };
}
