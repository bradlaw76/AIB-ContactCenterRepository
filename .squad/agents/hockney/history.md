# Hockney — History

## Project Context
- **Project:** AIB Contact Center Resource Portal
- **User:** Bradley Law
- **Test Stack:** Vitest 4.1, React Testing Library 16, jsdom 29, @testing-library/user-event 14
- **Test setup:** src/test-setup.ts imports @testing-library/jest-dom. Vitest configured in vite.config.ts.
- **Current state:** No test files exist. Test framework is fully configured and ready.
- **Constitution:** 80% min coverage on new code; deterministic tests only; behavior-named tests
- **Branch:** 001-contact-center-portal

## Learnings

## 2026-04-21 Azure Infrastructure Validation Pass

### Task
Pre-deployment IaC validation of `.azure/main.bicep`, `main.parameters.json`, and `azure.yaml`.

### Results Summary
- **Bicep build:** ✅ Zero errors, zero warnings
- **Naming conventions:** ✅ All resource names use `aibcc*` prefix + uniqueString suffix
- **No hardcoded secrets:** ✅ githubToken and aadClientSecret decorated `@secure()`; storageConnectionString built from `listKeys()` (not literal)
- **Parameters schema:** ✅ All params in main.parameters.json match Bicep declarations
- **azure.yaml:** ✅ Valid YAML; services.web → staticwebapp, services.api → function; npm scripts (build, ci) exist in package.json
- **Blob container:** ✅ `resources` container with `publicAccess: 'None'`
- **Functions runtime:** ✅ `FUNCTIONS_WORKER_RUNTIME = node`, `WEBSITE_NODE_DEFAULT_VERSION = ~18`, `nodeVersion = ~18`
- **App Insights linked:** ✅ `APPINSIGHTS_INSTRUMENTATIONKEY` and `APPLICATIONINSIGHTS_CONNECTION_STRING` set
- **SWA API proxy:** ✅ `staticwebapp.config.json` routes `/api/*` with navigationFallback exclude
- **Secrets from env:** ✅ KV references for githubToken and aadClientSecret; no literals
- **Managed Identity:** ✅ User-assigned identity with Storage Blob Data Contributor role pre-wired

### Findings / Warnings
1. **`parameters.json` KeyVault IDs are empty strings** — `githubToken` and `aadClientSecret` reference blocks have `"id": ""`. These will fail if deployed with `--parameters` file as-is. `azd` bypasses this via env var injection, but direct `az deployment group create` would error. **Remediation:** populate KV IDs or use `azd env set` variables only.
2. **CORS set to `['*']` on Functions** — acceptable for MVP but should be tightened to SWA hostname post-MVP.
3. **SWA `openIdIssuer` uses `/common` tenant** — works for multi-tenant but for a single-org tool should use the specific tenant ID. Low-risk MVP, but worth noting.
4. **`azure.yaml` hooks use `shell: sh`** — will fail on Windows runners without WSL/Git Bash. GitHub Actions runners are Linux so this is fine for CI; local `azd` on Windows would need adjustment.

### Decision
- Deployment plan Phase 6.4 (Hockney validate) marked COMPLETE
- Findings documented in `.squad/decisions/inbox/hockney-azure-validate.md`

## 2026-04-21 Test Foundation Pass

- Added behavior-focused unit tests for context providers:
	- src/context/ManifestContext.test.tsx
	- src/context/AuthContext.test.tsx
	- src/context/ToastContext.test.tsx
- Added behavior-focused unit tests for Shell components:
	- src/components/Shell/TopNav.test.tsx
	- src/components/Shell/MobileDrawer.test.tsx
	- src/components/Shell/Footer.test.tsx
- Added shared helper: src/test-utils.tsx (MemoryRouter + ToastProvider + AuthProvider + ManifestProvider)

### Patterns Used
- Provider tests use small consumer harness components to assert public context behavior.
- Deterministic API mocking via vi.stubGlobal('fetch') and per-test fetchMock implementations.
- Deterministic timer tests using vi.useFakeTimers() and explicit clock advancement for toast auto-dismiss.
- Hook guard behavior validated by rendering consumers outside providers and asserting thrown messages.
- Router navigation behavior asserted via useLocation observer component (no snapshots).

### Validation
- Targeted Vitest run: 32/32 tests passing.
- Coverage run over requested contexts + Shell components:
	- Statements: 87%
	- Branches: 82.22%
	- Functions: 83.33%
	- Lines: 86.95%

### Gaps / Risks Found
- src/components/Shell/Shell.tsx currently has 0% coverage because it was not part of the requested test file list.
- One TopNav test emits React act warnings from background provider state updates in test wrapper; tests pass and assertions are stable, but warning cleanup would improve signal quality.

## 2026-04-21 Phase 2 Shared Components + Pages Test Pass

- Added shared component tests:
	- src/components/TypeBadge/TypeBadge.test.tsx
	- src/components/ResourceCard/ResourceCard.test.tsx
	- src/components/InlineViewer/InlineViewer.test.tsx
	- src/components/EmptyState/EmptyState.test.tsx
	- src/components/LoadingSkeletons/LoadingSkeletons.test.tsx
- Added page tests:
	- src/pages/HomePage/HomePage.test.tsx
	- src/pages/SearchPage/SearchPage.test.tsx
	- src/pages/BrowsePage/BrowsePage.test.tsx
	- src/pages/ResourceDetailPage/ResourceDetailPage.test.tsx
	- src/pages/UploadPage/UploadPage.test.tsx
	- src/pages/ManagePage/ManagePage.test.tsx

### Patterns Used
- Behavior-first test naming and assertions for rendered output and user-visible outcomes.
- renderWithProviders used for all page-level tests to keep routing/context behavior realistic.
- Deterministic network mocking via vi.stubGlobal('fetch') with per-test URL+method branching.
- Route-aware assertions for redirects and URL-query-driven behavior using Routes/useNavigate harnesses.
- File input validation tested using user-event uploads, including applyAccept override for disallowed extensions.

### Validation
- Targeted Vitest run over the 11 newly created files: 49/49 tests passing.

### Gaps / Risks Found
- ResourceDetail page tests currently focus on visibility and URL/preview/copy behaviors; edit/save and delete failure toast branches are not yet directly asserted.

## 2026-04-21 Manifest Normalization + Workflow Static Checks

- Added manifest normalization script:
	- scripts/normalize-manifest.mjs
- Added targeted script behavior tests:
	- scripts/normalize-manifest.test.ts
- Added workflow with PR check-only and push commit-if-needed logic:
	- .github/workflows/generate-manifest.yml
- Added workflow static-check tests:
	- scripts/generate-manifest-workflow.test.ts

### Validation
- Targeted Vitest run over only new manifest-related tests:
	- 2 test files
	- 8 tests total
	- 8 passed

### Defects Found + Patched
- Initial failure: CLI entrypoint detection in scripts/normalize-manifest.mjs did not execute reliably on Windows path semantics, causing invalid-shape test to pass unexpectedly with exit code 0.
- Minimal fix applied: use pathToFileURL(process.argv[1]).href for robust entrypoint comparison.

### Gaps / Risks Found
- Workflow checks are static string assertions; they validate intended YAML logic but do not execute a live GitHub Actions run.
- Normalization behavior currently treats invalid/missing uploadDate as lowest-priority values during sorting.
