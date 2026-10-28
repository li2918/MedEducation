// Clickable SVG body map. Organs are colored by severity (pathophysiology) or by drug role.
(function () {
  const ORGAN_NAMES = {
    brain: 'Brain', eye: 'Eyes', lungs: 'Lungs', heart: 'Heart', liver: 'Liver', stomach: 'Stomach / GI',
    pancreas: 'Pancreas', kidney: 'Kidneys', bladder: 'Bladder / GU', vessels: 'Arteries', muscle: 'Skeletal muscle',
    nerves: 'Peripheral nerves', legs: 'Legs & feet',
  };
  // Strokes (lines) rather than fills for these organs.
  const LINE_ORGANS = ['vessels', 'nerves'];

  const SVG = `
  <svg viewBox="0 0 240 520" role="group" aria-label="Body map">
    <g class="silhouette">
      <ellipse cx="120" cy="50" rx="34" ry="40"/>
      <rect x="108" y="84" width="24" height="24" rx="6"/>
      <path d="M64 112 Q120 98 176 112 L170 300 Q120 316 70 300 Z"/>
      <path d="M62 116 Q46 120 42 150 L30 290 Q38 298 48 292 L66 170 Z"/>
      <path d="M178 116 Q194 120 198 150 L210 290 Q202 298 192 292 L174 170 Z"/>
    </g>
    <path class="organ" data-organ="legs" d="M74 296 L116 304 L114 500 Q100 510 84 500 Z M166 296 L124 304 L126 500 Q140 510 156 500 Z"/>
    <g class="organ" data-organ="muscle"><ellipse cx="50" cy="180" rx="9" ry="30" transform="rotate(8 50 180)"/><ellipse cx="190" cy="180" rx="9" ry="30" transform="rotate(-8 190 180)"/></g>
    <ellipse class="organ" data-organ="brain" cx="120" cy="40" rx="27" ry="23"/>
    <g class="organ" data-organ="eye"><circle cx="106" cy="62" r="5.5"/><circle cx="134" cy="62" r="5.5"/></g>
    <g class="organ" data-organ="lungs">
      <path d="M114 128 Q84 124 82 160 Q80 196 88 206 Q104 210 112 198 Z"/>
      <path d="M126 128 Q156 124 158 160 Q160 196 152 206 Q136 210 128 198 Z"/>
    </g>
    <path class="organ" data-organ="heart" d="M124 160 C120 150 104 150 104 164 C104 176 116 184 126 192 C136 184 146 176 146 164 C146 150 130 150 124 160 Z"/>
    <path class="organ" data-organ="liver" d="M78 214 Q100 202 132 210 Q128 236 104 240 Q84 238 78 214 Z"/>
    <path class="organ" data-organ="stomach" d="M136 210 Q160 206 162 226 Q160 246 140 244 Q132 236 140 228 Q138 220 136 210 Z"/>
    <path class="organ" data-organ="pancreas" d="M98 252 Q110 244 124 250 Q140 248 152 244 Q154 252 140 256 Q120 260 104 260 Q96 258 98 252 Z"/>
    <g class="organ" data-organ="kidney"><ellipse cx="96" cy="272" rx="9" ry="14"/><ellipse cx="144" cy="272" rx="9" ry="14"/></g>
    <ellipse class="organ" data-organ="bladder" cx="120" cy="300" rx="13" ry="9"/>
    <path class="organ line" data-organ="vessels" d="M122 178 L120 290 M120 290 L98 330 L96 490 M120 290 L142 330 L144 490 M122 140 L120 112 L120 96 M120 120 L70 130 L44 280 M120 120 L170 130 L196 280"/>
    <path class="organ line" data-organ="nerves" d="M106 320 L104 496 M134 320 L136 496 M106 470 L96 500 M134 470 L144 500"/>
  </svg>`;

  function BodyMap(root, onSelect) {
    root.innerHTML = `<div class="bodymap">${SVG}<div class="bm-tip" hidden></div></div>`;
    this.root = root;
    this.svg = root.querySelector('svg');
    this.tip = root.querySelector('.bm-tip');
    this.states = {};
    this.onSelect = onSelect;
    this.svg.querySelectorAll('.organ').forEach((el) => {
      const id = el.dataset.organ;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', ORGAN_NAMES[id]);
      el.addEventListener('click', () => this._pick(id));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._pick(id); } });
      el.addEventListener('mouseenter', () => this._hover(id, el));
      el.addEventListener('mouseleave', () => { this.tip.hidden = true; });
    });
  }

  BodyMap.prototype._pick = function (id) {
    const st = this.states[id];
    if (st && st.clickable && this.onSelect) this.onSelect(id);
  };

  BodyMap.prototype._hover = function (id, el) {
    const st = this.states[id] || {};
    this.tip.textContent = st.tip || ORGAN_NAMES[id];
    const box = el.getBoundingClientRect(), host = this.root.getBoundingClientRect();
    this.tip.style.left = `${box.left - host.left + box.width / 2}px`;
    this.tip.style.top = `${box.top - host.top - 8}px`;
    this.tip.hidden = false;
  };

  // states: { organId: { color, clickable, tip, ring } }
  BodyMap.prototype.set = function (states, selected) {
    this.states = states;
    this.svg.querySelectorAll('.organ').forEach((el) => {
      const id = el.dataset.organ, st = states[id] || {};
      const prop = LINE_ORGANS.includes(id) ? 'stroke' : 'fill';
      el.style[prop] = st.color || '';
      el.classList.toggle('clickable', !!st.clickable);
      el.classList.toggle('selected', id === selected);
      el.classList.toggle('ring', !!st.ring);
      if (st.ring && prop === 'fill') el.style.stroke = st.ring; else if (prop === 'fill') el.style.stroke = '';
    });
  };

  BodyMap.NAMES = ORGAN_NAMES;
  window.BodyMap = BodyMap;
})();
