// Patient portal: search → narrated animation → key points → teach-back quiz.
(function () {
  const $ = (id) => document.getElementById(id);

  const player = new Player($('player'), {
    voice: true,
    onEnd: () => $('quiz').classList.add('pulse'),
  });

  function renderQuiz(quiz) {
    const body = $('quiz-body');
    body.innerHTML = quiz.map((q, i) => `
      <div class="q" data-i="${i}">
        <p class="q-text">${i + 1}. ${q.q}</p>
        <div class="q-options">${q.options.map((o, j) => `<button type="button" class="opt" data-j="${j}">${o}</button>`).join('')}</div>
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
          ex.textContent = (right ? 'Correct. ' : 'Not quite. ') + q.explain;
          ex.hidden = false;
        };
      });
    });
  }

  function show(entry) {
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
    $('d-name').textContent = d.name;
    $('d-tagline').textContent = d.patient.tagline;
    $('d-icd').textContent = 'ICD-10 ' + d.icd10;
    $('d-points').innerHTML = d.patient.keyPoints.map((k) => `<li>${k}</li>`).join('');
    $('d-questions').innerHTML = d.patient.questions.map((k) => `<li><label><input type="checkbox"> ${k}</label></li>`).join('');
    const flags = d.patient.redFlags || [];
    $('d-flags-wrap').hidden = !flags.length;
    $('d-flags').innerHTML = flags.map((k) => `<li>${k}</li>`).join('');
    renderQuiz(d.patient.quiz);
    player.load({ title: d.name, scenes: d.patient.scenes });
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  new SearchBox($('search'), {
    placeholder: 'e.g. type 2 diabetes, high blood pressure',
    onPick: show,
    onMiss: (q) => show({ id: 'request-' + q.toLowerCase().replace(/\W+/g, '-'), name: q, available: false }),
  });
  SearchBox.chips($('chips'), show);

  const initial = location.hash.slice(1);
  if (initial) show(MedData.entries().find((e) => e.id === initial));
})();
