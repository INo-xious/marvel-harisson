import type { SVGProps } from "react";

type BrandIconProps = SVGProps<SVGSVGElement> & { size?: number };

export function GitHubMark({ size = 20, ...props }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.93c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.34-3.8-1.34-.52-1.3-1.26-1.65-1.26-1.65-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.74.4-1.24.72-1.53-2.5-.28-5.14-1.25-5.14-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.09 1.15a10.7 10.7 0 0 1 5.63 0c2.14-1.45 3.08-1.15 3.08-1.15.62 1.55.23 2.7.12 2.98.72.79 1.15 1.79 1.15 3.02 0 4.32-2.64 5.27-5.15 5.55.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
    </svg>
  );
}

export function LinkedInMark({ size = 20, ...props }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
      <path d="M5.2 3.5a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8ZM3.55 8.75h3.3V20.5h-3.3V8.75Zm5.45 0h3.16v1.61h.05c.44-.84 1.52-1.72 3.13-1.72 3.35 0 3.97 2.2 3.97 5.08v6.78H16v-6.01c0-1.44-.03-3.28-2-3.28-2 0-2.31 1.56-2.31 3.17v6.12H9V8.75Z" />
    </svg>
  );
}
