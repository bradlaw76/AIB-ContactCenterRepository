/*
=============================================================================
COMPONENT:    EmptyState
FILE:         src/components/EmptyState/EmptyState.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Reusable centered empty-state panel used when pages have no resources or no
query matches.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     Props only
- Auth Model:      None
- Rendering:       Client-side React component

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- 48px inline SVG icon
- Semantic title and message typography
- Optional CTA rendered as internal Link styled as primary button

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Use Link for internal navigation actions
=============================================================================
*/

import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  message: string
  action?: { label: string; href: string }
}

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <section
      style={{
        textAlign: 'center',
        paddingTop: '80px',
        paddingBottom: 'var(--space-8)',
        maxWidth: '560px',
        marginInline: 'auto',
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ marginInline: 'auto', color: 'var(--color-border)', marginBottom: 'var(--space-3)' }}
      >
        <path
          fill="currentColor"
          d="M3 5a2 2 0 0 1 2-2h3.172a2 2 0 0 1 1.414.586l1.828 1.828A2 2 0 0 0 12.828 6H19a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5Zm3 12h12a1 1 0 0 0 1-1V8h-6.172a4 4 0 0 1-2.828-1.172L8.172 5H5v11a1 1 0 0 0 1 1Z"
        />
      </svg>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-2)' }}>{title}</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-body)' }}>{message}</p>
      {action ? (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Link className="btn btn-primary" to={action.href}>
            {action.label}
          </Link>
        </div>
      ) : null}
    </section>
  )
}
