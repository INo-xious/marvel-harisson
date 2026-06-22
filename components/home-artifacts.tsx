import Image from "next/image";
import { publicEmail } from "@/data/contact";
import { labItems } from "@/data/lab-items";
import { projects } from "@/data/projects";

export type HomeArtifactKind = "projects" | "lab" | "timeline" | "profile" | "contact";

export type HomeRouteArtifact = {
  id: "projects" | "lab" | "timeline" | "contact" | "about";
  title: string;
  label: string;
  href: string;
  kind: HomeArtifactKind;
};

export const homeRouteArtifacts: HomeRouteArtifact[] = [
  { id: "projects", title: "Projects", label: "/projects", href: "/projects", kind: "projects" },
  { id: "lab", title: "Lab", label: "/lab", href: "/lab", kind: "lab" },
  { id: "timeline", title: "Timeline", label: "/timeline", href: "/timeline", kind: "timeline" },
  { id: "contact", title: "Connect", label: "/contact", href: "/contact", kind: "contact" },
  { id: "about", title: "About", label: "/about", href: "/about", kind: "profile" },
];

function ProjectsMosaic() {
  return (
    <div className="projects-artifact" aria-hidden="true">
      {projects.slice(0, 6).map((project) => (
        <span key={project.slug}>
          <Image src={project.image} alt="" fill sizes="96px" />
        </span>
      ))}
    </div>
  );
}

function LabArtifact() {
  const lab = labItems[0];
  return (
    <div className="lab-artifact" aria-hidden="true">
      <Image src={lab.image} alt="" fill sizes="224px" />
      <span>LAB / OIC</span>
    </div>
  );
}

export function HomeArtifactVisual({ kind }: { kind: HomeArtifactKind }) {
  if (kind === "projects") return <ProjectsMosaic />;
  if (kind === "lab") return <LabArtifact />;

  if (kind === "timeline") {
    return (
      <div className="timeline-artifact" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index}><i /><b /><em>2026</em></span>
        ))}
      </div>
    );
  }

  if (kind === "profile") {
    return (
      <div className="profile-artifact" aria-hidden="true">
        <b>MH</b><span>MARVEL HARISSON</span><small>INO-XIOUS · OSAKA</small>
        <div className="artifact-accent"><i /><i /><i /></div>
      </div>
    );
  }

  return (
    <div className="contact-artifact" aria-hidden="true">
      <span>&gt; connect</span>
      <small>{publicEmail}</small>
      <i /><i /><i />
      <b>&gt; _</b>
    </div>
  );
}
