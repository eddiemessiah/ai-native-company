/**
 * The AI Study Group, v2: the academy's tracks (T1–T4 from the existing
 * academy) plus two new tracks that feed the firm, and the chapter plan for
 * going global. Chapter status is honest: "active" means events have already
 * run there; "forming" means we are looking for a lead.
 */

export interface Track {
  readonly code: string;
  readonly title: string;
  readonly role: string;
  readonly status: "open" | "soon";
  readonly blurb: string;
  readonly topics: readonly string[];
}

export const tracks: readonly Track[] = [
  {
    code: "T1",
    title: "Agentic AI engineer roadmap",
    role: "Agentic AI Engineer",
    status: "open",
    blurb: "From calling a model to agents that use tools, keep memory and can be tested.",
    topics: ["LLMs", "prompts", "tools", "MCP", "agents", "evals"],
  },
  {
    code: "T2",
    title: "Ethical AI in Africa",
    role: "Responsible AI Practitioner",
    status: "open",
    blurb: "Build, buy and launch AI that is fair, lawful and safe, with the continent's laws and languages in view.",
    topics: ["bias", "data protection", "African languages", "AI policy", "safety"],
  },
  {
    code: "T3",
    title: "Inference engineering basics",
    role: "Inference Engineer",
    status: "soon",
    blurb: "What happens between a prompt and a token, and how to make it fast and cheap for real users.",
    topics: ["tokens", "KV cache", "batching", "quantisation", "serving"],
  },
  {
    code: "T4",
    title: "Onchain agents on Celo",
    role: "Onchain Agent Engineer",
    status: "soon",
    blurb: "Agents that hold and move value: wallets, spend limits and pay-per-call on Celo.",
    topics: ["stablecoins", "MiniPay", "agent wallets", "x402", "ERC-8004"],
  },
  {
    code: "T5",
    title: "Forward-deployed AI engineering",
    role: "Forward-Deployed Engineer",
    status: "soon",
    blurb: "Sit with a customer, find the workflow, ship the agent, prove it with evals. The job Shonin does every week.",
    topics: ["discovery", "evals", "decision layers", "approvals", "handover"],
  },
  {
    code: "T6",
    title: "AI-native services for founders",
    role: "AI-Native Founder",
    status: "soon",
    blurb: "Pick a unit, write the rulebook, build the review layer, price against the human. Start a service that runs like software.",
    topics: ["unit economics", "rulebooks", "review layers", "pricing", "distribution"],
  },
];

export interface Chapter {
  readonly city: string;
  readonly country: string;
  readonly lat: number;
  readonly lon: number;
  readonly status: "active" | "forming";
  readonly note: string;
}

export const chapters: readonly Chapter[] = [
  { city: "Lagos", country: "Nigeria", lat: 6.52, lon: 3.38, status: "active", note: "Home chapter" },
  { city: "Enugu", country: "Nigeria", lat: 6.44, lon: 7.5, status: "active", note: "Tech Fest and workshop city" },
  { city: "Abakaliki", country: "Nigeria", lat: 6.32, lon: 8.11, status: "active", note: "Three developer workshops in 2025" },
  { city: "Makurdi", country: "Nigeria", lat: 7.73, lon: 8.54, status: "active", note: "Workshops and activations in 2025" },
  { city: "Jos", country: "Nigeria", lat: 9.9, lon: 8.86, status: "active", note: "Build Day with Blockfuse Labs, 2026" },
  { city: "Port Harcourt", country: "Nigeria", lat: 4.82, lon: 7.03, status: "forming", note: "Web3phc community" },
  { city: "Abuja", country: "Nigeria", lat: 9.08, lon: 7.4, status: "forming", note: "Policy and government track" },
  { city: "Accra", country: "Ghana", lat: 5.6, lon: -0.19, status: "forming", note: "Pan-African AI Summit city" },
  { city: "Nairobi", country: "Kenya", lat: -1.29, lon: 36.82, status: "forming", note: "East Africa hub" },
  { city: "Kigali", country: "Rwanda", lat: -1.94, lon: 30.06, status: "forming", note: "Policy and research hub" },
  { city: "Kampala", country: "Uganda", lat: 0.35, lon: 32.58, status: "forming", note: "Makerere AI community" },
  { city: "Johannesburg", country: "South Africa", lat: -26.2, lon: 28.05, status: "forming", note: "Southern Africa hub" },
  { city: "Cairo", country: "Egypt", lat: 30.04, lon: 31.24, status: "forming", note: "North Africa hub" },
  { city: "London", country: "United Kingdom", lat: 51.51, lon: -0.13, status: "forming", note: "Diaspora chapter" },
  { city: "Toronto", country: "Canada", lat: 43.65, lon: -79.38, status: "forming", note: "Diaspora chapter" },
  { city: "Houston", country: "United States", lat: 29.76, lon: -95.37, status: "forming", note: "Diaspora chapter" },
];
