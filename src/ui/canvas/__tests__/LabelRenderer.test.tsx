import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LabelRenderer from "@/ui/canvas/LabelRenderer";

// Mock useDeviceLayout
vi.mock("@/ui/hooks/useDeviceLayout", () => ({
  useDeviceLayout: () => ({
    isMobile: false,
    getPosition: (component: any) => component.position ?? { x: 0.5, y: 0.5 },
    getCardSize: () => ({ widthRatio: 0.08, minWidth: 55, aspectRatio: 1.4 }),
  }),
}));

describe("LabelRenderer", () => {
  const baseLabel = {
    type: "label" as const,
    id: "test-label",
    text: "Hello World",
    position: { x: 0.5, y: 0.5 },
    fontSize: 0.03,
    textColor: "#ffffff",
    textAlign: "center" as const,
    fontWeight: "normal" as const,
    rotation: 0,
    width: 0.3,
    height: 0.1,
  };

  it("renders without crashing", () => {
    const { container } = render(
      <LabelRenderer
        component={baseLabel}
        viewportWidth={1920}
        viewportHeight={1080}
      />,
    );
    expect(container).toBeTruthy();
  });

  it("renders with custom text color", () => {
    const colored = { ...baseLabel, textColor: "#ff0000" };
    const { container } = render(
      <LabelRenderer
        component={colored}
        viewportWidth={1920}
        viewportHeight={1080}
      />,
    );
    expect(container).toBeTruthy();
  });

  it("renders with rotation", () => {
    const rotated = { ...baseLabel, rotation: 45 };
    const { container } = render(
      <LabelRenderer
        component={rotated}
        viewportWidth={1920}
        viewportHeight={1080}
      />,
    );
    expect(container).toBeTruthy();
  });

  it("renders with bold font weight", () => {
    const bold = { ...baseLabel, fontWeight: "bold" as const };
    const { container } = render(
      <LabelRenderer
        component={bold}
        viewportWidth={1920}
        viewportHeight={1080}
      />,
    );
    expect(container).toBeTruthy();
  });
});