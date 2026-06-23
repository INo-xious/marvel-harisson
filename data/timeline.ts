import { projects } from "@/data/projects";

export type TimelineEntry = {
  title: string;
  description: string;
  year: "2025" | "2026";
  href?: `/projects/${string}`;
};

const descriptions: Record<string, string> = {
  "marveious-style-engine": "C++ chess engine + Python playstyle pipeline",
  "idx-ownership-data-pipeline": "IDX disclosures and PDF table extraction",
  "robotics-soda-task": "Mobile robot design with arm, camera, and RPLiDAR",
  "pacman-processing-game": "Grid-based game and networking logic",
  "github-profile-readme": "Developer profile and project documentation",
};

const projectTimeline: TimelineEntry[] = projects.map((project) => ({
  title: project.title,
  description: descriptions[project.slug],
  year: project.year,
  href: project.route,
}));

export const timeline: TimelineEntry[] = [
  ...projectTimeline,
  {
    title: "Enrolled in Ritsumeikan University",
    description: "Started university studies in Japan",
    year: "2026",
  },
  {
    title: "Enrolled in ARC Academy Shinjuku",
    description: "Started and Graduated from Japanese language studies in Tokyo",
    year: "2025",
  },
  {
    title: "Graduated from Sekolah Dian Harapan Daan Mogot",
    description: "Completed high school education",
    year: "2025",
  },
];
