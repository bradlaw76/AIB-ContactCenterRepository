# Squad Decisions

## Active Decisions

### 2026-04-21 - Fenster - API Foundation

1. Multipart upload parsing uses native Azure Functions v4 `request.formData()` with `file` + JSON `metadata`.
2. SAS URLs are issued with 1-hour expiry for private resource access.
3. `content-index.json` in GitHub is the v1 manifest store, updated with SHA optimistic locking.
4. Blob naming uses UUID-based keys (`{uuid}.{ext}`), keeping original filename as metadata/title only.
5. Ownership enforcement compares `uploadedBy` to authenticated `principal.userDetails`.
6. Functions are `authLevel: 'anonymous'`; SWA `x-ms-client-principal` header is the auth boundary.

### 2026-04-21 - Hockney - Test Foundation

1. Tests use `src/test-utils.tsx` and `renderWithProviders` to mirror app provider wiring.
2. Assertions prioritize observable behavior over implementation details and snapshots.
3. Side effects are controlled deterministically with `vi.fn`, `vi.spyOn`, fake timers, and mocks.
4. TopNav navigation is verified with route observation rather than internals.
5. Follow-up noted: remove TopNav mobile `act` warning noise and add `Shell.tsx` coverage if promoted in scope.

### 2026-04-21 - McManus - Frontend Foundation

1. No manifest cache in v1; `ManifestContext` stores data in React state only.
2. Auth is fetched once on provider mount with no polling.
3. Toast IDs use `crypto.randomUUID()`.
4. TopNav responsive behavior is class-driven via `global.css` media queries.
5. MobileDrawer and toast container render with `createPortal(..., document.body)`.

### 2026-04-21 - McManus - Pages Implementation

1. Browse filters use sticky desktop sidebar and mobile drawer with shared `FilterPanel` behavior.
2. Manage edit action routes to `/resource/:id` as the single edit surface.
3. ResourceCard image previews use deterministic Picsum placeholders seeded by resource id.
4. Date and size display formatting remains frontend-derived.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
