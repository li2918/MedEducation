// Timeline player: turns a scene script into a scrubbable, narrated canvas animation.
// Script shape: { title, length?, audio?, scenes: [{ label, caption, say?, dur?, draw(ctx, p, s) }] }
// say (optional, English only): what the browser voice reads instead of the caption, e.g.
// "G. I. P." so an abbreviation is spelled out rather than read as a word.
//   length: optional target running time in seconds; scenes stretch evenly to reach it.
//   timing: 'audio' fits each scene to its recorded English clip instead (clip length plus a
//     short visual finish, or the scene's own dur if longer); length is then only a fallback
//     for when the clip lengths are unknown.
//   audio: optional folder of pre-recorded narration, one file per scene (<folder><n>.mp3).
//     It plays instead of the browser voice; if a file is missing, the browser voice takes over.
//   p = 0..1 progress through the scene, s = seconds since the scene started.
(function () {
  const W = 960, H = 540;
  const WORDS_PER_SEC = 2.6;
  const tr = (s) => (window.I18N ? I18N.tr(s) : s);
  const LANG = window.I18N ? I18N.lang : 'en';
  const CAP_H = 96; // caption band added under the picture in downloaded videos
  const TAIL = 1.5; // seconds of picture after a recorded clip ends, with timing: 'audio'
  // MP4 writer for downloads (Mediabunny, MPL-2.0), next to this script in js/vendor/
  const MEDIABUNNY = new URL('vendor/mediabunny-1.61.4.mjs', (document.currentScript && document.currentScript.src) || location.href).href;

  // Scene length is at least long enough for the narration to finish.
  function sceneLength(sc) {
    const words = (sc.say || sc.caption || '').split(/\s+/).filter(Boolean).length;
    return Math.max(sc.dur || 0, words / WORDS_PER_SEC + 1.4);
  }

  // Short hash of a caption, used to version its recorded clip's URL.
  function textTag(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function fmt(t) {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // Most human-sounding voices first: Edge's neural "Natural" voices, Google's online voice,
  // then Apple's enhanced/premium voices. Plain local voices (e.g. David, Zira) sound robotic.
  const VOICE_RANK = [
    /(Ava|Andrew|Emma|Brian|Jenny|Aria|Michelle|Guy).*Natural/i,
    /Natural/i,
    /Online/i,
    /Google US English/i,
    /Premium|Enhanced/i,
    /Samantha|Allison|Evan|Zoe|Ava/i,
  ];
  const VOICE_KEY = 'medmotion.narrator';
  const RECORDED = '__recorded__'; // picker value for the pre-recorded narrator

  // Browser voices in the page language (named englishVoices from when the site was English only).
  function englishVoices() {
    if (!('speechSynthesis' in window)) return [];
    if (LANG !== 'en') return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(LANG)).slice(0, 12);
    const rank = (v) => { const i = VOICE_RANK.findIndex((r) => r.test(v.name)); return i < 0 ? VOICE_RANK.length : i; };
    const en = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
    const us = en.filter((v) => /US/i.test(v.lang));
    // Keep the picker short: US English voices when available, best-sounding first.
    return (us.length ? us : en).sort((a, b) => rank(a) - rank(b)).slice(0, 12);
  }

  function savedVoice() {
    try { return localStorage.getItem(VOICE_KEY); } catch (e) { return null; /* storage unavailable */ }
  }

  function pickVoice() {
    const voices = englishVoices(), saved = savedVoice();
    return voices.find((v) => v.name === saved) || voices[0] || null;
  }

  // "Microsoft Ava Online (Natural) - English (United States)" → "Ava (Natural)"
  const voiceLabel = (v) => v.name.replace(/^Microsoft\s+/, '').replace(/\s+Online/, '').replace(/\s*-\s*English.*$/, '')
    + (/US/i.test(v.lang) ? '' : ` · ${v.lang}`);

  function Player(root, opts = {}) {
    this.opts = opts;
    root.innerHTML = `
      <div class="player">
        <div class="stage">
          <canvas width="${W}" height="${H}" aria-label="Animation"></canvas>
          <button class="big-play" type="button" aria-label="Play">▶</button>
        </div>
        <div class="caption" aria-live="polite"></div>
        <div class="controls">
          <button class="btn-play" type="button" aria-label="Play">▶</button>
          <input class="scrub" type="range" min="0" max="1000" value="0" aria-label="Seek">
          <span class="time">0:00 / 0:00</span>
          <button class="btn-voice" type="button" title="${tr('Narration')}">${tr('Voice')}</button>
          <select class="voice-pick" aria-label="Narrator voice" title="Narrator voice" hidden></select>
          <button class="btn-cc" type="button" title="${tr('Captions')}">CC</button>
          <button class="btn-dl" type="button" title="${tr('Download video')}">⬇ ${tr('Video')}</button>
          <button class="btn-full" type="button" title="${tr('Full screen')}">⛶</button>
        </div>
        <ol class="chapters"></ol>
      </div>`;
    this.el = root.querySelector('.player');
    this.canvas = root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.captionEl = root.querySelector('.caption');
    this.chaptersEl = root.querySelector('.chapters');
    this.scrub = root.querySelector('.scrub');
    this.timeEl = root.querySelector('.time');
    this.btnPlay = root.querySelector('.btn-play');
    this.bigPlay = root.querySelector('.big-play');
    this.btnVoice = root.querySelector('.btn-voice');
    this.btnCC = root.querySelector('.btn-cc');
    this.voice = opts.voice !== false;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this._clip = 0;
    this.cc = true;
    this.playing = false;
    this.t = 0;
    this.cur = -1;
    this.scenes = [];
    this.total = 0;
    this._frame = this._frame.bind(this);

    const toggle = () => (this.playing ? this.pause() : this.play());
    this.btnPlay.onclick = toggle;
    this.bigPlay.onclick = toggle;
    this.canvas.onclick = toggle;
    this.scrub.oninput = () => { if (!this.recording && !this.exporting) this.seek((this.scrub.value / 1000) * this.total); };
    this.btnDl = root.querySelector('.btn-dl');
    this.btnDl.onclick = () => this.download();
    this.btnVoice.onclick = () => {
      this.voice = !this.voice;
      if (!this.voice) this._stopSpeech();
      else if (this.playing && this.cur >= 0) this._speak(this.cur);
      this._syncButtons();
    };
    this.btnCC.onclick = () => { this.cc = !this.cc; this.captionEl.hidden = !this.cc; this._syncButtons(); };
    root.querySelector('.btn-full').onclick = () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (this.el.requestFullscreen) this.el.requestFullscreen();
    };
    this.voiceSel = root.querySelector('.voice-pick');
    this.voiceSel.onchange = () => {
      try { localStorage.setItem(VOICE_KEY, this.voiceSel.value); } catch (e) { /* storage unavailable */ }
      if (this.playing && this.voice && this.cur >= 0) this._speak(this.cur);
    };
    this._fillVoices();
    if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', () => this._fillVoices());
    this._resize();
    window.addEventListener('resize', () => this._resize());
    document.addEventListener('fullscreenchange', () => this._resize());
  }

  Player.prototype._resize = function () {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cssW = this.canvas.clientWidth || W;
    // While recording a download, render a fixed 1920-wide frame with a caption band below.
    const scale = this.recording ? 2 : Math.max(1, (cssW / W) * dpr);
    this.canvas.width = Math.round(W * scale);
    this.canvas.height = Math.round((H + (this.recording ? CAP_H : 0)) * scale);
    this.scale = scale;
    this.render();
  };

  Player.prototype.load = function (script) {
    this.pause();
    this.script = script;
    let start = 0;
    const DUR = window.AUDIO_DUR || {}, enClip = (i) => script.audio && DUR[`${script.audio}${i + 1}.mp3`];
    const fit = script.timing === 'audio' && script.scenes.every((sc, i) => enClip(i));
    const base = script.scenes.map((sc, i) => (fit ? Math.max(sc.dur || 0, enClip(i) + TAIL) : sceneLength(sc)));
    const sum = base.reduce((a, b) => a + b, 0), stretch = !fit && script.length > sum ? script.length / sum : 1;
    // Other languages play their own recordings (audio/<id>-zh/ ...). Scene timing is written for
    // the English narration, so each scene's clock is scaled by English / translated clip length
    // (rs) to keep the animation in step with the translated voice. ?v= changes whenever a caption
    // changes, so browsers never replay an old cached recording.
    const folder = script.audio && (LANG === 'en' ? script.audio : script.audio.replace(/\/?$/, `-${LANG}/`));
    this.scenes = script.scenes.map((sc, i) => {
      const caption = tr(sc.caption || ''), n = `${i + 1}.mp3`;
      const en = script.audio && DUR[script.audio + n], other = folder && DUR[folder + n];
      const rs = LANG !== 'en' && en && other ? en / other : 1, dur = (base[i] * stretch) / rs;
      const audio = folder ? `${folder}${n}?v=${textTag(caption)}` : null;
      const o = Object.assign({}, sc, { caption, say: LANG === 'en' ? sc.say : undefined, label: tr(sc.label), start, dur, audio, rs }); start += dur; return o;
    });
    this.total = start;
    this.t = 0;
    this.cur = -1;
    this.ended = false;
    this._audioFailed = false;
    this._fillVoices();
    this.chaptersEl.innerHTML = this.scenes.map((sc, i) =>
      `<li><button type="button" data-i="${i}"><span>${i + 1}</span>${sc.label}</button></li>`).join('');
    this.chaptersEl.querySelectorAll('button').forEach((b) => {
      b.onclick = () => { if (this.recording || this.exporting) return; this.seek(this.scenes[+b.dataset.i].start + 0.001); if (!this.playing) this.play(); else this._speak(this.cur); };
    });
    this._resize();
    this._syncButtons();
  };

  Player.prototype.play = function () {
    if (!this.scenes.length || this.exporting) return;
    if (this.t >= this.total - 0.01) this.t = 0;
    this.playing = true;
    this.ended = false;
    this._last = performance.now();
    const i = this._sceneAt(this.t), sc = this.scenes[i];
    // Re-speak on resume only near the start of a scene, so narration stays aligned.
    if (sc && this.t - sc.start < sc.dur * 0.3) this._speak(i);
    this.cur = this._sceneAt(this.t);
    requestAnimationFrame(this._frame);
    this._syncButtons();
  };

  Player.prototype.pause = function () {
    if (this.recording) this._finishRecording(false); // pausing cancels a download
    this.playing = false;
    this._stopSpeech();
    this._syncButtons();
  };

  Player.prototype.seek = function (t) {
    this.t = M.clamp(t, 0, this.total);
    this._stopSpeech();
    this.render();
  };

  Player.prototype._frame = function (now) {
    if (!this.playing) return;
    const dt = Math.min(0.1, (now - this._last) / 1000);
    this._last = now;
    // A recorded clip may still be loading (slow phone networks): hold the picture until it
    // actually starts (max 3 s), then keep the scene clock locked to the clip so the
    // animation never runs ahead of the voice.
    if (this._waiting) {
      if (now - this._waiting < 3000) { this.render(); requestAnimationFrame(this._frame); return; }
      this._waiting = 0;
    }
    this.t += dt;
    const clip = this.audio, cs = this.scenes[this.cur];
    if (this._speaking && cs && this._clipScene === this.cur && !clip.paused) {
      const target = cs.start + clip.currentTime;
      if (target < cs.start + cs.dur && Math.abs(this.t - target) > 0.2) this.t = target;
    }
    // Hold on the last frame of a scene until the narrator finishes the sentence (max 6 s),
    // so a slower voice is never cut off mid-word by the next scene.
    const sc = this.scenes[this.cur];
    if (this.voice && this._speaking && sc && this.t >= sc.start + sc.dur - 0.02) {
      this.t = sc.start + sc.dur - 0.02;
      this._held = (this._held || 0) + dt;
      if (this._held > 6) this._speaking = false;
    } else {
      this._held = 0;
    }
    if (this.t >= this.total) {
      this.t = this.total;
      this.playing = false;
      this.ended = true;
      this.render();
      this._syncButtons();
      if (this.recording) setTimeout(() => this._finishRecording(true), 400); // keep the last frame briefly
      else if (this.opts.onEnd) this.opts.onEnd();
      return;
    }
    this.render();
    requestAnimationFrame(this._frame);
  };

  Player.prototype._sceneAt = function (t) {
    for (let i = this.scenes.length - 1; i >= 0; i--) if (t >= this.scenes[i].start) return i;
    return 0;
  };

  // Draw the frame at time t into ctx at the given scale; band adds the caption strip used in
  // downloaded videos. Shared by the on-screen player and the frame-by-frame export, so a
  // download looks exactly like playback. Returns the scene index (-1 when nothing is loaded).
  Player.prototype._paint = function (ctx, scale, t, band) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f7faff'); g.addColorStop(1, '#eaf1fa');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (!this.scenes.length) return -1;

    const i = this._sceneAt(t), sc = this.scenes[i];
    const s = Math.min(t - sc.start, sc.dur), p = M.clamp(s / sc.dur), sEn = s * sc.rs;
    // Cross-fade from the previous scene's last frame, so a scene change (or a pause while the
    // next clip loads) never flashes an empty background.
    const fade = i === 0 ? 1 : M.clamp(s / 0.35);
    if (fade < 1) {
      const pv = this.scenes[i - 1];
      ctx.save(); ctx.globalAlpha = 1 - fade;
      try { pv.draw(ctx, 1, pv.dur * pv.rs); } catch (e) { console.error('Scene draw failed:', pv.label, e); }
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = fade;
    try { sc.draw(ctx, p, sEn); } catch (e) { console.error('Scene draw failed:', sc.label, e); }
    ctx.restore();

    M.pill(ctx, `${i + 1}/${this.scenes.length}  ${sc.label}`, 22, 32, { align: 'left', bg: 'rgba(255,255,255,0.92)', border: '#dbe5f5', color: M.C.blue, size: 14 });
    if (this.script.title) M.text(ctx, tr(this.script.title), W - 22, 32, { size: 14, align: 'right', color: M.C.muted, weight: 600 });
    if (band) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, H, W, CAP_H);
      ctx.fillStyle = '#d7e0ec'; ctx.fillRect(0, H, W, 1);
      M.wrap(ctx, sc.caption || '', W / 2, H + 34, W - 80, { size: 22, weight: 600, color: M.C.ink });
    }
    return i;
  };

  Player.prototype.render = function () {
    const i = this._paint(this.ctx, this.scale, this.t, !!this.recording);
    if (i < 0) return;
    const sc = this.scenes[i];
    if (i !== this.cur) {
      this.cur = i;
      if (this.playing) this._speak(i);
    }
    if (this._shownCaption !== i) {
      this._shownCaption = i;
      this.captionEl.textContent = sc.caption || '';
      this.chaptersEl.querySelectorAll('li').forEach((li, k) => li.classList.toggle('active', k === i));
    }
    this.scrub.value = Math.round((this.t / this.total) * 1000);
    this.timeEl.textContent = this.exporting ? `${tr('Exporting')} ${Math.round(this.exporting.progress * 100)}%`
      : `${this.recording ? '● ' + tr('Recording') + ' ' : ''}${fmt(this.t)} / ${fmt(this.total)}`;
  };

  // Download. Where the browser has WebCodecs (Chrome, Edge, recent Safari and Firefox), every
  // frame is drawn off screen and encoded to a 1080p 60 fps MP4 with the recorded narration
  // mixed in at each scene's start: no dropped frames, and it does not need to play in real
  // time. Otherwise (or if that fails) it falls back to playing the video once while recording.
  Player.prototype.download = function () {
    if (this.exporting) { this.exporting.cancelled = true; return; }
    if (this.recording) { this._finishRecording(false); return; }
    if (!this.scenes.length) return;
    if (window.VideoEncoder && window.OfflineAudioContext) {
      this._exportFrames().catch((e) => {
        const cancelled = this.exporting && this.exporting.cancelled;
        this.exporting = null;
        this._syncButtons(); this.render();
        if (!cancelled) { console.warn('Frame-by-frame export failed, recording in real time instead:', e); this._recordRealtime(); }
      });
      return;
    }
    this._recordRealtime();
  };

  // The narration as one track: each recorded clip placed at its scene's start (the player locks
  // a scene's clock to its clip, so this matches playback). Null without recorded clips, or when
  // they cannot be read (pages opened from file://).
  Player.prototype._narrationTrack = async function (rate) {
    if (!this._recorded() || location.protocol === 'file:') return null;
    const off = new OfflineAudioContext(1, Math.ceil(this.total * rate), rate);
    let any = false;
    for (const sc of this.scenes) {
      if (!sc.audio) continue;
      const res = await fetch(sc.audio);
      if (!res.ok) return null;
      const buf = await off.decodeAudioData(await res.arrayBuffer());
      const src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start(sc.start);
      any = true;
    }
    return any ? off.startRendering() : null;
  };

  Player.prototype._exportFrames = async function () {
    const FPS = 60, SCALE = 2, w = W * SCALE, h = (H + CAP_H) * SCALE;
    const MB = await import(MEDIABUNNY);
    const vcodec = await MB.getFirstEncodableVideoCodec(['avc', 'vp9', 'av1'], { width: w, height: h, frameRate: FPS });
    if (!vcodec) throw new Error('no video encoder');
    this.pause();
    this.exporting = { progress: 0, cancelled: false };
    this._syncButtons(); this.render();
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const output = new MB.Output({ format: new MB.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new MB.BufferTarget() });
    const video = new MB.CanvasSource(canvas, { codec: vcodec, quality: new MB.Quality({ bitrate: 5e6 }) });
    output.addVideoTrack(video, { frameRate: FPS });
    const narration = await this._narrationTrack(48000);
    let audio = null;
    if (narration) {
      const acodec = await MB.getFirstEncodableAudioCodec(['aac', 'opus'], { numberOfChannels: 1, sampleRate: 48000 });
      if (acodec) { audio = new MB.AudioBufferSource({ codec: acodec, quality: new MB.Quality({ bitrate: 128e3 }) }); output.addAudioTrack(audio); }
    }
    await output.start();
    if (audio) await audio.add(narration);
    const frames = Math.ceil(this.total * FPS);
    for (let f = 0; f <= frames; f++) {
      if (this.exporting.cancelled) { await output.cancel(); throw new Error('cancelled'); }
      this._paint(ctx, SCALE, Math.min(f / FPS, this.total), true);
      await video.add(f / FPS, 1 / FPS, f % (FPS * 2) ? undefined : { keyFrame: true });
      if (f % 15 === 0) { this.exporting.progress = f / frames; this.timeEl.textContent = `${tr('Exporting')} ${Math.round(this.exporting.progress * 100)}%`; }
    }
    await output.finalize();
    this.exporting = null;
    this._save(new Blob([output.target.buffer], { type: 'video/mp4' }), 'mp4');
    this._syncButtons(); this.render();
  };

  Player.prototype._save = function (blob, ext) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `MedMotion - ${tr(this.script.title) || 'video'}.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  };

  // Fallback download: play the whole video once in real time while recording the canvas (plus
  // the recorded narration), then save it as MP4 where the browser can, otherwise WebM.
  Player.prototype._recordRealtime = function () {
    const types = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
    const type = window.MediaRecorder && this.canvas.captureStream && types.find((t) => MediaRecorder.isTypeSupported(t));
    if (!this.scenes.length || !type) { alert(tr('Video download is not supported in this browser. Please try Chrome or Edge.')); return; }
    this.pause();
    this.recording = { type, chunks: [], voice: this.voice };
    this._resize();
    const stream = this.canvas.captureStream(30), audio = this._audioTrack();
    if (audio) stream.addTrack(audio);
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6e6 });
    rec.ondataavailable = (e) => { if (e.data.size) this.recording && this.recording.chunks.push(e.data); };
    this.recording.rec = rec;
    this.recording.stream = stream;
    this.voice = true;
    this.seek(0);
    rec.start(1000);
    this.play();
  };

  // Narration track for recordings. Only recorded clips can be captured (browser speech
  // cannot), and only over http(s): pages opened from file:// block reading the audio.
  Player.prototype._audioTrack = function () {
    if (location.protocol === 'file:' || !this._recorded() || !window.AudioContext) return null;
    if (!this._dest) {
      const ac = new AudioContext(), src = ac.createMediaElementSource(this.audio);
      this._dest = ac.createMediaStreamDestination();
      src.connect(ac.destination); src.connect(this._dest);
      this._ac = ac;
    }
    this._ac.resume();
    return this._dest.stream.getAudioTracks()[0];
  };

  Player.prototype._finishRecording = function (save) {
    const r = this.recording;
    if (!r) return;
    this.recording = null;
    r.rec.onstop = () => {
      if (!save) return;
      this._save(new Blob(r.chunks, { type: r.type.split(';')[0] }), r.type.includes('mp4') ? 'mp4' : 'webm');
    };
    if (r.rec.state !== 'inactive') r.rec.stop();
    this.voice = r.voice;
    r.stream.getVideoTracks().forEach((tr) => tr.stop());
    if (this.playing) this.pause();
    this._resize();
    this._syncButtons();
    if (save && this.opts.onEnd) this.opts.onEnd();
  };

  // Recorded narration is the default whenever this video has it and a file has not failed.
  Player.prototype._recorded = function () {
    const saved = savedVoice();
    return !!(this.script && this.script.audio) && !this._audioFailed && (!saved || saved === RECORDED);
  };

  // Narrate scene i: its recorded clip if available, otherwise the browser voice.
  Player.prototype._speak = function (i) {
    const sc = this.scenes[i];
    if (!this.voice || !sc || !sc.caption) return;
    this._stopSpeech();
    if (sc.audio && this._recorded()) {
      const id = this._clip, a = this.audio;
      a.onended = () => { if (this._clip === id) this._speaking = false; };
      a.onplaying = () => { if (this._clip === id) this._waiting = 0; };
      a.onerror = () => {
        if (this._clip !== id) return;
        this._waiting = 0;
        this._audioFailed = true; // files missing (not generated yet): fall back to the browser voice
        this._fillVoices();
        this._speakText(sc.say || sc.caption);
      };
      a.src = sc.audio;
      this._clipScene = i;
      this._speaking = true;
      this._waiting = performance.now();
      const pr = a.play();
      if (pr) pr.catch(() => {});
      // fetch the next clip now so the next scene starts on time
      const next = this.scenes[i + 1];
      if (next && next.audio) { this._preload = new Audio(); this._preload.preload = 'auto'; this._preload.src = next.audio; }
      return;
    }
    this._speakText(sc.say || sc.caption);
  };

  Player.prototype._speakText = function (textStr) {
    if (!('speechSynthesis' in window)) { this._voiceFailed = true; this._syncButtons(); return; }
    const u = new SpeechSynthesisUtterance(textStr.replace(/[↑↓]/g, ''));
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = LANG === 'zh' ? 'zh-CN' : 'en-US';
    // Slightly slower than default reads as calmer and more conversational.
    u.rate = this.opts.rate || 0.95;
    u.pitch = 1;
    u.onend = () => { if (this._utter === u) this._speaking = false; };
    // A real synthesis failure (not a cancel from pausing or switching scenes) means no voice is
    // available: say so on the Voice button rather than implying narration is playing.
    u.onerror = (e) => {
      if (this._utter === u) this._speaking = false;
      if (e && e.error && !/interrupted|canceled/.test(e.error)) { this._voiceFailed = true; this._syncButtons(); }
    };
    this._utter = u;
    this._speaking = true;
    speechSynthesis.speak(u);
  };

  Player.prototype._stopSpeech = function () {
    this._speaking = false;
    this._waiting = 0;
    this._utter = null;
    this._clip++;
    this.audio.pause();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  };

  Player.prototype._fillVoices = function () {
    const recorded = this._recorded(), cur = recorded ? null : pickVoice();
    const opts = englishVoices().map((v) =>
      `<option value="${v.name.replace(/"/g, '&quot;')}"${cur && v.name === cur.name ? ' selected' : ''}>${voiceLabel(v)}</option>`);
    if (this.script && this.script.audio && !this._audioFailed) {
      opts.unshift(`<option value="${RECORDED}"${recorded ? ' selected' : ''}>${tr('Natural narrator')}</option>`);
    }
    this.voiceSel.hidden = opts.length < 2;
    this.voiceSel.innerHTML = opts.join('');
  };

  Player.prototype._syncButtons = function () {
    const icon = this.playing ? '❚❚' : this.ended ? '↻' : '▶';
    this.btnPlay.textContent = icon;
    this.btnPlay.setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
    this.bigPlay.textContent = this.ended ? '↻' : '▶';
    this.bigPlay.hidden = this.playing;
    this.btnVoice.classList.toggle('on', this.voice);
    this.btnVoice.setAttribute('aria-pressed', String(this.voice));
    const noVoice = this.voice && this._voiceFailed && !(this._recorded && this._recorded());
    this.btnVoice.textContent = noVoice ? '🔇 ' + tr('Voice unavailable') : (this.voice ? '🔊 ' : '🔇 ') + tr('Voice');
    this.btnVoice.title = noVoice ? tr('Narration could not start in this browser') : tr('Narration');
    this.btnCC.classList.toggle('on', this.cc);
    this.btnCC.setAttribute('aria-pressed', String(this.cc));
    const busy = !!(this.recording || this.exporting);
    this.btnDl.textContent = busy ? '■ ' + tr('Stop') : '⬇ ' + tr('Video');
    this.btnDl.title = busy ? tr('Cancel download') : tr('Download video');
    this.btnDl.classList.toggle('on', busy);
  };

  Player.prototype.stop = function () { this.pause(); };

  // True when <folder><n>.mp3 exists for every scene and was recorded from the words the scene
  // says now (tools/make-narration.py writes AUDIO_DUR and the AUDIO_SAY fingerprints). A clip
  // made from an older caption would say the wrong thing, so then the browser voice is used.
  Player.hasRecording = function (folder, scenes) {
    const DUR = window.AUDIO_DUR || {}, SAY = window.AUDIO_SAY || {};
    return scenes.length > 0 && scenes.every((sc, i) => {
      const f = `${folder}${i + 1}.mp3`;
      return DUR[f] && SAY[f] === textTag(sc.say || sc.caption || '');
    });
  };

  window.Player = Player;
})();
