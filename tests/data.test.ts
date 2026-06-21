import { describe, expect, it } from "vitest";
import { labItems } from "@/data/lab-items";
import { projects } from "@/data/projects";
import { timeline } from "@/data/timeline";
import { HOME_ZOOM_MAX, HOME_ZOOM_MIN, TILE_POOL_SIZE } from "@/components/project-map";
import { themeBootstrapScript } from "@/components/theme-provider";

describe("portfolio data", () => {
  it("keeps project slugs, routes, and timeline entries unique and aligned", () => {
    expect(projects).toHaveLength(6);
    expect(new Set(projects.map((project) => project.slug)).size).toBe(6);
    expect(timeline.map((entry) => entry.href)).toEqual(projects.map((project) => project.route));
  });

  it("only exposes repository links for verified public work", () => {
    const linked = projects.filter((project) => project.repositoryUrl);
    expect(linked.map((project) => project.slug)).toEqual([
      "marveious-style-engine",
      "idx-ownership-data-pipeline",
      "github-profile-readme",
    ]);
  });

  it("labels every generated Lab image honestly", () => {
    expect(labItems).toHaveLength(6);
    expect(labItems.every((item) => item.mediaLabel === "Concept visualization")).toBe(true);
  });
});

describe("interaction limits", () => {
  it("caps the cursor tile pool and constrains home zoom", () => {
    expect(TILE_POOL_SIZE).toBe(48);
    expect(HOME_ZOOM_MIN).toBe(0.92);
    expect(HOME_ZOOM_MAX).toBe(1.08);
  });

  it("boots theme from a versioned storage key and system preference", () => {
    expect(themeBootstrapScript).toContain("marvel-portfolio-theme:v1");
    expect(themeBootstrapScript).toContain("prefers-color-scheme: dark");
  });
});
