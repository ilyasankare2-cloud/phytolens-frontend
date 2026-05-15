const KEY = 'trichai_history';

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function saveHistory(h) {
  try { localStorage.setItem(KEY, JSON.stringify(h)); } catch {}
}
