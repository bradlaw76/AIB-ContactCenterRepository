/*
=============================================================================
COMPONENT:    Footer
FILE:         src/components/Shell/Footer.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Simple site footer. Renders a centered copyright notice using text-caption
styling. Background matches the page background; separated from content by a
top border.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     None (static content)
- Auth Model:      None
- Rendering:       Client-side; rendered inside Shell below main content

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Copyright text:  "© 2026 Contact Center Portal"
- Styling:         background var(--color-background), border-top, centered

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- All colors via CSS custom properties
=============================================================================
*/

const styles: Record<string, React.CSSProperties> = {
  footer: {
    backgroundColor: 'var(--color-background)',
    borderTop: '1px solid var(--color-border)',
    padding: 'var(--space-6) var(--space-4)',
    textAlign: 'center',
  },
  text: {
    fontSize: 'var(--font-size-caption)',
    color: 'var(--color-text-secondary)',
  },
}

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <p style={styles.text}>© 2026 Contact Center Portal</p>
    </footer>
  )
}
