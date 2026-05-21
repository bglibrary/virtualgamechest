# Plan de rédaction de specs — Éditeur de jeu (Game JSON Editor)

> Document de planification destiné à guider la rédaction des specs produit et techniques par une IA.
> Ce document décrit **quoi construire**, **dans quel ordre**, et **avec quelles contraintes produit**.

## 1. Concept produit

### 1.1 Vision

Créer une interface graphique web intégrée à l'application BGE existante qui permet à un **game author** (non-développeur) de :

1. **Définir visuellement** les composants d'un jeu (cartes, decks, zones)
2. **Configurer** tous les attributs de chaque composant via des formulaires
3. **Positionner** les composants sur la table en temps réel (drag & drop sur le canvas)
4. **Définir les actions** (unitaires et composites) de chaque composant
5. **Configurer la séquence de démarrage** (startup)
6. **Exporter** le JSON final valide (validé par le schéma Zod existant)

### 1.2 Public cible

- **Game author** : utilisateur non technique qui conçoit des jeux de cartes
- **Développeur** : peut aussi l'utiliser pour prototyper rapidement

### 1.3 Intégration dans l'application existante

- Nouvelle route `/editor` dans l'app React (React Router)
- Réutilisation du **canvas existant** (`TableCanvas.tsx`) pour le rendu en direct de la table
- Réutilisation des **stores Zustand** existants pour l'état runtime
- Utilisation de la **validation Zod** existante (`schemas/game.ts`) pour valider le JSON en temps réel
- Export du fichier JSON dans `public/games/`

---

## 2. Périmètre complet de l'éditeur

### 2.1 Ce qui doit être éditable (mapping JSON → UI)

| Niveau JSON | Attribut | Widget UI | Cardinalité |
|---|---|---|---|
| **Racine** | `name` | Champ texte | 1 |
| | `version` | Champ texte | 1 |
| | `cardSize` | Sous-formulaire (widthRatio, minWidth, aspectRatio) | 0..1 |
| | `startup` | Liste d'étapes | 0..* |
| **Components** | | Liste ordonnée, ajout/suppression/réorganisation | 1..* |
| **Card** | `id` | Champ texte (généré auto) | 1 |
| | `face.text` | Champ texte | 1 |
| | `face.image` | URL image | 0..1 |
| | `back.text` | Champ texte | 0..1 |
| | `back.image` | URL image | 0..1 |
| | `position` | Drag & drop sur canvas | nullable |
| | `actions` | Liste d'actions | 1..* |
| **Deck** | `id` | Champ texte | 1 |
| | `cards` | Sélecteur de cartes (multi-select avec recherche) | 1..* |
| | `position` | Drag & drop sur canvas | 1 |
| | `faceUp` | Toggle booléen | 1 |
| | `actions` | Liste d'actions | 1..* |
| **Zone** | `id` | Champ texte | 1 |
| | `position` | Drag & drop sur canvas | 1 |
| | `label` | Champ texte | 0..1 |
| | `snapRadius` | Slider/input nombre | 0..1 |
| **Action (card)** | `type` | Selecteur (flip, composite) | 1 |
| | `label` | Champ texte | 1 |
| | `steps[]` (si composite) | Liste structurée | 0..* |
| **Action (deck)** | `type` | Selecteur (flip, draw-face-up, draw-face-down, shuffle, draw-to-zone, composite) | 1 |
| | `label` | Champ texte | 1 |
| | `targetZone` (si draw-to-zone) | Selecteur de zones | 1 |
| | `faceUp` (si draw-to-zone) | Toggle booléen | 1 |
| | `steps[]` (si composite) | Liste structurée | 0..* |
| **Startup step** | `type` | Selecteur | 1 |
| | `target` | Selecteur de composant | 1 |
| | `targetZone` (si draw-to-zone) | Selecteur de zone | 0..1 |
| | `faceUp` (si draw-to-zone) | Toggle booléen | 0..1 |
| | `actionLabel` (si composite) | Selecteur d'action du composant cible | 0..1 |

### 2.2 Validation en temps réel

- Chaque modification est validée contre le schéma Zod
- Les erreurs sont affichées dans l'interface (inline dans les formulaires + panneau d'erreurs global)
- L'export est bloqué tant que le JSON est invalide
- Les validateurs Zod existants (`gameDefinitionSchema`) sont utilisés tels quels

---

## 3. Architecture UI proposée

### 3.1 Layout général (3 panneaux)

