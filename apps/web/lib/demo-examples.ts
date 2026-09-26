/**
 * Example requests on the homepage demo, with the offer each must route to.
 * With no model keys the demo runs on the lexical heuristic, so `demo.test.ts`
 * checks every example against it.
 */
export const DEMO_EXAMPLES = [
  {
    message: "We run 3 restaurants in Lekki and need a WhatsApp assistant to take orders before December.",
    offer: "agent-ready-website",
  },
  {
    message: "Our Celo project needs help with a grant application. The round closes this Friday.",
    offer: "grant-desk",
  },
  {
    message: "We're a fintech. Our AML alerts are piling up and the CBN deadline is coming.",
    offer: "aml-alert-triage",
  },
  {
    message: "I want to learn to build AI agents and get a job as an AI engineer.",
    offer: "ai-study-group",
  },
  {
    message: "What does ChatGPT say about my fashion brand? Customers say it gets our prices wrong.",
    offer: "ai-visibility-audit",
  },
] as const satisfies readonly { message: string; offer: string }[];
