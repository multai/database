import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    email: v.string(),
    username: v.string(),
    passwordHash: v.optional(v.string()),
    authProvider: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        voiceEnabled: v.optional(v.boolean()),
        imageStyle: v.optional(v.string()),
        skipMode: v.optional(v.string()),
        theme: v.optional(v.string()),
      }),
    ),
    totalPlayTimeMinutes: v.optional(v.number()),
    charactersCreated: v.optional(v.number()),
    charactersDied: v.optional(v.number()),
    isOnline: v.boolean(),
    lastSeenAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  playerSessions: defineTable({
    playerId: v.id("players"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_player", ["playerId"]),

  plots: defineTable({
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    locationName: v.optional(v.string()),
    status: v.string(), // draft | active | archived
    createdBy: v.id("players"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  plotParticipants: defineTable({
    plotId: v.id("plots"),
    playerId: v.id("players"),
    roleName: v.string(),
    joinedAt: v.number(),
  })
    .index("by_plot", ["plotId"])
    .index("by_plot_player", ["plotId", "playerId"]),

  messages: defineTable({
    plotId: v.id("plots"),
    playerId: v.optional(v.id("players")),
    characterId: v.optional(v.id("characters")),
    targetType: v.string(),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    direction: v.string(), // sent | received | system
    content: v.string(),
    locationId: v.optional(v.string()),
    emotion: v.optional(v.string()),
    actions: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_plot", ["plotId"])
    .index("by_plot_time", ["plotId", "createdAt"])
    .index("by_character_time", ["characterId", "createdAt"]),

  // Existing tables kept for integration with entity runtime
  characters: defineTable({
    playerId: v.id("players"),
    name: v.string(),
    speciesId: v.string(),
    variant: v.optional(v.string()),
    currentLocationId: v.string(),
    currentLocationName: v.string(),
    currentPlanetName: v.optional(v.string()),
    status: v.string(),
    isInSafeZone: v.boolean(),
    health: v.optional(v.number()),
    energy: v.optional(v.number()),
    wealth: v.optional(v.number()),
    bornAt: v.number(),
    diedAt: v.optional(v.number()),
    causeOfDeath: v.optional(v.string()),
    lastActiveAt: v.number(),
    createdAt: v.number(),
    postgresId: v.string(),
  })
    .index("by_player", ["playerId"])
    .index("by_status", ["status"])
    .index("by_postgres", ["postgresId"]),

  sessions: defineTable({
    playerId: v.id("players"),
    characterId: v.id("characters"),
    connectionId: v.optional(v.string()),
    connectedAt: v.number(),
    lastActivityAt: v.number(),
    isActive: v.boolean(),
    currentView: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_character", ["characterId"])
    .index("by_active", ["isActive"]),

  notifications: defineTable({
    playerId: v.id("players"),
    characterId: v.optional(v.id("characters")),
    type: v.string(),
    title: v.string(),
    content: v.string(),
    actionType: v.optional(v.string()),
    actionData: v.optional(v.any()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_unread", ["playerId", "isRead"]),

  locationState: defineTable({
    locationId: v.string(),
    name: v.string(),
    description: v.string(),
    planetName: v.optional(v.string()),
    isSafeZone: v.boolean(),
    playerCharacterIds: v.array(v.string()),
    lastActivityAt: v.number(),
    updatedAt: v.number(),
  }).index("by_location", ["locationId"]),

  entityCache: defineTable({
    entityId: v.string(),
    name: v.string(),
    speciesName: v.string(),
    description: v.optional(v.string()),
    locationId: v.string(),
    status: v.string(),
    playerRelationships: v.optional(
      v.array(
        v.object({
          characterId: v.string(),
          relationship: v.string(),
          strength: v.number(),
        }),
      ),
    ),
    updatedAt: v.number(),
  })
    .index("by_entity", ["entityId"])
    .index("by_location", ["locationId"]),

  gameTime: defineTable({
    currentTick: v.number(),
    gameTimestamp: v.number(),
    realTimestamp: v.number(),
    tickRatio: v.number(),
    isPaused: v.boolean(),
    updatedAt: v.number(),
  }),
});
