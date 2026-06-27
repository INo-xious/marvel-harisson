import { getProjects } from "@/data/localized-data";
import { defaultLocale, type Locale } from "@/data/locale";

export type TimelineEntry = {
  title: string;
  description: string;
  year: "2025" | "2026";
  href?: string;
};

const descriptionsByLocale: Record<Locale, Record<string, string>> = {
  en: {
  "marveious-style-engine": "C++ chess engine + Python playstyle pipeline",
  "idx-ownership-data-pipeline": "IDX disclosures and PDF table extraction",
  "robotics-soda-task": "Mobile robot design with arm, camera, and RPLiDAR",
  "pacman-processing-game": "Grid-based game and networking logic",
  "github-profile-readme": "Developer profile and project documentation",
  "marvel-harisson": "Portfolio website with Next.js and Tailwind CSS",
  },
  ja: {
    "marveious-style-engine": "C++ チェスエンジン + Python プレイスタイル分析",
    "idx-ownership-data-pipeline": "IDX 開示資料と PDF テーブル抽出",
    "robotics-soda-task": "アーム、カメラ、RPLiDAR を使う移動ロボット設計",
    "pacman-processing-game": "グリッドベースのゲームとネットワークロジック",
    "github-profile-readme": "開発者プロフィールとプロジェクト文書",
    "marvel-harisson": "Next.js と Tailwind CSS によるポートフォリオサイト",
  },
};

const educationTimelineByLocale: Record<Locale, TimelineEntry[]> = {
  en: [
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
  ],
  ja: [
    {
      title: "立命館大学に入学",
      description: "情報システムサイエンス・エンジニアリング",
      year: "2026",
      href: "https://en.ritsumei.ac.jp/ise/isse/",
    },
    {
      title: "ARC Academy 日本語学校 新宿校に入学",
      description: "東京で日本語学習を開始",
      year: "2025",
      href: "https://japanese.arc-academy.net/en/",
    },
    {
      title: "Sekolah Dian Harapan Daan Mogot を卒業",
      description: "高校課程を修了",
      year: "2025",
      href: "https://www.sdh.sch.id/",
    },
  ],
};

export function getTimeline(locale: Locale = defaultLocale): TimelineEntry[] {
  const descriptions = descriptionsByLocale[locale];
  const projectTimeline: TimelineEntry[] = getProjects(locale).map((project) => ({
    title: project.title,
    description: descriptions[project.slug],
    year: project.year,
    href: project.route,
  }));

  return [...projectTimeline, ...educationTimelineByLocale[locale]];
}

export const timeline: TimelineEntry[] = getTimeline();
