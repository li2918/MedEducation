// Condition search box with typeahead suggestions; shared by both portals.
(function () {
  function SearchBox(root, opts) {
    root.innerHTML = `
      <form class="search-form" role="search">
        <input type="search" autocomplete="off" spellcheck="false" aria-label="Search conditions"
               placeholder="${opts.placeholder || 'Search a condition'}" aria-autocomplete="list" aria-controls="suggest">
        <button class="btn primary" type="submit">Search</button>
      </form>
      <ul class="suggest" id="suggest" role="listbox" hidden></ul>`;
    const input = root.querySelector('input'), list = root.querySelector('.suggest');
    let results = [], active = -1;

    const render = () => {
      list.hidden = !results.length;
      list.innerHTML = results.map((e, i) => `
        <li role="option" data-i="${i}" class="${i === active ? 'active' : ''}" aria-selected="${i === active}">
          <span class="s-name">${e.name}</span>
          <span class="s-meta">${e.icd10}${e.available ? '' : ' · coming soon'}</span>
        </li>`).join('');
    };
    const pick = (e) => { if (!e) return; input.value = e.name; results = []; render(); opts.onPick(e); };

    input.addEventListener('input', () => { results = MedData.search(input.value); active = results.length ? 0 : -1; render(); });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { active = Math.min(results.length - 1, active + 1); render(); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp') { active = Math.max(0, active - 1); render(); ev.preventDefault(); }
      else if (ev.key === 'Escape') { results = []; render(); }
    });
    list.addEventListener('mousedown', (ev) => { const li = ev.target.closest('li'); if (li) { ev.preventDefault(); pick(results[+li.dataset.i]); } });
    input.addEventListener('blur', () => setTimeout(() => { results = []; render(); }, 120));
    root.querySelector('form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const r = results[active] || MedData.search(input.value)[0];
      if (r) pick(r); else opts.onMiss && opts.onMiss(input.value);
    });
    this.input = input;
  }

  // Quick-pick chips for conditions that already have animations.
  SearchBox.chips = function (root, onPick) {
    const avail = MedData.entries().filter((e) => e.available);
    root.innerHTML = '<span class="muted">Available now:</span>' + avail.map((e) => `<button type="button" class="chip" data-id="${e.id}">${e.name}</button>`).join('');
    root.querySelectorAll('.chip').forEach((b) => { b.onclick = () => onPick(avail.find((e) => e.id === b.dataset.id)); });
  };

  // Shared "coming soon" request button, counted locally in this prototype.
  SearchBox.requestSoon = function (entry) {
    document.getElementById('soon-name').textContent = entry.name;
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
