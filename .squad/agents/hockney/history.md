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
