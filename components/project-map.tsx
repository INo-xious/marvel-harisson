"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { HomeArtifactVisual, homeRouteArtifacts } from "@/components/home-artifacts";
import { useLanguage } from "@/components/language-provider";
import { ScrambleText } from "@/components/scramble-text";

export const TILE_POOL_SIZE = 48;
export const HOME_ZOOM_MIN = 0.92;
export const HOME_ZOOM_MAX = 1.08;
export const GRID_SIZE = 32;
export const SPATIAL_ANGLE = 7;

export const GRID_TILE_SIZE = GRID_SIZE;
export const DRAG_THRESHOLD = 6;
const GRID_PARALLAX = 12;
const angleRadians = (SPATIAL_ANGLE * Math.PI) / 180;
const angleCos = Math.cos(angleRadians);
const angleSin = Math.sin(angleRadians);
const colors = ["#2589ef", "#30ad73", "#ffad22", "#75d6c2", "#bcdcff"];
const osakaTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type GridCell = { column: number; row: number };
type Point = { x: number; y: number };

type DragState = {
  node: HTMLAnchorElement;
  id: string;
  pointerId: number;
  startClient: Point;
  startOffset: Point;
  moved: boolean;
};

export function formatOsakaTime(date: Date) {
  return osakaTimeFormatter.format(date);
}

export function pointToRotatedGridCell(point: Point, gridOffset: Point = { x: 0, y: 0 }): GridCell {
  const x = point.x - gridOffset.x;
  const y = point.y - gridOffset.y;
  const unrotatedX = angleCos * x + angleSin * y;
  const unrotatedY = -angleSin * x + angleCos * y;
  return {
    column: Math.round(unrotatedX / GRID_SIZE - 0.5) + 0.5,
    row: Math.round(unrotatedY / GRID_SIZE - 0.5) + 0.5,
  };
}

function gridCellToPoint({ column, row }: GridCell): Point {
  return { x: column * GRID_SIZE, y: row * GRID_SIZE };
}

export function screenDeltaToSpatialPlane(delta: Point, scale = 1): Point {
  return {
    x: (angleCos * delta.x + angleSin * delta.y) / scale,
    y: (-angleSin * delta.x + angleCos * delta.y) / scale,
  };
}

