# Technical Specification — [Feature Name]

> Must reflect the latest validated understanding of product requirements.
> Update whenever requirements or implementation decisions change.

## Metadata

| Field | Value |
|---|---|
| Feature | _name_ |
| Status | Draft \| Validated \| Implemented \| Deprecated |
| Created | _date_ |
| Last Updated | _date_ |
| Requirements Reference | _link to feature-requirements.md_ |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| _what was decided_ | _why_ | _what else was evaluated_ |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| _file/path or module_ | New \| Modified \| Deleted | _what changes_ |

## API / Contracts

### Public Interfaces

```
// Types, function signatures, store actions, or API endpoints
```

### Data Models

```
// Zod schemas, TypeScript interfaces, or structural definitions
```

## State Management

_What state is added or modified? Which store(s)? How is it persisted (if at all)?_

## Database / Storage Changes

_Schema changes, migrations, new collections, index changes. Write "None" if not applicable._

## Migrations

| Migration | Description | Rollback Strategy |
|---|---|---|
| _name or ID_ | _what it does_ | _how to revert_ |

## Security Implications

_Auth, authorization, input validation, data exposure, XSS/Injection risks. Write "None" if not applicable._

## Validation Strategy

_How is input validated? Where (client, shared, both)? What library (Zod)?_

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | _what is tested_ |
| Component | React Testing Library | _what is tested_ |
| Integration | Vitest | _what is tested_ |
| E2E | Playwright | _what is tested_ |

_Key test scenarios that must pass before marking done:_

-

## Performance Considerations

_Rendering, computation, memory, bundle size. Write "None" if not applicable._

## Observability / Logging

_What to log, when, at what level. Write "None" if not applicable._

## Refactors Required

| Refactor | Mandatory \| Optional | Justification | Risk |
|---|---|---|---|
| _description_ | _M/O_ | _why it is needed_ | _blast radius_ |

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | _unresolved technical question_ | _answer or "pending"_ | _date resolved_ |

## Change Log

| Date | Change | Author |
|---|---|---|
| _date_ | _what changed_ | _who_ |
