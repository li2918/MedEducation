// Patient portal: choose a patient population → a medical category → a diagnosis → its
// narrated animation, key points, questions, warning signs, and teach-back quiz.
// Routes (all work with browser Back / Forward):
//   (no hash)                        home: population cards and a search across everything
//   #browse/<population>             categories for Adults, Pediatrics, or Pregnancy & Postpartum
//   #browse/<population>/<category>  diagnoses in one category
//   #topic/<population>/<topic>      a diagnosis that has no animation yet (Coming soon)
//   #<module>[/<part>]               an existing animation, e.g. #t2d, #asthma/3 (old links)
// Only topics with their own population-specific content play a video; the adult modules are
// never shown as pediatric or pregnancy content (see js/catalog.js).
(function () {
  const $ = (id) => document.getElementById(id);
  MedData.portal = 'patient';
  const tr = (s) => I18N.tr(s);
  I18N.apply();
  I18N.picker($('lang'));
  const Cat = window.MedCatalog;
  Cat.hydrate();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const popName = (id) => tr(Cat.population(id).name);
  const catName = (pop, id) => tr(Cat.category(pop, id).name);

  // A condition has one video (patient.scenes) or several shorter parts (patient.videos).
  const videosOf = (d) => d.patient.videos || [{ title: d.name, length: d.patient.length, audio: d.patient.audio, scenes: d.patient.scenes }];
  let current = null; // { d, k }: condition and part being shown

  const player = new Player($('player'), {
    voice: true,
    // After a part ends, an end screen points to the next part; after the last one, to the quiz.
    onEnd: () => {
      if (!current) return;
      const { d, k } = current, vids = videosOf(d), next = vids[k + 1];
      const tab = $('video-tabs').querySelector(`[data-k="${k + 1}"]`);
      if (tab) tab.classList.add('pulse'); else $('quiz').classList.add('pulse');
      const el = endCard();
      el.innerHTML = next
        ? `<p class="end-kicker">✓ ${tr(`Part ${k + 1} done`)}</p><p class="end-title">${tr(`Up next: Part ${k + 2}`)} · ${tr(next.title)}</p>
           <div class="end-btns"><button class="btn primary" type="button" data-act="next">▶ ${tr(`Watch Part ${k + 2}`)}</button><button class="btn" type="button" data-act="replay">↻ ${tr('Watch again')}</button></div>`
        : `<p class="end-kicker">✓ ${tr(vids.length > 1 ? `You watched all ${vids.length} parts` : 'You watched the video')}</p><p class="end-title">${tr('Now check what you learned')}</p>
           <div class="end-btns"><button class="btn primary" type="button" data-act="quiz">${tr('Take the quick quiz')} ↓</button><button class="btn" type="button" data-act="replay">↻ ${tr('Watch again')}</button></div>`;
      el.hidden = false;
      el.querySelectorAll('button').forEach((b) => {
        b.onclick = () => {
          if (b.dataset.act === 'next') { loadVideo(d, k + 1); player.play(); }
          else if (b.dataset.act === 'quiz') { el.hidden = true; $('quiz').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
          else player.play();
        };
      });
    },
  });
  function endCard() {
    let el = $('player').querySelector('.end-card');
    if (!el) { el = document.createElement('div'); el.className = 'end-card'; el.hidden = true; $('player').querySelector('.stage').appendChild(el); }
    return el;
  }
  // Starting playback any way (button, canvas, chapter) clears the end screen.
  const play = player.play.bind(player);
  player.play = () => { endCard().hidden = true; play(); };

  function loadVideo(d, k) {
    endCard().hidden = true;
    const vids = videosOf(d), v = vids[k] || vids[0];
    k = vids.indexOf(v);
    current = { d, k };
    const tabs = $('video-tabs');
    tabs.hidden = vids.length < 2;
    tabs.innerHTML = vids.map((x, i) =>
      `<button type="button" data-k="${i}" class="${i === k ? 'active' : ''}"><span>${tr('Part ' + (i + 1))}</span>${tr(x.title)}</button>`).join('');
    tabs.querySelectorAll('button').forEach((b) => { b.onclick = () => loadVideo(d, +b.dataset.k); });
    history.replaceState(null, '', '#' + d.id + (k ? '/' + (k + 1) : ''));
    player.load({ title: vids.length > 1 ? `${tr('Part ' + (k + 1))}: ${tr(v.title)}` : tr(d.name), length: v.length, timing: v.timing, audio: v.audio, scenes: v.scenes });
  }

  function renderQuiz(quiz) {
    const body = $('quiz-body');
    body.innerHTML = quiz.map((q, i) => `
      <div class="q" data-i="${i}">
        <p class="q-text">${i + 1}. ${tr(q.q)}</p>
        <div class="q-options">${q.options.map((o, j) => `<button type="button" class="opt" data-j="${j}">${tr(o)}</button>`).join('')}</div>
        <p class="q-explain" hidden></p>
      </div>`).join('');
    body.querySelectorAll('.q').forEach((el) => {
      const q = quiz[+el.dataset.i];
      el.querySelectorAll('.opt').forEach((b) => {
        b.onclick = () => {
          const right = +b.dataset.j === q.answer;
          el.querySelectorAll('.opt').forEach((x) => x.classList.remove('right', 'wrong'));
          b.classList.add(right ? 'right' : 'wrong');
          if (!right) el.querySelector(`.opt[data-j="${q.answer}"]`).classList.add('right');
          const ex = el.querySelector('.q-explain');
          ex.textContent = tr(right ? 'Correct.' : 'Not quite.') + ' ' + tr(q.explain);
          ex.hidden = false;
        };
      });
    });
  }

  // ---- views and navigation ---------------------------------------------------------------
  const VIEWS = ['home', 'browse', 'result', 'soon'];
  function view(name) {
    VIEWS.forEach((v) => { $(v).hidden = v !== name; });
    if (name !== 'result') player.pause();
  }
  // Push a new route and show it. '' is the home page.
  function go(hash) {
    if ((location.hash || '') !== hash) history.pushState(null, '', hash || location.pathname + location.search);
    route();
    window.scrollTo(0, 0);
  }
  // Breadcrumb trail: [[label, hash], ...]; the last item is the current page. back: [label, hash].
  function crumbs(list, back) {
    const el = $('crumbs');
    el.hidden = !list;
    if (!list) { el.innerHTML = ''; return; }
    el.innerHTML = `<ol>${list.map(([t, h], i) => (i < list.length - 1
      ? `<li><a href="${h || location.pathname}" data-h="${h}">${esc(tr(t))}</a></li>`
      : `<li aria-current="page">${esc(tr(t))}</li>`)).join('')}</ol>`
      + (back ? `<a class="crumb-back" href="${back[1]}" data-h="${back[1]}">← ${esc(back[0])}</a>` : '');
    el.querySelectorAll('a').forEach((a) => { a.onclick = (e) => { e.preventDefault(); go(a.dataset.h); }; });
  }
  const trailTo = (t) => [['Patient portal', ''], [Cat.population(t.population).name, `#browse/${t.population}`], [Cat.category(t.population, t.category).name, `#browse/${t.population}/${t.category}`], [t.name]];
  const backTo = (t) => [`${tr('Back to')} ${catName(t.population, t.category)}`, `#browse/${t.population}/${t.category}`];

  // ---- topic cards ----------------------------------------------------------------------------
  let ageFilter = null; // pediatrics only: 'infant' | 'child' | 'teen' | null (all ages)
  const AGE = Object.fromEntries(Cat.AGES.map((a) => [a.id, a.name]));
  const byAge = (list) => (ageFilter ? list.filter((t) => t.population !== 'pediatrics' || (t.ages || []).includes(ageFilter)) : list);
  function statusHtml(t, long) {
    const s = t.contentStatus === 'available'
      ? `<span class="st ready">▶ ${tr('Animation available')}</span>`
      : `<span class="st soon">${tr('Coming soon')}</span>`;
    const rv = t.contentStatus === 'available' || long ? `<span class="st review">${tr(t.clinicalReviewStatus === 'reviewed' ? 'Clinically reviewed' : 'Pending clinical review')}</span>` : '';
    const ages = (t.ages || []).length && t.ages.length < 3 ? `<span class="st age">${t.ages.map((a) => esc(tr(AGE[a]))).join(' · ')}</span>` : '';
    return s + rv + ages;
  }
  function topicList(list, showPop) {
    if (!list.length) return `<p class="muted empty">${tr('No topics match.')}</p>`;
    return `<ul class="topic-list">${list.map((t) => `
      <li><button type="button" class="topic-card${t.contentStatus === 'available' ? ' ready' : ''}" data-id="${t.id}">
        <span class="t-name">${esc(tr(t.name))}</span>
        ${showPop ? `<span class="t-pop">${esc(popName(t.population))} · ${esc(catName(t.population, t.category))}</span>` : ''}
        <span class="t-desc">${esc(tr(t.desc))}</span>
        <span class="t-status">${statusHtml(t)}</span>
      </button></li>`).join('')}</ul>`;
  }
  function bindTopics(root) {
    root.querySelectorAll('.topic-card').forEach((b) => { b.onclick = () => openTopic(Cat.get(b.dataset.id)); });
  }

  // ---- small drawings for the population and category cards -----------------------------------
  function drawIcon(cv) {
    const kind = cv.dataset.icon, r = window.devicePixelRatio || 1, W = 72;
    cv.width = W * r; cv.height = W * r;
    const ctx = cv.getContext('2d');
    ctx.scale(r, r);
    const c = W / 2;
    try {
      if (kind === 'adults') M.person(ctx, c, 42, 15, { mood: 1 });
      else if (kind === 'pediatrics') { M.person(ctx, c - 12, 40, 15, { mood: 1 }); M.person(ctx, c + 16, 52, 9, { mood: 1, look: { shirt: '#ffd36b', shirtShade: '#e8b84a' } }); }
      else if (kind === 'pregnancy') { M.person(ctx, c, 42, 15, { mood: 1, look: { shirt: '#f4a7c0', shirtShade: '#d98aa4' } }); ctx.fillStyle = '#f4a7c0'; ctx.beginPath(); ctx.ellipse(c + 7, 38, 9, 11, 0, 0, M.TAU); ctx.fill(); }
      else if (kind === 'heart') M.heart(ctx, c, c + 2, 14, {});
      else if (kind === 'glucose') { M.glucose(ctx, c - 10, c - 6, 11); M.glucose(ctx, c + 12, c + 4, 9); M.glucose(ctx, c - 4, c + 14, 8); }
      else if (kind === 'lungs') M.lungs(ctx, c, c + 2, 26, {});
      else if (kind === 'stomach') M.stomach(ctx, c, c, 26);
      else if (kind === 'brain') M.brain(ctx, c, c + 4, 30);
      else if (kind === 'kidney') M.kidney(ctx, c, c, 20, {});
      else if (kind === 'bone') {
        ctx.save(); ctx.translate(c, c); ctx.rotate(-0.6); ctx.fillStyle = '#efe6d2'; ctx.strokeStyle = '#c9b48c'; ctx.lineWidth = 2;
        M.rr(ctx, -20, -5, 40, 10, 5); ctx.fill(); ctx.stroke();
        [[-20, -6], [-20, 6], [20, -6], [20, 6]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 7, 0, M.TAU); ctx.fill(); ctx.stroke(); });
        ctx.restore();
      } else if (kind === 'thermometer') {
        ctx.fillStyle = '#e3e9f2'; M.rr(ctx, c - 5, 12, 10, 40, 5); ctx.fill(); ctx.fillStyle = '#e0524a'; M.rr(ctx, c - 2.5, 26, 5, 28, 2.5); ctx.fill(); M.dot(ctx, c, 56, 9, '#e0524a');
      } else if (kind === 'growth') {
        ctx.fillStyle = '#e3e9f2'; ctx.fillRect(c + 12, 10, 8, 54); ctx.fillStyle = '#9fb0c6'; for (let y = 14; y < 62; y += 8) ctx.fillRect(c + 12, y, 4, 2);
        M.person(ctx, c - 6, 44, 11, { mood: 1, look: { shirt: '#9fd8b8', shirtShade: '#7fbf9c' } });
      } else if (kind === 'placenta') {
        M.dot(ctx, c, c, 22, '#d9626b'); ctx.strokeStyle = '#a3263a'; ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const a = i / 6 * M.TAU; ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(c + Math.cos(a) * 18, c + Math.sin(a) * 18); ctx.stroke(); }
        ctx.strokeStyle = '#8fb3e8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(c, c); ctx.quadraticCurveTo(c + 18, c + 26, c + 4, 66); ctx.stroke();
      } else if (kind === 'postpartum') {
        M.person(ctx, c - 6, 42, 15, { mood: 1, look: { shirt: '#f4a7c0', shirtShade: '#d98aa4' } });
        M.dot(ctx, c + 12, 30, 9, '#fff6e5'); M.dot(ctx, c + 12, 26, 5, '#f1c7a5');
      } else if (kind === 'warning') {
        ctx.fillStyle = '#ffd36b'; ctx.strokeStyle = '#d18b00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c, 12); ctx.lineTo(c + 26, 58); ctx.lineTo(c - 26, 58); ctx.closePath(); ctx.fill(); ctx.stroke();
        M.text(ctx, '!', c, 44, { size: 26, weight: 900, color: '#8a5a00' });
      }
    } catch (e) { /* a missing drawing never blocks navigation */ }
  }
  const icon = (kind) => `<canvas class="card-icon" data-icon="${kind}" width="72" height="72" aria-hidden="true"></canvas>`;
  const drawIcons = (root) => root.querySelectorAll('canvas[data-icon]').forEach(drawIcon);

  // ---- home ---------------------------------------------------------------------------------
  function renderHome() {
    view('home');
    crumbs(null);
    $('home-results').hidden = true;
    $('pop-cards').hidden = false;
    $('pop-cards').innerHTML = Cat.POPULATIONS.map((p) => {
      const all = Cat.topics.filter((t) => t.population === p.id), ready = all.filter((t) => t.contentStatus === 'available').length;
      return `<button type="button" class="pop-card" data-pop="${p.id}">
        ${icon(p.id)}
        <span class="pc-name">${esc(tr(p.name))}</span>
        <span class="pc-blurb">${esc(tr(p.blurb))}</span>
        <span class="pc-count">${tr(`${all.length} topics`)} · ${ready ? tr(`${ready} with animations`) : tr('Animations coming soon')}</span>
      </button>`;
    }).join('');
    $('pop-cards').querySelectorAll('.pop-card').forEach((b) => { b.onclick = () => go(`#browse/${b.dataset.pop}`); });
    drawIcons($('pop-cards'));
    // quick picks: the adult animations that exist today
    const ready = Cat.topics.filter((t) => t.population === 'adults' && t.contentId && t.id === t.contentId);
    $('chips').innerHTML = `<span class="muted">${tr('Adult animations available now:')}</span>` + ready.map((t) => `<button type="button" class="chip" data-id="${t.id}">${esc(tr(t.name))}</button>`).join('');
    $('chips').querySelectorAll('.chip').forEach((b) => { b.onclick = () => openTopic(Cat.get(b.dataset.id)); });
  }
  // Results for a search: one clear match opens it; several matches are shown as choices.
  function showResults(root, q, list, showPop, onClear) {
    if (list.length === 1) { openTopic(list[0]); return; }
    root.hidden = false;
    root.innerHTML = `<div class="results-head"><h2>${list.length ? tr('Search results for') : tr('No topics match')} “${esc(q)}”</h2><button type="button" class="btn ghost" data-act="clear">${tr('Clear search')}</button></div>`
      + (list.length ? topicList(list, showPop) : `<p class="muted">${tr('Try another word, or ask us to make this topic.')}</p><button type="button" class="btn primary" data-act="request">${tr('Request this topic')}</button>`);
    bindTopics(root);
    root.querySelector('[data-act="clear"]').onclick = onClear;
    const rq = root.querySelector('[data-act="request"]');
    if (rq) rq.onclick = () => showSoon({ id: 'request-' + q.toLowerCase().replace(/\W+/g, '-'), name: q, desc: '' });
  }
  const suggestMeta = (t) => `${esc(popName(t.population))} · ${tr(t.contentStatus === 'available' ? 'Animation available' : 'Coming soon')}`;

  const globalBox = new SearchBox($('search'), {
    placeholder: 'e.g. diabetes, high blood pressure, asthma',
    search: (q) => Cat.search(q).slice(0, 8).map((r) => r.topic),
    meta: suggestMeta,
    onPick: (t) => openTopic(t),
    onSubmit: (q, list) => {
      if (!q.trim()) return;
      if ($('home').hidden) go('');
      $('pop-cards').hidden = true;
      showResults($('home-results'), q, list, true, () => { globalBox.clear(); renderHome(); });
    },
  });

  // ---- a population or a category -------------------------------------------------------------
  let scope = {};
  const PLACEHOLDER = { adults: 'Search adult conditions', pediatrics: 'Search conditions for children and teens', pregnancy: 'Search pregnancy and postpartum conditions' };
  const NOTICE = {
    pediatrics: 'These topics are being made for children and their families, with child-specific explanations. Adult videos are never shown here in their place.',
    pregnancy: 'Pregnant or recently gave birth? A severe headache, vision changes, heavy bleeding, severe belly pain, or trouble breathing need medical care right away. Call your maternity care team or your local emergency number.',
  };
  const browseBox = new SearchBox($('b-search'), {
    placeholder: 'Search',
    search: (q) => byAge(Cat.search(q, scope).map((r) => r.topic)).slice(0, 8),
    meta: (t) => (scope.category ? tr(t.contentStatus === 'available' ? 'Animation available' : 'Coming soon') : `${esc(catName(t.population, t.category))} · ${tr(t.contentStatus === 'available' ? 'Animation available' : 'Coming soon')}`),
    onPick: (t) => openTopic(t),
    onSubmit: (q, list) => { if (q.trim()) showResults($('b-body'), q, byAge(list), false, () => { browseBox.clear(); route(); }); },
  });
  function browseFrame(pop, title, lead, placeholder) {
    view('browse');
    $('b-title').textContent = title;
    $('b-lead').textContent = lead;
    const n = NOTICE[pop];
    $('b-notice').hidden = !n;
    $('b-notice').textContent = n ? tr(n) : '';
    $('b-notice').className = 'notice' + (pop === 'pregnancy' ? ' urgent' : '');
    browseBox.clear();
    browseBox.input.placeholder = tr(placeholder);
    // age filter (pediatrics only)
    const ages = $('b-ages');
    ages.hidden = pop !== 'pediatrics';
    if (pop === 'pediatrics') {
      ages.innerHTML = `<span class="muted">${tr('Age:')}</span>` + [{ id: '', name: 'All ages' }].concat(Cat.AGES).map((a) => `<button type="button" class="chip${(ageFilter || '') === a.id ? ' on' : ''}" data-age="${a.id}" aria-pressed="${(ageFilter || '') === a.id}">${esc(tr(a.name))}</button>`).join('');
      ages.querySelectorAll('.chip').forEach((b) => { b.onclick = () => { ageFilter = b.dataset.age || null; route(); }; });
    }
  }
  function renderPopulation(pop) {
    const P = Cat.population(pop);
    scope = { population: pop };
    crumbs([['Patient portal', ''], [P.name]], [tr('All patient groups'), '']);
    browseFrame(pop, tr(P.name), tr(P.blurb), PLACEHOLDER[pop]);
    $('b-body').innerHTML = `<div class="cat-grid">${Cat.CATEGORIES[pop].map((c) => {
      const list = byAge(Cat.inCategory(pop, c.id)), ready = list.filter((t) => t.contentStatus === 'available').length;
      return `<button type="button" class="cat-card" data-cat="${c.id}">
        ${icon(c.icon)}
        <span class="cc-name">${esc(tr(c.name))}</span>
        <span class="cc-count">${tr(`${list.length} topics`)}${ready ? ' · ' + tr(`${ready} with animations`) : ''}</span>
        <span class="cc-list">${list.slice(0, 4).map((t) => esc(tr(t.name))).join(' · ')}${list.length > 4 ? ' …' : ''}</span>
      </button>`;
    }).join('')}</div>`;
    $('b-body').querySelectorAll('.cat-card').forEach((b) => { b.onclick = () => go(`#browse/${pop}/${b.dataset.cat}`); });
    drawIcons($('b-body'));
  }
  function renderCategory(pop, cat) {
    const P = Cat.population(pop), Cc = Cat.category(pop, cat);
    scope = { population: pop, category: cat };
    crumbs([['Patient portal', ''], [P.name, `#browse/${pop}`], [Cc.name]], [`${tr('Back to')} ${tr(P.name)}`, `#browse/${pop}`]);
    browseFrame(pop, tr(Cc.name), tr(P.name), 'Search this category');
    $('b-body').innerHTML = topicList(byAge(Cat.inCategory(pop, cat)), false);
    bindTopics($('b-body'));
  }

  // ---- a diagnosis ------------------------------------------------------------------------------
  // Topics with their own content open the animation (old-style #module link); the rest open
  // their Coming soon page. Never falls back to another population's video.
  function openTopic(t) {
    if (!t) return;
    if (t.contentStatus === 'available' && t.contentId) {
      const hash = '#' + t.contentId + ((t.part || 1) > 1 ? '/' + t.part : '');
      if (location.hash !== hash) history.pushState(null, '', hash);
      showModule(MedData.get(t.contentId), (t.part || 1) - 1, t);
    } else {
      const hash = `#topic/${t.population}/${t.id}`;
      if (location.hash !== hash) history.pushState(null, '', hash);
      showSoon(t);
    }
    window.scrollTo(0, 0);
  }
  const WHY = {
    adults: 'This animation is planned for adults.',
    pediatrics: 'This animation will be made for children and their families, using child-specific causes, signs, and care. An adult video is not shown in its place.',
    pregnancy: 'This animation will be made specifically for pregnancy and the weeks after birth. An adult video is not shown in its place.',
  };
  function showSoon(t) {
    view('soon');
    const listed = !!(t.population && Cat.category(t.population, t.category));
    if (listed) crumbs(trailTo(t), backTo(t)); else crumbs([['Patient portal', ''], [t.name]], [tr('All patient groups'), '']);
    SearchBox.requestSoon(t);
    $('soon-meta').textContent = listed ? `${popName(t.population)} · ${catName(t.population, t.category)}` : '';
    $('soon-desc').textContent = t.desc ? tr(t.desc) : '';
    $('soon-status').innerHTML = listed ? statusHtml(t, true) : `<span class="st soon">${tr('Coming soon')}</span>`;
    $('soon-why').textContent = listed ? tr(WHY[t.population]) : '';
    const urgent = listed && t.population === 'pregnancy' && (t.category === 'warning' || t.category === 'blood-pressure');
    $('soon-notice').hidden = !urgent;
    $('soon-notice').className = 'notice urgent';
    $('soon-notice').textContent = urgent ? tr(NOTICE.pregnancy) : '';
  }
  function showModule(d, part, topic) {
    if (!d || !d.patient) return;
    const t = topic || Cat.forContent(d.id);
    view('result');
    if (t) crumbs(trailTo(t), backTo(t)); else crumbs([['Patient portal', ''], [d.name]]);
    $('d-pop').textContent = t ? popName(t.population) : '';
    $('d-pop').hidden = !t;
    $('quiz').classList.remove('pulse');
    $('d-name').textContent = tr(d.name);
    $('d-tagline').textContent = tr(d.patient.tagline);
    $('d-icd').textContent = 'ICD-10 ' + d.icd10;
    $('d-points').innerHTML = d.patient.keyPoints.map((k) => `<li>${tr(k)}</li>`).join('');
    $('d-questions').innerHTML = d.patient.questions.map((k) => `<li><label><input type="checkbox"> ${tr(k)}</label></li>`).join('');
    const flags = d.patient.redFlags || [];
    $('d-flags-wrap').hidden = !flags.length;
    $('d-flags').innerHTML = flags.map((k) => `<li>${tr(k)}</li>`).join('');
    // Separate tap-to-open emergency box, so urgent signs are never only in a video's last seconds.
    const em = d.patient.emergency;
    $('d-emergency').hidden = !em;
    $('d-emergency').open = false;
    if (em) {
      $('d-emergency-title').textContent = tr(em.title);
      $('d-emergency-list').innerHTML = em.items.map((k) => `<li>${tr(k)}</li>`).join('');
      $('d-emergency-action').textContent = tr(em.action || '');
    }
    renderQuiz(d.patient.quiz);
    // Related topics: short links to nearby (adult) conditions, each with a line on how it differs.
    const rel = (d.patient.related || []).filter((r) => MedData.get(r.id) && MedData.get(r.id).patient);
    $('related').hidden = !rel.length;
    $('d-related').innerHTML = rel.map((r) =>
      `<li><a href="#${r.id}" data-id="${r.id}">${tr(MedData.get(r.id).name)}</a><span>${tr(r.why)}</span></li>`).join('');
    $('d-related').querySelectorAll('a').forEach((a) => {
      a.onclick = (e) => { e.preventDefault(); openTopic(Cat.forContent(a.dataset.id)); };
    });
    loadVideo(d, part);
  }

  // ---- routing -----------------------------------------------------------------------------------
  function route() {
    const parts = location.hash.replace(/^#/, '').split('/').map((x) => { try { return decodeURIComponent(x); } catch (e) { return x; } });
    const [a, b, c] = parts;
    if (!a) return renderHome();
    if (a === 'browse' && Cat.population(b)) return c && Cat.category(b, c) ? renderCategory(b, c) : renderPopulation(b);
    if (a === 'topic') { const t = Cat.get(c); if (t && t.population === b) return t.contentStatus === 'available' ? showModule(MedData.get(t.contentId), (t.part || 1) - 1, t) : showSoon(t); }
    // old-style links: #t2d, #asthma/3 (adult animations), #hf (a listed topic), or a request
    const d = MedData.get(a);
    if (d && d.patient) return showModule(d, Math.max(0, (+b || 1) - 1));
    const t = Cat.get(a);
    if (t) return t.contentStatus === 'available' ? showModule(MedData.get(t.contentId), (t.part || 1) - 1, t) : showSoon(t);
    if (a.startsWith('request-')) return showSoon({ id: a, name: a.slice(8).replace(/-/g, ' '), desc: '' });
    const old = MedData.entries().find((e) => e.id === a);
    if (old) return showSoon({ id: old.id, name: old.name, desc: '' });
    return renderHome();
  }
  window.addEventListener('popstate', () => { route(); window.scrollTo(0, 0); });
  route();
})();
