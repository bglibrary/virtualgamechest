# Feature Requirements — Bulk Card Wizard

> Permet de créer un deck et ses cartes en masse, soit par déclaration d'un nombre, soit par upload d'images.

## Metadata

| Field | Value |
|---|---|
| Feature | Bulk Card Wizard |
| Status | Implemented |
| Created | 2026-05-24 |
| Last Updated | 2026-05-24 |
| Author | Nicolas |

## Goal

Permettre à un créateur de jeu de générer rapidement un deck avec ses cartes sans avoir à créer chaque carte individuellement dans l'éditeur.

## Business Context

Phase 9 de l'éditeur de jeu. L'éditeur permet déjà de créer des cartes une par une et de les assigner à un deck. Pour les jeux de cartes standards (52 cartes, tarot, etc.) ou les jeux custom avec des images, c'est beaucoup trop lent. Ce wizard résout ce problème.

## Scope

- Un wizard déclenché depuis l'éditeur (bouton dans PropertyPanel quand aucun composant n'est sélectionné)
- Deux modes d'input :
  - **Mode "Nombre"** : l'utilisateur tape un entier N, le wizard crée N cartes avec un text de fallback
  - **Mode "Images"** : l'utilisateur upload des fichiers images (face et/ou dos), le wizard détecte les paires par matching de nom de fichier
- Matching automatique front/back basé sur le nom de fichier (suffixe `_front`/`_back`, `-front`/`-back`, `_face`/`_back`, etc.)
- Interface de révision des paires avec possibilité d'édition manuelle
- Fallback text pour face et dos généré automatiquement
- Création d'un nouveau deck + des cartes associées dans le game store
- Génération d'IDs automatiques (éditables après)

## Out of Scope

- Upload par URL (uniquement fichiers locaux)
- Stockage persistant des images (géré par l'export, pas par le wizard)
- Édition des actions des cartes (seulement face/back/text)
- Import depuis un fichier CSV/JSON

## User Stories

### US-1: Créer un deck par nombre de cartes

**As a** créateur de jeu
**I want** spécifier un nombre de cartes et un texte par défaut
**So that** un deck avec N cartes soit créé automatiquement

**Acceptance Criteria:**

- [ ] Un champ "Nombre de cartes" permet de saisir un entier > 0
- [ ] Un champ "Texte par défaut (face)" permet de personnaliser le texte des faces
- [ ] Un champ "Texte par défaut (dos)" permet de personnaliser le texte des dos
- [ ] Les IDs sont générés automatiquement (card_0, card_1, ...)
- [ ] Le texte de chaque carte est "Texte par défaut N" (incrémenté)
- [ ] Un deck est créé contenant toutes les cartes
- [ ] Les cartes ont position: null (dans le deck)

### US-2: Créer un deck par upload d'images

**As a** créateur de jeu
**I want** uploader des images de face et/ou de dos
**So that** les cartes soient créées avec les images associées

**Acceptance Criteria:**

- [ ] Un input file multiple permet de sélectionner des images (.png, .jpg, .jpeg, .svg)
- [ ] Les fichiers sont lus et affichés en preview dans le wizard
- [ ] Le matching automatique détecte les paires face/dos par nom de fichier
- [ ] Les images non matchées sont listées séparément
- [ ] L'utilisateur peut associer manuellement une face à un dos
- [ ] L'utilisateur peut laisser une face sans dos (ou vice versa)

### US-3: Fallback text depuis le nom de fichier

**As a** créateur de jeu
**I want** que le texte par défaut des cartes soit déduit du nom de fichier
**So that** je n'aie pas à retaper le nom de chaque carte

**Acceptance Criteria:**

- [ ] `ace_of_spades_front.png` → text face "Ace of Spades"
- [ ] `king_hearts_back.png` → text dos "King Hearts"
- [ ] Les séparateurs `_` sont remplacés par des espaces
- [ ] La première lettre de chaque mot est capitalisée
- [ ] Le suffixe `_front`/`_back`/`_face` est retiré

### US-4: Réviser et éditer avant création

**As a** créateur de jeu
**I want** voir un tableau récapitulatif des cartes avant validation
**So that** je puisse modifier les textes et les paires si nécessaire

**Acceptance Criteria:**

- [ ] Un tableau liste toutes les cartes avec ID, face text, back text, preview image
- [ ] Chaque champ de texte est éditable inline
- [ ] L'utilisateur peut supprimer une carte du lot
- [ ] L'utilisateur peut revenir en arrière pour changer les images

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Upload d'un seul fichier (ni face ni dos détecté) | Traité comme face uniquement, pas de back |
| Tous les fichiers sont des dos | Traité comme dos uniquement, face avec fallback text |
| Nombre de cartes = 0 ou négatif | Le bouton "Créer" est désactivé, message d'erreur |
| Fichier non-image (ex: .pdf, .txt) | Filtré silencieusement ou message d'erreur selon le contexte |
| Deux fichiers avec le même nom (front+back) mais extensions différentes | Matché si le nom de base correspond (ex: `card_front.png` + `card_back.jpg`) |
| Image trop grande (> 10 Mo) | Avertissement mais pas de blocage (contraintes navigateur) |

## Validation Rules

| Input / Condition | Rule | Error Behavior |
|---|---|---|
| Nombre de cartes | Doit être un entier > 0 et ≤ 1000 | Message d'erreur, bouton désactivé |
| Upload d'images | Au moins 1 fichier image valide | Bouton désactivé si aucun fichier |
| Format d'image | .png, .jpg, .jpeg, .svg (même règle que imageUrlSchema) | Fichiers invalides ignorés |

## UX Expectations

- Modale centrée avec overlay sombre
- Bouton déclencheur "Créer des cartes en lot" dans le formulaire DeckForm (pas dans le PropertyPanel général)
- Deux étapes fluides :
  1. Choix du mode + configuration (tout sur la même vue, pas de navigation inutile)
     - Mode "Nombre" → input nombre + textes par défaut intégrés
     - Mode "Images" → zone de drop/click + preview miniatures + side badges (F/B/?)
  2. Révision (tableau éditable avec preview face/dos)
- Mode "Images" : drag & drop zone ou clic pour sélectionner
- Mode "Images" : preview miniatures des images uploadées
- Tableau de révision : lignes avec champs input pour texte
- Bouton "Créer le deck" en bas, disabled tant que la config est invalide
- Après création, la modale se ferme et le nouveau deck est sélectionné dans l'arbre

## Open Questions

| # | Question | Resolution | Date |
|---|---|---|---|
| 1 | Stockage des images uploadées ? | Blob URLs temporaires pour le wizard. Géré par l'export séparément. | 2026-05-24 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-24 | Création initiale | Nicolas |