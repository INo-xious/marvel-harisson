export type ContactLink = {
  kind: "github" | "linkedin" | "email";
  label: string;
  value: string;
  href?: string;
  note: string;
};

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
    value: "Email not published yet",
    // Add a public mailto: URL here when Marvel chooses to publish an address.
    note: "Use GitHub or LinkedIn in the meantime",
  },
];
