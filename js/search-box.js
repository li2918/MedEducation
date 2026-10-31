// Condition search box with typeahead suggestions; shared by both portals.
// Optional hooks (the provider portal uses the defaults): opts.search(q) returns the entries to
// suggest, opts.meta(e) the grey line under each name, and opts.onSubmit(q, results) handles
// Enter / the Search button instead of opening the best match.
(function () {
  const tr = (s) => (window.I18N ? I18N.tr(s) : s);
  let uid = 0;
  function SearchBox(root, opts) {
    const sid = 'suggest' + (uid++ ? uid : '');
    root.innerHTML = `
      <form class="search-form" role="search">
        <input type="search" autocomplete="off" spellcheck="false" aria-label="${tr('Search conditions')}"
               placeholder="${tr(opts.placeholder || 'Search a condition')}" aria-autocomplete="list" aria-controls="${sid}">
        <button class="btn primary" type="submit">${tr('Search')}</button>
      </form>
      <ul class="suggest" id="${sid}" role="listbox" hidden></ul>`;
    const input = root.querySelector('input'), list = root.querySelector('.suggest');
    let results = [], active = -1;
    const find = opts.search || ((q) => MedData.search(q));
    const meta = opts.meta || ((e) => `${e.icd10}${e.available ? '' : ' · ' + tr('coming soon')}`);

    const render = () => {
      list.hidden = !results.length;
      list.innerHTML = results.map((e, i) => `
        <li role="option" data-i="${i}" class="${i === active ? 'active' : ''}" aria-selected="${i === active}">
          <span class="s-name">${tr(e.name)}</span>
          <span class="s-meta">${meta(e)}</span>
        </li>`).join('');
    };
    const pick = (e) => { if (!e) return; input.value = tr(e.name); results = []; render(); opts.onPick(e); };

    input.addEventListener('input', () => { results = find(input.value); active = results.length ? 0 : -1; render(); });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { active = Math.min(results.length - 1, active + 1); render(); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp') { active = Math.max(0, active - 1); render(); ev.preventDefault(); }
      else if (ev.key === 'Escape') { results = []; render(); }
    });
    list.addEventListener('mousedown', (ev) => { const li = ev.target.closest('li'); if (li) { ev.preventDefault(); pick(results[+li.dataset.i]); } });
    input.addEventListener('blur', () => setTimeout(() => { results = []; render(); }, 120));
    root.querySelector('form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (opts.onSubmit) { const all = find(input.value); results = []; render(); opts.onSubmit(input.value, all); return; }
      const r = results[active] || find(input.value)[0];
      if (r) pick(r); else opts.onMiss && opts.onMiss(input.value);
    });
    this.input = input;
    this.clear = () => { input.value = ''; results = []; render(); };
  }

  // Quick-pick chips for conditions that already have animations.
  SearchBox.chips = function (root, onPick) {
    const avail = MedData.entries().filter((e) => e.available);
    root.innerHTML = `<span class="muted">${tr('Available now:')}</span>` + avail.map((e) => `<button type="button" class="chip" data-id="${e.id}">${tr(e.name)}</button>`).join('');
    root.querySelectorAll('.chip').forEach((b) => { b.onclick = () => onPick(avail.find((e) => e.id === b.dataset.id)); });
  };

  // Shared "coming soon" request button, counted locally in this prototype.
  SearchBox.requestSoon = function (entry) {
    document.getElementById('soon-name').textContent = tr(entry.name);
    const msg = document.getElementById('soon-msg'), btn = document.getElementById('soon-btn');
    msg.hidden = true; btn.disabled = false;
    btn.onclick = () => {
      try {
        const k = 'medmotion.requests', r = JSON.parse(localStorage.getItem(k) || '{}');
        r[entry.id] = (r[entry.id] || 0) + 1; localStorage.setItem(k, JSON.stringify(r));
      } catch (e) { /* storage unavailable */ }
      msg.hidden = false; btn.disabled = true;
    };
  };

  window.SearchBox = SearchBox;
})();
