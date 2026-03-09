-- Seed 001: Initial galaxies
-- Basic galaxy structure for prototype

-- Human home galaxy
INSERT INTO galaxies (name, type, technology_level_min, technology_level_max, contact_status, description, player_start_available)
VALUES (
  'Milky Way',
  'spiral',
  3, 5,
  'integrated',
  'Home galaxy of humanity. Recently achieved FTL travel and made first contact with alien civilizations.',
  true
);

-- Advanced alien galaxy
INSERT INTO galaxies (name, type, technology_level_min, technology_level_max, contact_status, description, player_start_available)
VALUES (
  'The Spiral Dominion',
  'spiral',
  5, 6,
  'dominant',
  'An ancient galaxy ruled by the Kelthari Hegemony. Highly advanced technology and complex politics.',
  false
);

-- Frontier galaxy
INSERT INTO galaxies (name, type, technology_level_min, technology_level_max, contact_status, description, player_start_available)
VALUES (
  'The Scattered Reach',
  'irregular',
  2, 4,
  'isolated',
  'A fragmented galaxy with no dominant power. Frontier territory, lawless and dangerous.',
  true
);

SELECT 'Galaxies seeded:' as status, count(*) as count FROM galaxies;
