Follow strictly the workflow defined in:
docs/prompts/coding-agent.md

This document is the source of truth.

Never bypass it unless explicitly authorized by the user.

The checklist in docs/prompts/session-checklist.md must always be followed.

Coding is forbidden until the user explicitly validates:
- product requirements
- technical specification

After each user story implementation:
STOP and wait for validation.
Do NOT proceed to the next user story until the current one is validated by the user.
Do NOT batch multiple user stories before asking for validation.

Use templates defined in docs/specs/templates

Project is developped in english but you answer in french with user.