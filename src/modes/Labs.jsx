import Workspace from '../components/Workspace.jsx';
import { Eyebrow } from '../components/ui.jsx';
import { LABS } from '../labs/index.js';
import { useNav } from '../nav.jsx';
import { useStudy } from '../state.jsx';

export default function Labs({ view }) {
  const { go } = useNav();
  const { categories } = useStudy();
  const lab = LABS.find((l) => l.id === view?.lab);

  if (lab) {
    const { Component } = lab;
    return (
      <Workspace mainLabel={lab.title}>
        <div className="crumb">
          <button onClick={() => go({ name: 'labs' })}>← All labs</button>
          <span className="faint">/</span>
          <span className="muted">{lab.domain}</span>
        </div>
        <div className="section" style={{ paddingBottom: 8 }}>
          <Eyebrow>Lab {LABS.indexOf(lab) + 1} of {LABS.length}</Eyebrow>
          <h1 style={{ marginTop: 12 }}>{lab.title}</h1>
          <p className="lede" style={{ marginTop: 8 }}>{lab.blurb}</p>
        </div>
        <Component />
      </Workspace>
    );
  }

  const domains = [...categories, ...new Set(LABS.map((l) => l.domain))].filter((d, i, a) => a.indexOf(d) === i);
  return (
    <Workspace mainLabel="Labs">
      <div className="hero">
        <Eyebrow>Labs</Eyebrow>
        <h1 style={{ marginTop: 14 }}>Hands-on tools for the concepts that are easier to see than to read.</h1>
        <p className="lede" style={{ marginTop: 12 }}>
          {LABS.length} interactive labs grouped by exam domain. They're practice for the performance-based questions and don't affect your mastery stats.
        </p>
      </div>
      <div className="lab-list">
        {domains.map((d) => {
          const labs = LABS.filter((l) => l.domain === d);
          if (!labs.length) return null;
          return (
            <div key={d}>
              <div className="lab-group-title">
                <Eyebrow>{d} · {labs.length}</Eyebrow>
              </div>
              {labs.map((l) => (
                <button key={l.id} className="lab-item" onClick={() => go({ name: 'labs', lab: l.id })}>
                  <span className="idx">{String(LABS.indexOf(l) + 1).padStart(2, '0')}</span>
                  <span>
                    <h3>{l.title}</h3>
                    <p>{l.blurb}</p>
                  </span>
                  <span className="arrow">→</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </Workspace>
  );
}
