import { useRef, useState } from 'react';
import { Eyebrow, Modal } from './ui.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { buildExport, clearBackup, copyText, downloadText, fileName, parseImport, serialize } from '../lib/progress.js';

export default function DataDialog() {
  const { items, stats, replaceItems, markExported, notify, overall, dirty } = useStudy();
  const { closeData, confirm } = useNav();
  const fileRef = useRef(null);
  const [paste, setPaste] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const count = Object.keys(items).length;

  const json = () => serialize(buildExport(items, stats));

  const doExport = () => {
    downloadText(fileName(), json());
    markExported();
    notify('Progress file downloaded');
  };

  const doCopy = async () => {
    if (await copyText(json())) {
      markExported();
      notify('Copied. Paste it into a note to keep it.');
    } else setError("This browser blocked the clipboard. Use Download instead.");
  };

  const applyImport = async (raw) => {
    setError('');
    try {
      const { items: incoming } = parseImport(raw);
      if (count > 0) {
        const ok = await confirm({
          title: 'Replace current progress?',
          body: `This replaces the ${count} items tracked now with ${Object.keys(incoming).length} from the file.`,
          confirmLabel: 'Replace',
        });
        if (!ok) return;
      }
      replaceItems(incoming, 'import');
      notify(`Loaded progress for ${Object.keys(incoming).length} items`);
      closeData();
    } catch (e) {
      setError(e.message);
    }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => applyImport(String(reader.result));
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(f);
  };

  const doReset = async () => {
    const ok = await confirm({ title: 'Reset all progress?', body: 'Every mastery stat goes back to zero.', confirmLabel: 'Reset' });
    if (!ok) return;
    replaceItems({}, 'reset');
    clearBackup();
    notify('Progress reset');
  };

  return (
    <Modal title="Progress file" onClose={closeData} labelledBy="data-title">
      <p className="muted small">Nothing saves automatically. Download your file when you finish, and load it next time on any device.</p>

      <div className="modal-sec stack">
        <Eyebrow>Save</Eyebrow>
        <p className="small">
          {count ? `${count} items · ${overall.readiness}% exam readiness` : 'Nothing to save yet.'}
          {dirty && <span className="muted"> · unsaved changes</span>}
        </p>
        <div className="hstack">
          <button className="btn primary" onClick={doExport} disabled={!count}>Download .json</button>
          <button className="tbtn" onClick={doCopy} disabled={!count}>Copy as text</button>
        </div>
      </div>

      <div className="modal-sec stack">
        <Eyebrow>Load</Eyebrow>
        <div className="hstack">
          <button className="btn" onClick={() => fileRef.current?.click()}>Choose file…</button>
          <button className="tbtn" onClick={() => setPaste((p) => !p)}>{paste ? 'Hide paste box' : 'Paste text'}</button>
          <input ref={fileRef} type="file" accept=".json,application/json,text/plain" hidden onChange={onFile} />
        </div>
        {paste && (
          <>
            <textarea className="input" placeholder='{"app": "netplus-study", …}' value={text} onChange={(e) => setText(e.target.value)} aria-label="Paste progress JSON" />
            <button className="btn" onClick={() => applyImport(text)} disabled={!text.trim()}>Load pasted text</button>
          </>
        )}
        {error && <p className="bad-text small">{error}</p>}
      </div>

      <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
        <span className="faint small">Phone or Slack? Copy as text works when downloads don't.</span>
        <button className="tbtn" onClick={doReset} disabled={!count}>Reset</button>
      </div>
    </Modal>
  );
}
