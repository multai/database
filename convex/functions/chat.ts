import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

async function requirePlayer(ctx: any, token: string) {
  const session = await ctx.db.query("playerSessions").withIndex("by_token", (q: any) => q.eq("token", token)).first();
  if (!session || session.expiresAt < Date.now()) throw new Error("Sessão inválida");
  return session.playerId;
}

export const listByPlot = query({
  args: { token: v.string(), plotId: v.id("plots") },
  handler: async (ctx, args) => {
    await requirePlayer(ctx, args.token);
    return ctx.db
      .query("messages")
      .withIndex("by_plot_time", (q) => q.eq("plotId", args.plotId))
      .collect();
  },
});

export const send = mutation({
  args: {
    token: v.string(),
    plotId: v.id("plots"),
    content: v.string(),
    direction: v.optional(v.string()),
    targetType: v.optional(v.string()),
    targetName: v.optional(v.string()),
    emotion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const playerId = await requirePlayer(ctx, args.token);
    const now = Date.now();

    const id = await ctx.db.insert("messages", {
      plotId: args.plotId,
      playerId,
      direction: args.direction ?? "sent",
      targetType: args.targetType ?? "entity",
      targetName: args.targetName,
      content: args.content,
      emotion: args.emotion,
      createdAt: now,
    });

    return id;
  },
});
