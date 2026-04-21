/*
=============================================================================
COMPONENT:    Shell
FILE:         src/components/Shell/Shell.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Top-level layout wrapper that composes TopNav, the page content area, Footer,
and MobileDrawer. Manages the open/closed state of the mobile drawer and
provides a flex-column layout that fills the full viewport height.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     None (layout only)
- Auth Model:      Delegated to TopNav / MobileDrawer via AuthContext
- Rendering:       Wraps all page routes in App.tsx

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Layout:          flex column, min-height 100vh
- TopNav:          sticky top nav (48px)
- Main:            flex-grow content area
- Footer:          always-visible bottom footer
- MobileDrawer:    conditionally rendered; controlled by isDrawerOpen state

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Do NOT clip the toast container — overflow must remain visible at layout level
=============================================================================
*/

import { useState, type ReactNode } from 'react'
import TopNav from './TopNav'
import Footer from './Footer'
import MobileDrawer from './MobileDrawer'

interface ShellProps {
  children: ReactNode
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
  },
}

export default function Shell({ children }: ShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div style={styles.wrapper}>
      <TopNav onMenuOpen={() => setIsDrawerOpen(true)} />
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <main id="main-content" style={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
