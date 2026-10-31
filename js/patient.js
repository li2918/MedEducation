// Patient portal: search → narrated animation → key points → teach-back quiz.
(function () {
  const $ = (id) => document.getElementById(id);
  MedData.portal = 'patient';
  const tr = (s) => I18N.tr(s);
  I18N.apply();
  I18N.picker($('lang'));

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

  function show(entry, part = 0) {
    if (!entry) return;
    history.replaceState(null, '', '#' + entry.id);
    if (!entry.available) {
      player.pause();
      $('result').hidden = true;
      $('soon').hidden = false;
      SearchBox.requestSoon(entry);
      return;
    }
    const d = MedData.get(entry.id);
    $('soon').hidden = true;
    $('result').hidden = false;
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
    // Related topics: short links to nearby conditions, each with a line on how it differs.
    const rel = (d.patient.related || []).filter((r) => MedData.get(r.id));
    $('related').hidden = !rel.length;
    $('d-related').innerHTML = rel.map((r) =>
      `<li><a href="#${r.id}" data-id="${r.id}">${tr(MedData.get(r.id).name)}</a><span>${tr(r.why)}</span></li>`).join('');
    $('d-related').querySelectorAll('a').forEach((a) => {
      a.onclick = (e) => { e.preventDefault(); show(MedData.entries().find((x) => x.id === a.dataset.id)); };
    });
    loadVideo(d, part);
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  new SearchBox($('search'), {
    placeholder: 'e.g. type 2 diabetes, high blood pressure',
    onPick: show,
    onMiss: (q) => show({ id: 'request-' + q.toLowerCase().replace(/\W+/g, '-'), name: q, available: false }),
  });
  SearchBox.chips($('chips'), show);

  const [initial, partNo] = location.hash.slice(1).split('/');
  if (initial) show(MedData.entries().find((e) => e.id === initial), Math.max(0, (+partNo || 1) - 1));
})();
