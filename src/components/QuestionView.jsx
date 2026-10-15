import { Paras } from './ui.jsx';

/**
 * A question's stem and answer rows.
 * reveal: show right/wrong styling (practice feedback, review).
 */
export function QuestionView({ q, selected = [], onToggle, reveal = false, hideStem = false }) {
  const need = q.correct.length;
  return (
    <div>
      {!hideStem && <p className="qstem">{q.question}</p>}
      {q.multi && !reveal && (
        <p className="qnote">
          Choose {need} · {selected.length} selected
        </p>
      )}
      <div className="opts" role={q.multi ? 'group' : 'radiogroup'} aria-label="Answers">
        {q.options.map((o) => {
          const isSel = selected.includes(o.key);
          const isRight = q.correct.includes(o.key);
          let cls = isSel ? 'on' : '';
          let tag = '';
          if (reveal) {
            if (isRight) { cls = 'good'; tag = isSel ? 'Correct' : 'Answer'; }
            else if (isSel) { cls = 'bad'; tag = 'Your pick'; }
            else cls = '';
          }
          return (
            <button
              key={o.key}
              type="button"
              className={`opt ${cls}`}
              role={q.multi ? 'checkbox' : 'radio'}
              aria-checked={isSel}
              disabled={reveal}
              onClick={() => onToggle?.(o.key)}
            >
              <span className="opt-k">{o.key}</span>
              <span className="opt-l">{o.text}</span>
              {tag && <span className="opt-m">{tag}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Explanation({ text, ok, label = 'Why' }) {
  if (!text) return null;
  return (
    <div className={`follow ${ok === true ? 'good' : ok === false ? 'bad' : ''}`}>
      <div className="follow-k">{label}</div>
      <Paras text={text} />
    </div>
  );
}

/** Toggle helper honoring single vs multi-select. */
export function toggleAnswer(q, current = [], key) {
  if (!q.multi) return [key];
  if (current.includes(key)) return current.filter((k) => k !== key);
  if (current.length >= q.correct.length) return [...current.slice(1), key];
  return [...current, key].sort();
}

/** Keyboard: A–H or 1–8 pick an option. */
export function keyToOption(q, e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  const k = e.key.toUpperCase();
  if (/^[A-H]$/.test(k) && q.options.some((o) => o.key === k)) return k;
  if (/^[1-8]$/.test(k)) return q.options[Number(k) - 1]?.key ?? null;
  return null;
}
