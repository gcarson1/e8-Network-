import MasteryPanel from './MasteryPanel.jsx';

/** Two-column layout: sidebar (mastery panel by default) + main panel. */
export default function Workspace({ side, children, mainLabel }) {
  return (
    <div className="workspace">
      {side === undefined ? <MasteryPanel /> : side}
      <main className="panel main" aria-label={mainLabel}>
        {children}
      </main>
    </div>
  );
}
