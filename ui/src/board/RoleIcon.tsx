/**
 * Role icons: single-colour line drawings (stroke only, currentColor), one per role key, in place of the
 * emoji in team.json. 24×24 grid, 1.6 stroke, round caps — they take the text colour, so both themes work.
 * Inside the team graph's SVG they render as a nested <svg> positioned by x/y/size.
 */
import type { ReactNode } from 'react'

const PATHS: Record<string, ReactNode> = {
  // Intent: bullseye
  intent: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12h.01" />
    </>
  ),
  // Constraints: scales
  feasibility: (
    <>
      <path d="M12 4v15.5M8 19.5h8M5 7.5h14" />
      <path d="M5 7.5l-2.5 6a2.8 2.8 0 0 0 5 0L5 7.5zM19 7.5l-2.5 6a2.8 2.8 0 0 0 5 0L19 7.5z" />
    </>
  ),
  // Scope: a checklist with ticks
  scope: (
    <>
      <path d="M10 6.5h10M10 12h10M10 17.5h10" />
      <path d="M3.8 6.5l1.4 1.4L8 5M3.8 12l1.4 1.4L8 10.5M3.8 17.5l1.4 1.4L8 16" />
    </>
  ),
  // Product manager: an acceptance checklist
  pm: (
    <>
      <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
      <path d="M9.5 4.5V3.5h5v1" />
      <path d="M9 12.5l2 2 4-4" />
    </>
  ),
  // Product list: a nine-cell grid
  catalog: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
    </>
  ),
  // Product detail: a card with an image
  detail: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <rect x="7" y="6.5" width="10" height="6" rx="1" />
      <path d="M7 15.5h10M7 18h6" />
    </>
  ),
  // Cart and checkout: a shopping cart
  cart: (
    <>
      <path d="M3 4.5h2.5l2.2 10.5h10.6l2-7.5H6.6" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </>
  ),
  // Security review: a shield
  security: (
    <>
      <path d="M12 3.5l7.5 3v5.5c0 4.5-3.2 7.7-7.5 9-4.3-1.3-7.5-4.5-7.5-9V6.5l7.5-3z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  // Architect: layers
  architect: (
    <>
      <path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8 12 3.5z" />
      <path d="M3.5 12.5l8.5 4.5 8.5-4.5" />
      <path d="M3.5 16.5l8.5 4 8.5-4" />
    </>
  ),
  // UI design: a pencil
  designer: (
    <>
      <path d="M4.5 19.5l1-4L15.5 5.5l3 3-10 10-4 1z" />
      <path d="M13.5 7.5l3 3" />
    </>
  ),
  // Testing: a flask
  tester: (
    <>
      <path d="M9 3.5h6" />
      <path d="M10 3.5v6l-5 8.5a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3L14 9.5v-6" />
      <path d="M7.5 15.5h9" />
    </>
  ),
  // Backend: a server
  backend: (
    <>
      <rect x="3.5" y="4.5" width="17" height="6.5" rx="1.5" />
      <rect x="3.5" y="13" width="17" height="6.5" rx="1.5" />
      <path d="M7 7.75h.01M7 16.25h.01" />
    </>
  ),
  // Web frontend: a monitor
  frontend: (
    <>
      <rect x="3.5" y="4.5" width="17" height="11.5" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
  // Android: a phone
  mobile: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  // Operations: a container
  ops: (
    <>
      <path d="M12 3.5l8 4.5v8L12 20.5 4 16V8l8-4.5z" />
      <path d="M4 8l8 4.5L20 8" />
      <path d="M12 12.5v8" />
    </>
  ),
  // Deploy: a rocket
  deploy: (
    <>
      <path d="M12 3c3 2.2 4.5 5.5 4.5 9.5l-2 3h-5l-2-3C7.5 8.5 9 5.2 12 3z" />
      <circle cx="12" cy="9.5" r="1.6" />
      <path d="M9.5 15.5l-2 3.5M14.5 15.5l2 3.5M12 16v4.5" />
    </>
  ),
  // Motion: an arc with sparkles
  motion: (
    <>
      <path d="M3.5 18.5c4-1 7-4 8.5-9" />
      <path d="M17 3.5l1.1 2.4 2.4 1.1-2.4 1.1L17 10.5l-1.1-2.4-2.4-1.1 2.4-1.1z" />
      <path d="M6.5 6.5l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6z" />
    </>
  ),
  // Compliance & security: a shield
  compliance: (
    <>
      <path d="M12 3.5l7 3v5.5c0 4.2-2.9 7.2-7 8.5-4.1-1.3-7-4.3-7-8.5V6.5l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  // Review: a magnifying glass
  reviewer: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  // Lessons: an open book
  knowledge: (
    <>
      <path d="M12 6.5c-2-1.6-4.6-2-8-2v13c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2v-13c-3.4 0-6 .4-8 2z" />
      <path d="M12 6.5v13" />
    </>
  ),
  // Whole product: a layout
  product: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 9h17M9 9v11.5" />
    </>
  ),
}

/** The moments of a run, drawn the same way (the CTO view and Delivery detail use them beside the role icons). */
export const ACTION_ICONS = {
  // Awaiting approval: a person
  wait: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  // Approve: a circle with a tick
  approved: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.4 2.4 4.6-4.8" />
    </>
  ),
  // Send back: an arrow turning back
  bounce: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </>
  ),
  // Sign: a pen
  sign: (
    <>
      <path d="M12 20h8" />
      <path d="M16.5 3.6a2.1 2.1 0 0 1 3 3L7 19.1l-4 .9.9-4L16.5 3.6z" />
    </>
  ),
  // Merge into main: a branch rejoining the trunk
  merge: (
    <>
      <circle cx="18" cy="18" r="2.5" />
      <circle cx="6" cy="6" r="2.5" />
      <path d="M6 21V8.5" />
      <path d="M6 8.5c0 5 4 9.5 9.5 9.5" />
    </>
  ),
  // Knowledge base: an open book
  book: (
    <>
      <path d="M12 6.5c-2-1.6-4.6-2-8-2v13c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2v-13c-3.4 0-6 .4-8 2z" />
      <path d="M12 6.5v13" />
    </>
  ),
  // Issue: a circle with a dot
  issue: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="1.6" />
    </>
  ),
  // PR: a branch pointing at the trunk
  pr: (
    <>
      <circle cx="18" cy="18" r="2.5" />
      <circle cx="6" cy="6" r="2.5" />
      <path d="M6 8.5V21" />
      <path d="M12.5 6H16a2 2 0 0 1 2 2v7.5" />
      <path d="M14.5 3.5L12 6l2.5 2.5" />
    </>
  ),
} satisfies Record<string, ReactNode>
export type ActionIcon = keyof typeof ACTION_ICONS

const FALLBACK = <circle cx="12" cy="12" r="7.5" />

/** A role's drawing by its key; numbered team members (frontend2, backend1) share their kind's drawing. */
export function rolePaths(role: string | null | undefined): ReactNode {
  return (role && (PATHS[role] || PATHS[role.replace(/\d+$/, '')] || (ACTION_ICONS as Record<string, ReactNode>)[role])) || FALLBACK
}

export function RoleIcon({ role, size = 18, className = '' }: { role: string | null | undefined; size?: number; className?: string }) {
  return (
    <svg
      className={`kt-role-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {rolePaths(role)}
    </svg>
  )
}

/** The same drawing inside another SVG (the team graph), centred on (cx, cy). */
export function RoleGlyph({ role, cx, cy, size = 22, className = '' }: { role: string | null | undefined; cx: number; cy: number; size?: number; className?: string }) {
  return (
    <svg
      className={`kt-role-icon ${className}`.trim()}
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {rolePaths(role)}
    </svg>
  )
}
