export type DetailSection = 'about' | 'services' | 'portfolio' | 'contact';

export const BANNER_NAV_ITEMS: { id: 'home' | DetailSection; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'contact', label: 'Contact' },
];

export interface ServiceRecord {
  title: string;
  stack: string;
  description: string;
}

export const SERVICES_DATA: ServiceRecord[] = [
  {
    title: 'Frontend development',
    stack: 'React.js · Django · JavaScript · HTML5 · CSS3',
    description:
      'Responsive component-driven React frontends integrated with structured Django backends and RESTful application flows.',
  },
  {
    title: 'Java & Relational Database Engineering',
    stack: 'Core Java · SQL · MySQL',
    description:
      'Object-oriented application logic, normalized relational schema design, and reliable database management.',
  },
];

export interface FiveTermItem {
  term: string;
  body: string;
}

export interface ProjectRecord {
  id: string;
  title: string;
  category: 'Full-Stack' | 'Frontend' | 'Data & Python';
  stack: string;
  summary: string;
  highlights: string[];
  url: string;
}

export interface ExperienceRecord {
  organization: string;
  role: string;
  period: string;
  location: string;
  detail: string;
}

export const PORTFOLIO_IDENTITY = {
  brandShort: 'Sayan Roy',
  fullName: 'Sayan Deep Roy',
  eyebrow: 'Frontend developer',
  headlineLine1: 'Sayan',
  headlineLine2: 'Deep Roy.',
  subLine1:
    'A passionate Frontend Developer skilled in building responsive, user-friendly, and visually engaging web applications using HTML, CSS, JavaScript, and React.',
  subLine2: '',
  primaryCta: 'Open Portfolio',
  secondaryCta: 'Read paper →',
  footerLeft: '© Sayan Deep Roy',
  footerRight: 'Bangalore · CS 2025',
  email: 'roysayandeep03@gmail.com',
  phone: '+91 9163640501',
  github: 'https://github.com/Sayandeep037',
  linkedin: 'https://www.linkedin.com/in/sayan-deep-roy-1364a2239',
  resumeUrl: '/assets/aistudio/Resume_5__14__b05cd521.pdf',
};

export const FIVE_PORTFOLIO_TERMS: FiveTermItem[] = [
  {
    term: 'CarbonPulse',
    body: 'full-stack carbon footprint tracker built with React and Django, enabling daily activity input, emission calculations, and real-time environmental impact insights.',
  },
  {
    term: 'Book Review Platform',
    body: 'interactive React.js catalog and reader review interface engineered with modular components, responsive layout, and smooth client-side navigation.',
  },
  {
    term: 'Expense Tracker',
    body: 'Python and Streamlit financial ledger with Pandas, Matplotlib, and Seaborn visualizations for categorized daily expense tracking and CSV persistence.',
  },
  {
    term: 'Experience & Training',
    body: 'IBM Edunet Foundation AI & Cloud intern (Nov 2023) deploying models on IBM Cloud, and QSpiders Bangalore Java Full Stack trainee (July 2026–Present) in Core Java, SQL, and Web.',
  },
  {
    term: 'Education & Credentials',
    body: 'B.Sc. Computer Science at Acharya Institute of Technology (CGPA 7.2/10.00, June 2025), backed by Infosys Python, IBM MySQL, Microsoft Data Analysis, TATA Gen AI, and Webathon.',
  },
];

export const PROJECTS_DATA: ProjectRecord[] = [
  {
    id: 'carbon-pulse',
    title: 'CarbonPulse — Carbon Footprint Tracker',
    category: 'Full-Stack',
    stack: 'React · Django · Python · REST API',
    summary:
      'Full-stack web application built using React and Django that helps users log daily activities, compute emissions, and visualize environmental impact in real time.',
    highlights: [
      'Interactive React frontend paired with Django backend emission calculation pipelines.',
      'Real-time data visualization encouraging sustainable lifestyle choices.',
    ],
    url: 'https://github.com/Sayandeep037',
  },
  {
    id: 'book-review',
    title: 'Book Review Platform',
    category: 'Frontend',
    stack: 'React.js · JavaScript · HTML5 · CSS3',
    summary:
      'Interactive React-based platform for exploring books and reading user reviews with modular dynamic components and responsive navigation.',
    highlights: [
      'Component-driven book discovery and review feed architecture.',
      'Responsive styling and smooth browsing across desktop and mobile viewports.',
    ],
    url: 'https://github.com/Sayandeep037',
  },
  {
    id: 'expense-tracker',
    title: 'Personal Expense Tracker',
    category: 'Data & Python',
    stack: 'Python · Streamlit · Pandas · Matplotlib · Seaborn',
    summary:
      'Python expense tracking tool built with Streamlit allowing users to add, save, load, and visualize daily expenses categorized by type with CSV file support.',
    highlights: [
      'Structured Pandas dataframe handling with CSV import/export.',
      'Automated Matplotlib and Seaborn category breakdown charts.',
    ],
    url: 'https://github.com/Sayandeep037',
  },
];

export const EXPERIENCES_DATA: ExperienceRecord[] = [
  {
    organization: 'QSpiders',
    role: 'Java Full Stack Training',
    period: 'July 2026 – Present',
    location: 'Bangalore, Karnataka',
    detail:
      'Hands-on training in Core Java, SQL database management, and frontend engineering with HTML, CSS, and JavaScript.',
  },
  {
    organization: 'IBM Edunet Foundation',
    role: 'Emerging Technologies Intern (AI & Cloud)',
    period: 'Nov 2023',
    location: 'Bangalore, Karnataka',
    detail:
      'Built AI models using popular Python frameworks and deployed workloads onto cloud platforms including IBM Cloud.',
  },
];

export const SKILL_GROUPS = [
  {
    label: 'Languages',
    items: ['Python', 'Core Java', 'JavaScript', 'SQL', 'HTML', 'CSS'],
  },
];

export const CREDENTIALS_DATA = {
  education: [
    'Acharya Institute of Technology — B.E/B.Tech Computer Science (CGPA: 7.2/10.00) · June 2025',
    'Sri Ramkrishna Sikshalaya, Howrah — Higher Secondary (71/100) · Aug 2021',
    'Sri Ramkrishna Sikshalaya, Howrah — Secondary (72/100) · May 2019',
  ],
  certifications: [
    'Python Foundation — Infosys',
    'Database Structures Management with MySQL — IBM',
    'Career Essentials in Data Analysis — Microsoft',
    'Gen AI Powered Data Analytics Job Simulation — TATA',
  ],
  skills: 'Python · C++ · Core Java · Django · React.js · SQL · JavaScript · HTML/CSS · Streamlit · Pandas · Excel',
  extracurricular: 'Hackathon based on Web Development — Participated in Webathon',
};