```
┌──────────────────────────────────────────────────────┐
│  Header : Breadcrumb + Nom du jeu + Boutons [Save] [Export] │
├─────────────┬───────────────────────┬────────────────┤
│             │                       │                │
│   Panneau   │   Panneau central     │  Panneau de    │
|   des       │   : Canvas (Table)    │  propriétés    │
|   composants│   avec rendu en       │  : Formulaire   │
|   (arbre)   │   direct              │  contextuel     │
│             │                       │                │
│  Liste des  │  Drag & drop pour     │  Affiche les    │
│  composants │  positionner          │  attributs du   │
│  (cards,    │  les composants       │  composant      │
│  decks,     │                       │  sélectionné    │
│  zones)     │                       │                 │
│             │                       │                 │
└─────────────┴───────────────────────┴────────────────┘
```

### 3.2 Pages/routes

| Route | Page | Description |
|---|---|---|
| `/editor` | Dashboard | Liste des jeux existants, bouton "Nouveau jeu" |
| `/editor/:gameId` | Éditeur | L'éditeur complet pour un jeu spécifique |
| `/editor/new` | Nouveau jeu | Formulaire de création (name, version, cardSize) |

### 3.3 Composants UI principaux

| Composant | Rôle |
|---|---|
| `GameList` | Liste des jeux existants avec leurs métadonnées |
| `GameEditor` | Layout 3 panneaux, gestion de la sélection, undo/redo |
| `ComponentTree` | Panneau gauche : arbre structuré des composants |
| `EditorCanvas` | Wrapper autour du `TableCanvas` avec édition position |
| `PropertyPanel` | Panneau droit : formulaire dynamique selon le type sélectionné |
| `CardForm` | Formulaire d'édition d'une carte |
| `DeckForm` | Formulaire d'édition d'un deck |
| `ZoneForm` | Formulaire d'édition d'une zone |
| `ActionEditor` | Éditeur d'action (unitaire ou composite avec steps) |
| `StartupEditor` | Éditeur de la séquence de démarrage |
| `ActionStepRow` | Ligne d'édition d'une step dans une action composite |
| `ValidationPanel` | Panneau/liste des erreurs de validation |
| `JsonPreview` | Aperçu du JSON final (lecture seule) |
| `ExportButton` | Bouton d'export (génère le fichier + download) |

### 3.4 État global (nouveaux stores Zustand)

| Store | Responsabilité |
|---|---|
| `editorStore` | État de l'éditeur : gameId, dirty flag, sélection courante |
| `editorHistoryStore` | Undo/redo : snapshots de l'état d'édition |
| `editorValidationStore` | Erreurs de validation actuelles |

---

## 4. Décisions produit

### 4.1 Approche UI : hybride formulaire + canvas

- **Formulaire structuré** pour toutes les propriétés textuelles, listes, sélecteurs (name, version, face, back, actions, startup)
- **Canvas interactif** pour le **positionnement** des composants (drag & drop direct sur le canvas)
- **Arbre de composants** dans le panneau gauche pour la sélection, le filtrage, la création/suppression
- **Panneau de propriétés** qui s'affiche à droite quand un composant est sélectionné dans l'arbre ou sur le canvas

### 4.2 Feedback live

- **Canvas** : la table se reconstruit en temps réel à chaque modification
- **Validation** : barre d'état avec nombre d'erreurs, chaque champ invalide est souligné en rouge
- **JSON preview** : onglet optionnel pour voir le JSON généré en live

### 4.3 Actions composites : éditeur visuel de steps

- Une action composite est une **séquence ordonnée d'étapes**
- L'éditeur de composite permet d'ajouter, supprimer, réordonner des steps
- Chaque step a un type (et des paramètres spécifiques au type)
- Interface proche d'un "If This Then That" ou d'un constructeur de workflow simple

### 4.4 Expérience "Nouveau jeu"

1. L'utilisateur clique "Nouveau jeu"
2. Saisit name + version (optionnel : cardSize)
3. Arrive sur l'éditeur vide avec des suggestions : "Ajoutez vos premières cartes", "Créer un deck", "Ajouter une zone"
4. Interface progressive : les éléments "invalides" (carte sans deck, deck sans cartes, etc.) sont tolérés pendant l'édition mais bloquent l'export

### 4.5 Gestion des IDs

- Les IDs sont générés automatiquement (slug à partir du face.text pour les cartes, id court pour decks/zones)
- L'utilisateur peut les renommer
- Validation de l'unicité (même règle que le schéma Zod)
- Les références (deck → cards, draw-to-zone → targetZone) sont mises à jour automatiquement lors des renommages

