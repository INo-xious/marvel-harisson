"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { projects } from "@/data/projects";

export const TILE_POOL_SIZE = 48;
export const HOME_ZOOM_MIN = 0.92;
export const HOME_ZOOM_MAX = 1.08;

const colors = ["#2589ef", "#30ad73", "#ffad22", "#75d6c2", "#bcdcff"];
const GRID_SIZE = 32;
const GRID_HALF = GRID_SIZE / 2;
const GRID_TILE_SIZE = 21;
const osakaTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function formatOsakaTime(date: Date) {
  return osakaTimeFormatter.format(date);
}

type GridCell = { u: number; v: number };

function pointToGridCell(x: number, y: number): GridCell {
  return {
    u: Math.round((x + y) / GRID_SIZE - 0.5) + 0.5,
    v: Math.round((x - y) / GRID_SIZE - 0.5) + 0.5,
  };
}

function gridCellToPoint({ u, v }: GridCell) {
  return { x: (u + v) * GRID_HALF, y: (u - v) * GRID_HALF };
}

type MapNode = {
  title: string;
  label: string;
  href: string;
  className: string;
  image?: string;
  alt?: string;
  kind?: "timeline" | "profile" | "contact";
};

const projectImage = (slug: string) => projects.find((project) => project.slug === slug)!;

const nodes: MapNode[] = [
  {
    title: "MarveIous Style Engine",
    label: "/style-engine",
    href: "/projects/marveious-style-engine",
    className: "node-style-engine",
    image: projectImage("marveious-style-engine").image,
    alt: "Chess engine concept object",
  },
  {
    title: "IDX Ownership Data Pipeline",
    label: "/idx-pipeline",
    href: "/projects/idx-ownership-data-pipeline",
    className: "node-idx",
    image: projectImage("idx-ownership-data-pipeline").image,
    alt: "Document extraction concept object",
  },
  {
    title: "Robotics Soda Task Concept",
    label: "/robotics",
    href: "/projects/robotics-soda-task",
    className: "node-robotics",
    image: projectImage("robotics-soda-task").image,
    alt: "Robotics concept object",
  },
  {
    title: "Lab",
    label: "/lab",
    href: "/lab",
    className: "node-lab",
    image: "/images/lab/interface-test.png",
    alt: "Interface experiment contact sheet",
  },
  {
    title: "Timeline",
    label: "/timeline",
    href: "/timeline",
    className: "node-timeline",
    kind: "timeline",
  },
  {
    title: "About",
    label: "/about",
    href: "/about",
    className: "node-about",
    kind: "profile",
  },
  {
    title: "Contact",
    label: "/contact",
    href: "/contact",
    className: "node-contact",
    kind: "contact",
  },
];

function SyntheticArtifact({ kind }: { kind: MapNode["kind"] }) {
  if (kind === "timeline") {
    return (
      <div className="timeline-artifact" aria-hidden="true">
        <i /><i /><i /><i />
      </div>
    );
  }
  if (kind === "profile") {
    return (
      <div className="profile-artifact" aria-hidden="true">
        <b>MH</b><span>MARVEL HARISSON</span><small>INO-XIOUS · OSAKA</small>
      </div>
    );
  }
  return (
    <div className="contact-artifact" aria-hidden="true">
      <span>&gt; connect</span><i /><i /><i />
    </div>
  );
}

