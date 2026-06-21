"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { LabItem } from "@/data/lab-items";

export function LabGallery({ items }: { items: LabItem[] }) {
  const [selected, setSelected] = useState<LabItem | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      lastTriggerRef.current?.focus();
    };
  }, [selected]);

  return (
    <>
      <div className="lab-grid">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            className={`lab-tile lab-tile-${index + 1}`}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : index * 0.045, duration: 0.25 }}
            onClick={(event) => {
              lastTriggerRef.current = event.currentTarget;
              setSelected(item);
            }}
            aria-label={`Open ${item.title}`}
          >
            <Image src={item.image} alt={item.alt} fill sizes="(max-width: 720px) 100vw, 50vw" />
            <span className="lab-tile-caption">
              <b>{item.title}</b><i>·</i><span>{item.category}</span>
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="lab-modal-backdrop"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelected(null);
            }}
          >
            <motion.section
              className="lab-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lab-modal-title"
              initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            >
              <button ref={closeRef} className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close Lab item">
                <X aria-hidden="true" size={19} />
              </button>
              <div className="lab-modal-image">
                <Image src={selected.image} alt={selected.alt} fill sizes="90vw" />
              </div>
              <div className="lab-modal-copy">
                <div>
                  <h2 id="lab-modal-title">{selected.title}</h2>
                  <p>{selected.description}</p>
                </div>
                <dl>
                  <div><dt>Category</dt><dd>{selected.category}</dd></div>
                  <div><dt>Year</dt><dd>{selected.year}</dd></div>
                  <div><dt>Media</dt><dd>{selected.mediaLabel}</dd></div>
                </dl>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
