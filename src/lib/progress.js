// Progress file = the persistence model. A lean JSON document the user
// downloads and re-imports; nothing here depends on browser storage surviving.

export const APP_ID = 'netplus-study';
export const FILE_VERSION = 1;
const BACKUP_KEY = 'netplus-study:backup';

export function buildExport(items, stats) {
  const categories = Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, v.pct]));
  return {
    app: APP_ID,
    version: FILE_VERSION,
    exportedAt: new Date().toISOString(),
    categories, // informational; recomputed from items on import
    items, // { [questionId]: "011" } recent outcomes, oldest first
  };
}

export function serialize(payload) {
  // One item per line keeps the file small but still readable/diffable.
  const { items, ...rest } = payload;
  const head = JSON.stringify(rest, null, 2).replace(/\n}$/, '');
  const body = Object.entries(items)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n');
  return `${head},\n  "items": {\n${body}\n  }\n}\n`;
}

/** Throws a readable Error if the text isn't a progress file. */
export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(String(text).trim());
  } catch {
    throw new Error("That isn't valid JSON. Pick the .json file you exported, or paste its full contents.");
  }
  if (!data || data.app !== APP_ID || typeof data.items !== 'object') {
    throw new Error("That file isn't a Network+ Study progress file.");
  }
  if (data.version > FILE_VERSION) {
    throw new Error('This progress file was made by a newer version of the app.');
  }
  const items = {};
  for (const [k, v] of Object.entries(data.items)) {
    if (typeof v === 'string' && /^[01]{1,8}$/.test(v)) items[k] = v.slice(-3);
  }
  return { items, exportedAt: data.exportedAt || null };
}

export function fileName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `netplus-progress-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

export function downloadText(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older in-app browsers: fall back to a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

// Best-effort safety net only (private windows, Slack's in-app browser and
// cleared site data can all wipe it). Export/import remains the real save.
export function saveBackup(items) {
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify({ items, at: Date.now() })); } catch { /* ignore */ }
}
export function loadBackup() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data.items === 'object' ? data : null;
  } catch {
    return null;
  }
}
export function clearBackup() {
  try { localStorage.removeItem(BACKUP_KEY); } catch { /* ignore */ }
}

export function getPref(key, fallback) {
  try { return localStorage.getItem(`netplus-study:${key}`) ?? fallback; } catch { return fallback; }
}
export function setPref(key, value) {
  try { localStorage.setItem(`netplus-study:${key}`, value); } catch { /* ignore */ }
}
