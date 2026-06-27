"use client";

import { useEffect, useRef } from "react";

const ALPHABET_SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-/<>?";

const KATAKANA_SCRAMBLE_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

const DEFAULT_DURATION_MS = 1600;
const SCRAMBLE_TICK_MS = 70;

function hasJapanese(text: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
}

export function ScrambleText({
  text,
  className,
  duration = DEFAULT_DURATION_MS,
}: {
  text: string;
  className?: string;
  duration?: number;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const previousTextRef = useRef(text);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const node = textRef.current;
    if (!node) return undefined;

    const previousText = previousTextRef.current;
    previousTextRef.current = text;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      node.textContent = text;
      node.removeAttribute("data-scrambling");
      return undefined;
    }

    if (previousText === text) return undefined;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (reduceMotion) {
      node.textContent = text;
      node.removeAttribute("data-scrambling");
      return undefined;
    }

    const isGoingToJapanese = hasJapanese(text);
    const scrambleChars = isGoingToJapanese
      ? KATAKANA_SCRAMBLE_CHARS
      : ALPHABET_SCRAMBLE_CHARS;

    const startedAt = performance.now();
    const maxLength = Math.max(previousText.length, text.length);

    let frameId = 0;

    node.textContent = previousText;
    node.setAttribute("data-scrambling", "true");

    const getScrambleChar = (index: number, tick: number) => {
      return scrambleChars[(index + tick) % scrambleChars.length];
    };

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const tick = Math.floor(elapsed / SCRAMBLE_TICK_MS);

      let nextText = "";

      /**
       * Phase 1:
       * Old text scrambles out.
       *
       * Phase 2:
       * New text scrambles in.
       */
      if (progress < 0.5) {
        const outProgress = progress / 0.5;
        const scrambledCharacters = Math.floor(outProgress * maxLength);

        for (let index = 0; index < maxLength; index += 1) {
          const source = previousText[index] ?? "";

          if (source === " ") {
            nextText += " ";
          } else if (index < scrambledCharacters) {
            nextText += getScrambleChar(index, tick);
          } else {
            nextText += source;
          }
        }
      } else {
        const inProgress = (progress - 0.5) / 0.5;
        const settledCharacters = Math.floor(inProgress * maxLength);

        for (let index = 0; index < maxLength; index += 1) {
          const target = text[index] ?? "";

          if (index < settledCharacters || progress === 1) {
            nextText += target;
          } else if (target === " ") {
            nextText += " ";
          } else {
            nextText += getScrambleChar(index, tick);
          }
        }
      }

      node.textContent = progress === 1 ? text : nextText;

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        node.removeAttribute("data-scrambling");
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      node.textContent = text;
      node.removeAttribute("data-scrambling");
    };
  }, [duration, text]);

  return (
    <span
      ref={textRef}
      className={className ? `scramble-text ${className}` : "scramble-text"}
      aria-label={text}
    >
      {text}
    </span>
  );
}