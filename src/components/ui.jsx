import { useEffect, useRef } from 'react';

export function Eyebrow({ children, n, className = '', style }) {
  return (
    <div className={`eyebrow ${className}`} style={style}>
      {children}
      {n != null && <span className="n">{n}</span>}
    </div>
  );
}

/** Segmented control for a single choice. options: values or { value, label, n } */
export function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {l}
            {o?.n != null && <span className="n">{o.n}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Check toggles for picking several. */
export function Chips({ options, selected, onToggle, label }) {
  return (
    <div className="toggles" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="toggle" aria-pressed={selected.includes(o.value)} onClick={() => onToggle(o.value)}>
          {o.label}
          {o.n != null && <span className="n">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

export function Meter({ pct, ink, thick, label }) {
  return (
    <div
      className={`meter ${ink ? 'ink' : ''} ${thick ? 'thick' : ''}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function Modal({ title, onClose, children, labelledBy = 'modal-title' }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => {
      const all = document.querySelectorAll('.modal');
      if (e.key === 'Escape' && all[all.length - 1] === ref.current) closeRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    if (!ref.current.contains(document.activeElement)) ref.current.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      if (!document.querySelector('.modal')) document.body.style.overflow = '';
      prev?.focus?.({ preventScroll: true });
    };
  }, []);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2 id={labelledBy}>{title}</h2>
          {onClose && (
            <button className="tbtn" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// 24×24 stroke icons, square caps to match the square UI.
const ICONS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9v12h14V9" /><path d="M10 21v-6h4v6" /></>,
  exam: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5" /><path d="M9 2h6" /></>,
  practice: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  flashcards: <><rect x="3" y="7" width="14" height="14" /><path d="M7 3h14v14" /></>,
  labs: <><path d="M9 3h6" /><path d="M10 3v6L4 20h16l-6-11V3" /><path d="M7 15h10" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  flag: <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
  save: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 21h16" /></>,
};

export function Icon({ name, size = 1 }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: `${size}rem`, height: `${size}rem` }} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** Explanation text split into paragraphs; the first one is the answer. */
export function Paras({ text, firstClass = '', restClass = 'rest' }) {
  const paras = String(text || '').split(/\n+/).filter(Boolean);
  return paras.map((p, i) => (
    <p key={i} className={i === 0 ? firstClass : restClass}>
      {p}
    </p>
  ));
}
