<!-- Sync Impact Report
Version: 0.1.0 → 1.0.0 (MINOR)
Modified principles: None (initial creation)
Added sections: Core Principles, Specification Workflow, Development Standards, Governance
Removed sections: None
Templates requiring updates:
  - plan-template.md: ✅ Update pending
  - spec-template.md: ✅ Update pending
  - tasks-template.md: ✅ Update pending
Follow-up TODOs: None
-->

# Calculadora Ahorro Constitution

## Core Principles

### I. Spec-First Development
All features start as complete specifications with zero pending points. Specifications must define: what the user does (Funcionalidad), how to validate completion (Criterio de aceptación), and the technical breakdown (Tareas y subtareas). Ambiguous requirements are marked as `⚠️ PENDIENTE` and must be resolved before implementation starts. No task begins until its spec is APROBADA.

### II. Verifiable Acceptance Criteria
Every spec defines measurable, non-subjective acceptance criteria. Criteria must be testable and tied to observable behavior (UI state changes, data persistence, API responses). Subjective criteria like "looks good" or "feels responsive" are not acceptable. Acceptance criteria are the source of truth for completion.

### III. Frontend-First, User-Centric
The application is a customer-facing Next.js interface (React 19, TypeScript, Tailwind CSS 4). All code decisions prioritize usability, performance, and accessibility. Visual consistency across ES/CA/EN locales is non-negotiable. Component behavior must be predictable and keyboard-navigable.

### IV. Internationalization as Architecture
UI copy lives in structured i18n dictionaries (dict.{es,ca,en}.json). Every new feature includes translation keys before implementation. Language switching (via localStorage `kroomix-locale`) must not require page reload. Chat API system prompts are locale-aware.

### V. Integration Testing Over Mocks
UI interactions are tested against real component state, not mocks. Workflow diagrams (React Flow), form submissions, and locale switching must verify end-to-end behavior. Mock testing is permitted only where external APIs (Anthropic, Supabase) are involved.

## Development Standards

### Specification Workflow
Specs follow a strict state progression: `BORRADOR` → `APROBADA` → `EN DESARROLLO` → `COMPLETADA`.
- **BORRADOR**: Initial draft, contains `⚠️ PENDIENTE` items.
- **APROBADA**: All pending points resolved, acceptance criteria verified, ready for task breakdown.
- **EN DESARROLLO**: Tasks are assigned and in progress; spec changes require approval.
- **COMPLETADA**: All tasks closed, acceptance criteria met, no outstanding issues.

### Code Standards
- Next.js 16 conventions (App Router, server/client components clearly marked).
- TypeScript strict mode enforced; no `any` types without justification.
- Tailwind CSS 4 for all styling; custom CSS only for complex animations (Framer Motion, React Flow).
- Component naming: PascalCase, co-located with stories or tests.
- Data files (`src/data/`) are immutable; configuration via environment variables or Supabase.

### Dependency Policy
Current stack is locked: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, React Flow v12. Major version upgrades require a dedicated spec and signed approval. New dependencies require justification and security review before merge.

## Governance

Constitution supersedes all other practices. Amendments require documentation of the rationale, explicit approval, and a migration plan for existing work.

**Review Compliance**: All PRs must verify that acceptance criteria are met and no `⚠️ PENDIENTE` items remain in the branch's specs. Specs in BORRADOR state are not eligible for merge.

**Ambiguity Resolution**: When Claude detects ambiguous requirements, ambiguity is marked as `⚠️ PENDIENTE` and flagged to the user. Work halts until clarified.

**Use CLAUDE.md for runtime guidance**: This constitution establishes governance rules. Day-to-day development questions (conventions, naming, patterns) are documented in CLAUDE.md and AGENTS.md.

**Version**: 1.0.0 | **Ratified**: 2026-04-28 | **Last Amended**: 2026-04-28
