import { Paras } from './ui.jsx';

/**
 * Renders a question's stem and answer options.
 * reveal: show correct/incorrect styling (practice feedback, exam review).
 */
export function QuestionView({ q, selected = [], onToggle, reveal = false, locked = false }) {
  const need = q.correct.length;
  return (
    <div className="stack-lg">
      {q.question && <p className="stem">{q.question}</p>}
      {q.multi && (
        <p className="select-note">
          Select {need} · {selected.length}/{need} chosen
        </p>
      )}
      <div className="options" role={q.multi ? 'group' : 'radiogroup'} aria-label="Answer choices">
        {q.options.map((o) => {
          const isSel = selected.includes(o.key);
          const isRight = q.correct.includes(o.key);
          let cls = '';
          let tag = '';
          if (reveal) {
            if (isRight) { cls = 'is-correct'; tag = isSel ? 'Correct' : 'Answer'; }
            else if (isSel) { cls = 'is-wrong'; tag = 'Your pick'; }
          }
          return (
            <button
              key={o.key}
              type="button"
              className={`option ${q.multi ? 'multi' : ''} ${isSel ? 'selected' : ''} ${cls}`}
              role={q.multi ? 'checkbox' : 'radio'}
              aria-checked={isSel}
              disabled={locked || reveal}
              onClick={() => onToggle?.(o.key)}
            >
              <span className="key">{o.key}</span>
              <span>{o.text}</span>
              <span className="tag">{tag}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Explanation({ text }) {
  if (!text) return null;
  return (
    <div className="explain">
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

/** Keyboard: A–G or 1–7 pick an option. Returns the option key or null. */
export function keyToOption(q, e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  const k = e.key.toUpperCase();
  if (/^[A-H]$/.test(k) && q.options.some((o) => o.key === k)) return k;
  if (/^[1-8]$/.test(k)) return q.options[Number(k) - 1]?.key ?? null;
  return null;
}