export function ProjectMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLTimeElement>(null);
  const tileRefs = useRef<Array<SVGRectElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const tileIndexRef = useRef(0);
  const lastCellRef = useRef("");
  const lastGridCellRef = useRef<GridCell | null>(null);
  const scaleRef = useRef(1);
  const enabledRef = useRef(false);
  const tilePool = useMemo(() => Array.from({ length: TILE_POOL_SIZE }), []);

  useEffect(() => {
    const updateClock = () => {
      const clock = clockRef.current;
      if (!clock) return;
      const now = new Date();
      clock.textContent = formatOsakaTime(now);
      clock.dateTime = now.toISOString();
    };
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 799px)");
    const update = () => {
      enabledRef.current = !reduced.matches && !narrow.matches;
    };
    update();
    reduced.addEventListener("change", update);
    narrow.addEventListener("change", update);
    return () => {
      reduced.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" || !enabledRef.current || frameRef.current !== null) return;
    const viewportX = event.clientX;
    const viewportY = event.clientY;
    const bounds = event.currentTarget.getBoundingClientRect();
    const clientX = viewportX - bounds.left;
    const clientY = viewportY - bounds.top;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const map = mapRef.current;
      if (!map) return;
      const currentCell = pointToGridCell(clientX, clientY);
      const cell = `${currentCell.u}:${currentCell.v}`;
      map.style.setProperty("--map-x", `${((viewportX / innerWidth) - 0.5) * -18}px`);
      map.style.setProperty("--map-y", `${((viewportY / innerHeight) - 0.5) * -12}px`);
      if (cell === lastCellRef.current) return;
      lastCellRef.current = cell;
      const previous = lastGridCellRef.current ?? currentCell;
      lastGridCellRef.current = currentCell;
      const deltaU = currentCell.u - previous.u;
      const deltaV = currentCell.v - previous.v;
      const steps = Math.min(6, Math.max(1, Math.abs(deltaU), Math.abs(deltaV)));

      for (let step = 1; step <= steps; step += 1) {
        const gridCell = {
          u: previous.u + Math.round((deltaU * step) / steps),
          v: previous.v + Math.round((deltaV * step) / steps),
        };
        const point = gridCellToPoint(gridCell);
        const tile = tileRefs.current[tileIndexRef.current % TILE_POOL_SIZE];
        tileIndexRef.current += 1;
        if (!tile) continue;
        const color = colors[tileIndexRef.current % colors.length];
        tile.classList.remove("tile-live");
        tile.setAttribute("x", String(point.x - GRID_TILE_SIZE / 2));
        tile.setAttribute("y", String(point.y - GRID_TILE_SIZE / 2));
        tile.setAttribute("transform", `rotate(45 ${point.x} ${point.y})`);
        tile.style.setProperty("--tile-color", color);
        tile.style.setProperty("--tile-life", `${900 + (tileIndexRef.current % 4) * 140}ms`);
        tile.dataset.gridCell = `${gridCell.u}:${gridCell.v}`;
        void tile.getBoundingClientRect();
        tile.classList.add("tile-live");
      }
    });
  };

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (!enabledRef.current) return;
    event.preventDefault();
    scaleRef.current = Math.min(
      HOME_ZOOM_MAX,
      Math.max(HOME_ZOOM_MIN, scaleRef.current - event.deltaY * 0.0004),
    );
    mapRef.current?.style.setProperty("--map-scale", String(scaleRef.current));
  };

  return (
    <section
      className="project-map"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        lastCellRef.current = "";
        lastGridCellRef.current = null;
      }}
      onWheel={handleWheel}
      aria-labelledby="home-title"
    >
      <time ref={clockRef} className="map-meta map-time" aria-label="Current time in Osaka">--:--:--</time>
      <div className="map-meta map-mode">interactive project map <span aria-hidden="true">▲</span></div>
      <div className="map-meta map-location">Osaka, Japan · 2026</div>
      <div className="map-meta map-updated">last updated · 2026</div>

      <svg className="map-grid" width="100%" height="100%" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="home-cross-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M0 0L${GRID_SIZE} ${GRID_SIZE}M${GRID_SIZE} 0L0 ${GRID_SIZE}`} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#home-cross-grid)" />
        <g className="trail-layer">
          {tilePool.map((_, index) => (
            <rect
              key={index}
              ref={(node) => { tileRefs.current[index] = node; }}
              className="cursor-tile"
              width={GRID_TILE_SIZE}
              height={GRID_TILE_SIZE}
              rx="1.5"
            />
          ))}
        </g>
      </svg>

      <div ref={mapRef} className="map-world">
        <div className="wordmark-wrap">
          <h1 id="home-title" className="block-wordmark" aria-label="Marvel">MARVEL</h1>
          <div className="home-copy">
            <p className="home-handle">Marvel Harisson · INo-xious</p>
            <p className="home-role">Software Engineering Student</p>
            <p className="home-tech">Python · C++ · Data Automation · Robotics</p>
            <p className="home-tagline">Building software foundations through practical projects.</p>
          </div>
        </div>
        {nodes.map((node) => (
          <Link key={node.href} className={`map-node ${node.className}`} href={node.href} aria-label={`${node.title}, ${node.label}`}>
            <div className="map-node-surface">
              {node.image ? (
                <Image src={node.image} alt={node.alt ?? ""} fill sizes="240px" className="map-node-image" />
              ) : (
                <SyntheticArtifact kind={node.kind} />
              )}
            </div>
            <span className="map-node-label">{node.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
