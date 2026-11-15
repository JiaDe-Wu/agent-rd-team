/**
 * The app bar the three views share: the app's name, the views as tabs — CTO view (every delivery), Delivery detail (the one
 * in hand), Team board (how its run went) — and Projection. It stays where it is when the view changes, and Projection belongs to the
 * app, not to a view: full screen goes on, the person moves between views, it stays on. Each view's own controls
 * (Download on the CTO view; the run, Replay, New requirement … on the board) sit in the row below.
 */

export type ViewKind = 'cto' | 'item' | 'board'

export const APP_CSS = `
.kt-app { display: flex; flex-direction: column; min-height: 100%; color: var(--text); font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif); }
.kt-appbar { display: flex; align-items: center; gap: 6px 18px; flex-wrap: wrap; padding: 10px 20px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
.kt-appbar h1 { margin: 0; font-size: 14px; font-weight: 700; color: var(--muted); letter-spacing: .04em; white-space: nowrap; }
.kt-tabs { display: flex; gap: 4px; align-self: stretch; }
.kt-tabs button { appearance: none; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--text); font: inherit; font-weight: 650;
  padding: 8px 12px 9px; margin-bottom: -1px; cursor: pointer; white-space: nowrap; }
.kt-tabs button:hover { color: var(--text-strong); }
.kt-tabs button[aria-selected="true"] { border-bottom-color: var(--accent); color: var(--text-strong); }
.kt-tabs button:focus-visible, .kt-appbar .kt-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.kt-appbar-grow { flex: 1; }
.kt-appbar .kt-btn { padding: 5px 12px; margin: 4px 0 6px; }
.kt-app.is-projection { position: fixed; inset: 0; z-index: 2147483000; height: 100vh; background: var(--bg); }
.kt-app.is-projection > .kt-appbar { flex: none; padding: 8px 26px 0; }
.kt-app.is-projection > .kt-root.is-projection { position: relative; inset: auto; z-index: auto; flex: 1 1 auto; min-height: 0; height: auto; }
`

const TABS: [ViewKind, string, string][] = [
  ['cto', 'CTO view', 'All deliveries: results and requirement flow'],
  ['item', 'Delivery detail', 'One delivery: cycle time, where the time went, cost, quality, value stream, human decisions'],
  ['board', 'Team board', 'How the multi-agent team delivers: roles, gates, checks, sign-off'],
]

export function AppBar({ view, projection, onView, onProjection, item }: { view: ViewKind; projection: boolean; onView: (v: ViewKind) => void; onProjection: () => void; item?: string }) {
  return (
    <header className="kt-appbar" data-testid="kt-appbar">
      <h1>AI-DLC multi-agent team</h1>
      <div className="kt-tabs" role="tablist" aria-label="Views">
        {TABS.map(([k, name, hint]) => (
          <button type="button" role="tab" key={k} aria-selected={view === k} title={k === 'item' && item ? `${hint} (${item})` : hint} onClick={() => view !== k && onView(k)}>
            {name}
          </button>
        ))}
      </div>
      <span className="kt-appbar-grow" />
      <button type="button" className={`kt-btn${projection ? ' is-on' : ''}`} onClick={onProjection} title={projection ? 'Exit projection (Esc)' : 'Full screen, large text; stays on when you switch views'}>
        {projection ? 'Exit projection' : 'Projection'}
      </button>
    </header>
  )
}
