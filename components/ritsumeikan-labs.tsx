import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { RitsumeikanLab } from "@/data/ritsumeikan-labs";

export function RitsumeikanLabs({ labs }: { labs: RitsumeikanLab[] }) {
  return (
    <section className="rits-labs" aria-labelledby="rits-labs-title">
      <header className="rits-labs-header">
        <div>
          <p>Ritsumeikan University · ISSE</p>
          <h2 id="rits-labs-title">Ritsumeikan Labs</h2>
        </div>
        <p>
          Through the Information Systems Science and Engineering course, I take part in
          project-based learning across five laboratories.
        </p>
      </header>

      <div className="rits-labs-grid">
        {labs.map((lab, index) => (
          <a
            key={lab.id}
            className="rits-lab-card"
            href={lab.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${lab.name} in a new tab`}
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
