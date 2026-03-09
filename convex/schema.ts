// Multi-AI Convex Schema
// Player-facing real-time data

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // PLAYERS (Human accounts)
  // ============================================
  players: defineTable({
    // Auth
    email: v.string(),
    username: v.string(),
    passwordHash: v.optional(v.string()), // If using email/password
    authProvider: v.optional(v.string()), // oauth provider if used
    
    // Profile
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    
    // Preferences
    preferences: v.optional(v.object({
      voiceEnabled: v.optional(v.boolean()),
      imageStyle: v.optional(v.string()),
      skipMode: v.optional(v.string()), // full, highlights, skip
      theme: v.optional(v.string()),
    })),
    
    // Stats
    totalPlayTimeMinutes: v.optional(v.number()),
    charactersCreated: v.optional(v.number()),
    charactersDied: v.optional(v.number()),
    
    // Status
    isOnline: v.boolean(),
    lastSeenAt: v.number(), // timestamp
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_online", ["isOnline"]),

  // ============================================
  // CHARACTERS (Player-controlled entities)
  // ============================================
  characters: defineTable({
    playerId: v.id("players"),
    
    // Identity
    name: v.string(),
    speciesId: v.string(), // Reference to PostgreSQL species
    variant: v.optional(v.string()), // baseline, augmented, adapted, hybrid, uploaded
    
    // Location (synced from PostgreSQL)
    currentLocationId: v.string(),
    currentLocationName: v.string(),
    currentPlanetName: v.optional(v.string()),
    
    // Status
    status: v.string(), // alive, dead, resting, vulnerable
    isInSafeZone: v.boolean(),
    
    // Stats (synced from PostgreSQL)
    health: v.optional(v.number()),
    energy: v.optional(v.number()),
    wealth: v.optional(v.number()),
    
    // Timestamps
    bornAt: v.number(),
    diedAt: v.optional(v.number()),
    causeOfDeath: v.optional(v.string()),
    lastActiveAt: v.number(),
    createdAt: v.number(),
    
    // PostgreSQL sync
    postgresId: v.string(), // UUID from PostgreSQL creatures table
  })
    .index("by_player", ["playerId"])
    .index("by_status", ["status"])
    .index("by_postgres", ["postgresId"]),

  // ============================================
  // SESSIONS (Active game sessions)
  // ============================================
  sessions: defineTable({
    playerId: v.id("players"),
    characterId: v.id("characters"),
    
    // Connection
    connectionId: v.optional(v.string()), // WebSocket connection ID
    connectedAt: v.number(),
    lastActivityAt: v.number(),
    
    // State
    isActive: v.boolean(),
    currentView: v.optional(v.string()), // location, inventory, map, etc.
  })
    .index("by_player", ["playerId"])
    .index("by_character", ["characterId"])
    .index("by_active", ["isActive"]),

  // ============================================
  // MESSAGES (Chat/conversation history)
  // ============================================
  messages: defineTable({
    // Who
    characterId: v.id("characters"),
    targetType: v.string(), // entity, player, system
    targetId: v.optional(v.string()), // Entity ID or Character ID
    targetName: v.optional(v.string()),
    
    // What
    direction: v.string(), // sent, received
    content: v.string(),
    
    // Context
    locationId: v.string(),
    
    // Metadata
    emotion: v.optional(v.string()), // For NPC responses
    actions: v.optional(v.array(v.string())), // Actions taken during message
    
    createdAt: v.number(),
  })
    .index("by_character", ["characterId"])
    .index("by_character_time", ["characterId", "createdAt"])
    .index("by_location", ["locationId"]),

  // ============================================
  // NOTIFICATIONS (Player alerts)
  // ============================================
  notifications: defineTable({
    playerId: v.id("players"),
    characterId: v.optional(v.id("characters")),
    
    type: v.string(), // message, event, danger, system
    title: v.string(),
    content: v.string(),
    
    // Link to action
    actionType: v.optional(v.string()),
    actionData: v.optional(v.any()),
    
    // Status
    isRead: v.boolean(),
    
    createdAt: v.number(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_unread", ["playerId", "isRead"]),

  // ============================================
  // LOCATION STATE (Real-time location info)
  // ============================================
  locationState: defineTable({
    locationId: v.string(), // PostgreSQL location ID
    
    // Cached info
    name: v.string(),
    description: v.string(),
    planetName: v.optional(v.string()),
    isSafeZone: v.boolean(),
    
    // Who's here (real-time)
    playerCharacterIds: v.array(v.string()), // Character IDs currently here
    
    // Recent activity
    lastActivityAt: v.number(),
    
    updatedAt: v.number(),
  })
    .index("by_location", ["locationId"]),

  // ============================================
  // ENTITY CACHE (NPC info for display)
  // ============================================
  entityCache: defineTable({
    entityId: v.string(), // PostgreSQL creature ID
    
    // Display info
    name: v.string(),
    speciesName: v.string(),
    description: v.optional(v.string()),
    
    // Current state
    locationId: v.string(),
    status: v.string(),
    
    // Relationship to players (if any)
    playerRelationships: v.optional(v.array(v.object({
      characterId: v.string(),
      relationship: v.string(),
      strength: v.number(),
    }))),
    
    updatedAt: v.number(),
  })
    .index("by_entity", ["entityId"])
    .index("by_location", ["locationId"]),

  // ============================================
  // TIME STATE (Game time sync)
  // ============================================
  gameTime: defineTable({
    currentTick: v.number(),
    gameTimestamp: v.number(), // Game world timestamp
    realTimestamp: v.number(), // Real world timestamp
    tickRatio: v.number(), // Game hours per real minute
    isPaused: v.boolean(),
    updatedAt: v.number(),
  }),
});
