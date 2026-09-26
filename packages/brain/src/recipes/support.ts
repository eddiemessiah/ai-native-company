import type { Brain } from "../brain";
import { Choice, Noul, Score } from "../questions";
import type { AnswersFor, State } from "../types";

/**
 * The cascade: one cheap typed decision decides which requests deserve a
 * generative model at all. Some branches never touch a model.
 */
export const ticketQuestions = {
  intent: Choice({
    instructions: "Primary intent of this support message",
    criteria: {
      order_status: "Asking where an existing order, transfer or payment is",
      billing: "Charges, invoices, refunds or duplicate payments",
      product_question: "Asking how a product or feature works",
      bug_report: "Something is broken or behaving wrongly",
      complaint: "Unhappy with the service and wants a resolution",
      other: "Anything else",
    },
  }),
  complexity: Score({
    instructions: "How complex this is to resolve",
    criteria: [
      "Simple lookup or standard procedure",
      "Requires judgment or several steps",
      "Unusual edge case that needs a person",
    ],
  }),
  frustration: Score({
    instructions: "How frustrated the customer appears",
    criteria: ["Calm, just stating facts", "Frustrated but civil", "Very angry, strong language"],
  }),
  refund_requested: Noul("The customer is explicitly asking for a refund"),
  has_repro: Noul("The customer describes the steps that led to the problem"),
};

export type TicketAnswers = AnswersFor<typeof ticketQuestions>;

export type TicketRoute =
  | { readonly kind: "code"; readonly handler: "lookup_order" }
  | { readonly kind: "llm"; readonly specialist: "billing" | "product" | "bugs" | "complaints" }
  | { readonly kind: "human"; readonly reason: string };

export function routeTicket(a: TicketAnswers): TicketRoute {
  const { intent, complexity, frustration } = a;
  if (intent.confidence < 0.5) return { kind: "human", reason: "unsure what the customer wants" };
  if (frustration.score > 1.5) return { kind: "human", reason: "customer is very angry" };
  switch (intent.choice) {
    case "order_status":
      return { kind: "code", handler: "lookup_order" };
    case "billing":
      // Refunds move money: a model may draft, a person approves.
      return a.refund_requested.noul >= 0.5
        ? { kind: "human", reason: "refund requested: prepare, then a person approves" }
        : { kind: "llm", specialist: "billing" };
    case "product_question":
      return { kind: "llm", specialist: "product" };
    case "bug_report":
      return complexity.score > 1 ? { kind: "human", reason: "complex bug" } : { kind: "llm", specialist: "bugs" };
    case "complaint":
      return complexity.score > 1 || complexity.confidence < 0.5
        ? { kind: "human", reason: "complex complaint" }
        : { kind: "llm", specialist: "complaints" };
    default:
      return { kind: "human", reason: "no category fits" };
  }
}

export async function triageTicket(brain: Brain, ticket: State) {
  const decision = await brain.decide("support.triage", ticket, ticketQuestions);
  return { decision, route: routeTicket(decision.answers) };
}
