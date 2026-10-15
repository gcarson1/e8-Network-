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

function ProgressButton() {
  const { openData } = useNav();
  const { dirty } = useStudy();
  return (
    <button className={`tbtn ${dirty ? 'strong' : ''}`} onClick={openData} title={dirty ? 'You have unsaved progress' : 'Save or load your progress file'}>
      {dirty && <span className="unsaved" aria-hidden="true" />}
      {dirty ? 'Save progress' : 'Progress file'}
    </button>
  );
}

function ThemeButton() {
  const { theme, toggleTheme } = useNav();
  return (
    <button className="tbtn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

function NavBar() {
  const { view, go } = useNav();
  const current = NAV.find(([n]) => n === view.name)?.[1];
  return (
    <header className="bar">
      <nav className="bar-nav" aria-label="Main">
        {NAV.map(([name, label]) => (
          <button key={name} aria-current={view.name === name ? 'page' : undefined} onClick={() => go(name)}>
            {label}
          </button>
        ))}
      </nav>
      <span className="bar-mtitle">{current}</span>
      <div className="bar-r">
        <ProgressButton />
        <ThemeButton />
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
      <button className="tbtn" onClick={onExit} style={{ marginLeft: -8 }}>
        ← {exitLabel}
      </button>
      <span className="bar-title">{title}</span>
      {meta.filter(Boolean).map((m, i) => (
        <span key={i} className={`bar-meta ${i > 0 ? 'opt-sm' : ''}`}>
          {m}
        </span>
      ))}
      <div className="bar-r">{right}</div>
    </header>
  );
}

/**
 * Page layout: top bar, main column, side panel (mastery by default).
 * Pass `bar` to replace the nav bar with a session bar.
 */
export default function Page({ bar, side, wide, label, children }) {
  return (
    <>
      {bar || <NavBar />}
      <div className="cols">
        <main className="main" aria-label={label}>
          <div className={`main-in ${wide ? 'wide' : ''}`}>{children}</div>
        </main>
        {side === undefined ? <MasteryPanel /> : side}
      </div>
      {!bar && <MobileNav />}
    </>
  );
}
