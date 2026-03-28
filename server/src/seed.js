const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("./models/User");
const Gig = require("./models/Gig");
const Work = require("./models/Work");

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for Seeding...");

    await User.deleteMany({});
    await Gig.deleteMany({});
    await Work.deleteMany({});
    console.log("Cleared existing data.");

    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Users ─────────────────────────────────────────────────
    const users = [
      { name: "Alex Rivera",      email: "alex@example.com",    password: hashedPassword, role: "freelancer", bio: "Senior Fullstack Developer with 8+ years of experience in MERN stack. I build scalable, production-ready applications.", skills: ["React", "Node.js", "MongoDB", "Express", "Docker", "GraphQL"] },
      { name: "Sarah Chen",       email: "sarah@example.com",   password: hashedPassword, role: "freelancer", bio: "UI/UX Designer obsessed with clean, minimalist interfaces. Figma power user & design systems enthusiast.", skills: ["Figma", "UI Design", "UX Research", "Web Design", "Prototyping"] },
      { name: "Michael Frost",    email: "michael@example.com", password: hashedPassword, role: "freelancer", bio: "B2B Content Writer & SEO Expert. I craft compelling narratives that rank and convert.", skills: ["SEO", "Content Writing", "Copywriting", "Marketing", "Blog Strategy"] },
      { name: "Priya Mehta",      email: "priya@example.com",   password: hashedPassword, role: "freelancer", bio: "Mobile app developer specialising in React Native & Flutter. Cross-platform excellence is my craft.", skills: ["React Native", "Flutter", "Firebase", "TypeScript", "iOS", "Android"] },
      { name: "Carlos Vega",      email: "carlos@example.com",  password: hashedPassword, role: "freelancer", bio: "AI/ML Engineer with hands-on experience in NLP, computer vision, and production model deployment.", skills: ["Python", "TensorFlow", "NLP", "Computer Vision", "FastAPI", "MLOps"] },
      { name: "Jessica Bloom",    email: "jessica@example.com", password: hashedPassword, role: "client",     bio: "Product Manager at a fast-growing tech startup. Looking for talented developers.", skills: [] },
      { name: "David Miller",     email: "david@example.com",   password: hashedPassword, role: "client",     bio: "Serial entrepreneur building multiple MVPs simultaneously.", skills: [] },
      { name: "Emily Watson",     email: "emily@example.com",   password: hashedPassword, role: "client",     bio: "Marketing Director at a mid-size e-commerce brand. I need great content and design.", skills: [] },
    ];

    const createdUsers = await User.insertMany(users);
    const [alex, sarah, michael, priya, carlos] = createdUsers;
    console.log("Test Users Created.");

    // ── Gigs ──────────────────────────────────────────────────
    const gigs = [
      {
        freelancer: alex._id,
        title: "Build a Custom MERN Stack Web Application",
        description: "I will build a high-performance, scalable web application tailored to your specific business needs using React, Node.js, and MongoDB.",
        category: "Development",
        tags: ["React", "Node.js", "SaaS", "Fullstack"],
        packages: {
          basic:    { price: 500,  deliveryDays: 14, revisions: 2, features: ["5 Pages", "Responsive Design", "Basic Auth"] },
          standard: { price: 1200, deliveryDays: 30, revisions: 5, features: ["10 Pages", "Auth Integration", "API Dev", "Deployment"] },
          premium:  { price: 2500, deliveryDays: 60, revisions: 999, features: ["Unlimited Pages", "Full Backend", "Admin Panel", "CI/CD", "1mo Support"] }
        }
      },
      {
        freelancer: alex._id,
        title: "REST API Development with Node.js & Express",
        description: "Professional, documented REST APIs with authentication, pagination, and deployment. Ideal for mobile app backends.",
        category: "Development",
        tags: ["Node.js", "Express", "REST API", "Backend"],
        packages: {
          basic:   { price: 300, deliveryDays: 7,  revisions: 2, features: ["5 Endpoints", "Basic Auth"] },
          standard:{ price: 700, deliveryDays: 14, revisions: 3, features: ["20 Endpoints", "JWT Auth", "Swagger Docs"] },
          premium: { price: 1500, deliveryDays: 30, revisions: 10, features: ["Unlimited Endpoints", "OAuth2", "Rate Limiting", "Deployed"] }
        }
      },
      {
        freelancer: sarah._id,
        title: "Premium UI/UX Design for Mobile & Web",
        description: "User-centric designs that convert. Get a modern, premium look for your product with full design system hand-off.",
        category: "Design",
        tags: ["Figma", "UI/UX", "Mobile App", "Design System"],
        packages: {
          basic:   { price: 200, deliveryDays: 7,  revisions: 3,  features: ["Homepage Mockup", "3 Screens"] },
          standard:{ price: 600, deliveryDays: 14, revisions: 7,  features: ["10 Screens", "Component Library"] },
          premium: { price: 1200, deliveryDays: 30, revisions: 999, features: ["Full App Design", "Design System", "Dev Handoff"] }
        }
      },
      {
        freelancer: sarah._id,
        title: "Brand Identity & Logo Design Package",
        description: "Complete brand identity from scratch — logo, typography, color palette, and brand guidelines document.",
        category: "Design",
        tags: ["Logo", "Branding", "Identity", "Design"],
        packages: {
          basic:   { price: 150, deliveryDays: 5,  revisions: 2, features: ["Logo (3 concepts)", "PNG/SVG"] },
          premium: { price: 500, deliveryDays: 14, revisions: 5, features: ["Full Brand Kit", "Style Guide PDF"] }
        }
      },
      {
        freelancer: michael._id,
        title: "SEO-Optimised Blog Content (5 Articles)",
        description: "Expert-level, long-form blog posts targeting your niche keywords. Research-backed, conversion-focused writing.",
        category: "Writing",
        tags: ["SEO", "Content Writing", "Blog", "Marketing"],
        packages: {
          basic:   { price: 150, deliveryDays: 7,  revisions: 2, features: ["5 x 500wd articles", "Keyword Research"] },
          standard:{ price: 350, deliveryDays: 10, revisions: 3, features: ["5 x 1500wd articles", "On-page SEO", "Internal Linking"] },
          premium: { price: 600, deliveryDays: 14, revisions: 5, features: ["5 x 3000wd articles", "Full SEO Strategy", "Meta Descriptions"] }
        }
      },
      {
        freelancer: michael._id,
        title: "SaaS Landing Page Copywriting",
        description: "High-converting landing page copy for your SaaS product. I've helped 20+ startups dramatically improve trial signups.",
        category: "Writing",
        tags: ["Copywriting", "SaaS", "Landing Page", "Conversion"],
        packages: {
          basic:  { price: 200, deliveryDays: 3, revisions: 2, features: ["Full Page Copy", "1 Revision"] },
          premium:{ price: 500, deliveryDays: 7, revisions: 5, features: ["Full Copy + Email Sequence", "A/B Variant"] }
        }
      },
      {
        freelancer: priya._id,
        title: "Cross-Platform Mobile App with React Native",
        description: "Beautiful, performant iOS & Android apps from a single codebase. API integration, auth, and App Store submission included.",
        category: "Development",
        tags: ["React Native", "iOS", "Android", "Mobile App"],
        packages: {
          basic:   { price: 800,  deliveryDays: 21, revisions: 3,  features: ["3 Screens", "Basic Navigation"] },
          standard:{ price: 2000, deliveryDays: 45, revisions: 5,  features: ["10 Screens", "Auth", "API Integration"] },
          premium: { price: 4000, deliveryDays: 90, revisions: 999, features: ["Full App", "Push Notifications", "Store Submission"] }
        }
      },
      {
        freelancer: carlos._id,
        title: "Custom AI Chatbot with GPT Integration",
        description: "Build a smart, context-aware chatbot for your business — trained on your own data using RAG and fine-tuning techniques.",
        category: "Data",
        tags: ["AI", "ChatGPT", "NLP", "Chatbot", "Python"],
        packages: {
          basic:   { price: 500,  deliveryDays: 14, revisions: 2, features: ["Basic Chatbot", "GPT-3.5", "5 Doc Uploads"] },
          standard:{ price: 1500, deliveryDays: 30, revisions: 5, features: ["RAG Pipeline", "GPT-4", "Custom Knowledge Base"] },
          premium: { price: 3000, deliveryDays: 60, revisions: 10, features: ["Fine-tuned Model", "Analytics", "Multi-platform Deploy"] }
        }
      },
      {
        freelancer: carlos._id,
        title: "Data Science & Machine Learning Consulting",
        description: "End-to-end ML pipeline design, model training, evaluation, and deployment. Python, scikit-learn, TensorFlow, FastAPI.",
        category: "Data",
        tags: ["Machine Learning", "Python", "Data Science", "TensorFlow"],
        packages: {
          standard:{ price: 1000, deliveryDays: 21, revisions: 3, features: ["Model Training", "Evaluation Report", "Basic API"] },
          premium: { price: 2500, deliveryDays: 45, revisions: 5, features: ["Full Pipeline", "MLOps Setup", "Monitoring Dashboard"] }
        }
      },
    ];

    const createdGigs = await Gig.insertMany(gigs);
    console.log(`${createdGigs.length} Gigs Created.`);

    // ── Portfolio Works / Explore Posts ────────────────────────
    const works = [
      { freelancer: alex._id,    title: "E-Commerce Platform MVP",       description: "A fully functional e-commerce site built with React and Node.js, featuring Stripe payments, inventory management, and an admin dashboard.", caption: "Shipped in 6 weeks for a US-based client.", tags: ["Fullstack", "E-Commerce", "Portfolio"] },
      { freelancer: alex._id,    title: "SaaS Project Management Tool",  description: "A Jira-like project board with real-time collaboration powered by Socket.IO. Multi-workspace, role-based access control.", caption: "Used by 3 startups in private beta.", tags: ["SaaS", "Real-time", "Portfolio"] },
      { freelancer: sarah._id,   title: "Fintech App UI Concept",         description: "A glassmorphism-inspired mobile banking application design. Features biometric login, animated balance cards, and a spending insights screen.", caption: "Modern, translucent, and beautiful.", tags: ["Mobile", "Fintech", "Design"] },
      { freelancer: sarah._id,   title: "EdTech Platform Design System",  description: "A full component library and design system built in Figma for an online learning platform with 50k+ users.", caption: "Figma Community — 1,200+ duplicates.", tags: ["Design System", "EdTech", "Figma"] },
      { freelancer: michael._id, title: "Content Strategy for a VC Blog", description: "Developed a 3-month content calendar and wrote all articles. Resulted in a 220% increase in organic traffic within 90 days.", caption: "SEO wins: #1 for 12 target keywords.", tags: ["SEO", "Strategy", "Content"] },
      { freelancer: michael._id, title: "B2B SaaS Website Copy Overhaul", description: "Rewrote the entire website copy for a B2B analytics startup, improving trial sign-up conversion from 1.2% to 4.8%.", caption: "A conversion-focused copywriting case study.", tags: ["Copywriting", "SaaS", "Conversion"] },
      { freelancer: priya._id,   title: "Fitness Tracker App (React Native)", description: "A cross-platform fitness app with GPS tracking, custom workout plans, and HealthKit/Google Fit integration.", caption: "4.8★ on App Store with 10k downloads.", tags: ["Mobile", "React Native", "Health"] },
      { freelancer: priya._id,   title: "Ride-Hailing App Prototype",    description: "A fully functional ride-hailing prototype with real-time map tracking, driver/rider roles, and Stripe payment flow.", caption: "Demo app built in a 48-hour hackathon.", tags: ["Mobile", "Maps", "Real-time"] },
      { freelancer: carlos._id,  title: "NLP Sentiment Analysis Pipeline", description: "Built a production sentiment analysis system for a social media monitoring client processing 50k tweets/day with 94% accuracy.", caption: "Deployed on AWS ECS with auto-scaling.", tags: ["NLP", "AI", "Production ML"] },
      { freelancer: carlos._id,  title: "Computer Vision Quality Control", description: "Designed a custom CNN to detect manufacturing defects in real-time, reducing QC failure rate by 35%.", caption: "Deployed on Raspberry Pi for edge inference.", tags: ["Computer Vision", "AI", "Manufacturing"] },
    ];

    await Work.insertMany(works);
    console.log(`${works.length} Portfolio Works Created.`);

    // ── Write credentials ─────────────────────────────────────
    const lines = users.map(u =>
      `Name:     ${u.name}\nEmail:    ${u.email}\nPassword: ${password}\nRole:     ${u.role}\n${"-".repeat(40)}`
    ).join("\n");
    fs.writeFileSync(path.join(__dirname, "../users.txt"), lines);
    console.log("Credentials written to server/users.txt");

    console.log("\n✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
