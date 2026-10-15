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
    const ok = await copyText(json());
    if (ok) {
      markExported();
      notify('Progress copied. Paste it into a note or message to keep it.');
    } else setError("Couldn't access the clipboard in this browser. Use Download instead.");
  };

  const applyImport = async (raw) => {
    setError('');
    try {
      const { items: incoming } = parseImport(raw);
      if (count > 0) {
        const ok = await confirm({
          title: 'Replace current progress?',
          body: `Importing replaces the ${count} items tracked in this session with ${Object.keys(incoming).length} from the file.`,
          confirmLabel: 'Replace',
        });
        if (!ok) return;
      }
      replaceItems(incoming, 'import');
      notify(`Imported progress for ${Object.keys(incoming).length} items`);
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
    const ok = await confirm({
      title: 'Reset all progress?',
      body: 'This clears every mastery stat in this session. Export first if you want to keep a copy.',
      confirmLabel: 'Reset',
    });
    if (!ok) return;
    replaceItems({}, 'reset');
    clearBackup();
    notify('Progress reset');
  };

  return (
    <Modal title="Progress file" onClose={closeData} labelledBy="data-title">
      <div className="section" style={{ paddingTop: 0 }}>
        <p className="muted" style={{ fontSize: 14 }}>
          This app doesn't save anything on its own. Your mastery stats live in a small <span className="mono">.json</span> file:
          export it when you're done, then import it next time (on any device).
        </p>
      </div>

      <div className="section stack">
        <Eyebrow>Save</Eyebrow>
        <p style={{ fontSize: 14 }}>
          {count ? `${count} items tracked · ${overall.pct}% overall mastery` : 'Nothing tracked yet.'}
          {dirty && <span className="muted"> · unsaved changes</span>}
        </p>
        <div className="row">
          <button className="btn primary" onClick={doExport} disabled={!count}>
            Download .json
          </button>
          <button className="btn quiet" onClick={doCopy} disabled={!count}>
            Copy as text
          </button>
        </div>
        <p className="faint" style={{ fontSize: 12.5 }}>
          On a phone or inside Slack, if the download doesn't work, use Copy as text and paste it into a note to yourself.
        </p>
      </div>

      <div className="section stack">
        <Eyebrow>Restore</Eyebrow>
        <div className="row">
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Choose file…
          </button>
          <button className="btn link" onClick={() => setPaste((p) => !p)}>
            {paste ? 'Hide paste box' : 'Paste text instead'}
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json,text/plain" hidden onChange={onFile} />
        </div>
        {paste && (
          <>
            <textarea
              className="input"
              placeholder='{"app": "netplus-study", ...}'
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Paste progress JSON"
            />
            <button className="btn" onClick={() => applyImport(text)} disabled={!text.trim()}>
              Import pasted text
            </button>
          </>
        )}
        {error && <p className="bad-text" style={{ fontSize: 14 }}>{error}</p>}
      </div>

      <div className="section row between">
        <span className="faint" style={{ fontSize: 13 }}>Start over from zero</span>
        <button className="btn link" onClick={doReset} disabled={!count}>
          Reset progress
        </button>
      </div>
    </Modal>
  );
}
