import { projects } from "@/data/projects";

export type TimelineEntry = {
  title: string;
  description: string;
  year: "2026";
  href: `/projects/${string}`;
};

const descriptions: Record<string, string> = {
  "marveious-style-engine": "C++ chess engine + Python playstyle pipeline",
  "idx-ownership-data-pipeline": "IDX disclosures and PDF table extraction",
  "robotics-soda-task": "Mobile robot design with arm, camera, and RPLiDAR",
  "pacman-processing-game": "Grid-based game and networking logic",
  "python-file-automation": "File I/O fundamentals and transformations",
  "github-profile-readme": "Developer profile and project documentation",
};

export const timeline: TimelineEntry[] = projects.map((project) => ({
  title: project.title,
  description: descriptions[project.slug],
  year: project.year,
  href: project.route,
}));
