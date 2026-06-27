import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { LocalizedRitsumeikanLab } from "@/data/localized-data";

type RitsumeikanLabsCopy = {
  ritsumeikanKicker: string;
  ritsumeikanTitle: string;
  ritsumeikanDescription: string;
};

export function RitsumeikanLabs({ labs, copy }: { labs: LocalizedRitsumeikanLab[]; copy: RitsumeikanLabsCopy }) {
  return (
    <section className="rits-labs" aria-labelledby="rits-labs-title">
      <header className="rits-labs-header">
        <div>
          <p>{copy.ritsumeikanKicker}</p>
          <h2 id="rits-labs-title">{copy.ritsumeikanTitle}</h2>
        </div>
        <p>{copy.ritsumeikanDescription}</p>
      </header>

      <div className="rits-labs-grid">
        {labs.map((lab, index) => (
          <a
            key={lab.id}
            className="rits-lab-card"
            href={lab.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={lab.linkAriaLabel}
          >
            <div className="rits-lab-media" data-fit={lab.imageFit ?? "cover"}>
              <Image
                src={lab.image}
                alt={lab.alt}
                fill
                sizes="(max-width: 799px) 100vw, (max-width: 1100px) 50vw, 33vw"
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="rits-lab-copy">
              <div>
                <p>{lab.shortName}</p>
                <h3>{lab.name}</h3>
              </div>
              <ArrowUpRight aria-hidden="true" size={18} />
              <p>{lab.description}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
