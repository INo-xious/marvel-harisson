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
  Radio,
  Sun,
  UserRound,
  Volume2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { ScrambleText } from "@/components/scramble-text";
import { useTheme } from "@/components/theme-provider";
import { GitHubMark, LinkedInMark } from "@/components/brand-icons";
import { publicEmailHref } from "@/data/contact";

const routeItems = [
  { key: "home", href: "/", icon: House },
  { key: "projects", href: "/projects", icon: Folder },
  { key: "lab", href: "/lab", icon: FlaskConical },
  { key: "timeline", href: "/timeline", icon: Clock3 },
  { key: "about", href: "/about", icon: UserRound },
] as const;

const socialItems = [
  { label: "GitHub", href: "https://github.com/INo-xious", icon: GitHubMark },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/marvel-harisson-4102b7345/",
    icon: LinkedInMark,
  },
] as const;

const MY_SPOTIFY_URL = "https://open.spotify.com/user/2emgyd9qtsz3ou4doaxkg428u";
const LOFI_EMBED_URL = "https://loficafe.net/embed/sleeping";

function routeIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FloatingNav() {
  const pathname = usePathname();
  const { copy } = useLanguage();
  const { toggleTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const [lofiLoaded, setLofiLoaded] = useState(false);
  const [lofiOpen, setLofiOpen] = useState(false);
  const closeLofiTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (closeLofiTimerRef.current !== null) window.clearTimeout(closeLofiTimerRef.current);
  }, []);

  const cancelLofiClose = () => {
    if (closeLofiTimerRef.current === null) return;
    window.clearTimeout(closeLofiTimerRef.current);
    closeLofiTimerRef.current = null;
  };

  const openLofi = () => {
    cancelLofiClose();
    setLofiLoaded(true);
    setLofiOpen(true);
  };

  const scheduleLofiClose = () => {
    cancelLofiClose();
    closeLofiTimerRef.current = window.setTimeout(() => setLofiOpen(false), 220);
  };

  const themeIcons = (
    <span className="theme-icons" aria-hidden="true">
      <Moon className="theme-icon-light" size={18} strokeWidth={1.8} />
      <Sun className="theme-icon-dark" size={18} strokeWidth={1.8} />
    </span>
  );

  return (
    <>
      <nav className="floating-nav desktop-nav" aria-label={copy.nav.ariaLabel}>
        {routeItems.map((item) => {
          const Icon = item.icon;
          const label = copy.nav[item.key];
          const active = routeIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              className="nav-action"
              href={item.href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              data-active={active || undefined}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span className="nav-tooltip" role="tooltip"><ScrambleText text={label} /></span>
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
              aria-label={`${item.label} (${copy.nav.opensNewTab})`}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span className="nav-tooltip" role="tooltip">{item.label}</span>
            </a>
          );
        })}
        <a
          className="nav-action"
          href={publicEmailHref}
          aria-label={copy.nav.emailMarvel}
        >
          <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
          <span className="nav-tooltip" role="tooltip"><ScrambleText text={copy.nav.email} /></span>
        </a>
        <button className="nav-action" type="button" onClick={toggleTheme} aria-label={copy.nav.toggleTheme}>
          {themeIcons}
          <span className="nav-tooltip" role="tooltip"><ScrambleText text={copy.nav.theme} /></span>
        </button>
        <div
          className="lofi-trigger"
          onPointerEnter={openLofi}
          onPointerLeave={scheduleLofiClose}
          onFocus={openLofi}
          onBlur={scheduleLofiClose}
        >
          <a
            className="nav-action"
            href={MY_SPOTIFY_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy.nav.openSleepRadio}
          >
            <Volume2 aria-hidden="true" size={18} strokeWidth={1.8} />
            <span className="nav-tooltip" role="tooltip"><ScrambleText text={copy.nav.sleepRadio} /></span>
          </a>
        </div>
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
              <span><ScrambleText text={copy.nav.more} /></span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label={copy.nav.closeMore}>
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
            <a href={publicEmailHref} onClick={() => setMoreOpen(false)}>
              <Mail aria-hidden="true" size={18} />
              <span><ScrambleText text={copy.nav.email} /></span>
            </a>
            <button type="button" onClick={toggleTheme}>
              {themeIcons}
              <span><ScrambleText text={copy.nav.switchTheme} /></span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (lofiOpen) {
                  setLofiOpen(false);
                } else {
                  openLofi();
                }
                setMoreOpen(false);
              }}
              aria-expanded={lofiOpen}
            >
              <Radio aria-hidden="true" size={18} />
              <span><ScrambleText text={copy.nav.sleepRadioControls} /></span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {lofiLoaded ? (
        <div
          className="lofi-panel"
          data-open={lofiOpen || undefined}
          onPointerEnter={cancelLofiClose}
          onPointerLeave={scheduleLofiClose}
          onFocus={cancelLofiClose}
          onBlur={scheduleLofiClose}
          aria-hidden={!lofiOpen}
        >
          <iframe
            src={LOFI_EMBED_URL}
            title={copy.nav.lofiTitle}
            loading="lazy"
            allow="autoplay"
          />
        </div>
      ) : null}

      <nav className="floating-nav mobile-nav" aria-label={copy.nav.mobileAriaLabel}>
        {routeItems.map((item) => {
          const Icon = item.icon;
          const label = copy.nav[item.key];
          const active = routeIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              className="nav-action"
              href={item.href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              data-active={active || undefined}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
              <span><ScrambleText text={label} /></span>
              {active ? <motion.span layoutId="mobile-nav-dot" className="nav-dot" /> : null}
            </Link>
          );
        })}
        <button className="nav-action" type="button" onClick={() => setMoreOpen((open) => !open)} aria-label={copy.nav.moreOptions} aria-expanded={moreOpen}>
          <MoreHorizontal aria-hidden="true" size={21} />
          <span><ScrambleText text={copy.nav.more} /></span>
        </button>
      </nav>
    </>
  );
}
