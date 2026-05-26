# Technical Specification — Bulk Card Wizard

> Implémentation du wizard de création de cartes en masse.

## Metadata

| Field | Value |
|---|---|
| Feature | Bulk Card Wizard |
| Status | Implemented |
| Created | 2026-05-24 |
| Last Updated | 2026-05-24 |
| Requirements Reference | [phase-9-bulk-card-wizard.md](../product_requirements/phase-9-bulk-card-wizard.md) |

## Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Wizard implémenté comme une modale React autonome | Découplé du reste du formulaire, peut être ouvert depuis n'importe où | Intégré directement dans DeckForm |
| Blob URLs pour les images uploadées | Pas de persistance nécessaire dans le wizard, export gère le stockage | Base64 (trop lourd en mémoire) |
| Logique de matching extraite dans un utilitaire pur | Testable unitairement sans DOM | Matching inline dans le composant |
| Mode "Nombre" et "Images" dans la même modale | UX fluide, pas de navigation entre pages | Deux wizards séparés |
| Utilisation de FileReader API (pas de lib externe) | Pas de dépendance supplémentaire pour une feature simple | react-dropzone, uuid |

## Impacted Components

| Component | Change Type | Description |
|---|---|---|
| `src/editor/utils/bulkCardUtils.ts` | **New** | Utilitaires de parsing, matching, génération |
| `src/editor/components/forms/BulkCardWizard.tsx` | **New** | Composant modale du wizard |
| `src/editor/components/forms/DeckForm.tsx` | **Modified** | Ajout d'un bouton "Créer des cartes en lot" + import du wizard |
| `src/editor/components/forms/PropertyPanel.tsx` | **Removed** | Le bouton n'est plus dans PropertyPanel (revert) |

## API / Contracts

### `bulkCardUtils.ts`

```typescript
// Types pour le matching d'images
type UploadedImage = {
  file: File;
  blobUrl: string;
  baseName: string;     // nom sans extension, sans suffixe front/back
  side: 'front' | 'back' | 'unknown';
};

type CardSlot = {
  id: string;
  faceImage: string | undefined;  // blob URL
  backImage: string | undefined;  // blob URL
  faceText: string;
  backText: string;
};

// Fonctions exportées
function processImageFiles(files: File[]): UploadedImage[];
function matchFrontAndBack(images: UploadedImage[]): CardSlot[];
function generateCardSlotsFromCount(count: number, faceText: string, backText: string): CardSlot[];
function fileNameToDisplayName(name: string): string;
function createDeckFromSlots(slots: CardSlot[], existingIds: string[]): { deck: DeckComponent; cards: CardComponent[] };
```

## State Management

Pas de nouveau store. Le wizard est un composant local qui utilise :
- `useEditorStore` pour appeler `updateGame` avec les nouveaux composants
- `useEditorStore` pour `selectComponent` après création

## Database / Storage Changes

None. Les images uploadées sont des blob URLs temporaires (pas persistées).

## Migrations

None.

## Security Implications

- Les blob URLs ne sont accessibles que dans la session courante
- Les fichiers sont lus via FileReader en mémoire client uniquement
- Pas d'envoi réseau

## Validation Strategy

- Validation côté client uniquement (le wizard)
- Nombre de cartes : validation avant soumission
- Fichiers : validation du type MIME et extension côté client
- `imageUrlSchema` existant dans le schema Zod (pour l'export, pas pour le wizard)

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | bulkCardUtils : parsing, matching, fileNameToDisplayName, createDeckFromSlots |
| Component | Vitest | BulkCardWizard : rendu, interaction, validation |

Key test scenarios :
- fileNameToDisplayName avec différents patterns de noms
- matchFrontAndBack avec fichiers front/back bien nommés
- matchFrontAndBack avec fichiers sans matching
- generateCardSlotsFromCount avec N = 5
- createDeckFromSlots vérifie les IDs et les références deck->cards

## Performance Considerations

- FileReader lit les fichiers en mémoire → pas de problème pour des jeux de cartes standards (< 100 fichiers, < 10 Mo chacun)
- Les blob URLs sont révoquées quand la modale se ferme (ou quand on recrée des slots)
- Le tableau de révision peut contenir jusqu'à 1000 lignes → virtualisation non nécessaire pour ce volume

## Observability / Logging

None.

## Refactors Required

None.

## Open Technical Questions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Comment gérer le stockage permanent des images uploadées ? | Reporté à la feature d'export. Le wizard produit des blob URLs temporaires. | 2026-05-24 |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-24 | Création initiale | Nicolas |