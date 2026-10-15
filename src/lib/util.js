export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

/**
 * Picks `count` questions, splitting the count across categories by weight
 * (largest remainder), then refilling from other categories when one runs dry.
 */
export function weightedSample(questions, count, weightOf) {
  const byCat = new Map();
  for (const q of shuffle(questions)) {
    if (!byCat.has(q.category)) byCat.set(q.category, []);
    byCat.get(q.category).push(q);
  }
  const cats = [...byCat.keys()];
  const weights = cats.map((c) => weightOf(c) || 1);
  const totalW = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / totalW) * count);
  const quota = raw.map(Math.floor);
  let left = count - quota.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => [r - Math.floor(r), i])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => { if (left > 0) { quota[i]++; left--; } });

  const chosen = [];
  const spare = [];
  cats.forEach((c, i) => {
    const pool = byCat.get(c);
    chosen.push(...pool.slice(0, quota[i]));
    spare.push(...pool.slice(quota[i]));
  });
  chosen.push(...shuffle(spare).slice(0, Math.max(0, count - chosen.length)));
  return shuffle(chosen);
}

export function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

export function fmtDuration(totalSeconds) {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

export function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

export function plural(n, word, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`;
}

export function relativeTime(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 90) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return `${Math.round(diff / 86400)} days ago`;
}
