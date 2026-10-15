import { useEffect, useRef } from 'react';

export function Eyebrow({ children, plain, className = '' }) {
  return <div className={`eyebrow ${plain ? 'plain' : ''} ${className}`}>{children}</div>;
}

export function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)} disabled={o.disabled}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function Chips({ options, selected, onToggle }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o.value} type="button" className="chip" aria-pressed={selected.includes(o.value)} onClick={() => onToggle(o.value)}>
          <span className="box" />
          {o.label}
          {o.count != null && <span className="count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Bar({ pct, neutral, thin, label }) {
  return (
    <div
      className={`bar ${neutral ? 'neutral' : ''} ${thin ? 'thin' : ''}`}
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
      // Only the top-most dialog reacts to Escape.
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
        <div className="section tight row">
          <h3 id={labelledBy}>{title}</h3>
          {onClose && (
            <button className="icon-btn modal-close" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

const ICONS = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  save: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 17v3h16v-3" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>,
};

export function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** Paragraph-split text (explanations contain newlines). */
export function Paras({ text, firstClass = 'first', restClass = 'rest' }) {
  const paras = String(text || '').split(/\n+/).filter(Boolean);
  return paras.map((p, i) => (
    <p key={i} className={i === 0 ? firstClass : restClass}>
      {p}
    </p>
  ));
}
