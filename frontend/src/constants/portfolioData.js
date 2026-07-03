export const personalInfo = {
  name: "Sanesh Kumar",
  firstName: "Sanesh",
  role: "Full Stack Developer | MERN Stack Developer",
  email: "sanesh7644@gmail.com",
  location: "Bihar, India",
  photo: "/sanesh1.jpg",
  bio: "B.Tech Computer Science student and Full Stack Developer passionate about building scalable web applications using the MERN stack. Experienced in developing secure REST APIs, authentication systems, cloud deployment, and AI-powered applications with a strong foundation in Data Structures & Algorithms.",
  about: [
    "I am currently pursuing a B.Tech in Computer Science & Engineering (2023-2027) at Government Engineering College, Lakhisarai. My primary focus is Full Stack Web Development, where I enjoy building secure, scalable, and user-friendly applications using React, Node.js, Express.js, and MongoDB.",
    "Over the past few years, I have developed several production-ready projects including an AI Chatbot, EcoRecycle Platform, Wanderlust, Zerodha Clone, and GitHub Clone. These projects have strengthened my expertise in authentication, REST APIs, cloud deployment, Docker, AWS services, and modern software development practices.",
    "I enjoy solving real-world problems through technology and continuously improve my skills by practicing Data Structures & Algorithms, exploring new technologies, and building practical applications that deliver meaningful user experiences.",
  ],
  status: "Open to Internship & Full-Time Opportunities",
  resumeLink: "/Sanesh_Kumar_Resume.pdf",
};

export const socialLinks = [
  { name: "GitHub", url: "https://github.com/Sanesh764", icon: "github" },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/sanesh-kumar-1802b1293/",
    icon: "linkedin",
  },
  { name: "Twitter", url: "https://x.com/Sanesh847", icon: "twitter" },
  {
    name: "LeetCode",
    url: "https://leetcode.com/u/sanesh7644/",
    icon: "leetcode",
  },
];

export const stats = [
  { label: "Projects", value: 10 },
  { label: "LeetCode Solved", value: 200 },
  { label: "Technologies", value: 12 },
  { label: "GitHub Commits", value: 500 },
];

export const skills = {
  languages: [
    { name: "C", icon: "SiC" },
    { name: "C++", icon: "SiCplusplus" },
    { name: "JavaScript", icon: "SiJavascript" },
    { name: "SQL", icon: "SiMysql" },
    { name: "Python", icon: "SiPython" },
  ],
  frontend: [
    { name: "React.js", icon: "SiReact" },
    { name: "HTML5", icon: "SiHtml5" },
    { name: "CSS3", icon: "FaCss3Alt" },
    { name: "Tailwind CSS", icon: "SiTailwindcss" },
    { name: "Bootstrap", icon: "SiBootstrap" },
    { name: "EJS", icon: "SiEjs" },
  ],
  backend: [
    { name: "Node.js", icon: "SiNodedotjs" },
    { name: "Express.js", icon: "SiExpress" },
    { name: "Socket.io", icon: "SiSocketdotio" },
    { name: "JWT", icon: "SiJsonwebtokens" },
    { name: "Passport.js", icon: "FaUserShield" },
    { name: "BCrypt", icon: "FaLock" },
  ],
  databases: [
    { name: "MongoDB", icon: "SiMongodb" },
    { name: "MongoDB Atlas", icon: "SiMongodb" },
    { name: "Mongoose", icon: "SiMongoose" },
    { name: "MySQL", icon: "SiMysql" },
  ],
  cloud: [
    { name: "AWS EC2", icon: "FaAws" },
    { name: "AWS S3", icon: "FaAws" },
    { name: "AWS Amplify", icon: "FaAws" },
    { name: "Cloudinary", icon: "SiCloudinary" },
    { name: "Render", icon: "SiRender" },
  ],
  devops: [
    { name: "Docker", icon: "SiDocker" },
    { name: "GitHub Actions", icon: "SiGithubactions" },
  ],
  testing: [
    { name: "Jest", icon: "SiJest" },
    { name: "Supertest", icon: "SiTestinglibrary" },
  ],
  tools: [
    { name: "Git", icon: "SiGit" },
    { name: "GitHub", icon: "SiGithub" },
    { name: "Postman", icon: "SiPostman" },
    { name: "Vite", icon: "SiVite" },
    { name: "Mapbox", icon: "SiMapbox" },
    { name: "VS Code", icon: "SiVscode" },
  ],
};

