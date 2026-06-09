please follow docs/prompts/system-prompt-instructions.md

## Règle de travail : toujours mettre à jour les specs

À chaque implémentation ou modification d'une feature :
- Les specs produit (`docs/specs/product_requirements/*.md`) et specs techniques (`docs/specs/technical_requirements/*.md`) correspondantes DOIVENT être mises à jour pour refléter l'état réel de l'implémentation.
- La spec doit être commitée dans le même commit que l'implémentation (via `git commit --amend` si nécessaire).
- Ne jamais laisser les specs diverger du code — c'est une source de dette technique et de confusion.