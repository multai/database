import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

async function requirePlayer(ctx: any, token: string) {
  const session = await ctx.db.query("playerSessions").withIndex("by_token", (q: any) => q.eq("token", token)).first();
  if (!session || session.expiresAt < Date.now()) throw new Error("Sessão inválida");
  return session.playerId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("plots").withIndex("by_status", (q) => q.eq("status", "active")).collect();
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    summary: v.string(),
    slug: v.string(),
    locationName: v.optional(v.string()),
    roleName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const playerId = await requirePlayer(ctx, args.token);
    const now = Date.now();
    const plotId = await ctx.db.insert("plots", {
      title: args.title,
      summary: args.summary,
      slug: args.slug,
      locationName: args.locationName,
      status: "active",
      createdBy: playerId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("plotParticipants", {
      plotId,
      playerId,
      roleName: args.roleName ?? "protagonist",
      joinedAt: now,
    });

    return plotId;
  },
});

export const join = mutation({
  args: { token: v.string(), plotId: v.id("plots"), roleName: v.string() },
  handler: async (ctx, args) => {
    const playerId = await requirePlayer(ctx, args.token);
    const existing = await ctx.db
      .query("plotParticipants")
      .withIndex("by_plot_player", (q) => q.eq("plotId", args.plotId).eq("playerId", playerId))
      .first();
    if (existing) return existing._id;

    return ctx.db.insert("plotParticipants", {
      plotId: args.plotId,
      playerId,
      roleName: args.roleName,
      joinedAt: Date.now(),
    });
  },
});