---

## 5. Flux utilisateur

### 5.1 Flux principal

```
Dashboard → Nouveau jeu / Éditer existant
  → Ajouter des composants (cards, decks, zones)
  → Pour chaque composant : éditer ses propriétés
  → Positionner les composants sur la table
  → Configurer les actions
  → Configurer la startup
  → Valider (erreurs → corriger)
  → Exporter le JSON
```

### 5.2 Création d'une carte

1. Cliquer "Ajouter une carte" dans le panneau gauche
2. Une carte apparaît dans l'arbre, sélectionnée
3. Le panneau droit montre le formulaire :
   - `id` (généré automatiquement modifiable)
   - `face.text` (obligatoire)
   - `face.image` (optionnel, URL)
   - `back.text` (optionnel)
   - `back.image` (optionnel, URL)
   - Actions (par défaut : flip)
4. À la création, `position` est null → la carte n'apparaît **pas** sur le canvas
5. L'utilisateur peut positionner la carte sur le canvas pour lui donner une position

### 5.3 Création d'un deck

1. Cliquer "Ajouter un deck"
2. Le formulaire deck s'ouvre :
   - `id` (généré)
   - `faceUp` (toggle)
   - `cards` : multi-select de toutes les cartes existantes
   - `position` : drag & drop sur canvas
   - Actions (par défaut : shuffle, flip, draw-face-up)
3. Si une carte référencée n'existe plus → erreur de validation visible

### 5.4 Création d'une zone

1. Cliquer "Ajouter une zone"
2. Le formulaire zone s'ouvre :
   - `id` (généré)
   - `label` (optionnel)
   - `snapRadius` (optionnel, slider)
   - `position` : drag & drop sur canvas

### 5.5 Édition des actions

1. Sélectionner un composant (carte ou deck) dans l'arbre
2. Dans le panneau des propriétés, section "Actions"
3. Liste des actions avec boutons : + Ajouter, ✏️ Éditer, 🗑 Supprimer, ↩️ Réordonner
4. Pour chaque action :
   - Selecteur de type (flip, draw-face-up, etc. selon le composant)
   - Champ label
   - Paramètres spécifiques au type (targetZone, faceUp, steps...)
5. Pour les actions composites : éditeur de séquence de steps

### 5.6 Édition de la startup

