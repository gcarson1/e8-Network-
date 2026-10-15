import { useState } from 'react';
import Page from '../components/Page.jsx';
import { Eyebrow } from '../components/ui.jsx';
import { LABS } from '../labs/index.js';
import { useNav } from '../nav.jsx';
import { useStudy } from '../state.jsx';
import { domainFor } from '../lib/bank.js';

export default function Labs({ view }) {
  const { go } = useNav();
  const { categories } = useStudy();
  const lab = LABS.find((l) => l.id === view?.lab);
  const [act, setAct] = useState(() => lab?.activities.find((x) => x.id === view?.act)?.id || lab?.activities[0].id);

  if (lab) {
    const cur = lab.activities.find((x) => x.id === act) || lab.activities[0];
    const { Component } = cur;
    return (
      <Page label={lab.title} wide>
        <button className="tbtn back" onClick={() => go('labs')}>← Labs</button>
        <Eyebrow>{domainFor(lab.domain)?.short || lab.domain}</Eyebrow>
        <h1 style={{ marginTop: 'var(--sp-1h)' }}>{lab.title}</h1>
        {lab.activities.length > 1 ? (
          <div className="utabs" role="tablist" style={{ marginTop: 'var(--sp-4)' }}>
            {lab.activities.map((x) => (
              <button key={x.id} role="tab" className="utab" aria-selected={x.id === cur.id} onClick={() => setAct(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ height: '1.375rem' }} />
        )}
        <div key={cur.id}>
          <Component />
        </div>
      </Page>
    );
  }

  const domains = [...new Set([...categories, ...LABS.map((l) => l.domain)])];
  return (
    <Page label="Labs">
      <div className="head">
        <h1>Labs</h1>
        <p>Hands-on practice for the performance-based questions. Labs don't change your mastery stats.</p>
      </div>
      {domains.map((d) => {
        const labs = LABS.filter((l) => l.domain === d);
        if (!labs.length) return null;
        return (
          <section key={d} style={{ marginBottom: 'var(--sp-7)' }}>
            <Eyebrow n={labs.length}>{domainFor(d)?.short || d}</Eyebrow>
            <div className="rows" style={{ marginTop: 'var(--sp-2)' }}>
              {labs.map((l) => (
                <button key={l.id} className="rowbtn" onClick={() => go({ name: 'labs', lab: l.id })}>
                  <span>
                    <span className="t">{l.title}</span>
                    <span className="s">{l.activities.map((x) => x.label).join(' · ')}</span>
                  </span>
                  <span className="r">→</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </Page>
  );
}
