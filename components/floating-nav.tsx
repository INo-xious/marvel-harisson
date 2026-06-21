"use client";

import {
  Clock3,
  ExternalLink,
  FlaskConical,
  Folder,
  House,
  Mail,
  Moon,
  MoreHorizontal,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { GitHubMark, LinkedInMark } from "@/components/brand-icons";

const routeItems = [
  { label: "Home", href: "/", icon: House },
  { label: "Projects", href: "/projects", icon: Folder },
  { label: "Lab", href: "/lab", icon: FlaskConical },
  { label: "Timeline", href: "/timeline", icon: Clock3 },
  { label: "About", href: "/about", icon: UserRound },
] as const;

const socialItems = [
  { label: "GitHub", href: "https://github.com/INo-xious", icon: GitHubMark },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/marvel-harisson-4102b7345/",
    icon: LinkedInMark,
  },
] as const;

function routeIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FloatingNav() {
  const pathname = usePathname();
  const { toggleTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const themeIcons = (
    <span className="theme-icons" aria-hidden="true">
      <Moon className="theme-icon-light" size={18} strokeWidth={1.8} />
      <Sun className="theme-icon-dark" size={18} strokeWidth={1.8} />
    </span>
  );

  return (
    <>
      <nav className="floating-nav desktop-nav" aria-label="Primary navigation">
        {routeItems.map((item) => {
          const Icon = item.icon;
          const active = routeIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              className="nav-action"
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              data-active={active || undefined}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span className="nav-tooltip" role="tooltip">{item.label}</span>
              {active ? <motion.span layoutId="nav-dot" className="nav-dot" /> : null}
            </Link>
          );
        })}
        <span className="nav-divider" aria-hidden="true" />
        {socialItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              className="nav-action"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.label} (opens in a new tab)`}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span className="nav-tooltip" role="tooltip">{item.label}</span>
            </a>
          );
        })}
        <Link
          className="nav-action"
          href="/contact#email"
          aria-label="Contact"
          aria-current={pathname === "/contact" ? "page" : undefined}
          data-active={pathname === "/contact" || undefined}
        >
          <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
          <span className="nav-tooltip" role="tooltip">Contact</span>
        </Link>
        <button className="nav-action" type="button" onClick={toggleTheme} aria-label="Toggle light or dark theme">
          {themeIcons}
          <span className="nav-tooltip" role="tooltip">Theme</span>
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen ? (
          <motion.div
            className="mobile-more"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div className="mobile-more-head">
              <span>More</span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close more menu">
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            {socialItems.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                  <Icon aria-hidden="true" size={18} />
                  <span>{item.label}</span>
                  <ExternalLink aria-hidden="true" size={14} />
                </a>
              );
            })}
            <Link href="/contact#email" onClick={() => setMoreOpen(false)}>
              <Mail aria-hidden="true" size={18} />
              <span>Contact</span>
            </Link>
            <button type="button" onClick={toggleTheme}>
              {themeIcons}
              <span>Switch theme</span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <nav className="floating-nav mobile-nav" aria-label="Mobile navigation">
        {routeItems.map((item) => {
          const Icon = item.icon;
          const active = routeIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              className="nav-action"
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              data-active={active || undefined}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
              {active ? <motion.span layoutId="mobile-nav-dot" className="nav-dot" /> : null}
            </Link>
          );
        })}
        <button className="nav-action" type="button" onClick={() => setMoreOpen((open) => !open)} aria-label="More navigation options" aria-expanded={moreOpen}>
          <MoreHorizontal aria-hidden="true" size={21} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
