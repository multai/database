import { mutation } from "../_generated/server";

export const seedMissingMerchant = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("plots")
      .withIndex("by_slug", (q) => q.eq("slug", "the-missing-merchant"))
      .first();

    if (existing) return existing._id;

    const player = await ctx.db.query("players").first();
    if (!player) throw new Error("Crie um player antes de rodar seed");

    return ctx.db.insert("plots", {
      slug: "the-missing-merchant",
      title: "The Missing Merchant",
      summary:
        "Aldric desapareceu após sair para as minas. Entre na história como um papel do enredo e investigue o mistério.",
      locationName: "The Rusty Anchor Tavern",
      status: "active",
      createdBy: player._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
