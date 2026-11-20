// All site copy lives here. Source: the portfolio content document provided by M. Shehana Safreen.

export type Link = { label: string; href: string };

export type Item = {
  heading: string;
  meta?: string[];        // short lines under the heading (organisation, period, ...)
  body?: string[];        // paragraphs
  tags?: string[];        // rendered as one comma-separated line
  links?: Link[];
};

export type Scene = {
  id: string;
  label: string;          // shown in the header while this scene is active
  frames: { desktop: number; mobile: number };
  align: "left" | "right" | "center";
  weight: number;         // scroll length of the scene, in viewport heights
  items: Item[];          // each item is one beat of text within the scene
};

export const profile = {
  name: "M. Shehana Safreen",
  title: "Full Stack Developer · AI Application Developer",
  location: "Madurai, Tamil Nadu, India",
  email: "Shehana201206@gmail.com",
  github: "https://github.com/sheha-create",
  linkedin: "https://www.linkedin.com/in/shehana-safreen-543448356/",
  // Set to the real résumé PDF path (e.g. "/Shehana-Safreen-Resume.pdf") to show a download button. Empty = no button.
  resumeUrl: "/Shehana-Safreen-Resume.pdf",
};

export const achievements = [
  { title: "3LC Data-Centric AI Challenge – Forage",
    body: "Contributed to a Kaggle-based challenge focused on improving data quality and model performance through iterative data-labeling strategies." },
  { title: "DATA SPRINT 2026",
    body: "Represented K.L.N. College of Engineering in a competitive quiz round covering Data Science and Applied Machine Learning." },
];

const frames = { desktop: 240, mobile: 120 };

