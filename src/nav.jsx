import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal } from './components/ui.jsx';

const NavContext = createContext(null);
export const useNav = () => useContext(NavContext);

/**
 * view: { name: 'home' | 'exam' | 'practice' | 'flashcards' | 'labs', lab?, preset? }
 * A screen with an in-progress session registers a guard message; navigating
 * away then asks for confirmation first.
 */
export function NavProvider({ children }) {
  const [view, setView] = useState({ name: 'home' });
  const [dataOpen, setDataOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const guard = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setDialog({ ...opts, resolve });
      }),
    [],
  );

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
      setView(typeof next === 'string' ? { name: next } : next);
      window.scrollTo(0, 0);
    },
    [confirm],
  );

  const setGuard = useCallback((g) => {
    guard.current = g;
  }, []);

  const value = useMemo(
    () => ({ view, go, setGuard, confirm, openData: () => setDataOpen(true), closeData: () => setDataOpen(false), dataOpen }),
    [view, go, setGuard, confirm, dataOpen],
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
          {dialog.body && (
            <div className="section" style={{ paddingTop: 0 }}>
              <p className="muted">{dialog.body}</p>
            </div>
          )}
          <div className="section row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn quiet" onClick={() => close(false)}>
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
