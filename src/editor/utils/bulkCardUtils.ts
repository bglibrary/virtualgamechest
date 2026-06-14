import type { CardComponent, DeckComponent } from "@/types/game";

// ─── Types ──────────────────────────────────────────────────────────────────

export type UploadedImage = {
  file: File;
  blobUrl: string;
  baseName: string;
  side: "front" | "back" | "unknown";
};

export type CardSlot = {
  id: string;
  faceImage: string | undefined;
  backImage: string | undefined;
  faceText: string;
  backText: string;
};

// ─── Suffix matching patterns ───────────────────────────────────────────────

const FRONT_SUFFIX_PATTERNS = [
  /[-_](?:front|face)$/i,
  /[-_]f$/i,
];

const BACK_SUFFIX_PATTERNS = [
  /[-_](?:back|rear)$/i,
  /[-_]b$/i,
];

/**
 * Strip known side suffixes from a filename (without extension).
 * e.g. "ace_of_spades_front" → "ace_of_spades"
 */
function stripSideSuffix(name: string): string {
  for (const pattern of [...FRONT_SUFFIX_PATTERNS, ...BACK_SUFFIX_PATTERNS]) {
    const stripped = name.replace(pattern, "");
    if (stripped !== name) return stripped;
  }
  return name;
}

/**
 * Detect which side a file belongs to based on its name.
 */
function detectSide(name: string): "front" | "back" | "unknown" {
  if (FRONT_SUFFIX_PATTERNS.some((p) => p.test(name))) return "front";
  if (BACK_SUFFIX_PATTERNS.some((p) => p.test(name))) return "back";
  return "unknown";
}

// ─── File processing ────────────────────────────────────────────────────────

const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg"];

function hasSupportedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

/**
 * Process raw File[] into UploadedImage[] with detected side and baseName.
 * Filters out unsupported file types.
 */
export function processImageFiles(files: File[]): UploadedImage[] {
  const valid = files.filter((f) => hasSupportedExtension(f.name));
  return valid.map((file) => {
    const nameWithoutExt = stripExtension(file.name);
    const side = detectSide(nameWithoutExt);
    const baseName = stripSideSuffix(nameWithoutExt);
    return {
      file,
      blobUrl: "", // will be filled after async read
      baseName,
      side,
    };
  });
}

/**
 * Asynchronously read files and produce blob URLs.
 * Must be called after processImageFiles, before matchFrontAndBack.
 */
export async function readFilesAsBlobUrls(
  images: UploadedImage[],
): Promise<UploadedImage[]> {
  return Promise.all(
    images.map(
      (img) =>
        new Promise<UploadedImage>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const blob = new Blob([reader.result as ArrayBuffer], {
              type: img.file.type,
            });
            resolve({ ...img, blobUrl: URL.createObjectURL(blob) });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(img.file);
        }),
    ),
  );
}

/**
 * Revoke all blob URLs in an array of UploadedImage, CardSlot, or string URLs.
 */
export function revokeBlobUrls(
  images: Array<UploadedImage | CardSlot>,
): void {
  for (const item of images) {
    if ("faceImage" in item) {
      if (item.faceImage?.startsWith("blob:")) URL.revokeObjectURL(item.faceImage);
      if (item.backImage?.startsWith("blob:")) URL.revokeObjectURL(item.backImage);
    }
    if ("blobUrl" in item && item.blobUrl) {
      if (item.blobUrl.startsWith("blob:")) URL.revokeObjectURL(item.blobUrl);
    }
  }
}

// ─── Matching ───────────────────────────────────────────────────────────────

/**
 * Match front/back images by baseName.
 */
export function matchFrontAndBack(images: UploadedImage[]): CardSlot[] {
  const fronts = images.filter((img) => img.side === "front");
  const backs = images.filter((img) => img.side === "back");
  const unknowns = images.filter((img) => img.side === "unknown");

  const backMap = new Map<string, UploadedImage>();
  for (const b of backs) {
    backMap.set(b.baseName, b);
  }

  const slots: CardSlot[] = [];
  const matchedBaseNames = new Set<string>();

  for (const f of fronts) {
    const back = backMap.get(f.baseName);
    matchedBaseNames.add(f.baseName);
    slots.push({
      id: "",
      faceImage: f.blobUrl,
      backImage: back?.blobUrl,
      faceText: fileNameToDisplayName(f.baseName),
      backText: back
        ? fileNameToDisplayName(f.baseName)
        : "Card Back",
    });
  }

  for (const b of backs) {
    if (!matchedBaseNames.has(b.baseName)) {
      slots.push({
        id: "",
        faceImage: undefined,
        backImage: b.blobUrl,
        faceText: fileNameToDisplayName(b.baseName),
        backText: fileNameToDisplayName(b.baseName),
      });
    }
  }

  for (const u of unknowns) {
    slots.push({
      id: "",
      faceImage: u.blobUrl,
      backImage: undefined,
      faceText: fileNameToDisplayName(u.baseName),
      backText: "Card Back",
    });
  }

  return slots;
}