export const projects = [
  {
    title: "AI Chatbot",
    description:
      "Built a full-stack AI chatbot with secure JWT authentication, real-time AI conversations, chat history management, and user accounts. Integrated NVIDIA NIM API for intelligent responses with a React frontend, Express backend, and MongoDB database.",
    tech: [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "JWT",
      "NVIDIA NIM API",
      "Axios",
    ],
    live: "https://main.d3vnb7tglk6hgc.amplifyapp.com/",
    code: "https://github.com/Sanesh764/chatbot",
    gradient: "linear-gradient(135deg, #11998e, #38ef7d)",
    icon: "FaRobot",
    features: [
      "Secure JWT Authentication",
      "Real-time AI Chat history",
      "NVIDIA NIM API Integration",
      "Responsive Interface",
    ],
    deployment: "AWS Amplify",
    status: "Completed",
  },
  {
    title: "E-Recycle Platform",
    description:
      "Developed a full-stack e-waste management platform that enables users to recycle electronic products through pickup requests, secure authentication, educational resources, and an admin-managed workflow. Includes responsive UI and MongoDB-powered data management.",
    tech: [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "JWT",
      "REST API",
      "Bootstrap",
    ],
    live: "https://eco-recycle-three.vercel.app/",
    code: "https://github.com/Sanesh764/E-com-website",
    gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
    icon: "FaShoppingCart",
    features: [
      "E-waste recycling scheduler",
      "Admin workflow console",
      "Bootstrap UI styling",
      "Secure user database",
    ],
    deployment: "Vercel",
    status: "Completed",
  },
  {
    title: "Zerodha Clone",
    description:
      "Created a full-stack stock trading platform inspired by Zerodha with secure authentication, responsive dashboard, portfolio management, and modern UI. Built using the MERN stack with RESTful APIs and MongoDB integration.",
    tech: [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "JWT",
      "REST API",
      "Bootstrap",
    ],
    live: "https://main.d2nd08dk4frp54.amplifyapp.com",
    code: "https://github.com/Sanesh764/ZERODHA_clone",
    gradient: "linear-gradient(135deg, #387ed1, #1e3a5f)",
    icon: "FaChartLine",
    features: [
      "Pixel-perfect replica UI",
      "Trading dashboard and stats",
      "MERN Stack API backend",
      "MongoDB portfolios",
    ],
    deployment: "AWS Amplify",
    status: "Completed",
  },
  {
    title: "GitHub Clone",
    description:
      "Built a full-stack GitHub-inspired platform featuring repository management, authentication, issue tracking, and a custom Git-like CLI supporting add, commit, push, pull, and revert operations with AWS S3 integration.",
    tech: [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "JWT",
      "AWS S3",
      "REST API",
    ],
    live: "https://github.com/Sanesh764/Github_clone",
    code: "https://github.com/Sanesh764/Github_clone",
    gradient: "linear-gradient(135deg, #24292e, #586069)",
    icon: "FaGithub",
    features: [
      "Repository management console",
      "Custom Git-like CLI commands",
      "AWS S3 file uploads",
      "JWT Authentication",
    ],
    deployment: "S3 / Local",
    status: "Completed",
  },
  {
    title: "Wanderlust",
    description:
      "Developed a full-stack vacation rental platform inspired by Airbnb with user authentication, property listings, image uploads, reviews, ratings, interactive maps, and complete CRUD functionality using the MVC architecture.",
    tech: [
      "Node.js",
      "Express.js",
      "MongoDB",
      "EJS",
      "Passport.js",
      "Cloudinary",
      "Mapbox",
      "MVC",
    ],
    live: "https://wanderlust-4c1x.onrender.com/listings",
    code: "https://github.com/Sanesh764/wanderlust",
    gradient: "linear-gradient(135deg, #ff385c, #e31c5f)",
    icon: "FaMapMarkedAlt",
    features: [
      "Airbnb booking CRUD flow",
      "Interactive Mapbox mapping",
      "Cloudinary photo uploads",
      "Passport.js user security",
    ],
    deployment: "Render",
    status: "Completed",
  },
  {
    title: "Simon Game",
    description:
      "Developed an interactive memory game using JavaScript with dynamic sequence generation, score tracking, responsive design, and engaging animations to improve user experience.",
    tech: ["HTML5", "CSS3", "JavaScript"],
    live: "https://sanesh764.github.io/SYMION_GAME/",
    code: "https://github.com/Sanesh764/SYMION_GAME",
    gradient: "linear-gradient(135deg, #fc4a1a, #f7b733)",
    icon: "FaGamepad",
    features: [
      "Sequence generation logic",
      "Local high score tracking",
      "Sound effects integration",
      "Responsive grid views",
    ],
    deployment: "GitHub Pages",
    status: "Completed",
  },
];

export const experience = [
  {
    title: "Bachelor of Technology (B.Tech) - Computer Science & Engineering",
    subtitle: "Government Engineering College, Lakhisarai | 2023 - 2027",
    description:
      "Currently pursuing a B.Tech in Computer Science & Engineering with a CGPA of 8.2/10. Focused on Full Stack Development, Data Structures & Algorithms, Database Management Systems, Object-Oriented Programming, Software Engineering, and Cloud Technologies.",
    icon: "FaGraduationCap",
    type: "education",
  },
  {
    title: "Full Stack Developer Intern",
    subtitle: "Maincrafts Technology (Remote) | 2026",
    description:
      "Developed scalable RESTful APIs using Node.js and Express.js with JWT authentication, RBAC, and Joi validation. Improved MongoDB performance through schema optimization, deployed applications using Docker on Render, and implemented secure session management for production-ready applications.",
    icon: "FaLaptopCode",
    type: "experience",
  },
  {
    title: "Full Stack Developer & Open Source Learner",
    subtitle: "2024 - Present",
    description:
      "Designed and deployed multiple production-ready MERN stack applications including an AI Chatbot, EcoRecycle Platform, Wanderlust, Zerodha Clone, and GitHub Clone. Experienced with AWS Amplify, Render, Docker, Cloudinary, Mapbox, MongoDB Atlas, GitHub Actions, and modern web development best practices.",
    icon: "FaCodeBranch",
    type: "project",
  },
];

export const navLinks = [
  { name: "Home", href: "home" },
  { name: "About", href: "about" },
  { name: "Skills", href: "skills" },
  { name: "Projects", href: "projects" },
  { name: "Experience", href: "experience" },
  { name: "Certificates", href: "certificates" },
  { name: "Contact", href: "contact" },
];
