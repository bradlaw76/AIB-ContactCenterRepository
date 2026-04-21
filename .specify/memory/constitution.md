<!--
  Sync Impact Report
  ==================
  Version change: N/A → 1.0.0
  Modified principles: N/A (initial ratification)
  Added sections:
    - Core Principles (4 principles: Code Quality, Testing Standards,
      User Experience Consistency, Performance Requirements)
    - Quality Gates
    - Development Workflow
    - Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ aligned (Constitution Check
      section already present)
    - .specify/templates/spec-template.md ✅ aligned (user scenarios,
      requirements, and edge cases sections present)
    - .specify/templates/tasks-template.md ✅ aligned (test tasks and
      phased structure present)
  Follow-up TODOs: None
-->

# AIB-ContactCenter Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

- All code MUST pass static analysis and linting before merge.
- Functions and modules MUST follow the single-responsibility principle;
  no function exceeds 50 lines without explicit justification.
- All public APIs MUST have clear, typed signatures. Implicit `any`
  types are forbidden.
- Dead code, commented-out code, and unused imports MUST be removed
  before merge.
- Every PR MUST be reviewed by at least one other contributor. Self-
  merges are prohibited on shared branches.
- Naming MUST be descriptive and consistent: no abbreviations beyond
  well-known domain terms.

### II. Testing Standards (NON-NEGOTIABLE)

- Every user story MUST have corresponding acceptance tests that
  validate its scenarios before the story is considered complete.
- Unit tests MUST cover all business logic; minimum 80% line coverage
  on new code.
- Integration tests are REQUIRED for: API contract changes, cross-
  service communication, database migrations, and shared schema
  updates.
- Tests MUST be deterministic — no flaky tests allowed. A failing test
  blocks the pipeline until fixed or removed with documented rationale.
- Test names MUST describe the behaviour under test, not the
  implementation (e.g., "rejects expired tokens" not "test_validate").

### III. User Experience Consistency

- UI components MUST follow a shared design system or component library;
  ad-hoc styling is prohibited for customer-facing surfaces.
- All user-facing text MUST be externalized for localization readiness;
  hard-coded strings in UI code are forbidden.
- Error messages shown to users MUST be actionable and human-readable;
  raw stack traces or internal codes MUST NOT be exposed.
- Navigation patterns, layout grids, and interaction paradigms MUST be
  consistent across all application surfaces.
- Accessibility MUST meet WCAG 2.1 AA as a minimum; new UI features
  MUST include keyboard navigation and screen-reader support.

### IV. Performance Requirements

- API endpoints MUST respond within 200 ms at the 95th percentile
  under expected load.
- Client-side pages MUST achieve a Largest Contentful Paint (LCP) under
  2.5 seconds on a baseline 4G connection.
- Database queries MUST NOT perform full table scans on tables exceeding
  10 000 rows without an index strategy documented in the PR.
- Memory usage per service instance MUST stay below the allocated limit;
  memory leaks identified in profiling MUST be resolved before release.
- Performance regression tests MUST be included for any change to
  hot-path code or data-access layers.

## Quality Gates

- **Merge gate**: All CI checks (lint, type-check, unit tests,
  integration tests) MUST pass before a PR can be merged.
- **Release gate**: Performance benchmarks MUST show no regression
  beyond 5% on key metrics before a release is tagged.
- **Accessibility gate**: Automated accessibility scans MUST pass;
  manual accessibility review is REQUIRED for new interaction patterns.
- **Coverage gate**: Overall test coverage MUST NOT decrease; new files
  MUST meet the 80% minimum.

## Development Workflow

- Feature work MUST follow the branch-per-feature model using the
  naming convention `###-feature-name`.
- Every feature MUST have a specification (`spec.md`) approved before
  implementation begins.
- Code reviews MUST verify compliance with all four Core Principles;
  reviewers MUST flag violations explicitly.
- Continuous integration runs on every push; broken builds MUST be
  fixed or reverted within 4 hours.

## Governance

- This constitution supersedes all other development practices and
  guidelines. In case of conflict, constitution principles prevail.
- Amendments require: (1) a written proposal with rationale,
  (2) review by at least two contributors, and (3) an updated version
  number following semantic versioning.
- Version policy: MAJOR for principle removals or incompatible
  redefinitions, MINOR for new principles or material expansions,
  PATCH for clarifications and typo fixes.
- Compliance review MUST occur at the start of every feature plan
  (Constitution Check in plan.md) and again before release.

**Version**: 1.0.0 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-21