export const scenes: Scene[] = [
  {
    id: "intro", label: "Introduction", frames, align: "left", weight: 200,
    items: [{
      heading: profile.name,
      meta: ["Full Stack Developer", "AI Application Developer", profile.location],
    }],
  },
  {
    id: "about", label: "About", frames, align: "right", weight: 400,
    items: [
      {
        heading: "About",
        body: [
          "I'm a third-year Computer Science and Engineering student passionate about building impactful software and intelligent applications.",
          "My interests lie at the intersection of Full-Stack Development and Artificial Intelligence. I enjoy transforming ideas into practical solutions, developing web applications, exploring AI-powered technologies, and creating software that addresses real-world challenges.",
        ],
      },
      {
        heading: "How I work",
        body: [
          "Through hands-on projects and continuous learning, I've been developing my skills in Python, JavaScript, web technologies, and AI application development. I focus on building functional, user-oriented solutions while strengthening my understanding of software engineering and emerging technologies.",
          "I'm always looking to explore new technologies, take on meaningful challenges, and grow as a developer.",
        ],
      },
      {
        heading: "Focus and education",
        meta: ["Full-Stack Development, AI Application Development, Intelligent Automation"],
        body: [
          "Career objective: to contribute to innovative software products and build a career at the intersection of software engineering and artificial intelligence.",
          "B.E. Computer Science and Engineering, K.L.N. College of Engineering, Madurai. 2024–2028. CGPA 8.66.",
        ],
      },
    ],
  },
  {
    id: "experience", label: "Experience", frames, align: "left", weight: 880,
    items: [
      { heading: "Machine Learning & AI Intern", meta: ["Skill Nexis", "Remote internship, September 2026 – October 2026"],
        body: ["Developed and worked with machine learning and AI models across assigned project tracks, following structured technical tasks and agile delivery milestones."] },
      { heading: "Data Science Intern – Python", meta: ["Skill Nexis", "Remote internship, September 2026 – October 2026"],
        body: ["Worked on Python-based data processing, statistical analysis and predictive modelling using structured datasets."] },
      { heading: "AWS Cloud Computing Intern", meta: ["EWB Edutech Private Limited", "Remote internship, September 2026 – October 2026"],
        body: ["Worked on AWS cloud infrastructure concepts and deployment solutions, completing weekly technical assessments and a final cloud capstone mini-project."] },
      { heading: "Front-End AI Engineering Intern", meta: ["FlyRank.ai", "Remote internship, July 2026 – September 2026"],
        body: ["Completed the production-focused AI capstone, \u201CShip It – Your First Production AI Product.\u201D Worked through 18 practical assignments covering responsive Tailwind interfaces, streaming AI chat experiences and MCP agent workflows. Completed 20 verified Anthropic Academy courses covering Claude API integration, agent skills, subagents, AWS Bedrock and Google Cloud Vertex AI."] },
      { heading: "Frontend & Junior Web Developer Intern", meta: ["YuvaIntern", "Remote internship, July 2026 – August 2026"],
        body: ["Developed responsive web interfaces and reusable components using HTML, CSS and JavaScript, with attention to cross-device performance and accessibility."] },
      { heading: "AI & Cloud Technologies Intern", meta: ["Edunet Foundation – IBM SkillsBuild & AICTE", "Remote internship, June 2026 – July 2026"],
        body: ["Worked on an agentic AI cybersecurity phishing detection agent using IBM Watsonx Orchestrate and Langflow. Also developed a college admission chatbot using IBM Watsonx Assistant."] },
      { heading: "Python Development Intern", meta: ["QSkill / Squarcell Resource India Pvt. Ltd.", "Remote internship, June 2026 – July 2026"],
        body: ["Worked on Python programming tasks, scripts and analytical utilities. Received a letter of recommendation."] },
      { heading: "Def-Space Artificial Intelligence Intern", meta: ["Bharat Space Education Research Centre (BSERC)", "15-day internship, 2026"],
        body: ["Completed the Def-Space Artificial Intelligence Internship 2026.", "Certificate ID: BSERC-2026-AI-2928"] },
    ],
  },
  {
    id: "projects", label: "Projects", frames, align: "right", weight: 560,
    items: [
      { heading: "Zenith", meta: ["AI / RAG application"],
        body: ["A RAG-based document assistant designed to help users interact with document content through an intelligent question-answering experience."],
        links: [{ label: "Live demo", href: "https://zenith-front.onrender.com" }] },
      { heading: "Candidate Intelligence Platform", meta: ["AI / recruitment technology"],
        body: ["An intelligent recruitment platform that helps HR teams explore applicant lists, search candidates based on skills and identify top applicants matching job requirements.",
               "Candidate discovery and search, skill-based filtering, candidate matching and ranking, recruitment-oriented candidate intelligence."],
        links: [{ label: "Live demo", href: "https://7w64oyjzf64pgfecyqy66p.streamlit.app/" }, { label: "GitHub", href: "https://github.com/sheha-create/India_runs" }] },
      { heading: "Food Label Analyzer", meta: ["AI / health technology"],
        body: ["A food label analysis application designed to help users understand nutritional information and evaluate food products against health-related dietary thresholds."],
        links: [{ label: "Live demo", href: "https://food-label-analyzer-2.onrender.com/" }] },
      { heading: "QNAS: Quantum Neural Architecture Search", meta: ["Quantum computing / optimization"],
        body: ["A quantum circuit optimization project exploring genetic algorithm-based quantum architecture search with noise-aware scoring and circuit benchmarking."],
        links: [{ label: "Live demo", href: "https://sheha-create.github.io/QNAS/" }] },
      { heading: "Network Port Scanner", meta: ["Cybersecurity / network security"],
        body: ["A Python-based network security utility for port scanning and basic network reconnaissance."],
        links: [{ label: "Live demo", href: "https://port-scanner-hl3o.onrender.com" }] },
    ],
  },
  {
    id: "skills", label: "Skills & Achievements", frames, align: "left", weight: 880,
    items: [
      { heading: "Programming & web development", tags: ["Python 3", "JavaScript", "HTML", "CSS", "Tailwind CSS"] },
      { heading: "AI & machine learning", tags: ["Generative AI", "Retrieval-Augmented Generation (RAG)", "Agentic AI", "Prompt Engineering", "Natural Language Processing (NLP)", "IBM Watsonx Orchestrate", "IBM Watsonx Assistant", "Claude API", "Model Context Protocol (MCP)", "Langflow"] },
      { heading: "Cloud & DevOps", tags: ["Amazon Web Services (AWS)", "AWS Bedrock", "Microsoft Azure", "IBM Cloud", "Oracle Cloud", "Render"] },
      { heading: "Data science & analytics", tags: ["Pandas", "NumPy", "Matplotlib", "Tableau", "Power BI", "Data Analytics"] },
      { heading: "Cybersecurity & networking", tags: ["Network Security", "Port Scanning", "Wireshark", "Nmap", "Kali Linux", "Cisco Packet Tracer", "Identity and Access Management (IAM)"] },
      { heading: "Development tools & methodologies", tags: ["Git", "Agile Methodologies"] },
      ...achievementItems(),
    ],
  },
  {
    id: "contact", label: "Contact", frames, align: "center", weight: 260,
    items: [{
      heading: "Let's talk",
      body: [profile.location],
      links: [
        { label: "Download Official Résumé", href: "/Shehana-Safreen-Resume.pdf" },
        { label: profile.email, href: `mailto:${profile.email}` },
        { label: "GitHub", href: profile.github },
        { label: "LinkedIn", href: profile.linkedin },
      ],
    }],
  },
];

