export type LabItem = {
  id: string;
  title: string;
  category: string;
  year: "2026";
  description: string;
  image: string;
  thumbnailImage: string;
  alt: string;
  mediaLabel: "Original photograph";
  tone: "dark" | "light";
  url: string;
};

export const labItems: LabItem[] = [
  {
    id: "rione-home-league",
    title: "Ri-one @Home League",
    category: "Robotics Development",
    year: "2026",
    description:
      "A development session with Ri-one's @Home League team, which builds service robots for household environments.",
    image: "/images/lab/rione-home-league.jpg",
    thumbnailImage: "/images/lab/optimized/rione-home-league-card.webp",
    alt: "Two Ri-one members working with laptops and prototype hardware in a robotics lab.",
    mediaLabel: "Original photograph",
    tone: "light",
    url: "https://rione.org/home-league/",
  },
];
