import { useEffect, useRef } from 'react';

export function Eyebrow({ children, n, className = '' }) {
  return (
    <div className={`eyebrow ${className}`}>
      {children}
      {n != null && <span className="n">{n}</span>}
    </div>
  );
}

/** Single-choice row of toggles. options: values or { value, label, n } */
export function Seg({ value, options, onChange, label }) {
  return (
    <div className="toggles" role="group" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return (
          <button key={String(v)} type="button" className="toggle" aria-pressed={value === v} onClick={() => onChange(v)}>
            {l}
            {o?.n != null && <span className="n">{o.n}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Multi-choice row of toggles. */
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

const ICONS = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  flag: <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
};

export function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true">
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
