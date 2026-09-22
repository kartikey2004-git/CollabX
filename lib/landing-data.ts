import { Search, Sparkles, RefreshCw, Users, Layers } from "lucide-react";

export type Faq = {
  question: string;
  answer: string;
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

export const faqs: Faq[] = [
  {
    question: "Who writes what's in the archive?",
    answer:
      "Engineers who actually solved the problem. Every piece is written from real, first-hand experience, not summarized from someone else's post.",
  },
  {
    question: "How do I know it's worth reading?",
    answer:
      "Nothing joins the archive unread. Another engineer looks at every submission before it becomes part of the archive, so what you find here has already been vetted.",
  },
  {
    question: "What kind of problems does it cover?",
    answer:
      "Backend, distributed systems, infra, databases: the problems you hit at 2am and wish someone had already written down. Seven engineering categories in total.",
  },
  {
    question: "How is this different from a random blog?",
    answer:
      "A blog is one person's feed. This is a shared archive, organized so the answer you needed once is still findable months later, not just read once and forgotten.",
  },
  {
    question: "How do I contribute?",
    answer:
      "Sign up as a contributor and write. If you've solved something worth remembering, it belongs in the archive.",
  },
];

export const leftFeatures: Feature[] = [
  {
    title: "WRITTEN FROM EXPERIENCE",
    description:
      "Every article comes from an engineer who actually hit the problem, not a rewrite of someone else's write-up.",
    icon: Sparkles,
    accent: true,
  },
  {
    title: "CHECKED BEFORE IT COUNTS",
    description:
      "A second engineer reads every piece before it joins the archive, so what's here is worth your time.",
    icon: RefreshCw,
  },
  {
    title: "OPEN TO EVERY ENGINEER",
    description:
      "Anyone can contribute. The archive grows because engineers keep adding what they've learned.",
    icon: Users,
  },
];

export const rightFeatures: Feature[] = [
  {
    title: "BUILT TO BE FOUND AGAIN",
    description:
      "Organized by category, so the solution you needed once is still there when the next engineer needs it.",
    icon: Search,
  },
  {
    title: "ALWAYS GROWING",
    description:
      "Every new contribution adds to what the next engineer can lean on. The archive never stops growing.",
    icon: Layers,
  },
];
