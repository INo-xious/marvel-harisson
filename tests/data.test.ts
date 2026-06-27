import { describe, expect, it } from "vitest";
import { labItems } from "@/data/lab-items";
import { contactLinks, publicEmail, publicEmailHref } from "@/data/contact";
import { getContactLinks, getProjects } from "@/data/localized-data";
import { siteCopy } from "@/data/locale";
import { projects } from "@/data/projects";
import { getTimeline, timeline } from "@/data/timeline";
import { ritsumeikanLabs } from "@/data/ritsumeikan-labs";
import { HOME_ZOOM_MAX, HOME_ZOOM_MIN, TILE_POOL_SIZE } from "@/components/project-map";
import { themeBootstrapScript } from "@/components/theme-provider";

describe("portfolio data", () => {
  it("keeps project slugs, routes, and timeline entries unique and aligned", () => {
    expect(projects).toHaveLength(6);
    expect(new Set(projects.map((project) => project.slug)).size).toBe(6);
    expect(timeline.slice(0, projects.length).map((entry) => entry.href)).toEqual(projects.map((project) => project.route));
    expect(timeline).toHaveLength(projects.length + 3);
  });

  it("keeps unfinished robotics claims and real project media honest", () => {
    const robotics = projects.find((project) => project.slug === "robotics-soda-task");
    expect(robotics?.caseStudy.built).toBeUndefined();
    expect(robotics?.caseStudy.lessons).toBeUndefined();
    expect(projects.some((project) => project.slug === "python-file-automation")).toBe(false);
  });

  it("exposes repository links for public project work", () => {
    const linked = projects.filter((project) => project.repositoryUrl);
    expect(linked.map((project) => project.slug)).toEqual([
      "marveious-style-engine",
      "idx-ownership-data-pipeline",
      "robotics-soda-task",
      "pacman-processing-game",
      "github-profile-readme",
      "marvel-harisson",
    ]);
    expect(projects.find((project) => project.slug === "robotics-soda-task")?.repositoryUrl).toBe(
      "https://github.com/Gil-gil-glitch/ros2_crane_plus_ws/tree/main",
    );
    expect(projects.find((project) => project.slug === "pacman-processing-game")?.repositoryUrl).toBe(
      "https://github.com/INo-xious/packman-game-ai-agent",
    );
  });

  it("provides Japanese localized copy without changing routes or repository URLs", () => {
    const japaneseProjects = getProjects("ja");
    expect(japaneseProjects).toHaveLength(projects.length);
    expect(japaneseProjects.map((project) => project.route)).toEqual(projects.map((project) => project.route));
    expect(japaneseProjects.find((project) => project.slug === "robotics-soda-task")?.description).toContain("ロボティクス");
    expect(japaneseProjects.find((project) => project.slug === "pacman-processing-game")?.repositoryUrl).toBe(
      "https://github.com/INo-xious/packman-game-ai-agent",
    );
    expect(getTimeline("ja").some((entry) => entry.title === "立命館大学に入学")).toBe(true);
    expect(getContactLinks("ja").find((item) => item.kind === "email")?.label).toBe("メール");
    expect(siteCopy.ja.projects.title).toBe("制作");
  });

  it("publishes the contact email through one mailto address", () => {
    const email = contactLinks.find((item) => item.kind === "email");
    expect(publicEmail).toBe("im.marvel.harisson@gmail.com");
    expect(publicEmailHref).toBe(`mailto:${publicEmail}`);
    expect(email).toMatchObject({ value: publicEmail, href: publicEmailHref });
  });

  it("uses only the real Ri-one Lab photograph and destination", () => {
    expect(labItems).toHaveLength(1);
    expect(labItems[0].mediaLabel).toBe("Original photograph");
    expect(labItems[0].url).toBe("https://rione.org/home-league/");
  });

  it("lists the five ISSE project-based learning labs with unique links", () => {
    expect(ritsumeikanLabs).toHaveLength(5);
    expect(new Set(ritsumeikanLabs.map((lab) => lab.url)).size).toBe(5);
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
