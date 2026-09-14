import {
  Pencil,
  Send,
  ShieldCheck,
  MessagesSquare,
  Sparkles,
  RefreshCw,
  Users,
  Layers,
  LucideIcon,
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

export type Feature = {
  title: string;
  description: string;
  icon: React.ElementType;
  accent?: boolean;
};

export type NavLink = {
  label: string;
  href: string;
};

export type NavItem = {
  heading: string;
  links: NavLink[];
};

export const nav: NavItem[] = [
  {
    heading: "Product",
    links: [
      { label: "Articles", href: "/articles" },
      { label: "Tech Reads", href: "/tech-reads" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
    ],
  },
];

// The four real stages a Submission moves through (schema.prisma's ContentStatus: DRAFT ->
// PENDING_REVIEW -> PUBLISHED/REJECTED), used by the scroll-driven process section.

export const steps: Step[] = [
  {
    id: 1,
    title: "Write",
    description:
      "Draft Articles and curated Tech Reads in a real Markdown editor with syntax highlighting, a formatting toolbar, and a live split preview.",
    tags: ["Markdown", "Mermaid", "Live Preview"],
    panelTitle: "Real Editor Feel",
    panelDescription:
      "Bold, headings, lists, and tables from a toolbar — or just type Markdown directly with syntax highlighting as you go. Diagrams in ```mermaid fences render live, right next to what you're writing.",
    icon: Pencil,
  },
  {
    id: 2,
    title: "Submit",
    description:
      "Send a draft for review — nothing on CollabX gets published without a human editorial pass.",
    tags: ["Draft", "Pending Review"],
    panelTitle: "One Draft At A Time",
    panelDescription:
      "Only one draft or pending submission can be in flight per Article or Tech Read, so it's always unambiguous which version is actually being worked on.",
    icon: Send,
  },
  {
    id: 3,
    title: "Review",
    description:
      "An admin reads every pending submission, can fix a typo or heading directly, then publishes or rejects it with a reason.",
    tags: ["Admin", "Edit", "Publish or Reject"],
    panelTitle: "A Real Editorial Gate",
    panelDescription:
      "Publish and reject both run as a single transaction, so a piece is never left published-but-stale. Reject one, and the reason travels back to the contributor, who resubmits as the next version.",
    icon: ShieldCheck,
  },
  {
    id: 4,
    title: "Discover",
    description:
      "Published Articles and Tech Reads are organized by category, easy to navigate, and open for discussion.",
    tags: ["Categories", "Comments"],
    panelTitle: "Built To Be Read",
    panelDescription:
      "Seven engineering categories from Backend to Distributed Systems, a scroll-spy table of contents on every article, and threaded comments on everything that's published.",
    icon: MessagesSquare,
  },
];

export const faqs: Faq[] = [
  {
    question: "Who can publish on CollabX?",
    answer:
      "Anyone can read. A Contributor can write and submit Articles or Tech Reads. Only an Admin can publish or reject a submission — publishing is never a self-serve action.",
  },
  {
    question: "What happens when a submission gets rejected?",
    answer:
      "The rejection reason travels back to the contributor. A rejected submission is never edited in place — the next fix is a brand-new version, so the review history always stays intact.",
  },
  {
    question: "Can I use Mermaid diagrams in an Article?",
    answer:
      "Yes. Drop a ```mermaid fence anywhere in your Markdown and it renders as an actual diagram, both in the live editor preview and on the published page — no separate diagramming tool needed.",
  },
  {
    question: "What's the difference between an Article and a Tech Read?",
    answer:
      "An Article is an original write-up you author yourself. A Tech Read curates an external resource — a blog post, talk, or paper — with your own summary and source attribution.",
  },
  {
    question: "Can an admin fix a typo without rejecting the whole submission?",
    answer:
      "Yes. While a submission is a draft or pending review, an admin (or the original contributor) can edit its title, summary, or content directly, instead of bouncing it back for a full resubmission.",
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
    title: "Write",
    description: "Draft in Markdown with live Mermaid previews and a formatting toolbar.",
    icon: Pencil,
    border: "border-sky-300",
    bg: "from-sky-100 via-slate-50 to-sky-50",
  },
  {
    title: "Submit",
    description: "Send it for review — one active draft per Article or Tech Read at a time.",
    icon: Send,
    border: "border-orange-300",
    bg: "from-orange-100 via-rose-50 to-amber-50",
  },
  {
    title: "Review",
    description: "An admin edits, publishes, or rejects with a reason — no silent drops.",
    icon: ShieldCheck,
    border: "border-cyan-300",
    bg: "from-cyan-100 via-sky-50 to-indigo-50",
  },
  {
    title: "Discover",
    description: "Readers browse by category, follow the table of contents, and join the discussion.",
    icon: MessagesSquare,
    border: "border-lime-300",
    bg: "from-yellow-100 via-green-50 to-lime-100",
  },
];

export const leftFeatures: Feature[] = [
  {
    title: "MARKDOWN + MERMAID",
    description:
      "Write in a real Markdown editor with syntax highlighting and a live preview — diagrams render straight from ```mermaid fences.",
    icon: Sparkles,
    accent: true,
  },
  {
    title: "VERSIONED SUBMISSIONS",
    description:
      "Every edit after a rejection is a new version — nothing is silently overwritten, and the history is never lost.",
    icon: RefreshCw,
  },
  {
    title: "ROLE-BASED ACCESS",
    description: "Admins moderate and publish, Contributors write and submit, Readers browse and comment.",
    icon: Users,
  },
];

export const rightFeatures: Feature[] = [
  {
    title: "THREADED COMMENTS",
    description: "Readers discuss published Articles and Tech Reads directly, with admin moderation when needed.",
    icon: MessagesSquare,
  },
  {
    title: "FULL VERSION HISTORY",
    description:
      "Every draft, rejection, and published version of a piece stays on record — nothing disappears when it's edited.",
    icon: Layers,
  },
];
