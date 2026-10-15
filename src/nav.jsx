import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './components/ui.jsx';
import { getPref, setPref } from './lib/progress.js';

const NavContext = createContext(null);
export const useNav = () => useContext(NavContext);

function initialTheme() {
  const saved = getPref('theme', null);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * view: { name: 'home' | 'exam' | 'practice' | 'flashcards' | 'labs', lab?, preset? }
 * A screen with a session in progress registers a guard; leaving it asks first.
 */
export function NavProvider({ children }) {
  const [view, setView] = useState({ name: 'home' });
  const [dataOpen, setDataOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [theme, setTheme] = useState(initialTheme);
  const guard = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      setPref('theme', next);
      return next;
    });
  }, []);

  const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), []);

  const go = useCallback(
    async (next) => {
      if (guard.current) {
        const ok = await confirm({
          title: guard.current.title || 'Leave this session?',
          body: guard.current.body,
          confirmLabel: guard.current.confirmLabel || 'Leave',
          cancelLabel: 'Stay',
        });
        if (!ok) return;
        guard.current = null;
      }
      setView(typeof next === 'string' ? { name: next, stamp: Date.now() } : { stamp: Date.now(), ...next });
      window.scrollTo(0, 0);
    },
    [confirm],
  );

  const setGuard = useCallback((g) => {
    guard.current = g;
  }, []);

  const value = useMemo(
    () => ({
      view, go, setGuard, confirm, theme, toggleTheme,
      openData: () => setDataOpen(true),
      closeData: () => setDataOpen(false),
      dataOpen,
    }),
    [view, go, setGuard, confirm, theme, toggleTheme, dataOpen],
  );

  const close = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <NavContext.Provider value={value}>
      {children}
      {dialog && (
        <Modal title={dialog.title} onClose={() => close(false)} labelledBy="confirm-title">
          {dialog.body && <p className="muted">{dialog.body}</p>}
          <div className="modal-foot">
            <button className="tbtn" onClick={() => close(false)}>
              {dialog.cancelLabel || 'Cancel'}
            </button>
            <button className="btn primary" onClick={() => close(true)} autoFocus>
              {dialog.confirmLabel || 'OK'}
            </button>
          </div>
        </Modal>
      )}
    </NavContext.Provider>
  );
}