1. Section "Startup" dans le panneau des propriétés (accessible depuis l'arbre, niveau racine)
2. Liste des steps avec ordre
3. Chaque step a :
   - `type` (selecteur)
   - `target` (selecteur des composants existants)
   - Paramètres additionnels selon le type

### 5.7 Export

1. Cliquer "Exporter"
2. Si validation OK : dialogue de confirmation avec nom de fichier
3. Le fichier JSON est téléchargé (ou sauvegardé dans `public/games/`)
4. Message de succès avec lien vers le jeu chargé

---

## 6. Contraintes techniques et réutilisation

### 6.1 Ce qui est réutilisé de l'existant

| Élément existant | Réutilisation |
|---|---|
| `gameDefinitionSchema` (Zod) | Validation temps réel + validation export |
| `TableCanvas.tsx` | Rendu du canvas en mode prévisualisation |
| `CardRenderer.tsx` | Rendu des cartes sur le canvas |
| `DeckRenderer.tsx` | Rendu des decks sur le canvas |
| `ZoneRenderer.tsx` | Rendu des zones sur le canvas |
| `types/game.ts` | Typage des données |
| Stores Zustand (cardPosition, cardState, deckState, zoneState) | État runtime pour le rendu canvas |
| `coverCrop.ts` | Utilitaires de rendu image |

### 6.2 Ce qui doit être créé (nouveaux composants)

| Fichier | Type | Description |
|---|---|---|
| `src/pages/EditorDashboard.tsx` | Page | Liste des jeux |
| `src/pages/GameEditor.tsx` | Page | Layout 3 panneaux |
| `src/editor/components/ComponentTree.tsx` | Composant | Arbre des composants |
| `src/editor/components/EditorCanvas.tsx` | Composant | Canvas éditable |
| `src/editor/components/PropertyPanel.tsx` | Composant | Panneau de propriétés |
| `src/editor/components/forms/CardForm.tsx` | Formulaire | Édition carte |
| `src/editor/components/forms/DeckForm.tsx` | Formulaire | Édition deck |
| `src/editor/components/forms/ZoneForm.tsx` | Formulaire | Édition zone |
| `src/editor/components/forms/ActionEditor.tsx` | Formulaire | Édition action |
| `src/editor/components/forms/StartupEditor.tsx` | Formulaire | Édition startup |
| `src/editor/components/forms/CompositeStepEditor.tsx` | Formulaire | Édition steps composites |
| `src/editor/components/ValidationPanel.tsx` | Composant | Erreurs validation |
| `src/editor/components/JsonPreview.tsx` | Composant | Aperçu JSON |
| `src/editor/stores/editorStore.ts` | Store | État éditeur |
| `src/editor/stores/editorHistoryStore.ts` | Store | Undo/redo |
| `src/editor/stores/editorValidationStore.ts` | Store | Validation |
| `src/editor/validation/useGameValidation.ts` | Hook | Validation temps réel |
| `src/editor/utils/jsonExport.ts` | Utilitaire | Export JSON |
| `src/editor/utils/idGenerator.ts` | Utilitaire | Génération IDs |
| `src/editor/utils/componentFactory.ts` | Utilitaire | Création composants par défaut |

### 6.3 Librairies recommandées

| Librairie | Usage | Raison |
|---|---|---|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag & drop (arbre composants, réordonnancement steps/actions) | Mature, React, accessible |
| `react-hook-form` + `@hookform/resolvers/zod` | Gestion des formulaires avec validation Zod | Réduit le boilerplate, s'intègre à la stack existante |
| `react-router-dom` | Routage | Déjà potentiellement présent |
| `use-debounce` (ou hook custom) | Debounce validation et mise à jour canvas | Évite les recalculs trop fréquents |

---

## 7. Ordre d'implémentation recommandé (phases)

### Phase 1 : Fondation (Squelette)

| Step | Description | Files concernés |
|---|---|---|
| 1.1 | Créer la route `/editor` et les pages vides | `App.tsx`, `EditorDashboard.tsx`, `GameEditor.tsx` |
| 1.2 | Créer `editorStore` avec sélection et dirty flag | `editorStore.ts` |
| 1.3 | Créer `editorValidationStore` et hook `useGameValidation` | `editorValidationStore.ts`, `useGameValidation.ts` |
| 1.4 | Layout 3 panneaux (vide, structure uniquement) | `GameEditor.tsx` + CSS |
| 1.5 | Navigation entre Dashboard et Éditeur | React Router |

### Phase 2 : Arbre des composants + Création

| Step | Description |
|---|---|
| 2.1 | `ComponentTree` : affichage listes des cards/decks/zones |
| 2.2 | Boutons "Ajouter carte/deck/zone" |
| 2.3 | `componentFactory.ts` : génération des objets par défaut |
| 2.4 | `idGenerator.ts` : génération d'IDs uniques |
| 2.5 | Sélection d'un composant dans l'arbre → mise à jour `editorStore.selectedId` |

### Phase 3 : Formulaires de propriétés

| Step | Description |
|---|---|
| 3.1 | `PropertyPanel` : panneau réactif selon le type sélectionné |
| 3.2 | `CardForm` : édition complète d'une carte |
| 3.3 | `DeckForm` : édition complète d'un deck |
| 3.4 | `ZoneForm` : édition complète d'une zone |
| 3.5 | Suppression de composants |
| 3.6 | Validation inline (champs rouges, messages d'erreur) |

### Phase 4 : Canvas interactif (positionnement)

| Step | Description |
|---|---|
| 4.1 | `EditorCanvas` : wrapper `TableCanvas` en mode édition |
| 4.2 | Drag & drop sur le canvas pour positionner les composants |
| 4.3 | Mise à jour de la position dans l'état éditeur |
| 4.4 | Snap aux zones si `snapRadius` défini (réutiliser `snapDetection.ts`) |

### Phase 5 : Actions

| Step | Description |
|---|---|
| 5.1 | `ActionEditor` : liste des actions d'un composant |
| 5.2 | Ajout/suppression/réordonnancement des actions |
| 5.3 | Édition des actions unitaires (flip, draw, shuffle) |
| 5.4 | `CompositeStepEditor` : éditeur de séquence de steps |
| 5.5 | Validation des actions composites (max 1 shuffle, pas de nesting) |

### Phase 6 : Startup

| Step | Description |
|---|---|
| 6.1 | `StartupEditor` : éditeur de la séquence de démarrage |
| 6.2 | Ajout/suppression/réordonnancement des steps |
| 6.3 | Édition de chaque step (type, target, paramètres) |
| 6.4 | Validation des références (target existe, targetZone existe) |

### Phase 7 : Validation + Export

| Step | Description |
|---|---|
| 7.1 | `ValidationPanel` : affichage global des erreurs |
| 7.2 | Barre d'état : "3 erreurs - Export bloqué" |
| 7.3 | `JsonPreview` : onglet ou modal d'aperçu du JSON |
| 7.4 | `jsonExport.ts` : génération du JSON et download |
| 7.5 | Bouton Export : dialogue, validation, téléchargement |

### Phase 8 : Undo/Redo + Polissage

| Step | Description |
|---|---|
| 8.1 | `editorHistoryStore` : snapshots de l'état |
| 8.2 | Raccourcis clavier Ctrl+Z / Ctrl+Shift+Z |
| 8.3 | Sauvegarde locale (localStorage) du brouillon en cours |
| 8.4 | Messages de confirmation avant de quitter avec changements non sauvegardés |

---

## 8. Cas limites et edge cases

| Situation | Comportement attendu |
|---|---|
| Deck référence une carte supprimée | Erreur de validation visible, le champ `cards` du deck est marqué |
| Zone référencée par `draw-to-zone` supprimée | Erreur de validation : l'action devient invalide |
| Carte avec `position: null` | N'apparaît pas sur le canvas mais reste dans l'arbre |
| Deck vide (0 cartes) | Bloqué à l'export (min 1 carte requis) |
| Noms d'IDs en double | Erreur de validation globale (validé par Zod) |
| Action composite avec 2 shuffle | Erreur de validation (validé par Zod) |
| Startup step cible un composant supprimé | Erreur de validation |
| Renommage d'un ID | Toutes les références sont mises à jour automatiquement |
| Trop d'étapes dans un composite (>20) | Erreur de validation (validé par Zod) |
| Image URL sans extension valide | Erreur de validation (validé par Zod) |

---

## 9. Métriques de succès

| Critère | Cible |
|---|---|
| Temps pour créer un jeu simple (ex: Poker Patience) depuis l'interface | < 15 min |
| Taux de couverture de validation Zod | 100% des règles existantes |
| Feedback de validation en temps réel | < 300ms après la fin de la saisie |
| Export JSON valide au premier clic | 100% (validation avant export) |
| Nombre de clics pour ajouter+configurer une carte | < 5 clics |

---

## 10. Instructions pour l'IA implémentant

### Format des specs à générer

1. **Feature Requirements** → `docs/specs/product_requirements/game-editor.md` (template `feature-requirements.md`)
2. **Technical Specification** → `docs/specs/technical_requirements/game-editor.md` (template `technical-spec.md`)

### Contenu des specs

- Les PRD et tech spec doivent couvrir **toutes les phases 1 à 8**
- Chaque phase doit définir les "user story" dans le PRD
- Le tech spec détaille l'architecture, les stores, les composants
- Le backlog (`docs/specs/backlog.md`) reçoit une entrée par phase

### Contraintes de code

- Validation Zod existante : ne pas la modifier, l'utiliser telle quelle
- Canvas existant : wrapper le `TableCanvas` pour l'éditeur, ne pas le réécrire
- Types existants : les étendre si nécessaire, ne pas les casser
- Tests : chaque phase doit avoir des tests unitaires pour les stores et les utilitaires

### Workflow pour l'IA

1. Rédiger le PRD et le tech spec
2. Les soumettre pour validation
3. Une fois validés, implémenter phase par phase
4. Après chaque phase : STOP, attendre validation
5. Ne pas passer à la phase suivante sans validation

---

## 11. Questions ouvertes

| # | Question | Décision | Résolue le |
|---|---|---|---|
| 1 | Faut-il un mode "upload d'image" (pas seulement URL) ? | | |
| 2 | Le JSON exporté doit-il remplacer le fichier existant dans `public/games/` ou être téléchargé ? | | |
| 3 | Faut-il un système de templates de jeu (ex: "Démarrer avec un jeu de 52 cartes") ? | | |
| 4 | Faut-il gérer le chargement d'un fichier JSON existant depuis l'interface (pas depuis le code) ? | | |
| 5 | Multi-langue pour l'interface éditeur (anglais/français) ? | | |

---

## 12. Change Log

| Date | Changement | Auteur |
|---|---|---|
| 2026-05-19 | Création du document | IA |