import { useEffect, useMemo, useRef, useState } from 'react';
import Page, { SessionBar } from '../components/Page.jsx';
import { SessionSide } from '../components/SessionSide.jsx';
import { Chips, Eyebrow, Paras, Seg } from '../components/ui.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { domainFor, leadExplanation } from '../lib/bank.js';
import { plural, shuffle } from '../lib/util.js';
import { weakestFirst } from './Practice.jsx';

export default function Flashcards() {
  const { questions, terms, categories, items, stats, recordResults } = useStudy();
  const { setGuard, go } = useNav();

  const [deck, setDeck] = useState('both');
  const [cats, setCats] = useState(categories);
  const [order, setOrder] = useState('smart');
  const [count, setCount] = useState(20);
  const [s, setS] = useState(null);

  const allCards = useMemo(
    () => [
      ...questions.map((q) => ({ kind: 'q', id: q.id, category: q.category, q })),
      ...terms.map((t) => ({ kind: 't', id: t.id, category: t.category, t })),
    ],
    [questions, terms],
  );
  const pool = allCards.filter((c) => cats.includes(c.category) && (deck === 'both' || (deck === 'questions' ? c.kind === 'q' : c.kind === 't')));

  const begin = (cards) => {
    setS({ cards, idx: 0, flipped: false, ratings: {}, endedAt: null });
    window.scrollTo(0, 0);
  };
  const start = () => {
    // Smart deck: weakest domains first, then the weakest cards inside each.
    const ordered =
      order === 'smart'
        ? weakestFirst(pool, items, stats).sort((a, b) => (stats[a.category]?.pct ?? 0) - (stats[b.category]?.pct ?? 0))
        : shuffle(pool);
    begin(count === 'all' ? ordered : ordered.slice(0, count));
  };

  const running = s && !s.endedAt;
  const rated = s ? Object.keys(s.ratings).length : 0;
  useEffect(() => {
    if (running && rated > 0) setGuard({ title: 'Leave this deck?', body: 'Cards you rated are already saved to your mastery.', confirmLabel: 'Leave' });
    return () => setGuard(null);
  }, [running, rated, setGuard]);

  const card = s?.cards[s.idx];
  const flip = () => setS((cur) => ({ ...cur, flipped: !cur.flipped }));
  const rate = (gotIt) => {
    if (!s.flipped) return;
    recordResults([[card.id, gotIt]]);
    setS((cur) => {
      const last = cur.idx === cur.cards.length - 1;
      return { ...cur, ratings: { ...cur.ratings, [card.id]: gotIt }, idx: last ? cur.idx : cur.idx + 1, flipped: false, endedAt: last ? Date.now() : null };
    });
  };
  const finish = () => setS((cur) => ({ ...cur, endedAt: Date.now() }));

  const keyRef = useRef(null);
  keyRef.current = (e) => {
    if (!running || document.querySelector('.modal') || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      flip();
    } else if (s.flipped && (e.key === '1' || e.key === 'ArrowLeft')) rate(false);
    else if (s.flipped && (e.key === '2' || e.key === 'ArrowRight')) rate(true);
  };
  useEffect(() => {
    const h = (e) => keyRef.current?.(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── setup ──
  if (!s) {
    const nQ = questions.filter((q) => cats.includes(q.category)).length;
    const nT = terms.filter((t) => cats.includes(t.category)).length;
    const n = count === 'all' ? pool.length : Math.min(count, pool.length);
    return (
      <Page label="Flashcard setup">
        <div className="head">
          <h1>Flashcards</h1>
          <p>Recall, flip, rate yourself. Ratings count toward mastery.</p>
        </div>
        <div className="field">
          <span className="field-label">Deck</span>
          <Seg
            label="Deck"
            value={deck}
            onChange={setDeck}
            options={[
              { value: 'both', label: 'Both', n: nQ + nT },
              { value: 'questions', label: 'Questions', n: nQ },
              { value: 'terms', label: 'Key terms', n: nT },
            ]}
          />
        </div>
        <div className="field">
          <span className="field-label">Domains</span>
          <Chips
            label="Domains"
            options={categories.map((c) => ({ value: c, label: domainFor(c)?.short || c }))}
            selected={cats}
            onToggle={(c) => setCats((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))}
          />
        </div>
        <div className="field">
          <span className="field-label">Order</span>
          <Seg
            label="Order"
            value={order}
            onChange={setOrder}
            options={[
              { value: 'smart', label: 'Weakest first' },
              { value: 'shuffle', label: 'Shuffled' },
            ]}
          />
        </div>
        <div className="field">
          <span className="field-label">Cards</span>
          <Seg label="Number of cards" value={count} onChange={setCount} options={[20, 50, { value: 'all', label: 'All', n: pool.length }]} />
        </div>
        <div className="form-foot">
          <button className="btn primary lg" onClick={start} disabled={!n}>{n ? `Start ${plural(n, 'card')}` : 'No cards match'}</button>
        </div>
      </Page>
    );
  }

  const cells = s.cards.map((c, i) => ({
    state: c.id in s.ratings ? (s.ratings[c.id] ? 'good' : 'bad') : 'empty',
    title: `Card ${i + 1}${c.kind === 't' ? ` · ${c.t.term}` : ''}`,
  }));
  const got = Object.values(s.ratings).filter(Boolean).length;

  // ── done ──
  if (s.endedAt) {
    const learning = s.cards.filter((c) => s.ratings[c.id] === false);
    return (
      <Page label="Deck done">
        <div className="head">
          <Eyebrow>Deck done</Eyebrow>
        </div>
        <div className="score">
          <div className="stat"><div className="v good-text">{got}</div><div className="k">Got it</div></div>
          <div className="stat"><div className="v bad-text">{learning.length}</div><div className="k">Still learning</div></div>
        </div>
        <div className="form-foot" style={{ margin: 'var(--sp-6) 0 var(--sp-7)' }}>
          {learning.length > 0 && <button className="btn primary" onClick={() => begin(shuffle(learning))}>Go again with the {learning.length} still learning</button>}
          <button className={learning.length ? 'tbtn' : 'btn primary'} onClick={() => setS(null)}>New deck</button>
        </div>
        {learning.length > 0 && (
          <section className="sec">
            <Eyebrow>Still learning</Eyebrow>
            <div className="rows" style={{ marginTop: 'var(--sp-3)' }}>
              {learning.map((c) => (
                <div key={c.id} className="small" style={{ padding: 'var(--sp-3) var(--sp-1)', borderBottom: '1px solid var(--line)' }}>
                  {c.kind === 't' ? <b>{c.t.term}</b> : <span className="clamp">{c.q.question}</span>}
                </div>
              ))}
            </div>
          </section>
        )}
      </Page>
    );
  }

  // ── running ──
  return (
    <Page
      label="Flashcards"
      bar={
        <SessionBar
          title="Flashcards"
          onExit={() => go('home')}
          meta={[`${got}/${rated} got it`, `${s.cards.length - rated} left`]}
          right={<button className="btn" onClick={finish}>Finish</button>}
        />
      }
      side={
        <SessionSide
          title="This deck"
          stat={`${got}/${rated}`}
          statLabel="got it"
          cells={cells}
          current={s.idx}
          legend={[
            { cls: 'good', label: 'Got it' },
            { cls: 'bad', label: 'Still learning' },
            { cls: '', label: 'Not yet' },
          ]}
        />
      }
    >
      <div className="measure">
        <div className="spread qmeta">
          <Eyebrow n={`of ${s.cards.length}`}>Card {s.idx + 1}</Eyebrow>
          <span className="faint small">{domainFor(card.category)?.short || card.category}</span>
        </div>
        <div
          className={`card ${s.flipped ? 'back' : ''}`}
          role="button"
          tabIndex={0}
          onClick={flip}
          aria-label={s.flipped ? 'Answer side. Activate to see the question.' : 'Question side. Activate to flip.'}
        >
          <CardFace card={card} flipped={s.flipped} key={`${card.id}-${s.flipped}`} />
        </div>
        {s.flipped ? (
          <div className="rate">
            <button className="btn" onClick={() => rate(false)}>Still learning <span className="k hide-sm">1</span></button>
            <button className="btn primary" onClick={() => rate(true)}>Got it <span className="k hide-sm">2</span></button>
          </div>
        ) : (
          <div className="rate one">
            <button className="btn primary" onClick={flip}>Show answer <span className="k hide-sm">Space</span></button>
          </div>
        )}
      </div>
    </Page>
  );
}

function CardFace({ card, flipped }) {
  if (card.kind === 't') {
    return (
      <div className="face">
        <span className="eyebrow">{flipped ? 'Definition' : 'Term'}</span>
        {flipped ? <span className="def">{card.t.definition}</span> : <span className="term">{card.t.term}</span>}
      </div>
    );
  }
  const q = card.q;
  if (!flipped) {
    return (
      <div className="face">
        <span className="eyebrow">Question{q.multi ? ` · choose ${q.correct.length}` : ''}</span>
        <span className="cstem">{q.question}</span>
        {q.options.length > 0 && (
          <span className="copts">
            {q.options.map((o) => (
              <span key={o.key}><b>{o.key}</b>{o.text}</span>
            ))}
          </span>
        )}
      </div>
    );
  }
  const answers = q.options.filter((o) => q.correct.includes(o.key));
  return (
    <div className="face">
      <span className="eyebrow">Answer</span>
      {answers.length
        ? answers.map((o) => <span className="ans" key={o.key}><b>{o.key}</b>{o.text}</span>)
        : <span className="ans">{q.back}</span>}
      {q.explanation && <div className="why"><Paras text={leadExplanation(q.explanation)} /></div>}
    </div>
  );
}
