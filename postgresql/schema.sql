-- Multi-AI PostgreSQL Schema
-- Entity engine and world state (high-volume processing)

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE creature_status AS ENUM (
  'alive', 'dead', 'missing', 'imprisoned', 'hibernating', 'resting', 'vulnerable'
);

CREATE TYPE drive_type AS ENUM (
  'family', 'wealth', 'freedom', 'power', 'knowledge', 'survival', 'revenge', 'love'
);

CREATE TYPE relationship_type AS ENUM (
  'family', 'friend', 'enemy', 'rival', 'lover', 
  'employer', 'employee', 'ally', 'acquaintance', 'stranger'
);

CREATE TYPE plot_scale AS ENUM (
  'galactic', 'planetary', 'regional', 'local', 'personal'
);

CREATE TYPE plot_status AS ENUM (
  'dormant', 'active', 'climax', 'resolved', 'failed'
);

-- ============================================
-- WORLD STRUCTURE
-- ============================================

CREATE TABLE galaxies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT, -- spiral, elliptical, irregular, dwarf
  technology_level_min INT DEFAULT 0,
  technology_level_max INT DEFAULT 7,
  contact_status TEXT DEFAULT 'isolated',
  description TEXT,
  player_start_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  galaxy_id UUID REFERENCES galaxies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT, -- core, arm, halo, fringe
  controlling_faction_id UUID,
  stability TEXT DEFAULT 'stable', -- stable, contested, lawless
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE star_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  coordinates POINT,
  star_type TEXT,
  technology_level INT,
  discovery_status TEXT DEFAULT 'charted', -- charted, explored, unknown
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE planets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_id UUID REFERENCES star_systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- terrestrial, gas_giant, ice, desert, ocean
  environment JSONB, -- { climate, gravity, atmosphere, etc. }
  population_estimate TEXT,
  controlling_faction_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planet_id UUID REFERENCES planets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- city, wilderness, dungeon, spaceport, station, etc.
  is_safe_zone BOOLEAN DEFAULT false,
  description TEXT,
  properties JSONB, -- { danger_level, resources, population, etc. }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE location_connections (
  from_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  to_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  travel_method TEXT, -- walk, fly, teleport, ship
  travel_time_minutes INT,
  bidirectional BOOLEAN DEFAULT true,
  PRIMARY KEY (from_location_id, to_location_id)
);

-- ============================================
-- SPECIES & FACTIONS
-- ============================================

CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  homeworld_id UUID REFERENCES planets(id),
  physical_description TEXT,
  culture TEXT,
  common_drives drive_type[],
  traits JSONB, -- { telepathic, pack_mentality, etc. }
  lifespan_years INT,
  language TEXT,
  base_personality_prompt TEXT, -- LLM system prompt for this species
  playable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE factions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT, -- government, corporation, guild, religion, criminal
  description TEXT,
  goals JSONB,
  headquarters_location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE religions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT, -- monotheistic, polytheistic, philosophical, tech_religion
  beliefs JSONB,
  practices JSONB,
  influence_modifiers JSONB, -- how it affects entity attributes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATURES (AI Entities)
-- ============================================

CREATE TABLE creatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  species_id UUID REFERENCES species(id),
  birth_planet_id UUID REFERENCES planets(id),
  current_location_id UUID REFERENCES locations(id),
  
  -- AI Personality
  drive drive_type NOT NULL,
  personality_traits JSONB, -- { brave: 0.8, greedy: 0.3, kind: 0.6 }
  values JSONB, -- { justice, loyalty, ambition, compassion, tradition }
  backstory TEXT,
  system_prompt TEXT, -- Full LLM system prompt
  
  -- State
  status creature_status DEFAULT 'alive',
  inventory JSONB DEFAULT '[]',
  stats JSONB, -- { health, energy, wealth, reputation }
  skills JSONB, -- { combat, diplomacy, stealth, technology }
  
  -- Affiliations
  faction_id UUID REFERENCES factions(id),
  religion_id UUID REFERENCES religions(id),
  social_class TEXT, -- elite, professional, working, outcast
  
  -- Player link (null for NPCs)
  player_id TEXT, -- Convex player ID (if player-controlled)
  player_online BOOLEAN DEFAULT false,
  
  -- Timestamps
  born_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  last_tick_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_creatures_location ON creatures(current_location_id);
