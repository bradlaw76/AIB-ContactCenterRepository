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

### 2026-04-21 — Shared Components + All Pages (Phase 2)

**Files created:**
1. `src/components/TypeBadge/TypeBadge.tsx`
2. `src/components/ResourceCard/ResourceCard.tsx`
3. `src/components/InlineViewer/InlineViewer.tsx`
4. `src/components/EmptyState/EmptyState.tsx`
5. `src/components/LoadingSkeletons/LoadingSkeletons.tsx`

**Files updated:**
1. `src/pages/HomePage/HomePage.tsx`
2. `src/pages/BrowsePage/BrowsePage.tsx`
3. `src/pages/SearchPage/SearchPage.tsx`
4. `src/pages/ResourceDetailPage/ResourceDetailPage.tsx`
5. `src/pages/UploadPage/UploadPage.tsx`
6. `src/pages/ManagePage/ManagePage.tsx`
7. `src/styles/tokens.css`
8. `src/styles/global.css`
9. `src/context/ToastContext.test.tsx` (type-safe UUID literal fix to unblock strict build)

**Patterns used:**
- Shared card primitives centralized via `.resource-card`, `.chip`, `.btn*`, `.pill-toggle*`, `.table`, and `.skeleton-shimmer` utility classes in `global.css`
- BrowsePage desktop/mobile filter parity via reusable `FilterPanel` component plus mobile right-side drawer overlay
- SearchPage uses URL-derived query (`useSearchParams`) as source of truth; re-filters on every URL change automatically
- ResourceDetailPage owner-only management combines `useAuth().isContentManager` + `resource.uploadedBy === user.userDetails`
- ResourceDetailPage inline edit form writes metadata through `PUT /api/resource/:id`; delete through `DELETE /api/resource/:id`
- UploadPage sends multipart FormData as `file` + JSON string metadata payload to `POST /api/upload`
- Manifest refresh pattern (`refresh()`) called after upload, update, and delete to keep list/detail views synchronized

**What Hockney needs to test:**
- `TypeBadge`: correct color token mapping and label for document/video/image
- `ResourceCard`: route linking to `/resource/:id`, type-specific visual branch rendering, relative date display, description clamp class
- `LoadingSkeletons`: count handling in `ResourceGridSkeleton`, structure in `ResourceDetailSkeleton`, shimmer class present
- `HomePage`: loading state shows 6 skeleton cards; featured subset capped at 3; recent list sorted descending by `uploadDate`
- `BrowsePage`: route-param category preselection (`/browse/:category`), multi-filter behavior, sort modes, mobile filter drawer open/close
- `SearchPage`: query-string driven results, type chip filtering, newest/oldest sort, empty state message
- `ResourceDetailPage`: not-found fallback, SAS URL fetch call, download disabled without URL, copy-link success/error toast, owner-gated edit/delete controls, update/delete request flows
- `UploadPage`: non-manager redirect, file extension/size validation, metadata required fields, successful upload navigation to `/resource/:id`, error toast path
- `ManagePage`: non-manager redirect, user-owned filtering, edit link target, delete confirmation and refresh behavior, empty-state upload CTA
