import { projects } from "@/data/projects";

export type TimelineEntry = {
  title: string;
  description: string;
  year: "2025" | "2026";
  href?: string;
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
    description: "Information Systems Science and Engineering",
    year: "2026",
    href: "https://en.ritsumei.ac.jp/ise/isse/",
  },
  {
    title: "Enrolled in ARC Academy Japanese Language School Shinjuku",
    description: "Started Japanese language studies in Tokyo",
    year: "2025",
    href: "https://japanese.arc-academy.net/en/",
  },
  {
    title: "Graduated from Sekolah Dian Harapan Daan Mogot",
    description: "Completed high school education",
    year: "2025",
    href: "https://www.sdh.sch.id/",
  },
];
