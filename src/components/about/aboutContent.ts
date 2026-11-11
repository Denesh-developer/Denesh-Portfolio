  // Content for the About modal, transcribed verbatim from Figma node 80:5.
  // Text lives here (not baked into images) so it stays live, crawlable DOM.

  export type Skill = { name: string; src: string }

  /** Tech / tooling logos, in the left-to-right order they appear on the card. */
  export const SKILLS: Skill[] = [
    { name: 'React', src: '/assets/about/icons/react.svg' },
    { name: 'JavaScript', src: '/assets/about/icons/javascript.svg' },
    { name: 'Java', src: '/assets/about/icons/java.svg' },
    { name: 'Android', src: '/assets/about/icons/android.svg' },
    { name: 'Firebase', src: '/assets/about/icons/firebase.svg' },
    { name: 'Tailwind CSS', src: '/assets/about/icons/tailwind.svg' },
    { name: 'HTML5', src: '/assets/about/icons/html5.svg' },
    { name: 'CSS3', src: '/assets/about/icons/css3.svg' },
    { name: 'Supabase', src: '/assets/about/icons/supabase.svg' },
    { name: 'MySQL', src: '/assets/about/icons/mysql.svg' },
    { name: 'PHP', src: '/assets/about/icons/php.svg' },
    { name: 'Python', src: '/assets/about/icons/python.svg' },
    { name: 'Git', src: '/assets/about/icons/git.svg' },
    { name: 'GitHub', src: '/assets/about/icons/Github.svg' },
    { name: 'VS Code', src: '/assets/about/icons/Visual Studio Code.svg' },
    { name: 'Vercel', src: '/assets/about/icons/vercel.svg' },
    { name: 'Node.js', src: '/assets/about/icons/nodejs.svg' },
    { name: 'Redux', src: '/assets/about/icons/redux.svg' },
  ]

  export const ROLES = ['Full-Stack Developer', 'Android Developer', 'System Administrator', 'Frontend Developer']

  export const INTRO =
    '"BCA Graduate & System Administrator passionate about creating clean, high-performance web applications, intuitive mobile experiences, and scalable tech infrastructure."'

  export const FOCUS =
    'Developing hyper-local community platforms (CheyyarHub, Cheyyar 3D Town & CheyyarBus), modern React & Android apps, robust cloud backends with Firebase & Supabase, and managing enterprise system infrastructure.'

  export type BuildItem = { label: string; image: string }

  export const BUILD_ITEMS: BuildItem[] = [
    { label: 'Web Applications', image: '/assets/about/build/custom-websites.jpg' },
    { label: 'Android Mobile Apps', image: '/assets/about/build/saas-platforms.jpg' },
    { label: 'Cloud & Database Systems', image: '/assets/about/build/ai-automation.jpg' },
    { label: 'Enterprise Infrastructure', image: '/assets/about/build/n8n-workflows.jpg' },
  ]
