import { useEffect, useState } from 'react';
import { StudyProvider, useStudy } from './state.jsx';
import { NavProvider, useNav } from './nav.jsx';
import { Icon } from './components/ui.jsx';
import DataDialog from './components/DataDialog.jsx';
import Home from './modes/Home.jsx';
import Exam from './modes/Exam.jsx';
import Practice from './modes/Practice.jsx';
import Flashcards from './modes/Flashcards.jsx';
import Labs from './modes/Labs.jsx';
import { getPref, setPref } from './lib/progress.js';

const NAV = [
  ['home', 'Home'],
  ['exam', 'Exam'],
  ['practice', 'Practice'],
  ['flashcards', 'Flashcards'],
  ['labs', 'Labs'],
];

function initialTheme() {
  const saved = getPref('theme', null);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function Shell() {
  const { view, go, openData, dataOpen } = useNav();
  const { dirty, toast } = useStudy();
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Warn before closing the tab with unexported progress.
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setPref('theme', next);
  };

  const Screen = { home: Home, exam: Exam, practice: Practice, flashcards: Flashcards, labs: Labs }[view.name] || Home;
  // Re-mount a screen when re-selected from the nav with a preset.
  const key = `${view.name}:${view.stamp || ''}`;

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => go('home')} aria-label="Network+ Study home">
          <span className="brand-mark">N+</span>
          <span className="brand-text">NETWORK+ STUDY</span>
        </button>
        <nav className="nav" aria-label="Main">
          {NAV.map(([name, label]) => (
            <button key={name} aria-current={view.name === name ? 'page' : undefined} onClick={() => go({ name, stamp: Date.now() })}>
              {label}
            </button>
          ))}
        </nav>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={openData} title="Export or import your progress file">
            <Icon name="save" />
            <span>Progress</span>
            {dirty && <span className="dot-badge" aria-label="unsaved changes" />}
          </button>
          <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Toggle dark mode">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>

      <Screen key={key} view={view} />

      {dataOpen && <DataDialog />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StudyProvider>
      <NavProvider>
        <Shell />
      </NavProvider>
    </StudyProvider>
  );
}
