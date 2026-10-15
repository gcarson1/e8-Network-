import { useEffect, useMemo, useRef, useState } from 'react';
import Workspace from '../components/Workspace.jsx';
import { SessionSide } from '../components/SessionSide.jsx';
import { Bar, Chips, Eyebrow, Paras, Seg } from '../components/ui.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { leadExplanation } from '../lib/bank.js';
import { plural, shuffle } from '../lib/util.js';
import { weakestFirst } from './Practice.jsx';

export default function Flashcards() {
  const { questions, terms, categories, items, stats, recordResults } = useStudy();
  const { setGuard } = useNav();

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

  const pool = allCards.filter(
    (c) => cats.includes(c.category) && (deck === 'both' || (deck === 'questions' ? c.kind === 'q' : c.kind === 't')),
  );

  const begin = (cards) => {
    setS({ cards, idx: 0, flipped: false, ratings: {}, endedAt: null });
    window.scrollTo(0, 0);
  };

  const start = () => {
    // Smart deck: weakest domains first, then the weakest cards inside them.
    const ordered =
      order === 'smart'
        ? [...weakestFirst(pool, items, stats)].sort((a, b) => (stats[a.category]?.pct ?? 0) - (stats[b.category]?.pct ?? 0))
        : shuffle(pool);
    begin(count === 'all' ? ordered : ordered.slice(0, count));
  };

  const running = s && !s.endedAt;
  const rated = s ? Object.keys(s.ratings).length : 0;
  useEffect(() => {
    if (running && rated > 0) setGuard({ title: 'Stop this deck?', body: 'Cards you already rated are saved to your mastery stats.', confirmLabel: 'Stop' });
    return () => setGuard(null);
  }, [running, rated, setGuard]);

  const card = s?.cards[s.idx];
  const flip = () => setS((cur) => ({ ...cur, flipped: !cur.flipped }));
  const rate = (gotIt) => {
    if (!s.flipped) return;
    recordResults([[card.id, gotIt]]);
    setS((cur) => {
      const ratings = { ...cur.ratings, [card.id]: gotIt };
      const last = cur.idx === cur.cards.length - 1;
      return { ...cur, ratings, idx: last ? cur.idx : cur.idx + 1, flipped: false, endedAt: last ? Date.now() : null };
    });
  };

  const keyRef = useRef(null);
  keyRef.current = (e) => {
    if (!running || document.querySelector('.modal') || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.target.tagName === 'BUTTON') return; // let focused buttons act normally
      e.preventDefault();
      flip();
    }
    else if (s.flipped && (e.key === '1' || e.key === 'ArrowLeft')) rate(false);
    else if (s.flipped && (e.key === '2' || e.key === 'ArrowRight')) rate(true);
  };
  useEffect(() => {
    const h = (e) => keyRef.current?.(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ================= setup =================
  if (!s) {
    const nQ = questions.filter((q) => cats.includes(q.category)).length;
    const nT = terms.filter((t) => cats.includes(t.category)).length;
    const n = count === 'all' ? pool.length : Math.min(count, pool.length);
    return (
      <Workspace mainLabel="Flashcard setup">
        <div className="hero">
          <Eyebrow>Flashcards</Eyebrow>
          <h1 style={{ marginTop: 14 }}>Flip, recall, and rate yourself honestly.</h1>
          <p className="lede" style={{ marginTop: 12 }}>
            "Got it" and "Still learning" feed the same mastery stats as your quiz answers, so a question you nail on a card counts toward its domain.
          </p>
        </div>
        <div className="section">
          <div className="field">
            <span className="label">Deck</span>
            <div>
              <Seg
                label="Deck"
                value={deck}
                onChange={setDeck}
                options={[
                  { value: 'both', label: 'Both' },
                  { value: 'questions', label: `Questions · ${nQ}` },
                  { value: 'terms', label: `Key terms · ${nT}` },
                ]}
              />
              <p className="hint">Question cards show the stem and choices; flip for the answer and why. Key terms are acronyms, ranges and concepts.</p>
            </div>
          </div>
          <div className="field">
            <span className="label">Domains</span>
            <Chips
              options={categories.map((c) => ({ value: c, label: c }))}
              selected={cats}
              onToggle={(c) => setCats((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))}
            />
          </div>
          <div className="field">
            <span className="label">Order</span>
            <div>
              <Seg
                label="Order"
                value={order}
                onChange={setOrder}
                options={[
                  { value: 'smart', label: 'Smart deck' },
                  { value: 'shuffle', label: 'Shuffle' },
                ]}
              />
              <p className="hint">
                {order === 'smart'
                  ? 'Cards from your weakest domains come first, and within each domain the cards you know least.'
                  : 'Pure random order.'}
              </p>
            </div>
          </div>
          <div className="field">
            <span className="label">Cards</span>
            <Seg label="Number of cards" value={count} onChange={setCount} options={[20, 50, { value: 'all', label: `All · ${pool.length}` }]} />
          </div>
        </div>
        <div className="qfoot">
          <button className="btn primary" onClick={start} disabled={!n}>
            {n ? `Start ${plural(n, 'card')}` : 'No cards match'}
          </button>
        </div>
      </Workspace>
    );
  }

  const cells = s.cards.map((c, i) => ({
    state: c.id in s.ratings ? (s.ratings[c.id] ? 'ok' : 'bad') : 'empty',
    title: `Card ${i + 1} · ${c.kind === 't' ? c.t.term : c.category}`,
  }));
  const got = Object.values(s.ratings).filter(Boolean).length;
  const legend = [
    { cls: 'ok', label: 'Got it' },
    { cls: 'bad', label: 'Still learning' },
    { cls: '', label: 'Not yet' },
  ];

  // ================= done =================
  if (s.endedAt) {
    const learning = s.cards.filter((c) => s.ratings[c.id] === false);
    return (
      <Workspace
        mainLabel="Deck complete"
        side={<SessionSide title="This deck" stat={`${got}/${rated}`} statLabel="got it" cells={cells} legend={legend} />}
      >
        <div className="section stack-lg">
          <Eyebrow>Deck complete</Eyebrow>
          <div className="scoreline">
            <div className="stat">
              <div className="v ok-text">{got}</div>
              <div className="k">Got it</div>
            </div>
            <div className="stat">
              <div className="v bad-text">{learning.length}</div>
              <div className="k">Still learning</div>
            </div>
          </div>
        </div>
        {learning.length > 0 && (
          <div className="section stack">
            <Eyebrow>Still learning</Eyebrow>
            <div>
              {learning.map((c) => (
                <div key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '10px 0', fontSize: 14 }}>
                  <span className="mono faint" style={{ fontSize: 12, marginRight: 10 }}>{c.kind === 't' ? 'TERM' : 'Q'}</span>
                  {c.kind === 't' ? <b>{c.t.term}</b> : c.q.question.slice(0, 140) + (c.q.question.length > 140 ? '…' : '')}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="qfoot">
          {learning.length > 0 && (
            <button className="btn primary" onClick={() => begin(shuffle(learning))}>
              Review the {learning.length} again →
            </button>
          )}
          <button className={`btn ${learning.length ? 'quiet' : 'primary'}`} onClick={() => setS(null)}>
            New deck
          </button>
        </div>
      </Workspace>
    );
  }

  // ================= running =================
  return (
    <Workspace
      mainLabel="Flashcards"
      side={
        <SessionSide title="This deck" stat={`${got}/${rated}`} statLabel={`got it · ${s.cards.length - rated} left`} cells={cells} current={s.idx} legend={legend}>
          <button className="btn quiet block" onClick={() => setS((cur) => ({ ...cur, endedAt: Date.now() }))}>
            End deck
          </button>
        </SessionSide>
      }
    >
      <div className="qhead">
        <span className="qnum">
          Card <b>{s.idx + 1}</b> of {s.cards.length}
        </span>
        <span className="faint mono hide-sm" style={{ fontSize: 12 }}>{card.category}</span>
        <span className="spacer" />
        <span className="faint mono hide-sm" style={{ fontSize: 12 }}>Space flips · 1 / 2 rate</span>
      </div>
      <div className="card-stage">
        <div className="progress-line">
          <Bar pct={(rated / s.cards.length) * 100} neutral thin label="Deck progress" />
        </div>
        <div className={`card ${s.flipped ? 'flipped' : ''}`} role="button" tabIndex={0} onClick={flip} aria-label={s.flipped ? 'Card back. Activate to show the front.' : 'Card front. Activate to flip.'}>
          <CardFace card={card} flipped={s.flipped} key={`${card.id}-${s.flipped}`} />
        </div>
        <div className="rate-row">
          <button className="btn learning" onClick={() => rate(false)} disabled={!s.flipped}>
            Still learning <span className="kbd">1</span>
          </button>
          <button className="btn gotit primary" onClick={() => rate(true)} disabled={!s.flipped}>
            Got it <span className="kbd">2</span>
          </button>
        </div>
        {!s.flipped && <p className="faint" style={{ fontSize: 13 }}>Think of the answer, then tap the card to flip it.</p>}
      </div>
    </Workspace>
  );
}

function CardFace({ card, flipped }) {
  if (card.kind === 't') {
    return (
      <span className="face">
        <span className="eyebrow plain">{flipped ? 'Definition' : 'Key term'}</span>
        {flipped ? <span className="def">{card.t.definition}</span> : <span className="term">{card.t.term}</span>}
        {!flipped && <span className="hint-flip">Tap to flip</span>}
      </span>
    );
  }
  const q = card.q;
  if (!flipped) {
    return (
      <span className="face">
        <span className="eyebrow plain">Question{q.multi ? ` · choose ${q.correct.length}` : ''}</span>
        <span className="cstem">{q.question}</span>
        {q.options.length > 0 && (
          <span className="copts">
            {q.options.map((o) => (
              <span key={o.key} style={{ display: 'flex', gap: 10, padding: '3px 0' }}>
                <b>{o.key}</b>
                <span>{o.text}</span>
              </span>
            ))}
          </span>
        )}
        <span className="hint-flip">Tap to flip</span>
      </span>
    );
  }
  const answers = q.options.filter((o) => q.correct.includes(o.key));
  return (
    <span className="face">
      <span className="eyebrow plain">Answer</span>
      {answers.length ? (
        answers.map((o) => (
          <span className="answer" key={o.key}>
            <span>{o.key}</span>
            {o.text}
          </span>
        ))
      ) : (
        <span className="answer">{q.back}</span>
      )}
      {q.explanation && (
        <div className="explain" style={{ fontSize: 14.5 }}>
          <Paras text={leadExplanation(q.explanation)} />
        </div>
      )}
    </span>
  );
}
