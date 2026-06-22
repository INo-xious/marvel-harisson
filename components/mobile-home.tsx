import Link from "next/link";
import { HomeArtifactVisual, homeRouteArtifacts } from "@/components/home-artifacts";

const MOBILE_GRID_SIZE = 24;
const SPATIAL_ANGLE = 7;

export function MobileHome() {
  return (
    <main className="mobile-home">
      <section className="mobile-spatial-hero" aria-labelledby="mobile-home-title">
        <svg className="mobile-map-grid" width="100%" height="100%" aria-hidden="true" focusable="false">
          <defs>
            <pattern
              id="mobile-cross-grid"
              width={MOBILE_GRID_SIZE}
              height={MOBILE_GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <path d="M9 12H15M12 9V15" />
            </pattern>
          </defs>
          <g transform={`rotate(${SPATIAL_ANGLE} 0 0)`}>
            <rect x="-25%" y="-25%" width="150%" height="150%" fill="url(#mobile-cross-grid)" />
          </g>
        </svg>

        <div className="mobile-artifact-plane">
          {homeRouteArtifacts.map((node) => (
            <Link
              key={node.id}
              className={`mobile-route mobile-route-${node.id}`}
              href={node.href}
              aria-label={`${node.title}, ${node.label}`}
            >
              <div className="mobile-route-surface">
                <HomeArtifactVisual kind={node.kind} />
              </div>
              <span>{node.label}</span>
            </Link>
          ))}
        </div>

        <h1 id="mobile-home-title" className="mobile-wordmark">MARVEL</h1>

        <section className="mobile-intro" aria-label="Introduction">
          <p className="home-handle">Marvel Harisson · INo-xious</p>
          <p className="home-role">Software Engineering Student</p>
          <p className="home-tech">Python · C++ · Data Automation · Robotics</p>
          <p className="home-tagline">Building software foundations through practical projects.</p>
        </section>
      </section>
    </main>
  );
}
