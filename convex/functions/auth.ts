import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

function hashPassword(password: string) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}_${password.length}`;
}

function createToken() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

async function getPlayerByToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("playerSessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return null;
  return ctx.db.get(session.playerId);
}

export const signup = mutation({
  args: { email: v.string(), username: v.string(), password: v.string(), displayName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existingEmail = await ctx.db.query("players").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (existingEmail) throw new Error("Email já cadastrado");

    const existingUser = await ctx.db.query("players").withIndex("by_username", (q) => q.eq("username", args.username)).first();
    if (existingUser) throw new Error("Username já existe");

    const now = Date.now();
    const playerId = await ctx.db.insert("players", {
      email: args.email,
      username: args.username,
      displayName: args.displayName,
      passwordHash: hashPassword(args.password),
      isOnline: true,
      lastSeenAt: now,
      createdAt: now,
    });

    const token = createToken();
    await ctx.db.insert("playerSessions", {
      playerId,
      token,
      createdAt: now,
      expiresAt: now + 1000 * 60 * 60 * 24 * 30,
    });

    return { token, playerId };
  },
});

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db.query("players").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (!player || player.passwordHash !== hashPassword(args.password)) {
      throw new Error("Credenciais inválidas");
    }

    const now = Date.now();
    const token = createToken();

    await ctx.db.patch(player._id, { isOnline: true, lastSeenAt: now });
    await ctx.db.insert("playerSessions", {
      playerId: player._id,
      token,
      createdAt: now,
      expiresAt: now + 1000 * 60 * 60 * 24 * 30,
    });

    return { token, playerId: player._id };
  },
});

export const me = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const player = await getPlayerByToken(ctx, args.token);
    if (!player) return null;
    return { id: player._id, email: player.email, username: player.username, displayName: player.displayName };
  },
});
