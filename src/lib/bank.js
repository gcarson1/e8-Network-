import { parseCSV } from './csv.js';

// CompTIA Network+ N10-009 domains with official exam weightings (%).
// Category names in the CSV are matched loosely so "Network Implementation",
// "2.0 Network Implementations", etc. all land on the same domain.
export const DOMAINS = [
  { key: 'concepts', name: 'Networking Concepts', short: 'Concepts', weight: 23, match: /concept|fundamental/i },
  { key: 'impl', name: 'Network Implementations', short: 'Implementations', weight: 20, match: /implement/i },
  { key: 'ops', name: 'Network Operations', short: 'Operations', weight: 19, match: /operation/i },
  { key: 'sec', name: 'Network Security', short: 'Security', weight: 14, match: /secur/i },
  { key: 'trouble', name: 'Network Troubleshooting', short: 'Troubleshooting', weight: 24, match: /troubleshoot/i },
];

export const EXAM = { code: 'N10-009', questions: 90, minutes: 90, passing: 720, scaleMin: 100, scaleMax: 900 };

export function canonicalCategory(raw) {
  const s = String(raw || '').trim();
  if (!s) return 'Uncategorized';
  const d = DOMAINS.find((d) => d.match.test(s));
  return d ? d.name : s;
}

export function domainFor(category) {
  return DOMAINS.find((d) => d.name === category) || null;
}

// Column aliases: the first matching header wins. Headers are compared
// lower-cased with spaces/dashes collapsed to underscores.
const ALIASES = {
  id: ['id', 'question_id', 'qid', 'item_id'],
  category: ['category', 'domain', 'topic', 'objective', 'section'],
  question: ['question', 'prompt', 'stem', 'question_text', 'text', 'term', 'front'],
  correct: ['correct_answer', 'correct', 'answer', 'answers', 'key', 'correct_answers', 'back'],
  explanation: ['explanation', 'rationale', 'reason', 'notes', 'feedback'],
  type: ['question_type', 'type'],
  source: ['source', 'reference', 'origin'],
  options: ['options', 'choices', 'answers_list'],
};

const norm = (h) => String(h).trim().toLowerCase().replace(/[\s\-]+/g, '_');

/**
 * Turns a CSV export into normalized questions:
 * { id, category, question, options: [{key, text}], correct: ['B'], multi, explanation, source }
 * Accepts option_a..option_z / a..z / choice_1..n columns, or a single
 * "options" column split on | or newlines. Correct answers may be letters
 * (A, "A|C", "A, C"), 1-based numbers, or the literal option text.
 */
export function loadBankFromCSV(text) {
  const rows = parseCSV(text);
  const warnings = [];
  if (rows.length < 2) return { questions: [], categories: [], warnings: ['The file has no data rows.'] };

  const header = rows[0].map(norm);
  const col = (name) => {
    for (const alias of ALIASES[name]) {
      const i = header.indexOf(alias);
      if (i !== -1) return i;
    }
    return -1;
  };
  const idx = Object.fromEntries(Object.keys(ALIASES).map((k) => [k, col(k)]));

  // Option columns in their natural order.
  const optionCols = header
    .map((h, i) => {
      let m = h.match(/^(?:option|opt|choice|answer)_?([a-h])$/) || h.match(/^([a-h])$/);
      if (m) return { i, order: m[1].charCodeAt(0) - 97 };
      m = h.match(/^(?:option|opt|choice)_?(\d+)$/);
      if (m) return { i, order: Number(m[1]) - 1 };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  if (idx.question === -1) warnings.push('No question column found (expected "question", "prompt", or "stem").');

  const questions = [];
  const seen = new Set();
  rows.slice(1).forEach((r, n) => {
    const get = (i) => (i >= 0 && r[i] != null ? String(r[i]).trim() : '');
    const question = get(idx.question);
    if (!question) return;

    let optionTexts = optionCols.map((c) => get(c.i));
    if (!optionTexts.some(Boolean) && idx.options !== -1) {
      optionTexts = get(idx.options).split(/\s*\|\s*|\n/).map((s) => s.trim());
    }
    // Keep original letters even if a middle option is blank.
    const options = optionTexts
      .map((t, i) => ({ key: String.fromCharCode(65 + i), text: t }))
      .filter((o) => o.text);

    const correct = parseCorrect(get(idx.correct), options);
    let id = get(idx.id) || `q${n + 1}`;
    if (seen.has(id)) id = `${id}-${n + 1}`;
    seen.add(id);

    if (options.length && !correct.length) warnings.push(`${id}: correct answer "${get(idx.correct)}" didn't match any option.`);

    questions.push({
      id,
      category: canonicalCategory(get(idx.category)),
      question,
      options,
      correct,
      multi: correct.length > 1 || /multi/i.test(get(idx.type)),
      explanation: get(idx.explanation),
      source: get(idx.source),
      // Rows without options become term-style flashcards (front/back).
      back: options.length ? '' : get(idx.correct),
    });
  });

  const categories = orderCategories(questions.map((q) => q.category));
  return { questions, categories, warnings };
}

function parseCorrect(raw, options) {
  if (!raw || !options.length) return [];
  const keys = new Set(options.map((o) => o.key));
  const exact = options.find((o) => o.text.toLowerCase() === raw.toLowerCase());
  if (exact) return [exact.key];

  const parts = raw.split(/\s*[|,;/&]\s*|\s+and\s+|\s+/i).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const up = p.toUpperCase();
    if (keys.has(up)) out.push(up);
    else if (/^\d+$/.test(p) && options[Number(p) - 1]) out.push(options[Number(p) - 1].key);
    else if (/^[A-H]{2,}$/.test(up) && [...up].every((c) => keys.has(c))) out.push(...up);
  }
  return [...new Set(out)].sort();
}

function orderCategories(list) {
  const unique = [...new Set(list)];
  const known = DOMAINS.map((d) => d.name).filter((n) => unique.includes(n));
  const other = unique.filter((n) => !known.includes(n)).sort();
  return [...known, ...other];
}

// First paragraph of an explanation — the part that explains the right answer.
export function leadExplanation(text) {
  if (!text) return '';
  return text.split(/\n+/)[0];
}
