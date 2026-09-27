/**
 * Example requests on the homepage demo, with the offer each must route to.
 * The first three show as buttons, so an agent example leads. With no model
 * keys the demo runs on the lexical heuristic, so `demo.test.ts` checks every
 * example against it.
 */
export const DEMO_EXAMPLES = [
  {
    message: "I need my agent to check a 402 payment request before it pays.",
    offer: "nova-check",
  },
  {
    message: "We run 3 restaurants in Lisbon and need a WhatsApp assistant to take orders before December.",
    offer: "agent-ready-website",
  },
  {
    message: "We're a fintech. Our AML alerts are piling up and the regulator's deadline is coming.",
    offer: "aml-alert-triage",
  },
  {
    message: "Our Celo project needs help with a grant application. The round closes this Friday.",
    offer: "grant-desk",
  },
  {
    message: "I want to learn to build AI agents and get a job as an AI engineer.",
    offer: "ai-study-group",
  },
  {
    message: "What does ChatGPT say about my fashion brand? Customers say it gets our prices wrong.",
    offer: "ai-visibility-audit",
  },
  {
    message: "We need receipts for every payment our agents make, for accounting.",
    offer: "nova-receipt",
  },
] as const satisfies readonly { message: string; offer: string }[];