CREATE INDEX idx_creatures_species ON creatures(species_id);
CREATE INDEX idx_creatures_status ON creatures(status) WHERE status = 'alive';
CREATE INDEX idx_creatures_player ON creatures(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX idx_creatures_tick ON creatures(last_tick_at) WHERE status = 'alive';

-- ============================================
-- CREATURE MEMORY (AI Context)
-- ============================================

CREATE TABLE creature_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creature_id UUID REFERENCES creatures(id) ON DELETE CASCADE,
  memory_type TEXT, -- event, conversation, knowledge, emotion
  content TEXT NOT NULL,
  importance FLOAT DEFAULT 0.5, -- 0-1, used for memory pruning
  related_creature_id UUID REFERENCES creatures(id),
  location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memories_creature ON creature_memories(creature_id);
CREATE INDEX idx_memories_importance ON creature_memories(creature_id, importance DESC);
CREATE INDEX idx_memories_recent ON creature_memories(creature_id, created_at DESC);

-- ============================================
-- RELATIONSHIPS
-- ============================================

CREATE TABLE creature_relationships (
  creature_id UUID REFERENCES creatures(id) ON DELETE CASCADE,
  related_id UUID REFERENCES creatures(id) ON DELETE CASCADE,
  relationship relationship_type NOT NULL,
  strength FLOAT DEFAULT 0.5, -- 0-1
  notes TEXT,
  since TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (creature_id, related_id)
);

CREATE INDEX idx_relationships_creature ON creature_relationships(creature_id);

-- ============================================
-- PLOTS & STORYLINES
-- ============================================

CREATE TABLE plots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT, -- war, revolution, heist, quest, bureaucratic, romance
  scale plot_scale NOT NULL,
  status plot_status DEFAULT 'dormant',
  
  summary TEXT,
  current_phase INT DEFAULT 1,
  phases JSONB, -- [{ phase: 1, name: "...", events: [...] }, ...]
  
  location_id UUID REFERENCES locations(id),
  started_at TIMESTAMPTZ,
  estimated_duration_hours INT,
  
  consequences JSONB, -- { on_success: [...], on_failure: [...] }
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plot_factions (
  plot_id UUID REFERENCES plots(id) ON DELETE CASCADE,
  faction_name TEXT NOT NULL,
  goals JSONB,
  strength FLOAT DEFAULT 0.5,
  PRIMARY KEY (plot_id, faction_name)
);

CREATE TABLE plot_participants (
  plot_id UUID REFERENCES plots(id) ON DELETE CASCADE,
  creature_id UUID REFERENCES creatures(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  faction_name TEXT,
  commitment FLOAT DEFAULT 0.5,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (plot_id, creature_id)
);

CREATE INDEX idx_plot_participants_creature ON plot_participants(creature_id);

-- ============================================
-- WORLD EVENTS (History)
-- ============================================

CREATE TABLE world_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT, -- battle, trade, birth, death, discovery, political
  description TEXT,
  location_id UUID REFERENCES locations(id),
  participants UUID[], -- creature IDs
  plot_id UUID REFERENCES plots(id),
  outcome JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_location ON world_events(location_id);
CREATE INDEX idx_events_time ON world_events(occurred_at DESC);
CREATE INDEX idx_events_plot ON world_events(plot_id);

-- ============================================
-- TICK SYSTEM
-- ============================================

CREATE TABLE tick_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tick_number BIGINT NOT NULL,
  game_time TIMESTAMPTZ NOT NULL,
  entities_processed INT,
  plots_advanced INT,
  events_generated INT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tick_log_number ON tick_log(tick_number DESC);

-- ============================================
-- MISSIONS & TRAVEL
-- ============================================

CREATE TABLE creature_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creature_id UUID REFERENCES creatures(id) ON DELETE CASCADE,
  mission_type TEXT, -- travel, quest, job, personal
  description TEXT,
  
  -- For travel
  origin_location_id UUID REFERENCES locations(id),
  destination_location_id UUID REFERENCES locations(id),
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  estimated_completion_at TIMESTAMPTZ,
  current_progress FLOAT DEFAULT 0, -- 0-1
  
  events_queue JSONB, -- Scheduled events during mission
  status TEXT DEFAULT 'active', -- active, completed, failed, cancelled
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_missions_creature ON creature_missions(creature_id);
CREATE INDEX idx_missions_active ON creature_missions(status) WHERE status = 'active';