export function snapToGrid(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function ProjectMap() {
  const { copy } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLTimeElement>(null);
  const hoverLabelRef = useRef<HTMLDivElement>(null);
  const hoverLabelTextRef = useRef<HTMLSpanElement>(null);
  const activeLabelRef = useRef("");
  const tileRefs = useRef<Array<SVGRectElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const tileIndexRef = useRef(0);
  const lastCellRef = useRef("");
  const lastGridCellRef = useRef<GridCell | null>(null);
  const mapOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const enabledRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const dragOffsetsRef = useRef(new Map<string, Point>());
  const suppressClickRef = useRef<HTMLAnchorElement | null>(null);
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
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () => {
      enabledRef.current = !reduced.matches && !narrow.matches && !coarse.matches;
    };
    update();
    reduced.addEventListener("change", update);
    narrow.addEventListener("change", update);
    coarse.addEventListener("change", update);
    return () => {
      reduced.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const placeHoverLabel = (clientX: number, clientY: number, bounds: DOMRect) => {
    if (!activeLabelRef.current || !hoverLabelRef.current) return;
    hoverLabelRef.current.style.transform = `translate3d(${(clientX - bounds.left).toFixed(2)}px, ${(clientY - bounds.top).toFixed(2)}px, 0)`;
  };

  const showHoverLabel = (
    label: string,
    clientX: number,
    clientY: number,
    bounds: DOMRect,
  ) => {
    activeLabelRef.current = label;
    if (hoverLabelTextRef.current) hoverLabelTextRef.current.textContent = label;
    hoverLabelRef.current?.setAttribute("data-visible", "true");
    placeHoverLabel(clientX, clientY, bounds);
  };

  const hideHoverLabel = (label: string) => {
    if (activeLabelRef.current !== label) return;
    activeLabelRef.current = "";
    hoverLabelRef.current?.removeAttribute("data-visible");
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current || event.pointerType === "touch" || !enabledRef.current || frameRef.current !== null) return;
    const viewportX = event.clientX;
    const viewportY = event.clientY;
    const bounds = event.currentTarget.getBoundingClientRect();

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const width = bounds.width || window.innerWidth;
      const height = bounds.height || window.innerHeight;
      const localX = viewportX - bounds.left;
      const localY = viewportY - bounds.top;
      placeHoverLabel(viewportX, viewportY, bounds);
      const offset = {
        x: ((localX / width) - 0.5) * -GRID_PARALLAX * 2,
        y: ((localY / height) - 0.5) * -GRID_PARALLAX * 2,
      };
      mapOffsetRef.current = offset;
      if (mapRef.current) {
        mapRef.current.style.transform = `translate3d(${offset.x.toFixed(2)}px, ${offset.y.toFixed(2)}px, 0) scale(${scaleRef.current})`;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const planePoint = {
        x: centerX + (localX - centerX - offset.x) / scaleRef.current,
        y: centerY + (localY - centerY - offset.y) / scaleRef.current,
      };
      const currentCell = pointToRotatedGridCell(planePoint);
      const cell = `${currentCell.column}:${currentCell.row}`;
      if (cell === lastCellRef.current) return;
      lastCellRef.current = cell;

      const previous = lastGridCellRef.current ?? currentCell;
      lastGridCellRef.current = currentCell;
      const deltaColumn = currentCell.column - previous.column;
      const deltaRow = currentCell.row - previous.row;
      const steps = Math.min(6, Math.max(1, Math.abs(deltaColumn), Math.abs(deltaRow)));

      for (let step = 1; step <= steps; step += 1) {
        const gridCell = {
          column: previous.column + Math.round((deltaColumn * step) / steps),
          row: previous.row + Math.round((deltaRow * step) / steps),
        };
        const point = gridCellToPoint(gridCell);
        const tile = tileRefs.current[tileIndexRef.current % TILE_POOL_SIZE];
        tileIndexRef.current += 1;
        if (!tile) continue;
        tile.classList.remove("tile-live");
        tile.setAttribute("x", String(point.x));
        tile.setAttribute("y", String(point.y));
        tile.style.setProperty("--tile-color", colors[tileIndexRef.current % colors.length]);
        tile.style.setProperty("--tile-life", `${900 + (tileIndexRef.current % 4) * 140}ms`);
        tile.dataset.gridCell = `${gridCell.column}:${gridCell.row}`;
        void tile.getBoundingClientRect();
        tile.classList.add("tile-live");
      }
    });
  };

  const handleDragStart = (event: React.PointerEvent<HTMLAnchorElement>, id: string) => {
    if (!enabledRef.current || event.pointerType === "touch" || (event.pointerType === "mouse" && event.button !== 0)) return;
    const node = event.currentTarget;
    const startOffset = dragOffsetsRef.current.get(id) ?? { x: 0, y: 0 };
    dragRef.current = {
      node,
      id,
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startOffset,
      moved: false,
    };
    node.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.node !== event.currentTarget || drag.pointerId !== event.pointerId) return;
    const screenDelta = {
      x: event.clientX - drag.startClient.x,
      y: event.clientY - drag.startClient.y,
    };
    if (!drag.moved && Math.hypot(screenDelta.x, screenDelta.y) < DRAG_THRESHOLD) return;

    if (!drag.moved) {
      drag.moved = true;
      drag.node.dataset.dragging = "true";
      hideHoverLabel(activeLabelRef.current);
    }

    const localDelta = screenDeltaToSpatialPlane(screenDelta, scaleRef.current);
    const baseX = drag.node.offsetLeft;
    const baseY = drag.node.offsetTop;
    const offset = {
      x: baseX + drag.startOffset.x + localDelta.x - baseX,
      y: baseY + drag.startOffset.y + localDelta.y - baseY,
    };
    dragOffsetsRef.current.set(drag.id, offset);
    drag.node.style.setProperty("--drag-x", `${offset.x.toFixed(2)}px`);
    drag.node.style.setProperty("--drag-y", `${offset.y.toFixed(2)}px`);
    event.preventDefault();
  };

  const finishDrag = (event: React.PointerEvent<HTMLAnchorElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.node !== event.currentTarget || drag.pointerId !== event.pointerId) return;
    if (drag.node.hasPointerCapture(event.pointerId)) drag.node.releasePointerCapture(event.pointerId);

    if (drag.moved) {
      const current = cancelled
        ? drag.startOffset
        : (dragOffsetsRef.current.get(drag.id) ?? drag.startOffset);
      const baseX = drag.node.offsetLeft;
      const baseY = drag.node.offsetTop;
      const snapped = {
        x: snapToGrid(baseX + current.x) - baseX,
        y: snapToGrid(baseY + current.y) - baseY,
      };
      dragOffsetsRef.current.set(drag.id, snapped);
      drag.node.dataset.settling = "true";
      drag.node.style.setProperty("--drag-x", `${snapped.x}px`);
      drag.node.style.setProperty("--drag-y", `${snapped.y}px`);
      drag.node.removeAttribute("data-dragging");
      suppressClickRef.current = drag.node;
      window.setTimeout(() => {
        drag.node.removeAttribute("data-settling");
        if (suppressClickRef.current === drag.node) suppressClickRef.current = null;
      }, 180);
    }
    dragRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (!enabledRef.current) return;
    event.preventDefault();
    scaleRef.current = Math.min(
      HOME_ZOOM_MAX,
      Math.max(HOME_ZOOM_MIN, scaleRef.current - event.deltaY * 0.0004),
    );
    const offset = mapOffsetRef.current;
    if (mapRef.current) {
      mapRef.current.style.transform = `translate3d(${offset.x.toFixed(2)}px, ${offset.y.toFixed(2)}px, 0) scale(${scaleRef.current})`;
    }
  };

  return (
    <section
      className="project-map"
      onPointerMove={handlePointerMove}
      onWheel={handleWheel}
      aria-labelledby="home-title"
    >
      <time ref={clockRef} className="map-meta map-time" aria-label={copy.home.osakaTimeLabel}>--:--:--</time>
      <div className="map-meta map-location"><ScrambleText text={copy.home.location} /></div>
      <div className="map-meta map-updated"><ScrambleText text={copy.home.updated} /></div>

      <div ref={mapRef} className="map-world">
        <svg className="map-grid" width="100%" height="100%" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="home-cross-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d="M13 16H19M16 13V19" />
            </pattern>
          </defs>
          <g className="grid-motion-layer">
            <g className="grid-angle-layer" transform={`rotate(${SPATIAL_ANGLE} 0 0)`}>
              <rect x="-25%" y="-25%" width="150%" height="150%" fill="url(#home-cross-grid)" />
              <g className="trail-layer">
                {tilePool.map((_, index) => (
                  <rect
                    key={index}
                    ref={(node) => { tileRefs.current[index] = node; }}
                    className="cursor-tile"
                    width={GRID_TILE_SIZE}
                    height={GRID_TILE_SIZE}
                  />
                ))}
              </g>
            </g>
          </g>
        </svg>

        <div className="spatial-stage">
          <div className="wordmark-wrap">
            <h1 id="home-title" className="block-wordmark" aria-label="Marvel">MARVEL</h1>
          </div>

          <div className="artifact-plane">
            {homeRouteArtifacts.map((node) => (
              <Link
                key={node.id}
                className={`map-node node-${node.id}`}
                href={node.href}
                aria-label={`${node.title}, ${node.label}`}
                onPointerDown={(event) => handleDragStart(event, node.id)}
                onPointerMove={handleDragMove}
                onPointerUp={(event) => finishDrag(event)}
                onPointerCancel={(event) => finishDrag(event, true)}
                onClick={(event) => {
                  if (suppressClickRef.current !== event.currentTarget) return;
                  event.preventDefault();
                  event.stopPropagation();
                  suppressClickRef.current = null;
                }}
                onPointerEnter={(event) => {
                  const bounds = event.currentTarget.closest(".project-map")?.getBoundingClientRect();
                  if (bounds) showHoverLabel(node.label, event.clientX, event.clientY, bounds);
                }}
                onPointerLeave={() => hideHoverLabel(node.label)}
                onFocus={(event) => {
                  const mapBounds = event.currentTarget.closest(".project-map")?.getBoundingClientRect();
                  const nodeBounds = event.currentTarget.getBoundingClientRect();
                  if (mapBounds) {
                    showHoverLabel(
                      node.label,
                      nodeBounds.left + nodeBounds.width / 2,
                      nodeBounds.top + nodeBounds.height / 2,
                      mapBounds,
                    );
                  }
                }}
                onBlur={() => hideHoverLabel(node.label)}
              >
                <div className="map-node-surface">
                  <HomeArtifactVisual kind={node.kind} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="home-copy">
        <p className="home-handle"><ScrambleText text={copy.home.handle} /></p>
        <p className="home-role"><ScrambleText text={copy.home.role} /></p>
        <p className="home-tech"><ScrambleText text={copy.home.tech} /></p>
        <p className="home-tagline"><ScrambleText text={copy.home.tagline} /></p>
      </div>

      <div ref={hoverLabelRef} className="map-hover-label" aria-hidden="true">
        <span ref={hoverLabelTextRef} />
        <i />
      </div>
    </section>
  );
}
