// Demo-only session handling. Nothing leaves the browser; a real build needs a backend
// with proper identity verification (e.g. NPPES NPI lookup) before granting clinician access.
(function () {
  const KEY = 'medmotion.session';
  let memory = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || memory; } catch (e) { return memory; }
  }
  function save(s) {
    memory = s;
    try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
  }

  // NPI check digit: Luhn over "80840" + the 10-digit NPI.
  function validNPI(npi) {
    if (!/^\d{10}$/.test(npi)) return false;
    const digits = ('80840' + npi).split('').map(Number);
    let sum = 0;
    for (let i = digits.length - 1, alt = false; i >= 0; i--, alt = !alt) {
      let d = digits[i];
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  // Clinicians may also open the patient portal (e.g. to show a patient); patients may not open the clinician portal.
  function require(role) {
    const s = load();
    if (!s || (role === 'clinician' && s.role !== 'clinician')) {
      location.replace('index.html' + (role ? `?portal=${role}` : ''));
      return null;
    }
    return s;
  }

  function signOut() { save(null); location.href = 'index.html'; }

  window.Auth = { load, save, validNPI, require, signOut };
})();
