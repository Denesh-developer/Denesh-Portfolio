/**
 * Always-rendered, visually-hidden About content for search engines and screen
 * readers. The visible About lives inside a modal that only mounts on click, so
 * this keeps the SEO-relevant copy present in the crawlable DOM at all times
 * (mirrored by the JSON-LD in index.html). It is real, accurate content — not
 * keyword stuffing — and reuses the same story as the modal, expanded with the
 * current journey and interests that the compact Figma card omits.
 */
export function AboutSeo() {
  return (
    <section className="sr-only" aria-label="About Deneshraja Nedunchezhian">
      <h1>Deneshraja Nedunchezhian — Full-Stack Developer, Android Developer &amp; System Administrator</h1>
      <p>
        I am a Full-Stack Developer, Android Developer, and System Administrator based in Tamil Nadu, India.
        I specialize in building responsive web applications using React.js, Tailwind CSS, JavaScript, and
        Firebase, along with native Android application engineering using Java. Currently working as a
        System Administrator at Voltech Engineers Private Limited, managing IT infrastructure, network workflows,
        and workstation deployments.
      </p>

      <h2>What I Build</h2>
      <ul>
        <li>Full-stack web applications (React, Firebase, Supabase)</li>
        <li>Native Android mobile applications (Java, Android Studio)</li>
        <li>Hyper-local community platforms like CheyyarHub, Cheyyar 3D Town &amp; CheyyarBus</li>
        <li>E-commerce systems &amp; inventory platforms (PHP, MySQL)</li>
        <li>Enterprise system infrastructure and network automation</li>
      </ul>

      <h2>Core Expertise</h2>
      <ul>
        <li>Frontend — React.js, Tailwind CSS, JavaScript, HTML5, CSS3</li>
        <li>Mobile — Android Development, Java, Android Studio</li>
        <li>Backend &amp; Databases — Firebase Auth &amp; Firestore, Supabase, MySQL, PHP</li>
        <li>Infrastructure — System Administration, Hardware Troubleshooting, Network Management</li>
      </ul>

      <h2>Current Journey</h2>
      <p>
        System Administrator at Voltech Engineers Private Limited while continuously designing and shipping
        real-world web and mobile applications. BCA graduate (76%) from Adhiparasakthi College of Arts and Science.
        Winner of multiple state and international level technical symposiums in Web Designing and Paper Presentation.
      </p>

      <h2>Beyond Development</h2>
      <p>Continuous learning, community technology tools, system optimization, and open source exploration.</p>
    </section>
  )
}
