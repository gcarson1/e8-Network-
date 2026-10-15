import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import bankCsv from '../network_plus_question_bank.csv?raw';
import { domainFor, loadBankFromCSV } from './lib/bank.js';
import { TERMS } from './data/terms.js';
import { categoryStats, overallStats, record } from './lib/mastery.js';
import { loadBackup, saveBackup } from './lib/progress.js';

// The question bank is baked into the HTML at build time.
const BANK = loadBankFromCSV(bankCsv);
if (BANK.warnings.length) console.warn('[question bank]', BANK.warnings);

const StudyContext = createContext(null);
export const useStudy = () => useContext(StudyContext);

export function StudyProvider({ children }) {
  const [items, setItems] = useState({});
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null); // { kind: 'export'|'import', at }
  const [backup, setBackup] = useState(() => loadBackup());
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const terms = useMemo(() => TERMS.filter((t) => BANK.categories.includes(t.category)), []);
  const stats = useMemo(() => categoryStats(BANK.categories, BANK.questions, terms, items), [items, terms]);
  const overall = useMemo(() => overallStats(stats, (c) => domainFor(c)?.weight), [stats]);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  /** results: [[id, correct], ...] */
  const recordResults = useCallback((results) => {
    if (!results.length) return;
    setItems((prev) => {
      const next = { ...prev };
      for (const [id, ok] of results) next[id] = record(next[id], ok);
      return next;
    });
    setDirty(true);
  }, []);

  const replaceItems = useCallback((next, kind) => {
    setItems(next);
    setDirty(kind === 'restore');
    if (kind !== 'restore') setLastSaved({ kind, at: Date.now() });
    setBackup(null);
  }, []);

  const markExported = useCallback(() => {
    setDirty(false);
    setLastSaved({ kind: 'export', at: Date.now() });
  }, []);

  // Best-effort browser backup after real study activity.
  useEffect(() => {
    if (dirty && Object.keys(items).length) saveBackup(items);
  }, [items, dirty]);

  const value = useMemo(
    () => ({
      bank: BANK,
      questions: BANK.questions,
      categories: BANK.categories,
      terms,
      items,
      stats,
      overall,
      dirty,
      lastSaved,
      backup,
      dismissBackup: () => setBackup(null),
      recordResults,
      replaceItems,
      markExported,
      notify,
      toast,
    }),
    [terms, items, stats, overall, dirty, lastSaved, backup, recordResults, replaceItems, markExported, notify, toast],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}
