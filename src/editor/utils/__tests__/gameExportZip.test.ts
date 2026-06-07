import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadGameZip } from "@/editor/utils/gameExportZip";

describe("gameExportZip", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("is importable and callable", () => {
    // downloadGameZip is async — just verify it's callable
    // (would throw on fetch in Node, which is expected)
    expect(downloadGameZip).toBeInstanceOf(Function);
  });

  it("handles invalid input gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fetch not available"));
    // Should not throw synchronously, and async rejection should be caught
    const promise = downloadGameZip({} as any, "test-id");
    // The function is async, so it returns a promise. It may reject asynchronously
    // due to the invalid game object. That's expected behavior.
    await expect(promise).rejects.toThrow();
  });
});
