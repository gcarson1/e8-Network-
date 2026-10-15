// Mastery model
// -------------
// Each study item (question id or key-term id) keeps a tiny history string of
// its last few outcomes, oldest first: "1" = correct / "Got it", "0" = missed /
// "Still learning". Example: "011".
//
// Item score = correct results in the last 3 / max(2, attempts). One correct
// answer is 50%, two in a row is mastered, and a recent miss pulls it back down.
// That rewards answering an item correctly more than once instead of guessing it
// once.
//
// Category mastery = average item score over every question in the category
// (unseen questions count as 0) plus any key terms you've studied there.

export const HISTORY_LEN = 3;

export function record(history = '', correct) {
  return (history + (correct ? '1' : '0')).slice(-HISTORY_LEN);
}

export function itemScore(history) {
  if (!history) return 0;
  const hits = [...history].filter((c) => c === '1').length;
  return hits / Math.max(2, history.length);
}

export function itemStatus(history) {
  if (!history) return 'new';
  const s = itemScore(history);
  if (s >= 0.999) return 'mastered';
  if (history.endsWith('0')) return 'missed';
  return 'learning';
}

/** Returns { [category]: { pct, seen, total, mastered } } */
export function categoryStats(categories, questions, terms, items) {
  const out = {};
  for (const c of categories) out[c] = { sum: 0, n: 0, seen: 0, total: 0, mastered: 0 };
  for (const q of questions) {
    const s = out[q.category];
    if (!s) continue;
    const h = items[q.id];
    s.total++;
    s.n++;
    if (h) {
      s.seen++;
      s.sum += itemScore(h);
      if (itemStatus(h) === 'mastered') s.mastered++;
    }
  }
  for (const t of terms) {
    const s = out[t.category];
    const h = items[t.id];
    if (!s || !h) continue;
    s.n++;
    s.sum += itemScore(h);
  }
  for (const c of categories) {
    const s = out[c];
    s.pct = s.n ? Math.round((s.sum / s.n) * 100) : 0;
    delete s.sum;
    delete s.n;
  }
  return out;
}

/**
 * Overall numbers.
 * readiness: domain mastery weighted by each domain's share of the real exam,
 *            so a weak heavy domain (Troubleshooting, 24%) counts for more than
 *            a weak light one (Security, 14%). Unknown categories weigh equally.
 * pct:       plain mastery across every question.
 */
export function overallStats(stats, weightOf = () => 1) {
  const entries = Object.entries(stats);
  const rows = entries.map(([, r]) => r);
  const total = rows.reduce((a, r) => a + r.total, 0);
  const seen = rows.reduce((a, r) => a + r.seen, 0);
  const pct = rows.length ? Math.round(rows.reduce((a, r) => a + r.pct * r.total, 0) / Math.max(1, total)) : 0;
  const weights = entries.map(([c]) => weightOf(c) || 1);
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  const readiness = Math.round(entries.reduce((a, [, r], i) => a + r.pct * weights[i], 0) / wSum);
  return { total, seen, pct, readiness };
}
