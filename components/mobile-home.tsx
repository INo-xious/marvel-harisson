import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { projects } from "@/data/projects";

export function MobileHome() {
  return (
    <main className="mobile-home">
      <section className="mobile-spatial-hero" aria-labelledby="mobile-home-title">
        <div className="mobile-object mobile-chess">
          <Image src="/images/projects/marveious-style-engine.png" alt="" fill sizes="120px" />
        </div>
        <div className="mobile-object mobile-doc">
          <Image src="/images/projects/idx-ownership-data-pipeline.png" alt="" fill sizes="120px" />
        </div>
        <div className="mobile-object mobile-robot">
          <Image src="/images/projects/robotics-soda-task.png" alt="" fill sizes="120px" />
        </div>
        <div className="mobile-tiles" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <h1 id="mobile-home-title" className="mobile-wordmark">MARVEL</h1>
      </section>
      <section className="mobile-intro">
        <p className="home-handle">Marvel Harisson · INo-xious</p>
        <p className="home-role">Software Engineering Student</p>
        <p className="home-tech">Python · C++ · Data Automation · Robotics</p>
        <p className="home-tagline">Building software foundations through practical projects.</p>
      </section>
      <section className="mobile-projects" aria-labelledby="explore-projects">
        <h2 id="explore-projects">Explore projects</h2>
        <div className="mobile-project-list">
          {projects.map((project) => (
            <Link key={project.slug} href={project.route} className="mobile-project-row">
              <div className="mobile-project-thumb">
                <Image src={project.image} alt="" fill sizes="130px" />
              </div>
              <div>
                <h3>{project.title}</h3>
                <p>{project.category} · {project.year}</p>
              </div>
              <ChevronRight aria-hidden="true" size={20} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
