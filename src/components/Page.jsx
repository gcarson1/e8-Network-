import { useEffect } from 'react';
import { useNav } from '../nav.jsx';
import { useStudy } from '../state.jsx';
import { Icon } from './ui.jsx';
import MasteryPanel from './MasteryPanel.jsx';

const NAV = [
  ['home', 'Home'],
  ['exam', 'Exam'],
  ['practice', 'Practice'],
  ['flashcards', 'Flashcards'],
  ['labs', 'Labs'],
];

function BarActions() {
  const { openData, theme, toggleTheme } = useNav();
  const { dirty } = useStudy();
  return (
    <div className="bar-r">
      <button className={`tbtn ${dirty ? 'strong' : ''}`} onClick={openData} title={dirty ? 'You have unsaved progress' : 'Save or load your progress file'}>
        {dirty ? <span className="unsaved" aria-hidden="true" /> : <Icon name="save" />}
        {dirty ? 'Save progress' : 'Progress file'}
      </button>
      <button className="tbtn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Light / dark">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
    </div>
  );
}

function NavBar() {
  const { view, go } = useNav();
  const current = NAV.find(([n]) => n === view.name)?.[1];
  return (
    <header className="bar">
      <div className="bar-in">
        <nav className="bar-nav" aria-label="Main">
          {NAV.map(([name, label]) => (
            <button key={name} aria-current={view.name === name ? 'page' : undefined} onClick={() => go(name)}>
              <Icon name={name} />
              {label}
            </button>
          ))}
        </nav>
        <span className="bar-mtitle">{current}</span>
        <BarActions />
      </div>
    </header>
  );
}

function MobileNav() {
  const { view, go } = useNav();
  return (
    <nav className="mnav" aria-label="Main">
      {NAV.map(([name, label]) => (
        <button key={name} aria-current={view.name === name ? 'page' : undefined} onClick={() => go(name)}>
          <Icon name={name} />
          {label === 'Flashcards' ? 'Cards' : label}
        </button>
      ))}
    </nav>
  );
}

/** Focus-mode bar shown during an exam, practice set or deck. */
export function SessionBar({ title, meta = [], onExit, exitLabel = 'Exit', right }) {
  useEffect(() => {
    document.body.classList.add('in-session');
    return () => document.body.classList.remove('in-session');
  }, []);
  return (
    <header className="bar">
      <div className="bar-in">
        <button className="tbtn" onClick={onExit} style={{ marginLeft: 'calc(var(--sp-2) * -1)' }}>
          ← {exitLabel}
        </button>
        <span className="bar-title">{title}</span>
        {meta.filter(Boolean).map((m, i) => (
          <span key={i} className={`bar-meta ${i > 0 ? 'opt-sm' : ''}`}>
            {m}
          </span>
        ))}
        <div className="bar-r">{right}</div>
      </div>
    </header>
  );
}

/**
 * Page layout: top bar, main column, right rail (mastery by default).
 * Pass `bar` to swap the nav bar for a session bar, and `footer` for a
 * quiet line pinned to the bottom of the main column.
 */
export default function Page({ bar, side, wide, label, footer, children }) {
  return (
    <>
      {bar || <NavBar />}
      <div className={`cols ${footer ? 'has-foot' : ''}`}>
        <main className="main" aria-label={label}>
          <div className={`main-in ${wide ? 'wide' : ''}`}>{children}</div>
        </main>
        {side === undefined ? <MasteryPanel /> : side}
        {footer && (
          <footer className="foot">
            <div className="foot-in">{footer}</div>
          </footer>
        )}
      </div>
      {!bar && <MobileNav />}
    </>
  );
}
