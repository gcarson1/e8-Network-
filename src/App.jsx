import { useEffect } from 'react';
import { StudyProvider, useStudy } from './state.jsx';
import { NavProvider, useNav } from './nav.jsx';
import DataDialog from './components/DataDialog.jsx';
import Home from './modes/Home.jsx';
import Exam from './modes/Exam.jsx';
import Practice from './modes/Practice.jsx';
import Flashcards from './modes/Flashcards.jsx';
import Labs from './modes/Labs.jsx';

const SCREENS = { home: Home, exam: Exam, practice: Practice, flashcards: Flashcards, labs: Labs };

function Shell() {
  const { view, dataOpen } = useNav();
  const { dirty, toast } = useStudy();

  // Warn before closing the tab with unsaved progress.
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const Screen = SCREENS[view.name] || Home;
  return (
    <>
      <Screen key={`${view.name}:${view.lab || ''}:${view.stamp || ''}`} view={view} />
      {dataOpen && <DataDialog />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
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