function achievementItems(): Item[] {
  return achievements.map((a) => ({ heading: a.title, meta: ["Achievement"], body: [a.body] }));
}

export type CertCategory = "AI & Machine Learning" | "Cloud & Technology" | "Professional Development";
export const certCategories: CertCategory[] = ["AI & Machine Learning", "Cloud & Technology", "Professional Development"];

export type Certificate = {
  issuer: string;
  title: string;
  category: CertCategory;
  detail?: string;
  date?: string;
  image?: string; // optional: put the file in public/certificates/ and set e.g. "/certificates/oracle-genai.jpg"
  url?: string;   // optional: add a real verification link only when you have one
};

// The first six are the featured gallery; the rest appear under "View all".
export const certificates: Certificate[] = [
  { issuer: "Oracle Cloud Infrastructure", title: "2025 Certified Generative AI Professional", category: "AI & Machine Learning", date: "October 23, 2025" },
  { issuer: "Oracle Cloud Infrastructure", title: "2025 Certified AI Foundations Associate", category: "AI & Machine Learning", date: "October 21, 2025" },
  { issuer: "Google / Kaggle", title: "5-Day AI Agents Intensive Course", category: "AI & Machine Learning" },
  { issuer: "Qualcomm Academy", title: "AI Upskilling Certificate: Technical Foundation", category: "AI & Machine Learning", date: "February 2, 2026" },
  { issuer: "NPTEL, IIT Kharagpur", title: "Introduction to Industry 4.0 and Industrial Internet of Things", category: "Cloud & Technology", detail: "12-week course, 78%", date: "July–October 2025" },
  { issuer: "Celonis", title: "Process Mining Rising Star: Technical", category: "Cloud & Technology", date: "April 23, 2026" },
  { issuer: "Google / Coursera", title: "Introduction to AI", category: "AI & Machine Learning" },
  { issuer: "Google for Education", title: "Gemini Certified Student", category: "AI & Machine Learning", date: "Issued June 12, 2025; valid through June 12, 2028" },
  { issuer: "NASSCOM FutureSkills", title: "Generative AI Literacy / SAWIT.AI Learnathon", category: "Professional Development" },
  { issuer: "CloudThat", title: "Azure Fundamentals Certification Program Completion", category: "Cloud & Technology", detail: "Program completion certificate", date: "April 1, 2026" },
  { issuer: "Google for Startups", title: "Startup School: Prompt to Prototype", category: "Professional Development", date: "December 10, 2025" },
  { issuer: "GUVI", title: "Build & Deploy Apps with Google AI Studio & Multilingual AI Speech App with Vibe Coding", category: "AI & Machine Learning" },
];
export const FEATURED_COUNT = 6;
