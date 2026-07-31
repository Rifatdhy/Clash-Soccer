// Core entity types
export interface Match {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  slotsTotal: number;
  slotsAvailable: number;
  status: "upcoming" | "completed" | "ongoing";
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  date: string;
}

export interface Album {
  id: string;
  title: string;
  matchDate: string;
  coverUrl: string;
  gdriveLink?: string;
  items: AlbumItem[];
}

export interface AlbumItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Setting {
  id?: string;
  communityName: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  whatsapp: string;
  instagram: string;
  location: string;
  googleMapsEmbed: string;
}

export interface Participant {
  id?: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  jerseySize?: string;
}

export interface RsvpEntry {
  id: string;
  matchId: string;
  matchTitle: string;
  matchDate: string;
  matchTime: string;
  participants: Participant[];
  totalParticipants: number;
  createdAt: string;
}

// Badge types
export type BadgeVariant = "default" | "success" | "warning" | "danger";

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Database row types (snake_case from PostgreSQL)
export interface MatchRow {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  slots_total: number;
  slots_available: number;
  status: string;
}

export interface NewsRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string;
  date: string;
}

export interface AlbumRow {
  id: string;
  title: string;
  match_date: string;
  cover_url: string;
}

export interface AlbumItemRow {
  id: string;
  album_id: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
}

export interface SettingRow {
  id: string;
  community_name: string;
  description: string;
  logo_url: string;
  banner_url: string;
  whatsapp: string;
  instagram: string;
  location: string;
  google_maps_embed: string;
}

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
}

export interface RsvpRow {
  id: string;
  match_id: string;
  participant_name: string;
  participant_phone: string;
  created_at: string;
}