// ─── Name transformation ────────────────────────────────────────────────────

const STOP_WORDS = new Set(["of", "the", "and", "a", "an", "in", "on", "at", "for", "to"]);

/**
 * Convert a snake_case or kebab-case filename to a display name.
 */
export function fileNameToDisplayName(name: string): string {
  const words = name.split(/[-_]+/);
  return words
    .map((word, i) => {
      if (word.length === 0) return word;
      const lower = word.toLowerCase();
      return i === 0 || !STOP_WORDS.has(lower)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : lower;
    })
    .join(" ");
}

// ─── Slot generation from count ─────────────────────────────────────────────

/**
 * Generate CardSlots from a count number, with fallback texts.
 * If count is 0, returns an empty array (empty deck).
 */
export function generateCardSlotsFromCount(
  count: number,
  faceText: string,
  backText: string,
): CardSlot[] {
  const slots: CardSlot[] = [];
  for (let i = 0; i < count; i++) {
    slots.push({
      id: "",
      faceImage: undefined,
      backImage: undefined,
      faceText: faceText ? `${faceText} ${i + 1}` : `Card ${i + 1}`,
      backText: backText || "Card Back",
    });
  }
  return slots;
}

// ─── Component creation ─────────────────────────────────────────────────────

const FLIP_ACTION = { type: "flip" as const, label: "Retourner" };

function generateComponentId(prefix: string, existingIds: Set<string>): string {
  let counter = 0;
  let id = `${prefix}-${counter}`;
  while (existingIds.has(id)) {
    counter++;
    id = `${prefix}-${counter}`;
  }
  return id;
}

/**
 * Create a DeckComponent referencing existing card IDs.
 * Used when the user picks existing cards to form a deck.
 */
export function createDeckFromExistingCards(
  cardIds: string[],
  existingIds: string[],
): DeckComponent {
  const idSet = new Set(existingIds);
  const deckId = generateComponentId("deck", idSet);
  return {
    type: "deck",
    id: deckId,
    cards: cardIds,
    position: { x: 0.5, y: 0.5 },
    faceUp: false,
    hideCountBadge: false,
    actions: [
      { type: "shuffle" as const, label: "Mélanger" },
      { type: "draw-face-up" as const, label: "Piocher" },
      { type: "flip" as const, label: "Retourner" },
    ],
  };
}

/**
 * Create the actual DeckComponent and CardComponent[] from CardSlot[].
 * Slots get their IDs assigned here.
 * IMPORTANT: Does NOT revoke blob URLs — cards in store hold references.
 */
export function createDeckFromSlots(
  slots: CardSlot[],
  existingIds: string[],
): { deck: DeckComponent; cards: CardComponent[] } {
  const idSet = new Set(existingIds);

  const cards: CardComponent[] = slots.map((slot) => {
    let cardId = slot.id;
    if (!cardId || idSet.has(cardId)) {
      cardId = generateComponentId("card", idSet);
    }
    idSet.add(cardId);

    const card: CardComponent = {
      type: "card",
      id: cardId,
      face: {
        type: "text",
        text: slot.faceText,
        ...(slot.faceImage ? { image: slot.faceImage } : {}),
      },
      back: {
        type: "text",
        text: slot.backText,
        ...(slot.backImage ? { image: slot.backImage } : {}),
      },
      position: null,
      actions: [FLIP_ACTION],
    };
    return card;
  });

  const deckId = generateComponentId("deck", idSet);
  const deck: DeckComponent = {
    type: "deck",
    id: deckId,
    cards: cards.map((c) => c.id),
    position: { x: 0.5, y: 0.5 },
    faceUp: false,
    hideCountBadge: false,
    actions: [
      { type: "shuffle" as const, label: "Mélanger" },
      { type: "draw-face-up" as const, label: "Piocher" },
      { type: "flip" as const, label: "Retourner" },
    ],
  };

  return { deck, cards };
}