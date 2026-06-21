export type LabItem = {
  id: string;
  title: string;
  category: string;
  year: "2026";
  description: string;
  image: string;
  alt: string;
  mediaLabel: "Concept visualization";
  tone: "dark" | "light";
};

export const labItems: LabItem[] = [
  {
    id: "robotics-sketch",
    title: "Robotics sketch",
    category: "Hardware Concept",
    year: "2026",
    description: "Early layout study for a mobile robot with an arm, camera, and lidar.",
    image: "/images/lab/robotics-sketch.png",
    alt: "Concept visualization of a top-down mobile robot on graph paper with lidar rings and engineering annotations.",
    mediaLabel: "Concept visualization",
    tone: "light",
  },
  {
    id: "chess-engine-visual",
    title: "Chess engine visual",
    category: "Software Experiment",
    year: "2026",
    description: "Board, search-tree, and evaluation studies for the MarveIous Style Engine.",
    image: "/images/lab/chess-engine-visual.png",
    alt: "Concept visualization of a grayscale chessboard, amber candidate move, evaluation curve, and search tree.",
    mediaLabel: "Concept visualization",
    tone: "dark",
  },
  {
    id: "processing-game",
    title: "Processing game screenshot",
    category: "Game Experiment",
    year: "2026",
    description: "An original maze, movement path, and state experiment inspired by the Processing game.",
    image: "/images/lab/processing-game.png",
    alt: "Concept visualization of an abstract maze with geometric tokens and a cobalt movement path.",
    mediaLabel: "Concept visualization",
    tone: "dark",
  },
  {
    id: "interface-test",
    title: "UI interaction test",
    category: "Interface Experiment",
    year: "2026",
    description: "Floating navigation spacing, selection, tooltip, and focus-state study.",
    image: "/images/lab/interface-test.png",
    alt: "Concept visualization of a compact black floating toolbar and its spacing and selected-state study.",
    mediaLabel: "Concept visualization",
    tone: "light",
  },
  {
    id: "system-diagram",
    title: "System diagram",
    category: "Software Design",
    year: "2026",
    description: "A visual pipeline study for document discovery, extraction, validation, and export.",
    image: "/images/projects/idx-ownership-data-pipeline.png",
    alt: "Concept visualization of documents passing through table reconstruction into a structured spreadsheet.",
    mediaLabel: "Concept visualization",
    tone: "dark",
  },
  {
    id: "code-study",
    title: "Code transformation study",
    category: "Programming",
    year: "2026",
    description: "A file-processing study representing small programming exercises and implementation notes.",
    image: "/images/projects/python-file-automation.png",
    alt: "Concept visualization of input text files passing through a transformation flow into validated output files.",
    mediaLabel: "Concept visualization",
    tone: "dark",
  },
];
