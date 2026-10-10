import { generateStructured, routeModel, type ModelRoute } from "@repo/gtm-harness";
import { z } from "zod";
import type { Channel, Workspace } from "./types";

/**
 * The LLM writes: one draft from a request in plain words ("a post for Friday's demo", "a
 * WhatsApp to Ada about the pilot"). It picks the channel from a fixed list and writes the text;
 * code checks it, the reviewer judges it, and the founder approves it like any other draft.
 */

export type Drafter = (ws: Workspace, request: string, opts?: { channel?: Channel; context?: string }) => Promise<{ channel: Channel; text: string; to?: string }>;

const DRAFT_CHANNELS = ["x", "telegram_post", "slack", "whatsapp", "email", "telegram_dm", "linkedin"] as const;
const schema = z.object({ channel: z.enum(DRAFT_CHANNELS), text: z.string().min(1).max(4000), to: z.string().max(200) });

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["channel", "text", "to"],
  properties: {
    channel: { type: "string", enum: [...DRAFT_CHANNELS] },
    text: { type: "string" },
    to: { type: "string", description: "For a message to a person: their phone number, email or @handle when the request names it. Otherwise an empty string" },
  },
} as const;

const SYSTEM = `You draft one go-to-market message for a founder, in their voice, from a short request. You only draft: the founder approves every message, and messages to people are sent by the founder's own tap.

Rules:
- Plain, specific, short. Lead with a number, a name or a concrete detail from the request or the product facts. No hype words (revolutionary, game-changing, seamless, cutting-edge, unlock), no filler openers, no emoji walls, at most one call to action.
- Never invent a number, a customer, a quote or a result. If the request needs a fact you don't have, write [slot: what's missing] so code holds the draft until the founder fills it.
- X posts: 280 characters at most. Messages to people: under 90 words, one personal line, one small ask, no links unless the request asks for one.
- channel: x for a post on X; telegram_post for the founder's own Telegram channel or group; slack for an update to the founder's team; whatsapp, email, telegram_dm or linkedin for a message to one person.`;

export function drafterFromEnv(env: Record<string, string | undefined> = process.env, route: ModelRoute | null = routeModel(env)): Drafter | null {
  if (!route) return null;
  return async (ws, request, opts = {}) => {
    const facts = [
      `Product: ${ws.input.product}`,
      `Pitch: ${ws.input.pitch}`,
      `Audience: ${ws.input.audience}`,
      `Goal: ${ws.input.goal}`,
      ws.input.url ? `URL: ${ws.input.url}` : "",
      `Positioning: ${ws.plan.positioning.oneLiner}`,
      `Proof the founder can show: ${ws.plan.positioning.proofToShow.join("; ") || "none given"}`,
      opts.context ? `Context: ${opts.context}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const result = await generateStructured(route, {
      system: SYSTEM,
      prompt: `${facts}\n\nRequest: ${request.slice(0, 1000)}${opts.channel ? `\nChannel: ${opts.channel}` : ""}`,
      schema: JSON_SCHEMA as unknown as Record<string, unknown>,
      name: "draft",
      maxTokens: 1200,
      effort: "low",
      signal: AbortSignal.timeout(45_000),
    });
    const parsed = schema.parse(result.value);
    return { channel: opts.channel ?? parsed.channel, text: parsed.text, ...(parsed.to.trim() ? { to: parsed.to.trim() } : {}) };
  };
}
