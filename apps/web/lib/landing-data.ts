import {
  Rocket,
  Workflow,
  Pencil,
  Network,
  Sparkles,
  LucideIcon,
  RefreshCw,
  Flag,
  Search,
  Layers,
} from "lucide-react";

export type Step = {
  id: number;
  title: string;
  description: string;
  tags: string[];
  panelTitle: string;
  panelDescription: string;
  icon: React.ElementType;
};

export type Faq = {
  question: string;
  answer: string;
};

export type Path = {
  d: string;
  transform: string;
};

export type workflowStep = {
  title: string;
  description: string;
  icon: LucideIcon;
  border: string;
  bg: string;
};

export type ChartStep = {
  label: string;
  value: number;
  featured?: boolean;
};

export type Feature = {
  title: string;
  description: string;
  icon: React.ElementType;
  accent?: boolean;
};

export type NavItem = {
  heading: string;
  links: string[];
};

export const nav: NavItem[] = [
  {
    heading: "Company",
    links: ["About", "Careers"],
  },
  {
    heading: "Product",
    links: ["Indexing", "Pricing"],
  },
  {
    heading: "Resources",
    links: [
      "Docs",
      "Example Queries",
      "Is Groundwork right for my team?",
      "Blog",
    ],
  },
  {
    heading: "Socials",
    links: ["LinkedIn", "GitHub"],
  },
];

export const steps: Step[] = [
  {
    id: 1,
    title: "Draw",
    description:
      "Collaboratively design system architecture, database schemas, API flows, and execution diagrams on an infinite Excalidraw canvas in real time.",
    tags: ["Excalidraw", "DB Schema", "Architecture", "Live"],
    panelTitle: "Visual Architecture",
    panelDescription:
      "Brainstorm ideas, create HLDs, model databases, map execution flows, and discuss designs together with multiplayer editing, comments, and version history before writing a single line of code.",
    icon: Pencil,
  },
  {
    id: 2,
    title: "Convert",
    description:
      "Transform diagrams into structured engineering documents and editable Markdown with AI assistance.",
    tags: ["AI", "Markdown", "Documentation", "Review"],
    panelTitle: "AI Conversion",
    panelDescription:
      "Generate architecture.md, database.md, execution-flow.md, API documentation, requirements, and other project artifacts directly from your diagrams. Review, edit, and refine everything before publishing.",
    icon: Network,
  },
  {
    id: 3,
    title: "Index",
    description:
      "Choose exactly which documents, diagrams, and versions become part of your project's AI knowledge base.",
    tags: ["Index", "Versioning", "Approval", "Control"],
    panelTitle: "Explicit Indexing",
    panelDescription:
      "Nothing is indexed automatically. AI only learns from approved artifacts, ensuring drafts, unfinished ideas, and experimental changes never become part of the searchable project context.",
    icon: Workflow,
  },
  {
    id: 4,
    title: "Query",
    description:
      "Ask technical questions about your project and receive grounded answers backed by source citations.",
    tags: ["RAG", "Citations", "Search", "AI"],
    panelTitle: "Grounded Answers",
    panelDescription:
      "Search across indexed architecture, schemas, APIs, design decisions, and documentation. Every response links back to its original source, and when the information doesn't exist, the AI simply says it doesn't know.",
    icon: Rocket,
  },
];

export const faqs: Faq[] = [
  {
    question: "Why not use Excalidraw, Notion, and ChatGPT separately?",
    answer:
      "You can. But every handoff loses context, and a generic AI hallucinates the moment it hits your specific architecture. Groundwork keeps diagrams, schemas, docs, and AI answers in one workspace, indexed on your terms.",
  },
  {
    question: "How is this different from other AI documentation tools?",
    answer:
      "Most tools auto-index everything, burning tokens and filling context with outdated drafts. Groundwork only learns from artifacts you explicitly index, so answers stay accurate and cheap to run.",
  },
  {
    question: "What actually stops the AI from hallucinating?",
    answer:
      "The AI retrieves only from artifacts marked Indexed. If an answer isn't in your approved docs and diagrams, it says \"I don't know\" instead of guessing.",
  },
  {
    question: "Can I turn a whiteboard drawing into documentation?",
    answer:
      "Yes. Draw on the built-in Excalidraw canvas, click AI Refine & Convert to MD, then review and index the generated file before the AI can see it.",
  },
  {
    question: "Who gets the most value from Groundwork?",
    answer:
      "Systems architects, tech leads, and engineers who need one trustworthy source of truth for how their systems are actually built.",
  },
];

export const PATHS: Path[] = [
  {
    d: "M 0 0 L 0 404.609",
    transform: "translate(370 0)",
  },
  {
    d: "M 164 0 L 98.814 0 L 0 83.557 L 0 205",
    transform: "translate(400 110)",
  },
  {
    d: "M 0 0 L 56.317 0 C 93.572 34.834 114.632 53.417 155 84.826 L 155 206",
    transform: "translate(181.152 110)",
  },
  {
    d: "M 0 0 L 295 0 L 295 81",
    transform: "translate(0 221)",
  },
  {
    d: "M 296 0 L 0 0 L 0 79",
    transform: "translate(438 221)",
  },
] as const;

export const workflowsteps: workflowStep[] = [
  {
    title: "Draw",
    description:
      "Sketch system architecture and DB schemas visually, in real time.",
    icon: Pencil,
    border: "border-sky-300",
    bg: "from-sky-100 via-slate-50 to-sky-50",
  },
  {
    title: "Convert",
    description: "AI turns diagrams into structured, reviewable Markdown.",
    icon: Sparkles,
    border: "border-orange-300",
    bg: "from-orange-100 via-rose-50 to-amber-50",
  },
  {
    title: "Index",
    description: "Explicitly approve exactly what the AI is allowed to learn.",
    icon: Workflow,
    border: "border-cyan-300",
    bg: "from-cyan-100 via-sky-50 to-indigo-50",
  },
  {
    title: "Query",
    description:
      "Ask questions and get cited answers, or an honest 'I don't know.'",
    icon: Rocket,
    border: "border-lime-300",
    bg: "from-yellow-100 via-green-50 to-lime-100",
  },
];

export const chartData: ChartStep[] = [
  {
    label: "Diagrams",
    value: 20,
  },
  {
    label: "Schemas",
    value: 45,
  },
  {
    label: "Docs",
    value: 70,
  },
  {
    label: "Indexed & Cited",
    value: 100,
    featured: true,
  },
];

export const leftFeatures: Feature[] = [
  {
    title: "DRAW ARCHITECTURE",
    description:
      "Sketch Excalidraw diagrams and DB schemas together in real time, before writing a single doc.",
    icon: Sparkles,
    accent: true,
  },
  {
    title: "AI CONVERSION",
    description:
      "Convert diagrams into structured Markdown with one click, then review before it counts.",
    icon: RefreshCw,
  },
  {
    title: "EXPLICIT INDEXING",
    description:
      "Nothing enters the AI's context until you click Index — no auto-sync, no drafts.",
    icon: Flag,
  },
];

export const rightFeatures: Feature[] = [
  {
    title: "GROUNDED ANSWERS",
    description:
      "Query strictly against indexed artifacts. If it isn't there, the AI says \"I don't know.\"",
    icon: Search,
  },
  {
    title: "CITED RESPONSES",
    description:
      "Every answer includes inline citations back to the exact source file — click to verify.",
    icon: Layers,
  },
];
