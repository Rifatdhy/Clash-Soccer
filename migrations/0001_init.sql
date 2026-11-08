-- Create tables for Clash.Soccer database

-- 1. Settings Table (holds community settings)
CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  community_name VARCHAR(255) NOT NULL DEFAULT 'Clash.Soccer',
  description TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  banner_url TEXT NOT NULL DEFAULT '',
  whatsapp VARCHAR(50) NOT NULL DEFAULT '',
  instagram VARCHAR(100) NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  google_maps_embed TEXT NOT NULL DEFAULT ''
);

-- 2. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  time VARCHAR(50) NOT NULL,
  location TEXT NOT NULL,
  slots_total INTEGER NOT NULL DEFAULT 20,
  slots_available INTEGER NOT NULL DEFAULT 20,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. RSVPs Table (holds RSVPs)
CREATE TABLE IF NOT EXISTS rsvps (
  id VARCHAR(50) PRIMARY KEY,
  match_id VARCHAR(50) REFERENCES matches(id) ON DELETE CASCADE,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  registered_at VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Albums Table
CREATE TABLE IF NOT EXISTS albums (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  match_date VARCHAR(50) NOT NULL,
  cover_url TEXT NOT NULL DEFAULT '',
  gdrive_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Album Items Table
CREATE TABLE IF NOT EXISTS album_items (
  id VARCHAR(50) PRIMARY KEY,
  album_id VARCHAR(50) REFERENCES albums(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. News Table
CREATE TABLE IF NOT EXISTS news (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  cover_image TEXT NOT NULL DEFAULT '',
  date VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
  id VARCHAR(50) PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial settings if not exists
INSERT INTO settings (id, community_name, description, logo_url, banner_url, whatsapp, instagram, location, google_maps_embed)
VALUES (
  'default',
  'Clash.Soccer',
  'Komunitas mini soccer terbesar di Depok. Bermain, berkompetisi, dan bertumbuh bersama.',
  '',
  '',
  '6281234567890',
  'clash.soccer',
  'Detos Mini Soccer, Depok',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0!2d106.8!3d-6.2!'
) ON CONFLICT (id) DO NOTHING;