# McManus — History

## Project Context
- **Project:** AIB Contact Center Resource Portal
- **User:** Bradley Law
- **Stack:** React 19, TypeScript, Vite 8, Azure Static Web Apps
- **Design:** Microsoft Dynamics 365 / Fluent UI styling — Segoe UI font, #0078D4 primary, #00B4D8 accent, 4px base grid
- **Pages:** HomePage, BrowsePage, SearchPage, ResourceDetailPage, UploadPage, ManagePage
- **Current state:** All pages are stubs (`<div>PageName</div>`). Shell is a div wrapper. CSS files are empty. Context providers return null.
- **Branch:** 001-contact-center-portal

## Learnings

### 2026-04-21 — Frontend Foundation Implementation

**Files implemented (in order):**
1. `src/styles/tokens.css` — full CSS custom property set (colors, type, spacing, radius, shadows, z-index, breakpoints)
2. `src/styles/global.css` — reset, base styles, typography utils, .container, .resource-grid (3→2→1 col), focus ring, .sr-only, TopNav responsive classes
3. `src/context/ManifestContext.tsx` — useReducer pattern, fetch /api/manifest, refresh(), types exported (Resource, Category, Manifest)
4. `src/context/AuthContext.tsx` — fetch /.auth/me on mount, SWA clientPrincipal shape, isContentManager derived bool
5. `src/context/ToastContext.tsx` — toast queue with crypto.randomUUID(), createPortal to document.body, auto-dismiss via setTimeout
6. `src/components/Shell/TopNav.tsx` — sticky 48px nav, hamburger state wired to Shell's isDrawerOpen
7. `src/components/Shell/Footer.tsx` — simple copyright footer
8. `src/components/Shell/MobileDrawer.tsx` — createPortal drawer, Escape key handler, focus on open, backdrop click closes
9. `src/components/Shell/Shell.tsx` — layout wrapper, composes all shell components, manages isDrawerOpen state

**Key patterns:**
- Context providers use throw-if-outside-provider pattern in hooks for runtime safety
- ManifestContext uses useReducer (not useState) to handle multi-step async state cleanly
- ToastContext renders ToastContainer inside the provider — consumer components don't render it
- MobileDrawer and ToastContainer both use createPortal to document.body to escape stacking context
- TopNav hamburger visibility is CSS class-controlled (topnav__hamburger / topnav__links / topnav__search) via global.css media queries, not inline style toggling — this separates concerns and allows Hockney to query DOM classes in tests
- Shell manages isDrawerOpen state; TopNav fires onMenuOpen() callback; MobileDrawer receives isOpen/onClose

**What Hockney needs to test:**
- ManifestContext: mock fetch('/api/manifest'), verify loading → success/error state transitions, verify refresh() triggers re-fetch
- AuthContext: mock fetch('/.auth/me') with/without clientPrincipal, verify isContentManager=true when role present
- ToastContext: addToast() adds to queue; auto-dismiss fires after duration; removeToast() removes by id
- TopNav: search input Enter navigates to /search?q=...; hamburger fires onMenuOpen
- MobileDrawer: renders on isOpen=true; Escape closes; backdrop click closes; focus on close button on open
- Shell: renders TopNav, main, Footer; MobileDrawer conditionally mounted
- global.css: .resource-grid renders 3 cols at 1200px, 2 at 800px, 1 at 400px
