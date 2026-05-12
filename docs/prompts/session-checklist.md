# Mandatory Workflow Checklist

Before coding:
- [ ] Requirements clarified
- [ ] Feature scope validated
- [ ] Parallelization opportunities identified in backlog
- [ ] Specs for independent features written in parallel where possible
- [ ] Product spec updated
- [ ] Technical spec updated
- [ ] User approved implementation

After each user story implementation:
- [ ] Implementation completed
- [ ] Regression tests added
- [ ] Tests passing
- [ ] Lint/typecheck/build passing
- [ ] No errors or warnings in the browser console (runtime validation)
- [ ] Specs updated if needed
- [ ] User asked to validate (STOP here, do NOT proceed to next US)
- [ ] User validation received

Before commit (per user story):
- [ ] Definition of Done checklist fully satisfied (Step 7)
- [ ] User validated behavior
- [ ] One commit per validated user story

Before merging a parallel branch:
- [ ] Parallel feature validated on its branch
- [ ] Main branch up to date with all prior sequential features
- [ ] Merge conflicts resolved and tested
- [ ] No regression from merge