// Language support. English is the source text everywhere; other languages are looked up by
// the English string. I18N.tr(s) returns the translation, or s unchanged when there is none.
// Strings with numbers can match a template: "Week 3" looks up "Week {0}" and fills the number
// back in. The language comes from ?lang=, then the saved choice, then English.
(function () {
  const KEY = 'medmotion.lang', LANGS = { en: 'English', zh: '中文' };
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage unavailable */ }
  const param = new URLSearchParams(location.search).get('lang');
  const lang = LANGS[param] ? param : LANGS[saved] ? saved : 'en';
  const dicts = {}, CJK = /[㐀-鿿]/, NUM = /\d+(?:\.\d+)?/g;

  function tr(s) {
    if (lang === 'en' || typeof s !== 'string' || !s || CJK.test(s)) return s;
    const d = dicts[lang] || {};
    if (d[s] != null) return d[s];
    const nums = s.match(NUM);
    if (nums) {
      let i = 0;
      const t = d[s.replace(NUM, () => `{${i++}}`)];
      if (t != null) return t.replace(/\{(\d+)\}/g, (m, k) => nums[+k]);
    }
    if (I18N.onMiss) I18N.onMiss(s);
    return s;
  }

  function setLang(l) {
    try { localStorage.setItem(KEY, l); } catch (e) { /* storage unavailable */ }
    const u = new URL(location.href); u.searchParams.delete('lang'); location.href = u.toString();
  }

  // A <select> for the top bar; changing it reloads the page in that language.
  function picker(root) {
    if (!root) return;
    root.innerHTML = `<select aria-label="Language">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${k === lang ? ' selected' : ''}>${v}</option>`).join('')}</select>`;
    root.querySelector('select').onchange = (e) => setLang(e.target.value);
  }

  // Translate static page text: elements with data-i18n (text) or data-i18n-ph (placeholder).
  function apply(doc = document) {
    doc.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    doc.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = tr(el.textContent.trim()); });
    doc.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = tr(el.placeholder); });
  }

  const I18N = window.I18N = { lang, LANGS, tr, setLang, picker, apply, add: (l, d) => { dicts[l] = Object.assign(dicts[l] || {}, d); }, onMiss: null };
})();
