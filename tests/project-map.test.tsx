import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { homeRouteArtifacts } from "@/components/home-artifacts";
import { LanguageProvider } from "@/components/language-provider";
import {
  formatOsakaTime,
  GRID_SIZE,
  GRID_TILE_SIZE,
  pointToRotatedGridCell,
  ProjectMap,
  screenDeltaToSpatialPlane,
  snapToGrid,
  SPATIAL_ANGLE,
  TILE_POOL_SIZE,
} from "@/components/project-map";

function renderProjectMap() {
  return render(
    <LanguageProvider initialLocale="en">
      <ProjectMap />
    </LanguageProvider>,
  );
}

function stubMotionPreferences(reduced = false) {
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reduced : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
}

describe("ProjectMap spatial system", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("formats the map clock in Osaka time", () => {
    expect(formatOsakaTime(new Date("2026-06-21T00:20:26.000Z"))).toBe("09:20:26");
  });

  it("contains the five approved homepage destinations", () => {
    stubMotionPreferences();
    expect(homeRouteArtifacts.map(({ href }) => href)).toEqual([
      "/projects",
      "/lab",
      "/timeline",
      "/contact",
      "/about",
    ]);
    const { container } = renderProjectMap();
    expect(container.querySelectorAll(".artifact-plane > a")).toHaveLength(5);
    expect(container.querySelector('.artifact-plane a[href="/lab"] .lab-artifact img')).toBeInTheDocument();
    expect(container.querySelector('.artifact-plane a[href^="/projects/"]')).not.toBeInTheDocument();
    const projectLink = container.querySelector('.artifact-plane a[href="/projects"]') as HTMLElement;
    fireEvent.pointerEnter(projectLink, { clientX: 120, clientY: 160, pointerType: "mouse" });
    expect(container.querySelector(".map-hover-label")).toHaveAttribute("data-visible", "true");
    expect(container.querySelector(".map-hover-label span")).toHaveTextContent("/projects");
  });

  it("uses a dense plus-marker grid and a capped trail pool", () => {
    stubMotionPreferences();
    const { container } = renderProjectMap();
    const pattern = container.querySelector("#home-cross-grid") as SVGPatternElement;
    expect(pattern.getAttribute("width")).toBe(String(GRID_SIZE));
    expect(pattern.getAttribute("height")).toBe(String(GRID_SIZE));
    expect(pattern.querySelector("path")?.getAttribute("d")).toBe("M13 16H19M16 13V19");
    const tiles = container.querySelectorAll(".cursor-tile");
    expect(tiles).toHaveLength(TILE_POOL_SIZE);
    expect(tiles[0]).toHaveAttribute("width", String(GRID_TILE_SIZE));
    expect(tiles[0]).toHaveAttribute("height", String(GRID_TILE_SIZE));
    expect(container.querySelector(".grid-angle-layer")?.getAttribute("transform")).toBe(`rotate(${SPATIAL_ANGLE} 0 0)`);
  });

  it("snaps the trail to half-grid cells in the rotated coordinate plane", () => {
    const radians = (SPATIAL_ANGLE * Math.PI) / 180;
    const local = { x: GRID_SIZE * 3.5, y: GRID_SIZE * 2.5 };
    const point = {
      x: Math.cos(radians) * local.x - Math.sin(radians) * local.y,
      y: Math.sin(radians) * local.x + Math.cos(radians) * local.y,
    };
    expect(pointToRotatedGridCell(point)).toEqual({ column: 3.5, row: 2.5 });
  });

  it("converts screen drag movement into the rotated, scaled spatial plane", () => {
    const radians = (SPATIAL_ANGLE * Math.PI) / 180;
    const planeDelta = { x: 64, y: 32 };
    const scale = 1.08;
    const screenDelta = {
      x: (Math.cos(radians) * planeDelta.x - Math.sin(radians) * planeDelta.y) * scale,
      y: (Math.sin(radians) * planeDelta.x + Math.cos(radians) * planeDelta.y) * scale,
    };
    expect(screenDeltaToSpatialPlane(screenDelta, scale).x).toBeCloseTo(planeDelta.x, 5);
    expect(screenDeltaToSpatialPlane(screenDelta, scale).y).toBeCloseTo(planeDelta.y, 5);
    expect(snapToGrid(47)).toBe(32);
    expect(snapToGrid(49)).toBe(64);
  });

  it("moves the complete spatial plane and activates full-cell trail tiles", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    stubMotionPreferences();

    const { container } = renderProjectMap();
    const map = container.querySelector(".project-map") as HTMLElement;
    const mapWorld = container.querySelector(".map-world") as HTMLElement;

    fireEvent.pointerMove(map, { clientX: 96, clientY: 96, pointerType: "mouse" });
    frames.shift()?.(0);
    fireEvent.pointerMove(map, { clientX: 160, clientY: 128, pointerType: "mouse" });
    frames.shift()?.(16);

    const trail = container.querySelector(".cursor-tile.tile-live") as SVGRectElement;
    expect(mapWorld.style.transform).toMatch(/^translate3d\(-?\d+\.\d{2}px, -?\d+\.\d{2}px, 0\) scale\(1\)$/);
    expect(trail).toBeInTheDocument();
    expect(trail.dataset.gridCell).toMatch(/\.5:.*\.5/);
    expect(Number(trail.getAttribute("x")) % GRID_SIZE).toBe(GRID_SIZE / 2);
    expect(Number(trail.getAttribute("y")) % GRID_SIZE).toBe(GRID_SIZE / 2);
  });

  it("disables grid movement and tiles for reduced motion", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    stubMotionPreferences(true);
    const { container } = renderProjectMap();
    const map = container.querySelector(".project-map") as HTMLElement;
    fireEvent.pointerMove(map, { clientX: 100, clientY: 100, pointerType: "mouse" });
    expect(frames).toHaveLength(0);
    expect(container.querySelector(".cursor-tile.tile-live")).not.toBeInTheDocument();
  });
});
