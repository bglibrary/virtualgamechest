# Validation Checklist — [Feature Name] / US-[N]: [User Story Title]

> Used during Step 6 (Validation Loop) and Step 7 (Definition of Done).
> One checklist per user story. All items must be checked before marking done.

## Metadata

| Field | Value |
|---|---|
| Feature | _name_ |
| User Story | _US-N: title_ |
| Validated By | _who validated_ |
| Date | _date_ |

## Product Requirements Alignment

- [ ] Feature requirements document is up to date
- [ ] All acceptance criteria for this user story are met
- [ ] Edge cases from requirements are handled correctly
- [ ] Validation rules from requirements are enforced
- [ ] UX expectations are satisfied
- [ ] No open product questions remain (or all are resolved)

## Technical Specification Alignment

- [ ] Technical spec document is up to date
- [ ] Implementation matches architecture decisions
- [ ] API / contracts match the spec
- [ ] No divergence between spec and code

## Implementation Quality

- [ ] Code is clean and readable
- [ ] Strong typing is applied (no unsafe `any` without justification)
- [ ] No dead code or unused imports
- [ ] No duplication without justification
- [ ] Secure defaults and proper error handling
- [ ] Input validation is in place
- [ ] No hardcoded secrets or credentials
- [ ] Backward compatibility is preserved (or break is approved)

## Testing

- [ ] Unit tests added / updated and passing
- [ ] Component tests added / updated and passing (if applicable)
- [ ] Edge cases covered by tests
- [ ] Regression risk addressed

## Tooling Checks

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm test` passes

## Documentation

- [ ] README updated (if impacted)
- [ ] Run/test procedures updated (if impacted)
- [ ] Relevant code comments or JSDoc added (if needed)

## Validation Result

| Status | Checked By | Date |
|---|---|---|
| Pass \| Fail \| Blocked | _name_ | _date_ |

### Validation Notes

_What was tested, how, any issues found, any deviations from acceptance criteria._

## Blocking Issues

| # | Issue | Resolution | Date |
|---|---|---|---|
| 1 | _description_ | _resolved how_ | _date_ |
