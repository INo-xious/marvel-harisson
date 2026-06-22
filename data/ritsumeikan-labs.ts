export type RitsumeikanLab = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  url: string;
  image: string;
  alt: string;
  imageFit?: "cover" | "contain";
};

export const ritsumeikanLabs: RitsumeikanLab[] = [
  {
    id: "ice",
    name: "Intelligent Computer Entertainment Lab",
    shortName: "ICE Lab",
    description: "Interactive entertainment and game-oriented computing.",
    url: "https://www.ice.ci.ritsumei.ac.jp/",
    image: "/images/lab/ritsumeikan-ice.png",
    alt: "Intelligent Computer Entertainment Lab website shown as a colorful game map.",
    imageFit: "contain",
  },
  {
    id: "vine",
    name: "Visual Information Engineering Laboratory",
    shortName: "VINE Lab",
    description: "Image and video processing, quality assessment, visual coding, and perception.",
    url: "https://vinelab.jp/",
    image: "/images/lab/ritsumeikan-vine.png",
    alt: "Visual Information Engineering Laboratory website with white wave lines on black.",
  },
  {
    id: "esoc",
    name: "e-Society Laboratory",
    shortName: "ICT for Human Enhancement",
    description: "Human-centered ICT in a multidisciplinary, international learning environment.",
    url: "https://rits-esoc.tech/",
    image: "/images/lab/ritsumeikan-esoc.png",
    alt: "e-Society Laboratory website over a photograph of Ritsumeikan University OIC.",
  },
  {
    id: "dgov",
    name: "Digital Governance Systems Laboratory",
    shortName: "DGS Lab",
    description: "ICT and data systems for public services, digital governance, and quality of life.",
    url: "https://dgovsys.org/",
    image: "/images/lab/ritsumeikan-dgov.png",
    alt: "Digital Governance Systems Laboratory website with a large black title on a dot grid.",
  },
  {
    id: "aecal",
    name: "Affective Engineering and Computer Arts Lab",
    shortName: "AECAL",
    description: "Systems shaped around human senses, emotions, sensibilities, and interactive arts.",
    url: "https://affective.engineering/",
    image: "/images/lab/ritsumeikan-aecal.png",
    alt: "Affective Engineering and Computer Arts Lab website with a bright blue header.",
  },
];
