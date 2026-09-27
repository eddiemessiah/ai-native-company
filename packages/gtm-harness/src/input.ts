import { z } from "zod";

/** What a founder tells the harness. Browser-safe: the form and the API share it. */

export const CHANNELS = ["x", "telegram", "whatsapp", "email", "linkedin", "discord", "farcaster", "communities", "events"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Readonly<Record<Channel, string>> = {
  x: "X",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  email: "Email",
  linkedin: "LinkedIn",
  discord: "Discord",
  farcaster: "Farcaster",
  communities: "Online communities",
  events: "Events and meetups",
};

export const STAGES = ["idea", "building", "live", "revenue"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Readonly<Record<Stage, string>> = {
  idea: "Idea",
  building: "Building",
  live: "Live, no revenue",
  revenue: "Making money",
};

export const gtmInputSchema = z.object({
  product: z.string().trim().min(2).max(80),
  pitch: z.string().trim().min(10).max(600),
  url: z.string().trim().url().max(300).optional().or(z.literal("")),
  audience: z.string().trim().min(5).max(400),
  stage: z.enum(STAGES),
  goal: z.string().trim().min(5).max(200),
  channels: z.array(z.enum(CHANNELS)).min(1).max(CHANNELS.length),
  regions: z.string().trim().max(120).optional().or(z.literal("")),
  /** Built on Celo, MiniPay or another chain: adds ecosystem channels. */
  onchain: z.boolean().optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
});

export type GtmInput = z.infer<typeof gtmInputSchema>;
