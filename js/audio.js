// Sonido 100% procedural con Web Audio: ambiente, latidos, pasos, puertas,
// susurros posicionales de las apariciones y sustos.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.hbT = 0;
    this.tickT = 0;
    this.crackT = 0;
    this.dripT = 3;
    this.level = 1;
  }

  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 5;
    this.master.connect(comp).connect(ctx.destination);

    this.revIn = ctx.createGain();
    const rev = ctx.createConvolver();
    rev.buffer = this.impulse(3.4, 2.4);
    const revOut = ctx.createGain();
    revOut.gain.value = 0.55;
    this.revIn.connect(rev).connect(revOut).connect(this.master);

    this.noiseBuf = this.makeNoise(3);
    this.brownBuf = this.makeBrown(4);
    this.startAmbience();
    this.ready = true;
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  // ------------------------------------------------------------ utilidades
  impulse(sec, decay) {
    const ctx = this.ctx, rate = ctx.sampleRate, len = Math.floor(rate * sec);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  makeNoise(sec) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  makeBrown(sec) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }
  get now() { return this.ctx.currentTime; }
  gain(v = 0) { const g = this.ctx.createGain(); g.gain.value = v; return g; }
  osc(type, f) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; }
  filt(type, f, Q = 1) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = Q; return b; }
  noise(brown = false) {
    const s = this.ctx.createBufferSource();
    s.buffer = brown ? this.brownBuf : this.noiseBuf;
    s.loop = true;
    return s;
  }
  env(g, t, a, peak, d) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  // salida estéreo con reverberación opcional
  out(pan = 0, rev = 0.3, vol = 1) {
    const g = this.gain(vol);
    let last = g;
    if (pan) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p);
      last = p;
    }
    last.connect(this.master);
    if (rev > 0) { const s = this.gain(rev); last.connect(s); s.connect(this.revIn); }
    return g;
  }
  // salida posicional 3D
  at(pos, rev = 0.4, vol = 1, ref = 1.5) {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = ref;
    p.rolloffFactor = 1.4;
    p.maxDistance = 40;
    this.setPos(p, pos);
    const g = this.gain(vol);
    g.connect(p);
    p.connect(this.master);
    if (rev > 0) { const s = this.gain(rev); p.connect(s); s.connect(this.revIn); }
    return g;
  }
  setPos(p, pos) {
    if (p.positionX) {
      p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z;
    } else p.setPosition(pos.x, pos.y, pos.z);
  }
  setListener(pos, fwd) {
    if (!this.ready) return;
    const l = this.ctx.listener;
    if (l.positionX) {
      l.positionX.value = pos.x; l.positionY.value = pos.y; l.positionZ.value = pos.z;
      l.forwardX.value = fwd.x; l.forwardY.value = fwd.y; l.forwardZ.value = fwd.z;
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    } else {
      l.setPosition(pos.x, pos.y, pos.z);
      l.setOrientation(fwd.x, fwd.y, fwd.z, 0, 1, 0);
    }
  }
  burst(dest, t, dur, type, f, Q, peak, a = 0.005) {
    const n = this.noise();
    const fl = this.filt(type, f, Q);
    const g = this.gain();
    n.connect(fl).connect(g).connect(dest);
    this.env(g, t, a, peak, dur);
    n.start(t, Math.random() * 2);
    n.stop(t + a + dur + 0.05);
    return fl;
  }
  thump(dest, t, f0, f1, peak, dur) {
    const o = this.osc('sine', f0);
    const g = this.gain();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o.connect(g).connect(dest);
    this.env(g, t, 0.004, peak, dur);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // ------------------------------------------------------------ ambiente
  startAmbience() {
    const ctx = this.ctx;
    // dron grave
    const droneOut = this.out(0, 0.4, 0.0);
    this.droneGain = droneOut;
    const lp = this.filt('lowpass', 170, 3);
    lp.connect(droneOut);
    for (const [f, type] of [[41.2, 'sawtooth'], [41.7, 'sawtooth'], [61.8, 'triangle'], [82.1, 'sine']]) {
      const o = this.osc(type, f);
      const g = this.gain(type === 'sine' ? 0.5 : 0.35);
      o.connect(g).connect(lp);
      o.start();
    }
    const lfo = this.osc('sine', 0.05);
    const lfoG = this.gain(70);
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start();
    droneOut.gain.setTargetAtTime(0.16, this.now, 3);

    // viento
    const wind = this.noise(true);
    this.windF = this.filt('bandpass', 420, 0.8);
    this.windG = this.gain(0);
    wind.connect(this.windF).connect(this.windG).connect(this.out(0, 0.3, 1));
    wind.start();

    // capa de tensión (sube con el miedo)
    this.tensionG = this.gain(0);
    const tOut = this.out(0, 0.6, 1);
    this.tensionG.connect(tOut);
    for (const f of [1108, 1174, 1244]) {
      const o = this.osc('sine', f);
      const g = this.gain(0.33);
      const trem = this.osc('sine', 5 + Math.random() * 3);
      const tg = this.gain(0.25);
      trem.connect(tg).connect(g.gain);
      o.connect(g).connect(this.tensionG);
      o.start(); trem.start();
    }
    this.lowTension = this.gain(0);
    const lo = this.osc('sawtooth', 55);
    const lo2 = this.osc('sawtooth', 58.3);
    const lof = this.filt('lowpass', 240, 2);
    lo.connect(lof); lo2.connect(lof);
    lof.connect(this.lowTension).connect(this.out(0, 0.3, 1));
    lo.start(); lo2.start();

    // acúfeno con poca cordura
    this.tinG = this.gain(0);
    const tin = this.osc('sine', 4200);
    tin.connect(this.tinG).connect(this.out(0, 0, 1));
    tin.start();

    // fuego (volumen según distancia a la chimenea)
    const fire = this.noise(true);
    const ff = this.filt('lowpass', 500, 0.7);
    this.fireG = this.gain(0);
    fire.connect(ff).connect(this.fireG).connect(this.out(0, 0.2, 1));
    fire.start();

    // quemadura de la linterna sobre una aparición
    const bn = this.noise();
    const bf = this.filt('highpass', 2500, 0.7);
    this.burnNoiseG = this.gain(0);
    bn.connect(bf).connect(this.burnNoiseG).connect(this.out(0, 0.3, 1));
    bn.start();
    this.burnOsc = this.osc('sawtooth', 300);
    const bof = this.filt('bandpass', 1200, 3);
    this.burnOscG = this.gain(0);
    const vib = this.osc('sine', 9);
    const vibG = this.gain(18);
    vib.connect(vibG).connect(this.burnOsc.frequency);
    this.burnOsc.connect(bof).connect(this.burnOscG).connect(this.out(0, 0.5, 1));
    this.burnOsc.start(); vib.start();
  }

  setLevel(L) {
    if (!this.ready) return;
    this.level = L;
    const t = this.now;
    const windVol = [0.05, 0.09, 0.12, 0.22][L];
    this.windG.gain.setTargetAtTime(windVol, t, 1.5);
  }

  update(dt, s) {
    if (!this.ready) return;
    const t = this.now;
    // viento que respira
    if (Math.random() < dt * 0.5) this.windF.frequency.setTargetAtTime(250 + Math.random() * 600, t, 1.2);

    // miedo
    this.tensionG.gain.setTargetAtTime(Math.pow(s.fear, 2) * 0.05, t, 0.3);
    this.lowTension.gain.setTargetAtTime(s.fear * 0.08, t, 0.4);
    this.tinG.gain.setTargetAtTime(s.sanity < 0.35 ? (0.35 - s.sanity) * 0.03 : 0, t, 0.5);

    // latido
    this.hbT -= dt;
    const hbStrength = Math.max(s.fear, (1 - s.sanity) * 0.6);
    if (this.hbT <= 0 && hbStrength > 0.12) {
      this.hbT = 1.15 - hbStrength * 0.7;
      const d = this.out(0, 0, 0.9);
      this.thump(d, t, 62, 38, 0.35 + hbStrength * 0.65, 0.16);
      this.thump(d, t + 0.19, 55, 34, (0.35 + hbStrength * 0.65) * 0.7, 0.16);
    }

    // fuego
    this.fireG.gain.setTargetAtTime(s.fireVol * 0.35, t, 0.3);
    this.crackT -= dt;
    if (s.fireVol > 0.05 && this.crackT <= 0) {
      this.crackT = 0.04 + Math.random() * 0.25;
      this.burst(this.out((Math.random() - 0.5) * 0.4, 0.1, s.fireVol), t, 0.02 + Math.random() * 0.03, 'highpass', 1500 + Math.random() * 3000, 1, 0.5);
    }

    // reloj
    this.tickT -= dt;
    if (this.tickT <= 0) {
      this.tickT += 1;
      if (s.clockVol > 0.02) {
        this.burst(this.out(0, 0.3, s.clockVol), t, 0.025, 'bandpass', 3200, 6, 0.8);
      }
    }

    // goteo en el sótano
    if (this.level === 0) {
      this.dripT -= dt;
      if (this.dripT <= 0) {
        this.dripT = 0.8 + Math.random() * 3;
        const o = this.osc('sine', 1400 + Math.random() * 900);
        const g = this.gain();
        o.frequency.exponentialRampToValueAtTime(700, t + 0.08);
        o.connect(g).connect(this.out((Math.random() - 0.5) * 1.6, 0.9, 0.12));
        this.env(g, t, 0.002, 0.5, 0.08);
        o.start(t); o.stop(t + 0.15);
      }
    }

    // quemadura
    this.burnNoiseG.gain.setTargetAtTime(s.burn * 0.06, t, 0.1);
    this.burnOscG.gain.setTargetAtTime(s.burn * s.burn * 0.05, t, 0.1);
    this.burnOsc.frequency.setTargetAtTime(260 + s.burn * 900, t, 0.2);
  }

  // ------------------------------------------------------------ efectos
  footstep(surface, run) {
    if (!this.ready) return;
    const t = this.now;
    const d = this.out((Math.random() - 0.5) * 0.25, surface === 'stone' ? 0.35 : 0.12, run ? 0.55 : 0.38);
    const f = surface === 'stone' ? 1700 : surface === 'attic' ? 650 : 950;
    this.burst(d, t, 0.07, 'bandpass', f * (0.85 + Math.random() * 0.3), 1.3, 0.7);
    this.thump(d, t, 95 + Math.random() * 20, 45, 0.5, 0.09);
    if (surface !== 'stone' && Math.random() < (surface === 'attic' ? 0.25 : 0.1)) this.creak(0.12 + Math.random() * 0.1);
  }

  creak(vol = 0.2, pan = 0, dur = 0) {
    if (!this.ready) return;
    const t = this.now;
    const base = 110 + Math.random() * 90;
    const o = this.osc('sawtooth', base);
    const f = this.filt('bandpass', 700 + Math.random() * 900, 9);
    const g = this.gain();
    o.connect(f).connect(g).connect(this.out(pan, 0.35, vol));
    const len = dur || 0.35 + Math.random() * 0.6;
    for (let k = 1; k <= 8; k++) o.frequency.linearRampToValueAtTime(base * (0.8 + Math.random() * 0.5), t + (len * k) / 8);
    this.env(g, t, 0.05, 0.6, len);
    o.start(t); o.stop(t + len + 0.1);
  }

  doorOpen(pos) {
    if (!this.ready) return;
    const t = this.now;
    const d = this.at(pos, 0.5, 0.9);
    this.burst(d, t, 0.03, 'highpass', 2500, 1, 0.5);
    const base = 95 + Math.random() * 40;
    for (const mult of [1, 2.02]) {
      const o = this.osc('sawtooth', base * mult);
      const f = this.filt('bandpass', 900 * mult, 7);
      const g = this.gain();
      o.connect(f).connect(g).connect(d);
      const len = 1.1 + Math.random() * 0.4;
      for (let k = 1; k <= 10; k++) o.frequency.linearRampToValueAtTime(base * mult * (0.75 + Math.random() * 0.8), t + 0.08 + (len * k) / 10);
      this.env(g, t + 0.06, 0.1, mult === 1 ? 0.45 : 0.2, len);
      o.start(t); o.stop(t + len + 0.3);
    }
  }

  doorClose(pos) {
    if (!this.ready) return;
    const t = this.now;
    const d = this.at(pos, 0.5, 0.9);
    this.creak(0.12, 0, 0.5);
    this.thump(d, t + 0.55, 90, 45, 0.7, 0.18);
    this.burst(d, t + 0.55, 0.08, 'lowpass', 900, 1, 0.5);
    this.burst(d, t + 0.62, 0.02, 'highpass', 3000, 1, 0.35);
  }

  doorSlam(pos) {
    if (!this.ready) return;
    const t = this.now;
    const d = this.at(pos, 1.2, 1.6, 3);
    this.thump(d, t, 80, 30, 1.0, 0.35);
    this.burst(d, t, 0.3, 'lowpass', 700, 1, 1.0);
    this.burst(d, t + 0.02, 0.05, 'highpass', 2000, 1, 0.5);
  }

  locked() {
    if (!this.ready) return;
    const t = this.now;
    const d = this.out(0, 0.4, 0.8);
    for (let k = 0; k < 4; k++) this.burst(d, t + k * 0.08, 0.025, 'bandpass', 2200 + Math.random() * 800, 4, 0.7);
    this.thump(d, t + 0.35, 110, 60, 0.5, 0.12);
  }

  stinger() {
    if (!this.ready) return;
    const t = this.now;
    const d = this.out(0, 0.9, 0.5);
    for (const f of [587, 622, 659, 1244, 1318]) {
      const o = this.osc('sawtooth', f);
      const fl = this.filt('highpass', 400, 0.7);
      const g = this.gain();
      o.frequency.linearRampToValueAtTime(f * 1.03, t + 1.6);
      o.connect(fl).connect(g).connect(d);
      this.env(g, t, 0.015, 0.16, 1.8);
      o.start(t); o.stop(t + 2);
    }
    this.burst(d, t, 0.6, 'bandpass', 3500, 2, 0.4);
    this.thump(this.out(0, 0.4, 1), t, 70, 28, 1, 0.8);
  }

  scare() {
    if (!this.ready) return;
    const t = this.now;
    const d = this.out(0, 0.8, 1.1);
    const shaper = this.ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 512) - 1; curve[i] = Math.tanh(x * 6); }
    shaper.curve = curve;
    shaper.connect(d);
    for (const f of [620, 655, 910]) {
      const o = this.osc('sawtooth', f);
      const g = this.gain();
      o.frequency.exponentialRampToValueAtTime(f * 0.35, t + 1.3);
      const vib = this.osc('sine', 11);
      const vg = this.gain(25);
      vib.connect(vg).connect(o.frequency);
      o.connect(g).connect(shaper);
      this.env(g, t, 0.01, 0.35, 1.3);
      o.start(t); vib.start(t); o.stop(t + 1.5); vib.stop(t + 1.5);
    }
    this.burst(d, t, 0.9, 'bandpass', 1800, 0.8, 0.9);
    this.thump(this.out(0, 0.3, 1.2), t, 60, 25, 1, 0.6);
  }

  ghostWake(pos) {
    if (!this.ready) return;
    const t = this.now;
    const d = this.at(pos, 0.7, 1.2);
    const f = this.burst(d, t, 1.0, 'bandpass', 500, 5, 0.6, 0.5);
    f.frequency.exponentialRampToValueAtTime(1800, t + 1.3);
  }

  ghostDie(pos) {
    if (!this.ready) return;
    const t = this.now;
    const d = this.at(pos, 1.0, 1.4, 3);
    for (const [f, k] of [[880, 1], [1320, 0.5], [660, 0.7]]) {
      const o = this.osc('sawtooth', f);
      const fl = this.filt('bandpass', f * 1.5, 2);
      const g = this.gain();
      o.frequency.exponentialRampToValueAtTime(f * 0.09, t + 2.4);
      fl.frequency.exponentialRampToValueAtTime(200, t + 2.4);
      const vib = this.osc('sine', 7);
      const vg = this.gain(f * 0.04);
      vib.connect(vg).connect(o.frequency);
      o.connect(fl).connect(g).connect(d);
      this.env(g, t, 0.05, 0.4 * k, 2.4);
      o.start(t); vib.start(t); o.stop(t + 2.6); vib.stop(t + 2.6);
    }
    const w = this.burst(d, t, 2.2, 'bandpass', 3000, 1.5, 0.5, 0.3);
    w.frequency.exponentialRampToValueAtTime(300, t + 2.4);
  }

  thunder(delay = 0.8, vol = 1) {
    if (!this.ready) return;
    const t = this.now + delay;
    const d = this.out((Math.random() - 0.5) * 0.6, 0.6, vol);
    const n = this.noise(true);
    const f = this.filt('lowpass', 900, 0.8);
    const g = this.gain();
    n.connect(f).connect(g).connect(d);
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(90, t + 3.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.2, t + 0.08);
    g.gain.setTargetAtTime(0.5, t + 0.3, 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
    n.start(t); n.stop(t + 4.6);
  }

  piano(pos) {
    if (!this.ready) return;
    const t = this.now;
    const d = pos ? this.at(pos, 1.0, 1.5, 3) : this.out((Math.random() - 0.5), 1.0, 0.4);
    const roots = [110, 116.5, 98, 130.8, 92.5];
    const r = roots[Math.floor(Math.random() * roots.length)];
    const notes = Math.random() < 0.5 ? [r] : [r, r * 1.0595];
    notes.forEach((f, k) => {
      for (const [h, a] of [[1, 0.5], [2, 0.22], [3, 0.12], [4.02, 0.06]]) {
        const o = this.osc('sine', f * h);
        const g = this.gain();
        o.connect(g).connect(d);
        this.env(g, t + k * 0.02, 0.005, a, 3.5 / h);
        o.start(t); o.stop(t + 4);
      }
    });
  }

  knock(pan) {
    if (!this.ready) return;
    const t = this.now;
    const d = this.out(pan, 0.7, 0.8);
    const n = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const tt = t + k * (0.28 + Math.random() * 0.1);
      this.thump(d, tt, 140, 70, 0.8, 0.12);
      this.burst(d, tt, 0.05, 'lowpass', 600, 1, 0.5);
    }
  }

  stepsAbove() {
    if (!this.ready) return;
    const t = this.now;
    const pan = (Math.random() - 0.5) * 1.2;
    const n = 4 + Math.floor(Math.random() * 4);
    for (let k = 0; k < n; k++) {
      const d = this.out(pan + k * 0.08, 0.5, 0.5 * (1 - k / (n + 2)));
      this.thump(d, t + k * 0.62, 70, 40, 0.8, 0.15);
      this.burst(d, t + k * 0.62, 0.06, 'lowpass', 300, 1, 0.5);
    }
  }

  whisperEar(pan) {
    if (!this.ready) return;
    const t = this.now;
    const d = this.out(pan, 0.15, 0.55);
    const n = this.noise();
    const f = this.filt('bandpass', 2200, 3.5);
    const g = this.gain(0);
    n.connect(f).connect(g).connect(d);
    let tt = t;
    for (let k = 0; k < 9; k++) {
      const len = 0.06 + Math.random() * 0.12;
      g.gain.setTargetAtTime(Math.random() < 0.25 ? 0 : 0.3 + Math.random() * 0.5, tt, 0.02);
      f.frequency.setTargetAtTime(1300 + Math.random() * 2600, tt, 0.03);
      tt += len;
    }
    g.gain.setTargetAtTime(0, tt, 0.05);
    n.start(t); n.stop(tt + 0.4);
  }

  scrape() {
    if (!this.ready) return;
    const t = this.now;
    const d = this.out((Math.random() - 0.5) * 1.4, 0.8, 0.5);
    const f = this.burst(d, t, 1.4, 'bandpass', 300, 4, 0.7, 0.3);
    f.frequency.linearRampToValueAtTime(700, t + 1.5);
  }

  // voz posicional de cada aparición: susurros y un gemido ocasional
  createVoice() {
    const eng = this;
    if (!this.ready) {
      return { set() {}, update() {}, stop() {} };
    }
    const ctx = this.ctx;
    const p = ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 1.3;
    p.rolloffFactor = 1.5;
    p.maxDistance = 40;
    const out = this.gain(0);
    out.connect(p);
    p.connect(this.master);
    const rs = this.gain(0.6);
    p.connect(rs); rs.connect(this.revIn);

    const n = this.noise();
    n.playbackRate.value = 0.7 + Math.random() * 0.5;
    const bp = this.filt('bandpass', 1500, 4);
    const wg = this.gain(0);
    n.connect(bp).connect(wg).connect(out);
    n.start(0, Math.random() * 2);

    const o = this.osc('triangle', 150 + Math.random() * 60);
    const vib = this.osc('sine', 4 + Math.random() * 2);
    const vg = this.gain(5);
    vib.connect(vg).connect(o.frequency);
    const of = this.filt('lowpass', 700, 1);
    const og = this.gain(0);
    o.connect(of).connect(og).connect(out);
    o.start(); vib.start();

    const v = {
      active: false, moving: false, burn: 0, dormant: true, t: 0, moanT: 3 + Math.random() * 6,
      set(active, moving, burn, dormant = false) {
        this.active = active; this.moving = moving; this.burn = burn; this.dormant = dormant;
      },
      update(dt, pos) {
        const now = eng.now;
        eng.setPos(p, pos);
        const vol = this.active ? (this.dormant ? 0.25 : this.moving ? 1 : 0.55) : 0;
        out.gain.setTargetAtTime(vol, now, 0.25);
        this.t -= dt;
        if (this.t <= 0) {
          this.t = 0.07 + Math.random() * 0.22;
          const talk = Math.random() < 0.3 ? 0 : (0.12 + Math.random() * 0.3) * (this.moving ? 1 : 0.5);
          wg.gain.setTargetAtTime(talk, now, 0.03);
          bp.frequency.setTargetAtTime(700 + Math.random() * 2500, now, 0.04);
        }
        this.moanT -= dt;
        if (this.moanT <= 0 && !this.dormant) {
          this.moanT = 4 + Math.random() * 8;
          const base = 130 + Math.random() * 90;
          o.frequency.setValueAtTime(base, now);
          o.frequency.linearRampToValueAtTime(base * (0.7 + Math.random() * 0.2), now + 2);
          og.gain.cancelScheduledValues(now);
          og.gain.setValueAtTime(og.gain.value, now);
          og.gain.linearRampToValueAtTime(0.12, now + 0.6);
          og.gain.linearRampToValueAtTime(0, now + 2.2);
        }
      },
      stop() {
        const now = eng.now;
        out.gain.setTargetAtTime(0, now, 0.2);
        n.stop(now + 1); o.stop(now + 1); vib.stop(now + 1);
      },
    };
    return v;
  }
}
