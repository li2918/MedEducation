// Timeline player: turns a scene script into a scrubbable, narrated canvas animation.
// Script shape: { title, scenes: [{ label, caption, dur?, draw(ctx, p, s) }] }
//   p = 0..1 progress through the scene, s = seconds since the scene started.
(function () {
  const W = 960, H = 540;
  const WORDS_PER_SEC = 2.6;

  // Scene length is at least long enough for the narration to finish.
  function sceneLength(sc) {
    const words = (sc.caption || '').split(/\s+/).filter(Boolean).length;
    return Math.max(sc.dur || 0, words / WORDS_PER_SEC + 1.4);
  }

  function fmt(t) {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  let cachedVoice = null;
  function pickVoice() {
    if (cachedVoice || !('speechSynthesis' in window)) return cachedVoice;
    const voices = speechSynthesis.getVoices().filter((v) => /^en(-|_)US/i.test(v.lang));
    cachedVoice = voices.find((v) => /natural|aria|jenny|samantha|google us/i.test(v.name)) || voices[0] || null;
    return cachedVoice;
  }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { cachedVoice = null; pickVoice(); };

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
          <button class="btn-voice" type="button" title="Narration">Voice</button>
          <button class="btn-cc" type="button" title="Captions">CC</button>
          <button class="btn-full" type="button" title="Full screen">⛶</button>
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
    this.voice = opts.voice !== false && 'speechSynthesis' in window;
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
    this.scrub.oninput = () => { this.seek((this.scrub.value / 1000) * this.total); };
    this.btnVoice.onclick = () => {
      this.voice = !this.voice;
      if (!this.voice) this._stopSpeech();
      else if (this.playing && this.cur >= 0) this._speak(this.scenes[this.cur].caption);
      this._syncButtons();
    };
    this.btnCC.onclick = () => { this.cc = !this.cc; this.captionEl.hidden = !this.cc; this._syncButtons(); };
    root.querySelector('.btn-full').onclick = () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (this.el.requestFullscreen) this.el.requestFullscreen();
    };
    if (!('speechSynthesis' in window)) this.btnVoice.disabled = true;
    this._resize();
    window.addEventListener('resize', () => this._resize());
    document.addEventListener('fullscreenchange', () => this._resize());
  }

  Player.prototype._resize = function () {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cssW = this.canvas.clientWidth || W;
    const scale = Math.max(1, (cssW / W) * dpr);
    this.canvas.width = Math.round(W * scale);
    this.canvas.height = Math.round(H * scale);
    this.scale = scale;
    this.render();
  };

  Player.prototype.load = function (script) {
    this.pause();
    this.script = script;
    let start = 0;
    this.scenes = script.scenes.map((sc) => { const dur = sceneLength(sc); const o = Object.assign({}, sc, { start, dur }); start += dur; return o; });
    this.total = start;
    this.t = 0;
    this.cur = -1;
    this.ended = false;
    this.chaptersEl.innerHTML = this.scenes.map((sc, i) =>
      `<li><button type="button" data-i="${i}"><span>${i + 1}</span>${sc.label}</button></li>`).join('');
    this.chaptersEl.querySelectorAll('button').forEach((b) => {
      b.onclick = () => { this.seek(this.scenes[+b.dataset.i].start + 0.001); if (!this.playing) this.play(); else this._speak(this.scenes[this.cur].caption); };
    });
    this._resize();
    this._syncButtons();
  };

  Player.prototype.play = function () {
    if (!this.scenes.length) return;
    if (this.t >= this.total - 0.01) this.t = 0;
    this.playing = true;
    this.ended = false;
    this._last = performance.now();
    const sc = this.scenes[this._sceneAt(this.t)];
    // Re-speak on resume only near the start of a scene, so narration stays aligned.
    if (sc && this.t - sc.start < sc.dur * 0.3) this._speak(sc.caption);
    this.cur = this._sceneAt(this.t);
    requestAnimationFrame(this._frame);
    this._syncButtons();
  };

  Player.prototype.pause = function () {
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
    this.t += dt;
    if (this.t >= this.total) {
      this.t = this.total;
      this.playing = false;
      this.ended = true;
      this.render();
      this._syncButtons();
      if (this.opts.onEnd) this.opts.onEnd();
      return;
    }
    this.render();
    requestAnimationFrame(this._frame);
  };

  Player.prototype._sceneAt = function (t) {
    for (let i = this.scenes.length - 1; i >= 0; i--) if (t >= this.scenes[i].start) return i;
    return 0;
  };

  Player.prototype.render = function () {
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f7faff'); g.addColorStop(1, '#eaf1fa');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (!this.scenes.length) return;

    const i = this._sceneAt(this.t), sc = this.scenes[i];
    const s = Math.min(this.t - sc.start, sc.dur), p = M.clamp(s / sc.dur);
    ctx.save();
    ctx.globalAlpha = i === 0 ? 1 : M.clamp(s / 0.35);
    try { sc.draw(ctx, p, s); } catch (e) { console.error('Scene draw failed:', sc.label, e); }
    ctx.restore();

    M.pill(ctx, `${i + 1}/${this.scenes.length}  ${sc.label}`, 22, 32, { align: 'left', bg: 'rgba(255,255,255,0.92)', border: '#dbe5f5', color: M.C.blue, size: 14 });
    if (this.script.title) M.text(ctx, this.script.title, W - 22, 32, { size: 14, align: 'right', color: M.C.muted, weight: 600 });

    if (i !== this.cur) {
      this.cur = i;
      if (this.playing) this._speak(sc.caption);
    }
    if (this._shownCaption !== i) {
      this._shownCaption = i;
      this.captionEl.textContent = sc.caption || '';
      this.chaptersEl.querySelectorAll('li').forEach((li, k) => li.classList.toggle('active', k === i));
    }
    this.scrub.value = Math.round((this.t / this.total) * 1000);
    this.timeEl.textContent = `${fmt(this.t)} / ${fmt(this.total)}`;
  };

  Player.prototype._speak = function (textStr) {
    if (!this.voice || !textStr) return;
    this._stopSpeech();
    const u = new SpeechSynthesisUtterance(textStr.replace(/[↑↓]/g, ''));
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = 'en-US';
    u.rate = this.opts.rate || 1;
    speechSynthesis.speak(u);
  };

  Player.prototype._stopSpeech = function () {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  };

  Player.prototype._syncButtons = function () {
    const icon = this.playing ? '❚❚' : this.ended ? '↻' : '▶';
    this.btnPlay.textContent = icon;
    this.btnPlay.setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
    this.bigPlay.textContent = this.ended ? '↻' : '▶';
    this.bigPlay.hidden = this.playing;
    this.btnVoice.classList.toggle('on', this.voice);
    this.btnVoice.setAttribute('aria-pressed', String(this.voice));
    this.btnVoice.textContent = this.voice ? '🔊 Voice' : '🔇 Voice';
    this.btnCC.classList.toggle('on', this.cc);
    this.btnCC.setAttribute('aria-pressed', String(this.cc));
  };

  Player.prototype.stop = function () { this.pause(); };

  window.Player = Player;
})();
