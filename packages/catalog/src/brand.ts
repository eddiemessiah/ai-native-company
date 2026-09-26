import type { Proof } from "./types";

/**
 * Brand in one place. "Fundi" is the working name (see company/brand/names.md);
 * renaming the company is a change to this file.
 */
export const brand = {
  name: "Fundi",
  tagline: "The work, done.",
  description:
    "Fundi is an AI-native firm. Agents do the work, people own the outcome. We sell finished work, not hours or seats: audits, agents, grant applications and company brains, each priced per unit against what the human alternative costs.",
  story:
    "In Kiswahili, a fundi is the master craftsperson who does the job for you. In isiZulu, umfundi is a learner. Fundi is both: a firm that ships work, and a school that trains the people who ship it.",
  thesis: [
    "LLMs write: briefs, drafts, code, explanations.",
    "A System One model decides: route, score, approve, escalate.",
    "Code executes, and owns anything exact or irreversible.",
  ],
  founder: {
    name: "Edidiong Umana",
    alias: "Defi Messiah",
    role: "Founder",
    based: "Lagos, Nigeria",
    x: "https://x.com/defimessiah1",
    github: "https://github.com/eddiemessiah",
    telegram: "https://t.me/defimessiah0x",
  },
  agent: {
    name: "Fundi One",
    role: "Agent co-founder",
    description:
      "The firm's decision brain: every intake, route, score and approval runs through it and is logged with its confidence. It prepares; a person approves anything that moves money or can't be undone.",
  },
  contact: {
    telegram: "https://t.me/defimessiah0x",
    x: "https://x.com/defimessiah1",
  },
  locale: { home: "Lagos", timezone: "Africa/Lagos", markets: ["Nigeria", "Ghana", "Kenya", "Global"] },
} as const;

/** Verifiable work that already exists. Every item has a public trail. */
export const proofs: readonly Proof[] = [
  {
    label: "Omni402 on Celo mainnet",
    detail: "x402 gateway + MCP server; gasless USDC settlement, block 74,479,633",
    href: "https://github.com/eddiemessiah/omni402",
  },
  {
    label: "ERC-8004 agent #9765",
    detail: "An onchain agent identity on Celo",
    href: "https://8004scan.io/agents/celo/9765",
  },
  {
    label: "22 projects into Proof of Ship",
    detail: "Onboarded to Celo's builder program in two months (Apr–May 2026)",
  },
  {
    label: "25+ events, 11+ workshops",
    detail: "Across Nigeria since 2022, incl. Café Cursor Lagos (300+) and Enugu Tech Fest (15,000)",
  },
  {
    label: "AI Study Group",
    detail: "Free academy: agentic AI engineering and ethical AI in Africa, with soulbound certificates on Celo",
  },
];
