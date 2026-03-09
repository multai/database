# Multi-AI Database

Database schemas for the Multi-AI universe.

## Architecture

**Hybrid approach:**

| Database | Purpose | Use Case |
|----------|---------|----------|
| **PostgreSQL** | Entity engine, tick system | High-volume background processing |
| **Convex** | Player-facing, real-time | Live game state, subscriptions |

```
┌─────────────────────────────────────────────────────────┐
│                    MULTI-AI                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PLAYER CLIENT                                           │
│       │                                                  │
│       ▼                                                  │
│  ┌─────────────┐         ┌─────────────────────────┐    │
│  │   CONVEX    │◄───────►│     GAME SERVER         │    │
│  │             │         │                         │    │
│  │ • Players   │         │  ┌───────────────────┐  │    │
│  │ • Sessions  │         │  │    POSTGRESQL     │  │    │
│  │ • Chat      │         │  │                   │  │    │
│  │ • Real-time │         │  │ • Entities (AI)   │  │    │
│  │   state     │         │  │ • Tick data       │  │    │
│  │             │         │  │ • Memories        │  │    │
│  └─────────────┘         │  │ • World state     │  │    │
│                          │  │ • Heavy queries   │  │    │
│                          │  └───────────────────┘  │    │
│                          └─────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Structure

```
/database
├── /postgresql
│   ├── /migrations      # Incremental schema changes
│   ├── /seeds           # Initial data (species, worlds)
│   └── schema.sql       # Full schema reference
├── /convex
│   ├── /functions       # Convex functions
│   └── schema.ts        # Convex schema
└── README.md
```

## PostgreSQL Schema

See [postgresql/schema.sql](postgresql/schema.sql) for the complete schema.

### Core Tables

- `galaxies`, `sectors`, `star_systems`, `planets`, `locations` — World structure
- `species` — Species catalog
- `creatures` — AI-controlled entities
- `creature_memories` — Entity memory/context
- `creature_relationships` — Entity connections
- `plots`, `plot_participants` — Storyline system
- `world_events` — Historical record

## Convex Schema

See [convex/schema.ts](convex/schema.ts) for the complete schema.

### Core Tables

- `players` — Human accounts
- `characters` — Player-controlled characters
- `sessions` — Active game sessions
- `messages` — Chat/conversation history
- `notifications` — Player notifications

## Sync Strategy

Some data needs to exist in both databases:

1. **Character creation** → Write to Convex (player-facing) + PostgreSQL (for entity interactions)
2. **Entity interactions** → PostgreSQL processes, pushes updates to Convex
3. **Real-time events** → Convex notifies players instantly

## Getting Started

### PostgreSQL

```bash
# Start local PostgreSQL (Docker)
docker-compose up -d postgres

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### Convex

```bash
# Install Convex CLI
npm install -g convex

# Initialize (first time)
npx convex init

# Deploy
npx convex deploy
```

## Development

```bash
# Install dependencies
npm install

# Run both databases locally
npm run dev
```
