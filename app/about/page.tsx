import type { Metadata } from "next";

export const metadata: Metadata = { title: "About", description: "About Marvel Harisson, a software engineering student in Osaka." };

const learning = ["Python", "C++", "Software fundamentals", "Robotics", "System design", "Git and GitHub", "Data automation"];
const interests = ["Robotics", "AI", "Automation", "Chess engines", "Human-computer interaction"];

export default function AboutPage() {
  return (
    <main className="editorial-page about-page">
      <div className="about-grid">
        <section className="about-intro">
          <h1 className="block-page-title">About</h1>
          <p className="about-lead">Hi, I&apos;m Marvel Harisson, a first-year undergraduate at Ritsumeikan University in Osaka, Japan. I&apos;m building my software engineering foundation through practical projects in Python, C++, data automation, and robotics.</p>
          <p className="about-support">My goal is to learn by building real systems, documenting the process, and gradually developing a specialization in software engineering, robotics, or intelligent systems.</p>
        </section>
        <aside className="identity-card" aria-label="Marvel Harisson profile card">
          <div className="identity-mark" aria-hidden="true">MH</div>
          <dl>
            <div><dt>Name</dt><dd>Marvel Harisson</dd></div>
            <div><dt>Location</dt><dd>Osaka, Japan</dd></div>
            <div><dt>Graduation</dt><dd>Expected 2030</dd></div>
            <div><dt>Handle</dt><dd>INo-xious</dd></div>
          </dl>
          <div className="identity-tiles" aria-hidden="true">{Array.from({ length: 14 }).map((_, index) => <i key={index} />)}</div>
        </aside>
      </div>
      <div className="about-lists">
        <section><h2>Currently learning</h2><ol>{learning.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol></section>
        <section><h2>Interested in</h2><ol>{interests.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol></section>
        <section><h2>Beyond code</h2><p>Chess · Pokémon · FPS games · Minecraft redstone</p></section>
      </div>
    </main>
  );
}
