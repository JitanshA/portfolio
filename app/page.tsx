import { experience, projects, research, skillGroups } from "@/data/portfolio";
import { HeroIdentity, MotionEnhancer } from "@/components/motion";
import { MobileNavigation } from "@/components/mobile-navigation";
import { TelescopeHero } from "@/components/telescope-hero";

const Arrow = () => <span aria-hidden="true">↗</span>;

function SectionHeading({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <header className="section-heading motion-heading">
      <p className="eyebrow">{"// "}{eyebrow}</p>
      <h2>{children}</h2>
    </header>
  );
}

export default function Home() {
  return (
    <>
      <MotionEnhancer />
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <nav className="shell nav" aria-label="Primary navigation">
          <a className="wordmark" href="#top" aria-label="Jitansh Arora, home">jitansh.arora</a>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#experience">Work</a>
            <a href="#projects">Projects</a>
            <a href="#research">Research</a>
            <a href="#skills">Stack</a>
          </div>
          <MobileNavigation />
          <a className="nav-contact" href="#contact">Contact <Arrow /></a>
        </nav>
        <span className="scroll-progress" aria-hidden="true" />
      </header>

      <main id="main">
        <section id="top" className="shell hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="availability"><span /> Halifax, NS · graduating Dec 2026</p>
            <HeroIdentity />
            <p className="hero-intro">Computer science student focused on backend engineering, distributed systems, infrastructure, and low-level software.</p>
            <div className="hero-links" aria-label="Professional profiles">
              <a className="button button-primary" href="https://github.com/JitanshA" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
              <a className="button" href="https://www.linkedin.com/in/jitansh-arora-3a2981274" target="_blank" rel="noreferrer">LinkedIn <Arrow /></a>
            </div>
          </div>
          <div className="hero-visual">
            <TelescopeHero />
          </div>
        </section>

        <section id="about" className="shell section about reveal-section" data-reveal>
          <SectionHeading eyebrow="about">About me.</SectionHeading>
          <div className="about-grid">
            <div className="about-copy">
              <p>I’m completing a Bachelor of Computer Science with Co-op at Dalhousie University. My work spans telescope control software, spacecraft tooling, healthcare test infrastructure, and research systems.</p>
              <p>I’m most interested in reliable backend software, communication between systems, infrastructure, and the low-level details that make software predictable.</p>
              <div className="experience-total" aria-label="24 months of co-op and internship experience">
                <strong>24</strong>
                <span>months of co-op &amp;<br />internship experience</span>
              </div>
            </div>
            <dl className="facts">
              <div><dt>Degree</dt><dd>Bachelor of Computer Science with Co-op</dd></div>
              <div><dt>University</dt><dd>Dalhousie University</dd></div>
              <div><dt>Focus</dt><dd>Backend · systems · infrastructure</dd></div>
              <div><dt>Graduation</dt><dd>December 2026</dd></div>
              <div><dt>GPA</dt><dd>4.10 / 4.30</dd></div>
              <div><dt>Credentials</dt><dd>AWS Cloud Practitioner · IBM Machine Learning Professional Certificate</dd></div>
            </dl>
          </div>
        </section>

        <section id="experience" className="shell section reveal-section" data-reveal>
          <SectionHeading eyebrow="experience">Where I’ve worked.</SectionHeading>
          <div className="timeline" data-timeline>
            <span className="timeline-track" aria-hidden="true"><span className="timeline-progress" /></span>
            {experience.map((item) => (
              <article className="timeline-row" key={item.organization}>
                <div className="timeline-meta"><time>{item.period}</time><span>{item.location}</span></div>
                <div className="timeline-content">
                  <div className="role-heading"><div><h3>{item.organization}</h3><p>{item.role}</p></div><span aria-hidden="true">◌</span></div>
                  <ul>{item.contributions.map((contribution) => <li key={contribution}>{contribution}</li>)}</ul>
                  {item.link && <a className="inline-link" href={item.link.href} target="_blank" rel="noreferrer">{item.link.label} <Arrow /></a>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="projects" className="shell section reveal-section" data-reveal>
          <SectionHeading eyebrow="projects">Engineering projects.</SectionHeading>
          <div className="project-grid">
            {projects.filter((project) => project.featured).map((project, index) => (
              <article className={`project${project.href ? " project--linked" : ""}`} key={project.name}>
                <div className="project-index">0{index + 1}</div>
                <div className="project-top">
                  <h3>{project.name}</h3>
                  {project.status && <span className="status">{project.status}</span>}
                </div>
                <p className="project-description">{project.description}</p>
                <p className="project-detail">{project.detail}</p>
                <ul className="tags" aria-label={`${project.name} technologies`}>
                  {project.stack.map((item) => <li key={item}>{item}</li>)}
                </ul>
                {project.href && <a className="project-link" href={project.href} target="_blank" rel="noreferrer" aria-label={`View ${project.name} on GitHub`}>View repository <Arrow /></a>}
              </article>
            ))}
          </div>
          <div className="additional-projects">
            <p className="subsection-label">Additional projects</p>
            {projects.filter((project) => !project.featured).map((project, index) => (
              <article className="project-row" key={project.name}>
                <div className="project-row-index">0{index + 5}</div>
                <div className="project-row-main">
                  <div className="project-top">
                    <h3>{project.name}</h3>
                    {project.context && <span className="context-tag">{project.context}</span>}
                  </div>
                  <p>{project.description} {project.detail}</p>
                </div>
                <ul className="tags" aria-label={`${project.name} technologies`}>
                  {project.stack.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="research" className="shell section reveal-section" data-reveal>
          <SectionHeading eyebrow="research">Research & onboard systems.</SectionHeading>
          <div className="research-list">
            {research.map((item) => (
              <article key={item.title}>
                <div><time>{item.period}</time>{item.status && <span className="status">{item.status}</span>}</div>
                <div className="research-title">
                  <h3>{item.title}</h3>
                  {item.role && <p>{item.role}</p>}
                </div>
                <div className="research-copy">
                  <p>{item.description}</p>
                  {item.detail && <p>{item.detail}</p>}
                  {item.link && <a className="inline-link" href={item.link.href} target="_blank" rel="noreferrer">{item.link.label} <Arrow /></a>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="skills" className="shell section reveal-section" data-reveal>
          <SectionHeading eyebrow="stack">Tools I build with.</SectionHeading>
          <div className="skill-grid">
            {skillGroups.map((group) => (
              <div className="skill-group" key={group.label}>
                <h3>{group.label}</h3>
                <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="shell contact reveal-section" data-reveal>
          <p className="eyebrow">{"// contact"}</p>
          <div className="contact-copy motion-heading">
            <h2>Let’s build something reliable.</h2>
            <p>Find my work on GitHub or connect with me on LinkedIn.</p>
          </div>
          <div className="contact-links">
            <a href="https://github.com/JitanshA" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
            <a href="https://www.linkedin.com/in/jitansh-arora-3a2981274" target="_blank" rel="noreferrer">LinkedIn <Arrow /></a>
          </div>
        </section>
      </main>

      <footer className="shell footer">
        <div className="footer-row">
          <p>© {new Date().getFullYear()} Jitansh Arora</p>
          <a href="#top">Back to top ↑</a>
        </div>
        <p className="footer-credit">
          Hero 3D model: “Satellite Dish” by{" "}
          <a href="https://sketchfab.com/JordieLitt" target="_blank" rel="noreferrer">Jordan Little</a>, via{" "}
          <a href="https://sketchfab.com/3d-models/satellite-dish-3d1668dc014e4ff3b5205773b7940e71" target="_blank" rel="noreferrer">Sketchfab</a>, licensed{" "}
          <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Mesh split into rotating/stationary groups for this site; geometry and textures otherwise unmodified.
        </p>
      </footer>
    </>
  );
}
