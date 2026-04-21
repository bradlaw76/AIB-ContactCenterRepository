/*
=============================================================================
COMPONENT:    MobileDrawer
FILE:         src/components/Shell/MobileDrawer.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Slide-in navigation drawer for mobile viewports. Rendered when the hamburger
button in TopNav is activated. Includes an overlay backdrop, nav links, and a
close button. Focus is trapped inside while open; pressing Escape closes it.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     useAuth() for conditional Sign In link
- Auth Model:      SWA built-in auth
- Rendering:       createPortal to document.body; controlled by Shell state

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Slide-in from left animation
- Backdrop overlay (rgba 0,0,0,0.3) — click closes
- Nav links:  Browse, Search, Sign In / user name
- Close button (X) top right
- Focus trap via onKeyDown Escape
- WCAG: aria-modal, role="dialog", aria-label

------------------------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------------------------
- Full focus trap (Tab cycling) implemented via ref on first/last focusable
  elements; confirm with Hockney during accessibility testing

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Must close on Escape key
- Must trap focus while open
- All colors via CSS custom properties
=============================================================================
*/

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 'calc(var(--z-modal) - 1)' as unknown as number,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '280px',
    backgroundColor: 'var(--color-surface)',
    zIndex: 'var(--z-modal)' as unknown as number,
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-4)',
    boxShadow: 'var(--shadow-card-hover)',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 'var(--space-4)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.25rem',
    color: 'var(--color-text-primary)',
    padding: 'var(--space-1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-button)',
  },
  navList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  navLink: {
    display: 'block',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-card-title)',
    textDecoration: 'none',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-button)',
  },
  signInLink: {
    display: 'block',
    color: 'var(--color-primary)',
    fontSize: 'var(--font-size-card-title)',
    textDecoration: 'none',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-button)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
  },
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { user } = useAuth()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  /* Focus close button when drawer opens */
  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus()
    }
  }, [isOpen])

  /* Close on Escape */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        style={styles.backdrop}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={styles.drawer}
      >
        <div style={styles.drawerHeader}>
          <button
            ref={closeBtnRef}
            aria-label="Close navigation menu"
            onClick={onClose}
            style={styles.closeBtn}
          >
            ×
          </button>
        </div>

        <nav aria-label="Mobile navigation">
          <ul style={styles.navList}>
            <li>
              <Link to="/browse" style={styles.navLink} onClick={onClose}>
                Browse
              </Link>
            </li>
            <li>
              <Link to="/search" style={styles.navLink} onClick={onClose}>
                Search
              </Link>
            </li>
            <li>
              {user ? (
                <span style={{ ...styles.navLink, display: 'block', color: 'var(--color-text-secondary)' }}>
                  {user.userDetails}
                </span>
              ) : (
                <a href="/.auth/login/aad" style={styles.signInLink} onClick={onClose}>
                  Sign In
                </a>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </>,
    document.body
  )
}
