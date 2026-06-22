export type ContactLink = {
  kind: "github" | "linkedin" | "email";
  label: string;
  value: string;
  href?: string;
  note: string;
};

export const publicEmail = "im.marvel.harisson@gmail.com";
export const publicEmailHref = `mailto:${publicEmail}`;

export const contactLinks: ContactLink[] = [
  {
    kind: "github",
    label: "GitHub",
    value: "INo-xious",
    href: "https://github.com/INo-xious",
    note: "Public repositories and project documentation",
  },
  {
    kind: "linkedin",
    label: "LinkedIn",
    value: "Marvel Harisson",
    href: "https://www.linkedin.com/in/marvel-harisson-4102b7345/",
    note: "University, interests, and professional updates",
  },
  {
    kind: "email",
    label: "Email",
    value: publicEmail,
    href: publicEmailHref,
    note: "Email me directly",
  },
];
