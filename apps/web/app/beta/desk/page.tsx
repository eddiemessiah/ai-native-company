import { ownedWorkspace } from "@repo/gtm-cloud";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetaDesk } from "@/components/beta/desk";
import { betaCtx, deskData, sessionUser, workspaceList } from "@/lib/beta";

export const metadata: Metadata = {
  title: "Desk",
  robots: { index: false },
};

export default async function DeskPage(props: PageProps<"/beta/desk">) {
  const params = await props.searchParams;
  const user = await sessionUser().catch(() => null);
  if (!user) redirect("/beta");
  if (!user.workspaceIds.length) redirect("/beta/new");
  const ctx = betaCtx();
  if (ctx.cfg.missing.length) redirect("/beta");

  const asked = typeof params.ws === "string" ? params.ws : undefined;
  const ws = await ownedWorkspace(ctx, user.id, asked ?? user.workspaceIds.at(-1)!);
  if (!ws) redirect(asked ? "/beta/desk" : "/beta/new");

  const [data, workspaces] = await Promise.all([deskData(ws), workspaceList(user)]);
  const flash =
    params.connected === "x"
      ? { tone: "ok" as const, text: `X is connected${data.workspace.x ? ` as @${data.workspace.x.username}` : ""}. Approved X posts run there.` }
      : params.error === "x"
        ? { tone: "error" as const, text: "X didn't connect. Try again from Connections." }
        : null;

  return <BetaDesk key={ws.id} initial={data} workspaces={workspaces} canCreate={workspaces.length < 3} flash={flash} />;
}
