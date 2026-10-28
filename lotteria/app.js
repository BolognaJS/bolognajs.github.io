/* =====================================================================
   Lotteria Bologna JS — JS vanilla, zero dipendenze
   - ruota su canvas con estrazione crypto-random
   - jingle/tick/fanfara sintetizzati con Web Audio (nessun file audio)
   - dettatura nomi con Web Speech API (it-IT)
   - recap persistente in localStorage, pronto da copiare in chat
   ===================================================================== */
   (() => {
    "use strict";
  
    const TAU = Math.PI * 2;
    const STORE_KEY = "bjs-lotteria-v1";
    const REDUCED =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Palette pastello coerente col tema: caldi (gialli, pesca, rosa, crema)
       alternati ad accenti freddi (menta, acqua, lilla). Tutte abbastanza
       chiare da reggere l'inchiostro scuro, anche sugli spicchi sottili. */
    const SLICE_COLORS = [
      { bg: "#ffe9a3", fg: "#2a1c10" },
      { bg: "#ffc7b0", fg: "#2a1c10" },
      { bg: "#f7f1d8", fg: "#2a1c10" },
      { bg: "#ffb6c8", fg: "#2a1c10" },
      { bg: "#cfe8c7", fg: "#2a1c10" },
      { bg: "#bfe3ea", fg: "#2a1c10" },
      { bg: "#d2cdf3", fg: "#2a1c10" },
      { bg: "#f2d6e6", fg: "#2a1c10" },
    ];
    /* Con pochi nomi la ruota sarebbe fatta di fette enormi: si duplicano
       i nomi fino ad avere almeno questo numero di spicchi. */
    const MIN_SLICES = 12;
    const DEMO_NAMES = [
      "Ada Lovelace",
      "Alan Turing",
      "Grace Hopper",
      "Giorgio Aquino",
      "Francesco Bedussi",
      "Marco Patierno",
      "Valerio Innocenti Sedili",
      "Sara Vieira",
      "Dan Abramov",
      "Evan You",
      "Rich Harris",
      "Giulia Bianchi",
    ];
  
    /* ------------------------------------------------------------------ */
    /* utils                                                              */
    /* ------------------------------------------------------------------ */
  
    const $ = (sel) => document.querySelector(sel);
    const mod = (n, m) => ((n % m) + m) % m;
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  
    function uid() {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
      }
      return "w_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }
  
    function randomInt(max) {
      if (max <= 1) return 0;
      const c = window.crypto || window.msCrypto;
      if (c && typeof c.getRandomValues === "function") {
        const range = 0x100000000;
        const limit = Math.floor(range / max) * max;
        const buf = new Uint32Array(1);
        let value;
        do {
          c.getRandomValues(buf);
          value = buf[0];
        } while (value >= limit);
        return value % max;
      }
      return Math.floor(Math.random() * max);
    }
  
    function parseNames(text) {
      const seen = new Set();
      const out = [];
      String(text || "")
        .split(/\r?\n/)
        .forEach((line) => {
          const name = line.replace(/\s+/g, " ").trim().slice(0, 64);
          if (!name) return;
          const key = name.toLocaleLowerCase("it");
          if (seen.has(key)) return;
          seen.add(key);
          out.push(name);
        });
      return out;
    }
  
    function capitalize(text) {
      return text
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[.!,;:]+$/, "")
        .replace(/(^|[\s'’\-])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase("it"));
    }
  
    const timeFmt = new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  
    function formatTime(iso) {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? "" : timeFmt.format(d);
    }
  
    let toastTimer = 0;
    function toast(message) {
      if (!el.toast) return;
      el.toast.textContent = message;
      el.toast.classList.add("is-visible");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        el.toast.classList.remove("is-visible");
      }, 2800);
    }
  
    /* ------------------------------------------------------------------ */
    /* elements                                                           */
    /* ------------------------------------------------------------------ */
  
    const el = {};
    [
      "screenSetup",
      "screenWheel",
      "namesForm",
      "namesInput",
      "nameCount",
      "micBtn",
      "micLabel",
      "micStatus",
      "demoBtn",
      "wheel",
      "spinBtn",
      "editBtn",
      "poolMeta",
      "resultBanner",
      "resultName",
      "winnersList",
      "winnersCount",
      "winnersEmpty",
      "copyWinners",
      "clearWinners",
      "removeToggle",
      "soundToggle",
      "soundLabel",
      "openRecap",
      "recapCount",
      "recapDialog",
      "recapList",
      "recapEmpty",
      "recapCopy",
      "recapClear",
      "toast",
      "confetti",
    ].forEach((id) => {
      el[id] = document.getElementById(id);
    });
  
    /* ------------------------------------------------------------------ */
    /* state persistence                                                  */
    /* ------------------------------------------------------------------ */
  
    function defaultState() {
      return { participants: [], winners: [], muted: false, removeWinners: true };
    }
  
    function loadState() {
      const base = defaultState();
      try {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (!raw) return base;
        const data = JSON.parse(raw);
        if (!data || typeof data !== "object") return base;
        const participants = Array.isArray(data.participants) ? data.participants : [];
        const winners = Array.isArray(data.winners) ? data.winners : [];
        return {
          participants: participants
            .filter((n) => typeof n === "string" && n.trim())
            .map((n) => n.trim())
            .slice(0, 2000),
          winners: winners
            .filter((w) => w && typeof w.name === "string" && w.name.trim())
            .map((w) => ({
              id: typeof w.id === "string" ? w.id : uid(),
              name: w.name.trim(),
              at: typeof w.at === "string" ? w.at : new Date().toISOString(),
            })),
          muted: data.muted === true,
          removeWinners: data.removeWinners !== false,
        };
      } catch (error) {
        return base;
      }
    }
  
    let storageWarned = false;
    function saveState() {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch (error) {
        if (!storageWarned) {
          storageWarned = true;
          toast("Salvataggio locale non disponibile: il recap resta solo in questa sessione.");
        }
      }
    }
  
    const state = loadState();
  
    /* ------------------------------------------------------------------ */
    /* audio: jingle sintetizzato in stile gioco a premi                  */
    /* ------------------------------------------------------------------ */
  
    class SoundKit {
      constructor() {
        this.ctx = null;
        this.master = null;
        this.muted = false;
        this.noise = null;
      }
  
      ensure() {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        if (!this.ctx) {
          try {
            this.ctx = new Ctx();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.muted ? 0 : 0.42;
            this.master.connect(this.ctx.destination);
          } catch (error) {
            this.ctx = null;
            return null;
          }
        }
        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        return this.ctx;
      }
  
      setMuted(muted) {
        this.muted = muted;
        if (this.ctx && this.master) {
          this.master.gain.setTargetAtTime(
            muted ? 0 : 0.42,
            this.ctx.currentTime,
            0.02
          );
        }
      }
  
      tone(freq, when, dur, opts = {}) {
        const ctx = this.ctx;
        if (!ctx) return;
        const {
          type = "square",
          gain = 0.08,
          filter = 0,
          attack = 0.01,
          slideTo = 0,
        } = opts;
        const osc = ctx.createOscillator();
        const vca = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(20, freq), when);
        if (slideTo) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), when + dur);
        }
        let out = osc;
        if (filter) {
          const lp = ctx.createBiquadFilter();
          lp.type = "lowpass";
          lp.frequency.value = filter;
          osc.connect(lp);
          out = lp;
        }
        out.connect(vca);
        vca.connect(this.master);
        const peak = Math.max(0.0003, gain);
        const end = when + Math.max(0.03, dur);
        vca.gain.setValueAtTime(0.0001, when);
        vca.gain.exponentialRampToValueAtTime(peak, when + attack);
        vca.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.start(when);
        osc.stop(end + 0.06);
      }
  
      noiseBuffer() {
        if (this.noise) return this.noise;
        const rate = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, Math.floor(rate * 2), rate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noise = buffer;
        return buffer;
      }
  
      noiseHit(when, dur, gain, type, freq, q = 0.9) {
        const ctx = this.ctx;
        if (!ctx) return;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer();
        const flt = ctx.createBiquadFilter();
        flt.type = type;
        flt.frequency.value = freq;
        flt.Q.value = q;
        const vca = ctx.createGain();
        vca.gain.setValueAtTime(Math.max(0.0002, gain), when);
        vca.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        src.connect(flt);
        flt.connect(vca);
        vca.connect(this.master);
        src.start(when, Math.random() * 1.2);
        src.stop(when + dur + 0.03);
      }
  
      tick() {
        const ctx = this.ensure();
        if (!ctx) return;
        this.tone(1150 + Math.random() * 380, ctx.currentTime, 0.026, {
          type: "square",
          gain: 0.05,
          filter: 6500,
          attack: 0.002,
        });
      }
  
      buzz() {
        const ctx = this.ensure();
        if (!ctx) return;
        const t = ctx.currentTime;
        this.tone(140, t, 0.18, { type: "sawtooth", gain: 0.09, filter: 800 });
        this.tone(110, t + 0.16, 0.22, { type: "sawtooth", gain: 0.09, filter: 700 });
      }
  
      /** Jingle originale in stile "gioco a premi": 5 battute, ~6,2s. */
      jingle() {
        const ctx = this.ensure();
        if (!ctx) return;
        const t0 = ctx.currentTime + 0.08;
        const beat = 0.32;
        const note = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  
        const melody = [
          [76, 0.5], [79, 0.5], [84, 1], [83, 0.5], [79, 0.5], [76, 1],
          [81, 0.5], [84, 0.5], [83, 0.5], [79, 0.5], [77, 0.5], [76, 0.5], [74, 1],
          [77, 0.5], [81, 0.5], [84, 1], [83, 0.5], [79, 0.5], [76, 1],
          [74, 0.5], [76, 0.5], [79, 0.5], [81, 0.5], [84, 2],
          [83, 0.5], [79, 0.5], [76, 0.5], [79, 0.5], [84, 1.5],
        ];
  
        let t = t0;
        for (const [midi, beats] of melody) {
          this.tone(note(midi), t, Math.min(0.9, beats * beat * 0.86), {
            type: "square",
            gain: 0.075,
            filter: 2900,
            attack: 0.008,
          });
          if (beats >= 1) {
            this.tone(note(midi + 12), t, 0.1, { type: "triangle", gain: 0.018 });
          }
          t += beats * beat;
        }
  
        const bars = [
          [48, 4],
          [45, 4],
          [41, 4],
          [43, 4],
          [48, 3.5],
        ];
        let bt = t0;
        for (const [root, beats] of bars) {
          for (let b = 0; b < beats; b += 0.5) {
            const interval = Math.abs(b % 1) < 0.001 ? 0 : 7;
            this.tone(note(root + interval), bt + b * beat, 0.22, {
              type: "triangle",
              gain: 0.07,
              filter: 900,
              attack: 0.006,
            });
          }
          bt += beats * beat;
        }
  
        const totalBeats = 19.5;
        for (let b = 0; b < totalBeats; b += 0.5) {
          const when = t0 + b * beat;
          this.noiseHit(when, 0.026, 0.02, "highpass", 7200, 0.8);
          if (b % 4 === 0) {
            this.tone(120, when, 0.14, {
              type: "sine",
              gain: 0.2,
              slideTo: 48,
              attack: 0.004,
            });
          }
          if (b % 4 === 2) {
            this.noiseHit(when, 0.09, 0.055, "bandpass", 1900, 1.4);
          }
          if (b % 8 === 6) {
            this.noiseHit(when, 0.14, 0.045, "highpass", 5200, 0.7);
          }
        }
      }
  
      fanfare() {
        const ctx = this.ensure();
        if (!ctx) return;
        const t0 = ctx.currentTime + 0.03;
        const note = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  
        [72, 76, 79, 84].forEach((midi, i) => {
          this.tone(note(midi), t0 + i * 0.085, 0.13, {
            type: "square",
            gain: 0.09,
            filter: 3400,
          });
        });
        [72, 76, 79, 84, 88].forEach((midi) => {
          this.tone(note(midi), t0 + 0.44, 1.35, {
            type: "triangle",
            gain: 0.055,
            filter: 3200,
          });
        });
        this.tone(note(36), t0 + 0.44, 1.2, { type: "sine", gain: 0.22 });
        this.noiseHit(t0 + 0.44, 0.22, 0.07, "bandpass", 2400, 1.2);
        this.applause(t0 + 0.5, 2.1);
      }
  
      applause(when, duration) {
        const ctx = this.ctx;
        if (!ctx) return;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer();
        src.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 2100;
        bp.Q.value = 0.7;
        const vca = ctx.createGain();
        const start = Math.max(ctx.currentTime, when);
        vca.gain.setValueAtTime(0.0001, start);
        for (let i = 0; i < 16; i += 1) {
          const at = start + Math.random() * duration;
          vca.gain.exponentialRampToValueAtTime(0.015 + Math.random() * 0.05, at);
        }
        vca.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        src.connect(bp);
        bp.connect(vca);
        vca.connect(this.master);
        src.start(start);
        src.stop(start + duration + 0.1);
      }
    }
  
    const sound = new SoundKit();
    sound.setMuted(state.muted);
  
    /* ------------------------------------------------------------------ */
    /* ruota                                                              */
    /* ------------------------------------------------------------------ */
  
    const wheel = {
      ctx: el.wheel.getContext("2d"),
      size: 0,
      dpr: 1,
      rotation: 0,
      names: [],
      winnerIndex: -1,
      spinning: false,
    };
  
    function resizeWheel() {
      const width = Math.round(el.wheel.getBoundingClientRect().width);
      if (!width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      wheel.size = width;
      wheel.dpr = dpr;
      el.wheel.width = Math.round(width * dpr);
      el.wheel.height = Math.round(width * dpr);
      wheel.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawWheel();
    }
  
    function fitLabel(text, ctx, maxWidth) {
      if (ctx.measureText(text).width <= maxWidth) return text;
      let base = text;
      while (base.length > 1) {
        base = base.slice(0, -1).trimEnd();
        const candidate = base + "…";
        if (ctx.measureText(candidate).width <= maxWidth) return candidate;
      }
      return "…";
    }
  
    function drawWheel() {
      const ctx = wheel.ctx;
      const size = wheel.size;
      if (!size) return;
      const c = size / 2;
      const r = size / 2 - 7;
      const names = wheel.names;
  
      ctx.clearRect(0, 0, size, size);
  
      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, r + 4, 0, TAU);
      ctx.fillStyle = "#17170f";
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#f3df49";
      ctx.stroke();
      ctx.restore();
  
      if (!names.length) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(c, c, r - 6, 0, TAU);
        ctx.fillStyle = "#0d0d0b";
        ctx.fill();
        ctx.setLineDash([10, 12]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#3a3a30";
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#9b9b90";
        ctx.font = "700 " + Math.round(size * 0.034) + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Aggiungi i partecipanti", c, c);
        ctx.restore();
        return;
      }
  
      const arc = TAU / names.length;
  
      for (let i = 0; i < names.length; i += 1) {
        const start = wheel.rotation + i * arc;
        const color = SLICE_COLORS[i % SLICE_COLORS.length];
  
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.arc(c, c, r, start, start + arc);
        ctx.closePath();
        ctx.fillStyle = color.bg;
        ctx.fill();
        ctx.lineWidth = names.length > 48 ? 1 : 2;
        ctx.strokeStyle = "rgba(10,10,9,0.55)";
        ctx.stroke();
  
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(start + arc / 2);
        const fontSize = Math.round(
          clamp(arc * r * 0.5, 8, names.length > 16 ? 23 : 27)
        );
        ctx.font = "700 " + fontSize + 'px "Open Sans", system-ui, sans-serif';
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = color.fg;
        const label = fitLabel(names[i], ctx, r * (names.length > 14 ? 0.52 : 0.6));
        ctx.fillText(label, r - Math.max(16, size * 0.042), 0);
        ctx.restore();
      }
  
      if (wheel.winnerIndex >= 0 && wheel.winnerIndex < names.length) {
        const start = wheel.rotation + wheel.winnerIndex * arc;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.arc(c, c, r, start, start + arc);
        ctx.closePath();
        ctx.lineWidth = Math.max(4, size * 0.012);
        ctx.strokeStyle = "#ec1c40";
        ctx.shadowColor = "#f3df49";
        ctx.shadowBlur = Math.max(10, size * 0.05);
        ctx.stroke();
        ctx.restore();
      }
  
      const hub = size * 0.112;
      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, hub, 0, TAU);
      ctx.fillStyle = "#0a0a09";
      ctx.fill();
      ctx.lineWidth = Math.max(3, size * 0.009);
      ctx.strokeStyle = "#f3df49";
      ctx.stroke();
      ctx.fillStyle = "#f3df49";
      ctx.font = "800 " + Math.round(size * 0.045) + 'px "Open Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BJS", c, c + size * 0.003);
      ctx.restore();
    }
  
    /** Ripete i nomi in modo uniforme: ogni nome ha lo stesso numero di
        spicchi, quindi la probabilità di vittoria resta identica. */
    function buildSlots(names) {
      const count = names.length;
      if (!count) return [];
      const repeat = count >= MIN_SLICES ? 1 : Math.ceil(MIN_SLICES / count);
      const slots = [];
      for (let round = 0; round < repeat; round += 1) {
        for (let i = 0; i < count; i += 1) slots.push(names[i]);
      }
      return slots;
    }
  
    function sameNames(a, b) {
      return a.length === b.length && a.every((name, i) => name === b[i]);
    }
  
    function setWheelNames(names) {
      const slots = buildSlots(names);
      if (sameNames(slots, wheel.names)) return;
      wheel.names = slots;
      wheel.winnerIndex = -1;
      wheel.rotation = mod(wheel.rotation, TAU);
      drawWheel();
    }
  
    function getPool() {
      if (!state.removeWinners) return state.participants.slice();
      const won = new Set(state.winners.map((w) => w.name));
      return state.participants.filter((name) => !won.has(name));
    }
  
    function refreshSpinState() {
      const pool = getPool();
      const empty = pool.length === 0;
      el.spinBtn.disabled = empty || wheel.spinning;
      el.spinBtn.classList.toggle("is-spinning", wheel.spinning);
      if (wheel.spinning) {
        el.spinBtn.textContent = "Gira…";
      } else if (empty) {
        el.spinBtn.textContent = "Urna vuota";
      } else {
        el.spinBtn.textContent = state.winners.length ? "Gira ancora" : "Gira la ruota";
      }
      el.poolMeta.textContent =
        pool.length +
        " in gara · " +
        state.winners.length +
        (state.winners.length === 1 ? " estratto" : " estratti");
    }
  
    function hideBanner() {
      el.resultBanner.hidden = true;
      el.resultName.textContent = "—";
    }
  
    function showBanner(name) {
      el.resultName.textContent = name;
      el.resultBanner.hidden = false;
    }
  
    /* ------------------------------------------------------------------ */
    /* suspense: frenata lunga e poi colpo di coda imprevedibile          */
    /* ------------------------------------------------------------------ */

    function meanOf(fn, samples) {
      let sum = 0;
      for (let i = 0; i < samples; i += 1) sum += fn((i + 0.5) / samples);
      return sum / samples;
    }

    /**
     * Due fasi, entrambe definite come velocità sempre positiva (niente
     * marce indietro) e integrate in una tabella di posizioni:
     *
     * 1. frenata lunga con qualche "respiro", che porta la ruota a strisciare
     *    lentamente: a quel punto sembra chiaro dove si fermerà;
     * 2. negli ultimi 1,3-2 secondi la ruota riprende un po' di slancio e
     *    supera di qualche fetta il punto in cui una frenata normale l'avrebbe
     *    fermata, poi si ferma dolcemente sul vincitore.
     *
     * La curva atterra esatta su `delta`, cioè sulla fetta vincente.
     */
    function buildSpinCurve(delta, arc) {
      const brakeMs = 7200 + Math.random() * 900;
      const kickMs = 1300 + Math.random() * 700;
      const duration = brakeMs + kickMs;

      /* velocità di "strisciata" a fine frenata, in rad/ms; il tetto evita
         che con pochi nomi (fette enormi) la ruota strisci troppo veloce */
      const crawl = Math.min(arc * (1.1 + Math.random() * 0.5), TAU * 0.12) / 1000;
      /* fette in più rispetto alla frenata naturale */
      const extra = Math.min(arc * (1.6 + Math.random() * 1.6), TAU * 0.4);

      const decay = 2 + Math.random() * 0.3;
      const cycles = 2 + Math.random() * 0.6;
      const amp = 0.3 + Math.random() * 0.1;
      const crest = 0.6 + Math.random() * 0.06;
      const phase = Math.PI / 2 - TAU * cycles * crest;
      const brakeShape = (p) =>
        Math.pow(1 - p, decay) * (1 + amp * Math.sin(TAU * cycles * p + phase));

      /* lo slancio ha il picco a circa un terzo della fase finale */
      const skew = 0.6 + Math.random() * 0.2;
      const kickShape = (q) => Math.pow(Math.sin(Math.PI * Math.pow(q, skew)), 2);

      /* distanza che una frenata naturale da `crawl` a zero coprirebbe */
      const coast = (crawl * kickMs) / 3;
      const brakeDist = delta - coast - extra;
      const brakeAmp = (brakeDist / brakeMs - crawl) / meanOf(brakeShape, 400);
      const kickAmp = extra / (kickMs * meanOf(kickShape, 400));

      function velocity(ms) {
        if (ms < brakeMs) return crawl + brakeAmp * brakeShape(ms / brakeMs);
        const q = (ms - brakeMs) / kickMs;
        return crawl * (1 - q) * (1 - q) + kickAmp * kickShape(q);
      }

      const steps = 900;
      const dt = duration / steps;
      const progress = new Array(steps + 1);
      progress[0] = 0;
      for (let i = 0; i < steps; i += 1) {
        progress[i + 1] = progress[i] + velocity((i + 0.5) * dt) * dt;
      }
      const scale = delta / progress[steps];

      function rotationAt(elapsed) {
        if (elapsed >= duration) return delta;
        if (elapsed <= 0) return 0;
        const x = elapsed / dt;
        const i = Math.min(steps - 1, Math.floor(x));
        const frac = x - i;
        return scale * (progress[i] + (progress[i + 1] - progress[i]) * frac);
      }

      return { duration, rotationAt };
    }
  
    function spin() {
      if (wheel.spinning) return;
      const pool = getPool();
      if (!pool.length) {
        sound.buzz();
        toast("Urna vuota: azzera il recap o rimetti in gara i nomi già estratti.");
        return;
      }
  
      sound.ensure();
      setWheelNames(pool);
      if (!wheel.names.length) return;
  
      wheel.spinning = true;
      wheel.winnerIndex = -1;
      hideBanner();
      refreshSpinState();
  
      const count = wheel.names.length;
      const arc = TAU / count;
      const winnerIndex = randomInt(count);
      const jitter = (Math.random() - 0.5) * arc * 0.55;
      const targetCenter = -Math.PI / 2 + jitter;
      const targetRotation = targetCenter - (winnerIndex + 0.5) * arc;
      const startRotation = wheel.rotation;
      let delta = mod(targetRotation - startRotation, TAU);
      const turns = REDUCED ? 1 : 5 + randomInt(3);
      delta += turns * TAU;
  
      const curve = REDUCED ? null : buildSpinCurve(delta, arc);
      const duration = curve ? curve.duration : 1400;
      const startTime = performance.now();
      let lastSlice = -1;
      let lastTick = 0;
  
      sound.jingle();
  
      function frame(now) {
        const elapsed = now - startTime;
        const t = clamp(elapsed / duration, 0, 1);
        const rotated = curve
          ? curve.rotationAt(elapsed)
          : delta * (1 - Math.pow(1 - t, 3));
        wheel.rotation = startRotation + rotated;
  
        if (count > 1) {
          const slice = Math.floor(mod(-Math.PI / 2 - wheel.rotation, TAU) / arc) % count;
          if (slice !== lastSlice) {
            lastSlice = slice;
            if (now - lastTick > 45) {
              lastTick = now;
              sound.tick();
            }
          }
        }
  
        drawWheel();
  
        if (t < 1) {
          window.requestAnimationFrame(frame);
        } else {
          finishSpin(winnerIndex);
        }
      }
  
      window.requestAnimationFrame(frame);
    }
  
    function finishSpin(winnerIndex) {
      const name = wheel.names[winnerIndex];
      wheel.rotation = mod(wheel.rotation, TAU);
      wheel.winnerIndex = winnerIndex;
      wheel.spinning = false;
      drawWheel();
      addWinner(name);
      showBanner(name);
      sound.fanfare();
      burstConfetti();
      refreshSpinState();
    }
  
    /* ------------------------------------------------------------------ */
    /* confetti                                                           */
    /* ------------------------------------------------------------------ */
  
    const confetti = {
      ctx: el.confetti.getContext("2d"),
      parts: [],
      raf: 0,
      w: 0,
      h: 0,
    };
  
    function resizeConfetti() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      confetti.w = window.innerWidth;
      confetti.h = window.innerHeight;
      el.confetti.width = Math.round(confetti.w * dpr);
      el.confetti.height = Math.round(confetti.h * dpr);
      confetti.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  
    function burstConfetti() {
      if (REDUCED) return;
      const rect = el.wheel.getBoundingClientRect();
      const ox = rect.left + rect.width / 2;
      const oy = rect.top + rect.height * 0.45;
      const colors = ["#f3df49", "#ec1c40", "#f7f5ef", "#ffffff", "#ff8a3d"];
      for (let i = 0; i < 150; i += 1) {
        const angle = Math.random() * TAU;
        const speed = 4 + Math.random() * 12;
        confetti.parts.push({
          x: ox,
          y: oy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5,
          w: 5 + Math.random() * 7,
          h: 8 + Math.random() * 10,
          rot: Math.random() * TAU,
          vr: (Math.random() - 0.5) * 0.4,
          color: colors[i % colors.length],
          life: 1,
        });
      }
      if (!confetti.raf) confetti.raf = window.requestAnimationFrame(confettiTick);
    }
  
    function confettiTick() {
      const ctx = confetti.ctx;
      ctx.clearRect(0, 0, confetti.w, confetti.h);
      confetti.parts = confetti.parts.filter((p) => p.life > 0);
  
      for (const p of confetti.parts) {
        p.vy += 0.22;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.007;
        ctx.save();
        ctx.globalAlpha = clamp(p.life * 1.5, 0, 1);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
  
      if (confetti.parts.length) {
        confetti.raf = window.requestAnimationFrame(confettiTick);
      } else {
        confetti.raf = 0;
        ctx.clearRect(0, 0, confetti.w, confetti.h);
      }
    }
  
    /* ------------------------------------------------------------------ */
    /* winners + recap                                                    */
    /* ------------------------------------------------------------------ */
  
    function addWinner(name) {
      state.winners.push({ id: uid(), name, at: new Date().toISOString() });
      saveState();
      renderWinners();
      renderRecap();
      updateBadge();
      const scroller = el.winnersList.parentElement;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }
  
    function removeWinner(id) {
      state.winners = state.winners.filter((w) => w.id !== id);
      saveState();
      renderWinners();
      renderRecap();
      updateBadge();
      if (!wheel.spinning) {
        setWheelNames(getPool());
        refreshSpinState();
      }
    }
  
    function clearWinners() {
      if (!state.winners.length) {
        toast("Il recap è già vuoto.");
        return;
      }
      const count = state.winners.length;
      const ok = window.confirm(
        "Azzerare il recap? " +
          (count === 1
            ? "Il vincitore tornerà in gara e il nome salvato verrà rimosso."
            : "I " + count + " vincitori torneranno in gara e i nomi salvati verranno rimossi.")
      );
      if (!ok) return;
      state.winners = [];
      saveState();
      hideBanner();
      renderWinners();
      renderRecap();
      updateBadge();
      setWheelNames(getPool());
      refreshSpinState();
      toast("Recap azzerato. Tutti di nuovo in gara.");
    }
  
    function updateBadge() {
      el.recapCount.textContent = String(state.winners.length);
    }
  
    function rankLabel(index) {
      return String(index + 1).padStart(2, "0");
    }
  
    function buildWinnerRow(winner, index, withDelete) {
      const li = document.createElement("li");
  
      const rank = document.createElement("span");
      rank.className = "winners__rank";
      rank.textContent = rankLabel(index);
  
      const body = document.createElement("div");
      body.className = "winners__body";
  
      const name = document.createElement("span");
      name.className = "winners__name";
      name.textContent = winner.name;
      name.title = winner.name;
  
      const time = document.createElement("span");
      time.className = "winners__time";
      time.textContent = formatTime(winner.at);
  
      body.append(name, time);
      li.append(rank, body);
  
      if (withDelete) {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "winners__del";
        del.dataset.removeWin = winner.id;
        del.setAttribute("aria-label", "Rimuovi " + winner.name + " dal recap");
        del.textContent = "✕";
        li.append(del);
      }
  
      return li;
    }
  
    function renderWinners() {
      const list = el.winnersList;
      list.textContent = "";
      state.winners.forEach((winner, i) => {
        list.append(buildWinnerRow(winner, i, false));
      });
      el.winnersEmpty.hidden = state.winners.length > 0;
      el.winnersCount.textContent = String(state.winners.length);
    }
  
    function renderRecap() {
      const list = el.recapList;
      list.textContent = "";
      state.winners.forEach((winner, i) => {
        list.append(buildWinnerRow(winner, i, true));
      });
      el.recapEmpty.hidden = state.winners.length > 0;
    }
  
    function winnersText() {
      return (
        "🏆 Lotteria Bologna JS — vincitori\n" +
        state.winners.map((w, i) => i + 1 + ". " + w.name).join("\n")
      );
    }
  
    function legacyCopy(text) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-2000px";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (error) {
        ok = false;
      }
      ta.remove();
      return ok;
    }
  
    async function copyWinners() {
      if (!state.winners.length) {
        toast("Nessun vincitore da copiare: gira prima la ruota.");
        return;
      }
      const text = winnersText();
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch (error) {
        copied = false;
      }
      if (!copied) copied = legacyCopy(text);
      toast(
        copied
          ? "Recap copiato: incollalo dove vuoi."
          : "Copia non riuscita: seleziona i nomi dal recap."
      );
    }
  
    /* ------------------------------------------------------------------ */
    /* screens                                                            */
    /* ------------------------------------------------------------------ */
  
    function showScreen(name) {
      const wheelScreen = name === "wheel";
      el.screenSetup.hidden = wheelScreen;
      el.screenWheel.hidden = !wheelScreen;
      document.body.dataset.screen = name;
      if (!wheelScreen) stopMic();
    }
  
    function refreshNameCount() {
      const names = parseNames(el.namesInput.value);
      el.nameCount.textContent =
        names.length === 1 ? "1 nome" : names.length + " nomi";
      el.nameCount.classList.toggle("is-warn", names.length === 1);
      return names;
    }
  
    function enterWheel() {
      showScreen("wheel");
      setWheelNames(getPool());
      wheel.winnerIndex = -1;
      hideBanner();
      refreshSpinState();
      window.requestAnimationFrame(() => {
        resizeWheel();
        refreshSpinState();
      });
    }
  
    /* ------------------------------------------------------------------ */
    /* microfono                                                          */
    /* ------------------------------------------------------------------ */
  
    let recognition = null;
    let micOn = false;
    let micErrorNotice = "";
  
    function setupMic() {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        el.micBtn.disabled = true;
        el.micLabel.textContent = "Microfono non supportato";
        el.micStatus.textContent =
          "Dettatura non disponibile in questo browser: prova Chrome, Edge o Safari.";
        return;
      }
  
      recognition = new SpeechRecognition();
      recognition.lang = "it-IT";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
  
      recognition.onstart = () => {
        el.micStatus.textContent = "In ascolto… detta un nome alla volta.";
      };
  
      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = (result[0] && result[0].transcript ? result[0].transcript : "").trim();
          if (!transcript) continue;
          if (result.isFinal) {
            const name = capitalize(transcript);
            if (!name) continue;
            const current = el.namesInput.value.trim();
            el.namesInput.value = (current ? current + "\n" : "") + name;
            refreshNameCount();
            el.micStatus.textContent = "Aggiunto: " + name;
          } else {
            interim += transcript + " ";
          }
        }
        if (interim.trim()) {
          el.micStatus.textContent = "… " + interim.trim();
        }
      };
  
      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          micErrorNotice =
            "Permesso microfono negato: abilitalo dal lucchetto nella barra dell'indirizzo.";
          stopMic();
          el.micStatus.textContent = micErrorNotice;
          toast("Serve il permesso del microfono per dettare i nomi.");
        } else if (event.error === "no-speech" || event.error === "aborted") {
          /* silenzio o stop richiesto: nessun messaggio */
        } else if (event.error === "audio-capture") {
          el.micStatus.textContent = "Nessun microfono trovato.";
        } else {
          el.micStatus.textContent = "Microfono: " + event.error;
        }
      };
  
      recognition.onend = () => {
        if (micOn) {
          try {
            recognition.start();
          } catch (error) {
            /* riavvio troppo rapido: il browser lo gestisce al prossimo giro */
          }
        } else {
          el.micStatus.textContent =
            micErrorNotice || "Microfono spento. Puoi sempre scrivere a mano.";
        }
      };
    }
  
    function startMic() {
      if (!recognition) return;
      if (!window.isSecureContext) {
        el.micStatus.textContent =
          "La dettatura richiede una pagina sicura (https o localhost).";
        toast("Per il microfono serve https o localhost.");
        return;
      }
      micOn = true;
      micErrorNotice = "";
      el.micBtn.setAttribute("aria-pressed", "true");
      el.micLabel.textContent = "Sto ascoltando";
      try {
        recognition.start();
      } catch (error) {
        el.micStatus.textContent = "Impossibile avviare il microfono.";
      }
    }
  
    function stopMic() {
      if (!recognition) return;
      micOn = false;
      el.micBtn.setAttribute("aria-pressed", "false");
      el.micLabel.textContent = "Detta i nomi";
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          /* già fermo */
        }
      }
    }
  
    /* ------------------------------------------------------------------ */
    /* ui wiring                                                          */
    /* ------------------------------------------------------------------ */
  
    function updateSoundUI() {
      el.soundToggle.setAttribute("aria-pressed", String(!state.muted));
      el.soundLabel.textContent = state.muted ? "Suono OFF" : "Suono ON";
    }
  
    sound.setMuted(state.muted);
    updateSoundUI();
    el.removeToggle.checked = state.removeWinners;
    el.namesInput.value = state.participants.join("\n");
    refreshNameCount();
    renderWinners();
    renderRecap();
    updateBadge();
    setupMic();
    resizeConfetti();
  
    el.namesInput.addEventListener("input", refreshNameCount);
  
    el.namesForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const names = parseNames(el.namesInput.value);
      if (names.length < 2) {
        toast("Servono almeno 2 partecipanti per far girare la ruota.");
        el.namesInput.focus();
        return;
      }
      stopMic();
      state.participants = names;
      saveState();
      el.namesInput.value = names.join("\n");
      refreshNameCount();
      enterWheel();
    });
  
    el.demoBtn.addEventListener("click", () => {
      const existing = new Set(parseNames(el.namesInput.value).map((n) => n.toLowerCase()));
      const additions = DEMO_NAMES.filter((n) => !existing.has(n.toLowerCase()));
      const current = el.namesInput.value.trim();
      el.namesInput.value = (current ? current + "\n" : "") + additions.join("\n");
      refreshNameCount();
      toast("Nomi demo aggiunti: puoi modificarli o cancellarli.");
      el.namesInput.focus();
    });
  
    el.micBtn.addEventListener("click", () => {
      if (micOn) {
        stopMic();
      } else {
        startMic();
      }
    });
  
    el.spinBtn.addEventListener("click", spin);
    el.editBtn.addEventListener("click", () => showScreen("setup"));
  
    el.removeToggle.addEventListener("change", () => {
      state.removeWinners = el.removeToggle.checked;
      saveState();
      if (!el.screenWheel.hidden && !wheel.spinning) {
        setWheelNames(getPool());
        hideBanner();
      }
      refreshSpinState();
    });
  
    el.soundToggle.addEventListener("click", () => {
      state.muted = !state.muted;
      saveState();
      sound.setMuted(state.muted);
      updateSoundUI();
      if (!state.muted) {
        if (sound.ensure()) {
          sound.tone(880, sound.ctx.currentTime, 0.08, { type: "triangle", gain: 0.08 });
          sound.tone(1320, sound.ctx.currentTime + 0.09, 0.12, {
            type: "triangle",
            gain: 0.07,
          });
        }
      }
    });
  
    el.copyWinners.addEventListener("click", copyWinners);
    el.clearWinners.addEventListener("click", clearWinners);
    el.recapCopy.addEventListener("click", copyWinners);
    el.recapClear.addEventListener("click", clearWinners);
  
    el.openRecap.addEventListener("click", () => {
      renderRecap();
      if (typeof el.recapDialog.showModal === "function") {
        el.recapDialog.showModal();
      } else {
        el.recapDialog.setAttribute("open", "");
      }
    });
  
    function closeRecap() {
      if (typeof el.recapDialog.close === "function") {
        el.recapDialog.close();
      } else {
        el.recapDialog.removeAttribute("open");
      }
    }
  
    el.recapDialog.addEventListener("click", (event) => {
      if (event.target === el.recapDialog) closeRecap();
      const closeBtn = event.target.closest("[data-close-recap]");
      if (closeBtn) closeRecap();
  
      const removeBtn = event.target.closest("[data-remove-win]");
      if (removeBtn) {
        removeWinner(removeBtn.dataset.removeWin);
      }
    });
  
    document.addEventListener("keydown", (event) => {
      if (event.code !== "Space") return;
      if (document.body.dataset.screen !== "wheel") return;
      if (el.recapDialog.open) return;
      const tag = (event.target.tagName || "").toLowerCase();
      if (tag === "button" || tag === "input" || tag === "textarea" || event.target.isContentEditable) {
        return;
      }
      event.preventDefault();
      spin();
    });
  
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!el.screenWheel.hidden) resizeWheel();
        resizeConfetti();
      }, 120);
    });
  
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(drawWheel).catch(() => {});
    }
  
    el.namesInput.focus({ preventScroll: true });
  })();
  