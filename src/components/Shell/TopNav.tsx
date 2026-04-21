/*
=============================================================================
COMPONENT:    TopNav
FILE:         src/components/Shell/TopNav.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Sticky 48px top navigation bar. Contains the portal brand link (left), nav
links and search bar (center/right), and auth state (Sign In button or user
avatar). Collapses to a hamburger menu icon on mobile (<768px).

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     useAuth() for user state
- Auth Model:      SWA built-in auth (/.auth/login/aad, /.auth/logout)
- Rendering:       Client-side; sticky via CSS position: sticky

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Brand:           "Contact Center Portal" linked to /
- Nav links:       Browse (/browse)
- Search bar:      Input + icon, navigates to /search?q= on Enter
- Auth:            Sign In button (unauthenticated) | username display (auth'd)
- Mobile:          Hamburger icon triggers MobileDrawer; search collapses to icon
- Accessibility:   WCAG 2.1 AA — aria-label on icon buttons, focus management

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Height must remain 48px (--nav-height: 48px)
- All colors via CSS custom properties — no hardcoded hex
- z-index must use var(--z-nav)
=============================================================================
*/

import { useState, useRef, type KeyboardEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface TopNavProps {
  onMenuOpen: () => void
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 'var(--z-nav)' as unknown as number,
    height: '48px',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    paddingInline: 'var(--space-4)',
    gap: 'var(--space-4)',
  },
  brand: {
    color: 'var(--color-primary)',
    fontSize: 'var(--font-size-card-title)',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  spacer: {
    flex: 1,
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  navLink: {
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-body)',
    textDecoration: 'none',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-button)',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-button)',
    overflow: 'hidden',
    backgroundColor: 'var(--color-background)',
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    padding: 'var(--space-1) var(--space-2)',
    fontSize: 'var(--font-size-body)',
    color: 'var(--color-text-primary)',
    minWidth: '180px',
    outline: 'none',
  },
  searchButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 'var(--space-1) var(--space-2)',
    display: 'flex',
    alignItems: 'center',
    color: 'var(--color-text-secondary)',
  },
  signInBtn: {
    border: '1px solid var(--color-primary)',
    borderRadius: 'var(--radius-button)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-primary)',
    padding: 'var(--space-1) var(--space-3)',
    fontSize: 'var(--font-size-body)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontWeight: 'var(--font-weight-semibold)' as unknown as number,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  userDisplay: {
    fontSize: 'var(--font-size-body)',
    color: 'var(--color-text-primary)',
    whiteSpace: 'nowrap',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 'var(--space-1)',
    color: 'var(--color-text-primary)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

export default function TopNav({ onMenuOpen }: TopNavProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  return (
    <nav aria-label="Main navigation" style={styles.nav}>
      {/* Hamburger — shown via media query class */}
      <button
        className="topnav__hamburger"
        aria-label="Open navigation menu"
        aria-expanded={false}
        onClick={onMenuOpen}
        style={styles.hamburger}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <rect y="3" width="20" height="2" rx="1" />
          <rect y="9" width="20" height="2" rx="1" />
          <rect y="15" width="20" height="2" rx="1" />
        </svg>
      </button>

      {/* Brand */}
      <Link to="/" style={styles.brand}>
        Contact Center Portal
      </Link>

      <span style={styles.spacer} />

      {/* Nav links — hidden on mobile via class */}
      <div className="topnav__links" style={styles.navLinks}>
        <Link to="/browse" style={styles.navLink}>
          Browse
        </Link>
      </div>

      {/* Search bar — hidden on mobile via class */}
      <div className="topnav__search" style={styles.searchWrapper}>
        <input
          ref={inputRef}
          type="search"
          aria-label="Search resources"
          placeholder="Search resources..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={styles.searchInput}
        />
        <button
          aria-label="Submit search"
          onClick={() => {
            if (query.trim()) {
              navigate(`/search?q=${encodeURIComponent(query.trim())}`)
              setQuery('')
            }
          }}
          style={styles.searchButton}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.156a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
          </svg>
        </button>
      </div>

      {/* Auth area */}
      {!loading && (
        <>
          {user ? (
            <span style={styles.userDisplay} aria-label={`Signed in as ${user.userDetails}`}>
              {user.userDetails}
            </span>
          ) : (
            <a href="/.auth/login/aad" style={styles.signInBtn}>
              Sign In
            </a>
          )}
        </>
      )}
    </nav>
  )
}
