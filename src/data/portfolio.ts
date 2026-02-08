export interface PortfolioData {
    personal: {
        name: string;
        title: string;
        email: string;
        phone: string;
        linkedin: string;
        resume: string;
        bio: string;
        about: string;
    };
    skills: {
        category: string;
        description: string; // Added description
        items: string[];
        logos?: { name: string; url: string }[];
    }[];
    experience: {
        role: string;
        company: string;
        url: string;
        logo?: string;
        period: string;
        duration: string;
        description: string;
    }[];
    projects: {
        title: string;
        category: string;
        description: string;
    }[];
    academics: {
        degree: string;
        description: string;
    }[];
}

export const portfolioData: PortfolioData = {
    personal: {
        name: "Ramesh BG",
        title: "Developer",
        email: "rameshbg11@gmail.com",
        phone: "+91 7829112957",
        linkedin: "https://www.linkedin.com/in/rameshbg/",
        resume: "https://drive.google.com/file/d/1oGnUgGU9DqPDf_l5WpYQjCtHLR9sBMxo/view?usp=sharing",
        bio: "Building scalable web applications and robust architectures. Experienced in full-stack development, cloud infrastructure, and modern frontend frameworks.",
        about: "I am a Developer with expertise in Angular, React, and Node.js. I have a strong background in building fintech products, monorepo architectures, and micro-frontends. I am passionate about performance optimization, clean code, and DevOps practices."
    },
    skills: [
        {
            category: "Frontend & Micro-frontends",
            description: "Building responsive, scalable, and high-performance user interfaces using modern frameworks and micro-frontend architectures.",
            items: [
                "Angular", "React.js", "Vue.js", "Svelte", "TypeScript",
                "JavaScript (ES6+)", "HTML5", "CSS3", "Micro-frontends", "Module Federation"
            ],
            logos: [
                { name: "Angular", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angular/angular-original.svg" },
                { name: "React", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
                { name: "Vue.js", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" },
                { name: "TypeScript", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" },
                { name: "HTML5", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" },
                { name: "CSS3", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" }
            ]
        },
        {
            category: "Backend & Cloud",
            description: "Developing robust server-side applications, managing cloud infrastructure, and ensuring secure containerized deployments.",
            items: [
                "Node.js", "Express", "REST APIs", // Removed NestJS
                "Nginx", "Docker", "Kubernetes", "CI/CD", "OWASP"
            ],
            logos: [
                { name: "Node.js", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
                { name: "Docker", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" },
                { name: "Kubernetes", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg" }
            ]
        },
        {
            category: "State Management & Architecture",
            description: "Designing scalable state management solutions and clean architecture patterns for complex applications.",
            items: [
                "NgRx", "Redux", "RxJS", "Nx Monorepo", "System Design",
                "Design Patterns", "Clean Architecture"
            ],
            logos: [
                { name: "Redux", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg" },
                { name: "RxJS", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rxjs/rxjs-original.svg" }
            ]
        },
        {
            category: "Tools & Methodologies",
            description: "Utilizing industry-standard tools and agile methodologies to streamline development and ensure code quality.",
            items: [
                "Git", "JIRA", "Agile", "Scrum", "TDD", "Jest", "Cypress", "Webpack", "Vite"
            ],
            logos: [
                { name: "Git", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
                { name: "Vite", url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" }
            ]
        }
    ],
    experience: [
        {
            role: "Lead Software Engineer",
            company: "Open Financial Technologies",
            url: "https://open.money/",
            logo: "https://open-frontend-bucket.s3.amazonaws.com/logos/favicon/favicon-darkmode.svg",
            period: "Present",
            duration: "Jan 2021 — Present",
            description: "Lead the design, architecture, and development of scalable fintech frontend platforms used by tens of thousands of businesses. Drive frontend excellence, performance, and developer productivity while collaborating with product, backend, and design teams."
        },
        {
            role: "Software Engineer",
            company: "Neutrinos",
            url: "https://www.neutrinos.com/",
            logo: "data:image/svg+xml,%3Csvg width='38' height='24' viewBox='0 0 38 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28.145 0.0262295L19.0832 7.16066L9.54159 0.0262295H7.22283V23.9475H9.48829L18.5501 16.8131L28.0651 23.9475H30.3838V0.0262295H28.1184H28.145ZM28.0384 20.9574L11.4339 8.52459V11.4623L16.6578 15.3705L9.6482 20.8787V3.01639L26.2794 15.4492V12.5115L21.0555 8.60328L28.0651 3.09508V20.9574H28.0384ZM37.66 21.0623V24L32.2229 19.9344V16.9967L37.6866 21.0623H37.66ZM0 2.93771V0L5.43711 4.06557V7.00328L0 2.93771Z' fill='%233b82f6'/%3E%3C/svg%3E",
            period: "Past",
            duration: "Oct 2017 — Jan 2021",
            description: "Develop enterprise-grade web applications with a strong focus on security, scalability, and workflow-driven systems for global clients across document management and insurance domains."
        }
    ],
    projects: [
        {
            title: "Open Money",
            category: "Fintech Platform",
            description: "Developed a comprehensive fintech platform covering accounting, GST filing, billing, payouts, and third-party integrations, ensuring compliance and scalability."
        },
        {
            title: "Static Sites Portfolio",
            category: "Web Development",
            description: "Built responsive and SEO-optimized static websites for marketing and product landing pages, with a focus on performance, accessibility, and cross-browser compatibility."
        },
        {
            title: "Open Ecosystem Suite",
            category: "Architecture",
            description: "Contributed to multiple fintech initiatives under the Open ecosystem, delivering modular applications with reusable libraries and optimized builds in a monorepo setup."
        },
        {
            title: "Apollo Insurance Platform",
            category: "Insurance Tech",
            description: "Designed and implemented a sales and servicing platform for vehicle and mortgage insurance, enabling underwriting, claims processing, and banking integrations."
        },
        {
            title: "Ingredion DMS",
            category: "Enterprise System",
            description: "Delivered an RBAC-based document management solution with secure storage, approvals, versioning, and advanced search, streamlining enterprise document workflows."
        },
        {
            title: "Open Capital",
            category: "Fintech",
            description: "Built a lending and repayment system to manage credit disbursements, repayments, and compliance workflows with real-time tracking and reporting."
        },
        {
            title: "Payment Gateway SDK",
            category: "SDK Development",
            description: "Developed a JavaScript SDK to simplify web-based payment gateway integration, supporting seamless checkout flows and secure transaction handling."
        },
        {
            title: "Aviva SRM",
            category: "CRM System",
            description: "Created a lead and sales relationship management system for the insurance sector, supporting claims tracking, customer engagement, and end-to-end sales lifecycle management."
        }
    ],
    academics: [
        {
            degree: "Bachelor of Engineering in Computer Science",
            description: "Focused on core computer science concepts, software development, and engineering fundamentals. Participated in technical events and academic projects."
        },
        {
            degree: "Pre-University (PCMCS)",
            description: "Specialized in Physics, Chemistry, Mathematics, and Computer Science. Built a strong foundation in analytical thinking, problem-solving, and basic programming concepts."
        }
    ]
}
