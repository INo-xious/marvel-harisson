export type ProjectStatus =
  | "public-repository"
  | "concept"
  | "experiment"
  | "documentation";

export type CaseStudy = {
  problem: string;
  solution: string;
  built?: string[];
  technicalDetails: string[];
  lessons?: string[];
};

export type Project = {
  title: string;
  slug: string;
  year: "2026";
  category: string;
  status: ProjectStatus;
  description: string;
  tags: string[];
  route: `/projects/${string}`;
  repositoryUrl?: string;
  image: string;
  imageAlt: string;
  visualType: string;
  imageFit?: "cover" | "contain";
  caseStudy: CaseStudy;
};

export const projects: Project[] = [
  {
    title: "MarveIous Style Engine",
    slug: "marveious-style-engine",
    year: "2026",
    category: "C++ Chess Engine / Python Data Pipeline",
    status: "public-repository",
    description:
      "A from-scratch C++ chess engine paired with a Python data pipeline that learns move preferences from public Chess.com game history.",
    tags: ["C++", "Python", "Chess Engine", "Algorithms", "UCI", "Data Pipeline"],
    route: "/projects/marveious-style-engine",
    repositoryUrl: "https://github.com/INo-xious/marvelous-playstyle-engine",
    image: "/images/projects/marveious-style-engine-real.png",
    imageAlt:
      "MarveIous chess engine interface showing a playable board, move history, engine settings, and search depth response.",
    visualType: "Chess engine interface",
    imageFit: "contain",
    caseStudy: {
      problem:
        "I wanted to build a chess engine from scratch while also exploring how a player's public game history could influence move preferences.",
      solution:
        "I combined a C++ chess engine with a Python data pipeline. The C++ side focuses on legal move generation, search, and UCI-style interaction, while the Python side parses public Chess.com games and extracts style-related patterns.",
      built: [
        "Legal chess move handling",
        "UCI-compatible engine structure",
        "Alpha-beta search foundation",
        "Python PGN and game-history pipeline",
        "Move-preference analysis from public games",
        "Project documentation and baseline reporting",
      ],
      technicalDetails: [
        "C++ engine core",
        "Python data collection and parsing",
        "Chess.com public game archive",
        "PGN parsing",
        "Search and evaluation foundation",
      ],
      lessons: [
        "Chess engines require careful rule handling.",
        "Separating engine logic from data analysis keeps the system cleaner.",
        "C++ suits performance-sensitive logic while Python supports rapid data experiments.",
      ],
    },
  },
  {
    title: "IDX Ownership Data Pipeline",
    slug: "idx-ownership-data-pipeline",
    year: "2026",
    category: "Python Data Automation",
    status: "public-repository",
    description:
      "A Python automation pipeline for searching Indonesian Stock Exchange disclosures, parsing PDFs, reconstructing ownership tables, validating extracted data, and exporting structured Excel workbooks.",
    tags: ["Python", "PDF Parsing", "Data Automation", "Excel", "Streamlit", "Playwright"],
    route: "/projects/idx-ownership-data-pipeline",
    repositoryUrl: "https://github.com/INo-xious/idx-ownership-data-pipeline",
    image: "/images/projects/idx-ownership-data-pipeline-real.png",
    imageAlt:
      "IDX disclosure page filtered for shareholder announcements above five percent, with several PDF results listed.",
    visualType: "IDX disclosure source",
    caseStudy: {
      problem:
        "Indonesian Stock Exchange disclosure PDFs contain useful ownership information, but the data is difficult to analyze because it is trapped inside semi-structured documents.",
      solution:
        "I built a Python automation pipeline that searches disclosures, downloads relevant PDFs, reconstructs ownership tables, validates extracted information, and exports structured Excel workbooks.",
      built: [
        "Browser automation for finding documents",
        "PDF download and parsing workflow",
        "Positional table reconstruction",
        "Data-validation steps and confidence warnings",
        "Excel workbook export",
        "Streamlit interface",
      ],
      technicalDetails: ["Python", "Playwright", "pdfplumber", "Pandas", "OpenPyXL", "Streamlit"],
      lessons: [
        "Real-world PDFs are messy and inconsistent.",
        "Validation is essential when extracting data automatically.",
        "The final output should be useful for non-technical users.",
        "Automation projects need explicit error handling.",
      ],
    },
  },
  {
    title: "Robotics Soda Task Concept",
    slug: "robotics-soda-task",
    year: "2026",
    category: "Robotics / Hardware Design",
    status: "concept",
    description:
      "An early TurtleBot2/Kobuki robotics exploration using an arm, camera, and A1 RPLiDAR for a 'grab me a soda' task.",
    tags: ["Robotics", "TurtleBot2", "Kobuki", "RPLiDAR", "Hardware Design"],
    route: "/projects/robotics-soda-task",
    image: "/images/projects/robotics-soda-task.jpg",
    imageAlt:
      "A robotic arm assembly being held above a container of hardware components during an early development session.",
    visualType: "Early robotics hardware work",
    imageFit: "contain",
    caseStudy: {
      problem:
        "A robot needs to navigate, detect, and retrieve a soda can using a mobile base, sensor, camera, and arm.",
      solution:
        "The current direction combines a Kobuki/TurtleBot2 base for movement, an A1 RPLiDAR for navigation, a camera for object detection, and a robotic arm for grasping.",
      technicalDetails: ["TurtleBot2 / Kobuki base", "A1 RPLiDAR", "Camera", "Robotic arm", "Object-retrieval flow"],
    },
  },
  {
    title: "Pac-Man Processing Game",
    slug: "pacman-processing-game",
    year: "2026",
    category: "Java / Processing / Networking",
    status: "experiment",
    description:
      "A Pac-Man style game built in Processing with grid-based movement and AI/server-oriented logic.",
    tags: ["Processing", "Java", "Game Logic", "Networking"],
    route: "/projects/pacman-processing-game",
    image: "/images/projects/pacman-processing-game.png",
    imageAlt:
      "Concept visualization of an original cobalt maze, geometric player and opponent tokens, and a network-state diagram.",
    visualType: "Maze and network-state study",
    caseStudy: {
      problem:
        "I wanted to build a grid-based game while practicing Processing, movement logic, and AI/server-style game structure.",
      solution:
        "I created a Pac-Man style game using Processing with a defined maze grid, game states, player movement, pellets, and server-oriented logic.",
      built: ["Grid-based maze", "Game states", "Player movement", "Pellets and win/lose logic", "AI/server-oriented structure"],
      technicalDetails: ["Processing", "Java-style syntax", "Grid arrays", "Network and server-logic basics"],
      lessons: [
        "Grid-based games require careful state handling.",
        "Movement should be separated from rendering.",
        "Game logic becomes easier when states are clearly defined.",
      ],
    },
  },
  {
    title: "GitHub Profile README",
    slug: "github-profile-readme",
    year: "2026",
    category: "Documentation / Personal Branding",
    status: "documentation",
    description:
      "A developer profile README that presents technical focus, projects, skills, and learning direction.",
    tags: ["GitHub", "Markdown", "Documentation", "Personal Branding"],
    route: "/projects/github-profile-readme",
    repositoryUrl: "https://github.com/INo-xious/INo-xious",
    image: "/images/projects/github-profile-readme.png",
    imageAlt:
      "GitHub profile README showing a large red MARVEL banner and an introduction to Marvel Harisson's student work.",
    visualType: "GitHub profile README",
    imageFit: "contain",
    caseStudy: {
      problem:
        "My projects, interests, and learning direction needed one clear public entry point rather than scattered descriptions.",
      solution:
        "I structured a GitHub profile README around an honest student introduction, featured work, tools, current focus, and next areas to explore.",
      built: ["Profile introduction", "About and current-focus sections", "Featured project links", "Skills and tools inventory", "Exploring-next section", "Social links"],
      technicalDetails: ["Markdown", "GitHub profile repository", "Relative media assets", "Accessible link structure"],
      lessons: [
        "Good documentation benefits from hierarchy and restraint.",
        "A profile should distinguish current ability from areas being explored.",
        "Public project descriptions need regular maintenance as work evolves.",
      ],
    },
  },
];

export const projectBySlug = new Map(projects.map((project) => [project.slug, project]));

export const projectStatusLabels: Record<ProjectStatus, string> = {
  "public-repository": "Public repository",
  concept: "Concept",
  experiment: "Experiment",
  documentation: "Documentation",
};
