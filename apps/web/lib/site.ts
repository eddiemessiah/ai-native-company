// A custom domain goes in NEXT_PUBLIC_SITE_URL. Without it, Vercel builds use the
// project's production domain, so llms.txt, the agent card and the sitemap are
// right from the first deploy.
const vercelDomain = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || (vercelDomain ? `https://${vercelDomain}` : "http://localhost:3000")
).replace(/\/$/, "");

export function absolute(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export const links = {
  booking: process.env.NEXT_PUBLIC_BOOKING_URL || "",
  paystack: process.env.NEXT_PUBLIC_PAYSTACK_URL || "",
  stripe: process.env.NEXT_PUBLIC_STRIPE_URL || "",
  academy: "https://edidiongumana-codes-ai.vercel.app/academy/",
} as const;

export const nav = [
  { href: "/directory", label: "Directory" },
  { href: "/study", label: "Study Group" },
  { href: "/agents", label: "For agents" },
  { href: "/research", label: "Research" },
  { href: "/company", label: "Company" },
] as const;
