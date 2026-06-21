import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatOsakaTime, ProjectMap } from "@/components/project-map";

describe("ProjectMap cursor trail", () => {
  afterEach(() => vi.restoreAllMocks());

  it("formats the map clock in Osaka time", () => {
    expect(formatOsakaTime(new Date("2026-06-21T00:20:26.000Z"))).toBe("09:20:26");
  });

  it("activates a directional trail after the pointer crosses a grid cell", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    const { container } = render(<ProjectMap />);
    const map = container.querySelector(".project-map") as HTMLElement;
    const pattern = container.querySelector("#home-cross-grid") as SVGPatternElement;

    expect(pattern.getAttribute("width")).toBe("32");
    expect(pattern.getAttribute("height")).toBe("32");

    fireEvent.pointerMove(map, { clientX: 96, clientY: 96, pointerType: "mouse" });
    frames.shift()?.(0);
    fireEvent.pointerMove(map, { clientX: 128, clientY: 112, pointerType: "mouse" });
    frames.shift()?.(16);

    const trail = container.querySelector(".cursor-tile.tile-live") as HTMLElement;
    expect(trail).toBeInTheDocument();
    expect(trail.style.getPropertyValue("--tile-color")).not.toBe("");
    expect(trail.dataset.gridCell).toMatch(/\.5:/);
    expect(trail.getAttribute("transform")).toMatch(/^rotate\(45 \d+ \d+\)$/);
    expect(trail.closest(".map-grid")).toBeInTheDocument();
  });
});
