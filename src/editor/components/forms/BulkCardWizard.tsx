import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "@/editor/stores/editorStore";
import type { CardSlot } from "@/editor/utils/bulkCardUtils";
import type { CardComponent } from "@/types/game";
import {
  processImageFiles,
  readFilesAsBlobUrls,
  revokeBlobUrls,
  matchFrontAndBack,
  generateCardSlotsFromCount,
  createDeckFromSlots,
  createDeckFromExistingCards,
} from "@/editor/utils/bulkCardUtils";

type WizardMode = "count" | "images" | "existing";

interface Props {
  onClose: () => void;
}

export default function BulkCardWizard({ onClose }: Props) {
  const game = useEditorStore((s) => s.game);
  const updateGame = useEditorStore((s) => s.updateGame);
  const selectComponent = useEditorStore((s) => s.selectComponent);

  const [step, setStep] = useState<1 | 3>(1);
  const [mode, setMode] = useState<WizardMode>("count");

  // Count mode
  const [cardCount, setCardCount] = useState(0);
  const [defaultFaceText, setDefaultFaceText] = useState("Card");
  const [defaultBackText, setDefaultBackText] = useState("Card Back");

  // Image mode
  const [uploadedImages, setUploadedImages] = useState<Awaited<ReturnType<typeof readFilesAsBlobUrls>> | null>(null);
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing cards mode
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Result slots (editable)
  const [slots, setSlots] = useState<CardSlot[]>([]);

  const allCards = useMemo(() => {
    return (game?.components.filter(
      (c) => c.type === "card",
    ) ?? []) as CardComponent[];
  }, [game]);

  const isValid = useMemo(() => {
    if (mode === "count") return cardCount >= 0 && cardCount <= 1000;
    if (mode === "existing") return selectedCardIds.length > 0;
    return slots.length > 0;
  }, [mode, cardCount, selectedCardIds.length, slots.length]);

  // ─── File upload ─────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Revoke previous before creating new ones (safe — not yet in store)
      if (uploadedImages) revokeBlobUrls(uploadedImages);

      setIsReading(true);
      try {
        const fileArray = Array.from(files);
        const processed = processImageFiles(fileArray);
        const withUrls = await readFilesAsBlobUrls(processed);
        console.debug("[BulkCardWizard] files loaded:", fileArray.length, "files,", withUrls.length, "valid images");
        setUploadedImages(withUrls);
      } finally {
        setIsReading(false);
      }
      e.target.value = "";
    },
    [uploadedImages],
  );

  useEffect(() => {
    if (!uploadedImages || uploadedImages.length === 0) {
      setSlots([]);
      return;
    }
    const matched = matchFrontAndBack(uploadedImages);
    console.debug("[BulkCardWizard] matched", matched.length, "slots from", uploadedImages.length, "images");
    setSlots(matched);
  }, [uploadedImages]);

  // ─── Slot editing ────────────────────────────────────────────────────

  const updateSlot = useCallback(
    (index: number, updater: (slot: CardSlot) => CardSlot) => {
      setSlots((prev) => {
        const next = [...prev];
        next[index] = updater(next[index]);
        return next;
      });
    },
    [],
  );

  const removeSlot = useCallback(
    (index: number) => {
      setSlots((prev) => prev.filter((_, i) => i !== index));
    },
    [],
  );

  // ─── Existing cards toggle ───────────────────────────────────────────

  const toggleExistingCard = useCallback((cardId: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId],
    );
  }, []);

  // ─── Create deck ─────────────────────────────────────────────────────

  const handleCreate = useCallback(() => {
    if (!game) return;

    const existingIds = game.components.map((c) => c.id);

    if (mode === "existing") {
      // Find decks containing selected cards
      const otherDeckIds = new Set<string>();
      for (const cardId of selectedCardIds) {
        for (const c of game.components) {
          if (c.type === "deck" && c.cards.includes(cardId)) {
            otherDeckIds.add(c.id);
          }
        }
      }

      let updatedComponents = [...game.components];

      // Remove selected cards from other decks
      if (otherDeckIds.size > 0) {
        updatedComponents = updatedComponents.map((c) => {
          if (c.type === "deck" && otherDeckIds.has(c.id)) {
            return { ...c, cards: c.cards.filter((id) => !selectedCardIds.includes(id)) };
          }
          return c;
        });
      }

      // Set selected card positions to null (they're now in a deck)
      updatedComponents = updatedComponents.map((c) => {
        if (c.type === "card" && selectedCardIds.includes(c.id)) {
          return { ...c, position: null };
        }
        return c;
      });

      const deck = createDeckFromExistingCards(selectedCardIds, existingIds);
      updatedComponents = [...updatedComponents, deck];

      console.debug("[BulkCardWizard] create existing deck:", {
        deckId: deck.id,
        cards: deck.cards,
        removedFromDecks: [...otherDeckIds],
      });

      updateGame(() => ({
        ...game,
        components: updatedComponents,
      }));
      selectComponent(deck.id);
      onClose();
      return;
    }

    // Create deck + new cards (count or images mode)
    const { deck, cards } = createDeckFromSlots(slots, existingIds);

    console.debug("[BulkCardWizard] create deck with new cards:", {
      deckId: deck.id,
      cardCount: cards.length,
      sampleCard: cards[0] && {
        id: cards[0].id,
        faceImage: cards[0].face.image?.substring(0, 50),
        backImage: cards[0].back?.image?.substring(0, 50),
      },
    });

    updateGame((g) => ({
      ...g,
      components: [...g.components, deck, ...cards],
    }));

    selectComponent(deck.id);
    onClose();
  }, [game, mode, slots, selectedCardIds, updateGame, selectComponent, onClose]);

  // ─── Navigation ──────────────────────────────────────────────────────

  const goToReview = useCallback(() => {
    if (mode === "count") {
      setSlots(
        generateCardSlotsFromCount(cardCount, defaultFaceText, defaultBackText),
      );
    }
    setStep(3);
  }, [mode, cardCount, defaultFaceText, defaultBackText]);

  // ─── Drop handler ────────────────────────────────────────────────────

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      if (uploadedImages) revokeBlobUrls(uploadedImages);

      setIsReading(true);
      try {
        const fileArray = Array.from(files);
        const processed = processImageFiles(fileArray);
        const withUrls = await readFilesAsBlobUrls(processed);
        setUploadedImages(withUrls);
      } finally {
        setIsReading(false);
      }
    },
    [uploadedImages],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // ─── Field helper ────────────────────────────────────────────────────

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="mb-0.5 block text-xs text-gray-500">{label}</label>
        {children}
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────

  const modeLabel =
    mode === "existing"
      ? `Créer le deck (${selectedCardIds.length} cartes)`
      : step === 1
        ? "Réviser les cartes →"
        : `Créer le deck (${slots.length} cartes)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-3">
          <h2 className="text-base font-semibold text-white">
            Nouveau deck
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-400">
                Choisissez le mode de création du deck :
              </p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setMode("count")}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    mode === "count"
                      ? "border-blue-500 bg-blue-950/40 text-blue-200"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <div className="text-sm font-medium">Par nombre</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Définissez un nombre de cartes à créer.
                  </div>
                </button>

                <button
                  onClick={() => setMode("images")}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    mode === "images"
                      ? "border-blue-500 bg-blue-950/40 text-blue-200"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <div className="text-sm font-medium">Par images</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Importez des images, matching auto front/back.
                  </div>
                </button>

                <button
                  onClick={() => setMode("existing")}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    mode === "existing"
                      ? "border-blue-500 bg-blue-950/40 text-blue-200"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <div className="text-sm font-medium">Cartes existantes</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Sélectionnez des cartes déjà créées.
                  </div>
                </button>
              </div>

              {mode === "count" && (
                <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <Field label="Nombre de cartes (0 = deck vide)">
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={cardCount}
                      onChange={(e) => setCardCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
                    />
                  </Field>

                  {cardCount > 0 && (
                    <>
                      <Field label="Texte par défaut (face)">
                        <input
                          type="text"
                          value={defaultFaceText}
                          onChange={(e) => setDefaultFaceText(e.target.value)}
                          placeholder="Card"
                          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
                        />
                        <p className="mt-0.5 text-[11px] text-gray-600">
                          Ex: "Card 1", "Card 2"&hellip;
                        </p>
                      </Field>

                      <Field label="Texte par défaut (dos)">
                        <input
                          type="text"
                          value={defaultBackText}
                          onChange={(e) => setDefaultBackText(e.target.value)}
                          placeholder="Card Back"
                          className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm"
                        />
                      </Field>
                    </>
                  )}
                </div>
              )}

              {mode === "images" && (
                <div className="space-y-4">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 p-8 transition-colors hover:border-gray-500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg
                      className="mb-2 h-8 w-8 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-400">
                      {isReading ? "Lecture des fichiers..." : "Cliquez ou glissez-déposez vos images ici"}
                    </span>
                    <span className="mt-1 text-xs text-gray-600">PNG, JPG, SVG acceptés</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.svg"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isReading}
                    />
                  </div>

                  {uploadedImages && uploadedImages.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs text-gray-500">
                        {uploadedImages.length} fichier(s) — {slots.length} carte(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {uploadedImages.map((img, i) => (
                          <div
                            key={i}
                            className="group relative h-16 w-12 overflow-hidden rounded border border-gray-700"
                            title={`${img.file.name} (${img.side})`}
                          >
                            {img.blobUrl ? (
                              <img
                                src={img.blobUrl}
                                alt={img.file.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-gray-600">...</div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 text-[10px] text-white truncate">
                              {img.side === "front" ? "F" : img.side === "back" ? "B" : "?"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {slots.length > 0 && (
                    <div className="rounded-lg border border-green-900/50 bg-green-950/30 p-3">
                      <p className="text-xs font-medium text-green-400">✓ {slots.length} cartes détectées.</p>
                    </div>
                  )}
                </div>
              )}

              {mode === "existing" && (
                <div className="space-y-2">
                  {allCards.length === 0 && (
                    <p className="text-sm text-gray-600">Aucune carte disponible.</p>
                  )}
                  <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-2">
                    {allCards.map((card) => (
                      <label
                        key={card.id}
                        className={`flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                          selectedCardIds.includes(card.id)
                            ? "bg-blue-900/40 text-blue-200"
                            : "text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCardIds.includes(card.id)}
                          onChange={() => toggleExistingCard(card.id)}
                          className="rounded border-gray-600 bg-gray-900"
                        />
                        <span className="truncate">{card.id}</span>
                        <span className="ml-auto text-xs text-gray-600">{card.face.text}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">{selectedCardIds.length} carte(s)</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Révisez et modifiez les cartes. Vous pouvez
                <button onClick={() => setStep(1)} className="mx-1 text-blue-400 underline hover:text-blue-300">
                  revenir en arrière
                </button>.
              </p>

              {slots.length === 0 && (
                <p className="text-sm text-yellow-400">Aucune carte (deck vide).</p>
              )}

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-800 p-3">
                    <div className="flex flex-col gap-1">
                      {slot.faceImage ? (
                        <img src={slot.faceImage} alt="face" className="h-12 w-9 rounded border border-gray-600 object-cover" />
                      ) : (
                        <div className="flex h-12 w-9 items-center justify-center rounded border border-gray-600 bg-gray-700 text-[10px] text-gray-500">no img</div>
                      )}
                      <span className="text-[10px] text-gray-600">face</span>
                      {slot.backImage ? (
                        <img src={slot.backImage} alt="back" className="h-12 w-9 rounded border border-gray-600 object-cover" />
                      ) : (
                        <div className="flex h-12 w-9 items-center justify-center rounded border border-gray-600 bg-gray-700 text-[10px] text-gray-500">no img</div>
                      )}
                      <span className="text-[10px] text-gray-600">back</span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={slot.faceText}
                        onChange={(e) => updateSlot(i, (s) => ({ ...s, faceText: e.target.value }))}
                        className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm text-white"
                        placeholder="Face text"
                      />
                      <input
                        type="text"
                        value={slot.backText}
                        onChange={(e) => updateSlot(i, (s) => ({ ...s, backText: e.target.value }))}
                        className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm text-white"
                        placeholder="Back text"
                      />
                    </div>

                    <button
                      onClick={() => removeSlot(i)}
                      className="shrink-0 rounded p-1 text-gray-600 hover:bg-red-950/50 hover:text-red-400"
                      title="Supprimer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-700 px-5 py-3">
          <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white">
            Annuler
          </button>

          <div className="flex items-center gap-2">
            {mode === "existing" && (
              <button onClick={handleCreate} disabled={selectedCardIds.length === 0}
                className="rounded bg-green-700 px-4 py-1.5 text-sm text-white transition-colors hover:bg-green-600 disabled:opacity-40">
                {modeLabel}
              </button>
            )}

            {mode !== "existing" && step === 1 && (
              <button onClick={goToReview}
                disabled={(mode === "count" && cardCount < 0) || (mode === "images" && slots.length === 0)}
                className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white transition-colors hover:bg-blue-500 disabled:opacity-40">
                {modeLabel}
              </button>
            )}

            {mode !== "existing" && step === 3 && (
              <button onClick={handleCreate} disabled={!isValid}
                className="rounded bg-green-700 px-4 py-1.5 text-sm text-white transition-colors hover:bg-green-600 disabled:opacity-40">
                {modeLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}