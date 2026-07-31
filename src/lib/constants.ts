/**
 * Application constants
 * Centralized configuration values
 */

// API Endpoints
export const API_ENDPOINTS = {
  MATCHES: "/api/matches",
  NEWS: "/api/news",
  ALBUMS: "/api/albums",
  ALBUM_ITEMS: "/api/albums/items",
  SETTINGS: "/api/settings",
  FAQS: "/api/faqs",
  RSVPS: "/api/rsvps",
  AUTH: "/api/auth/login",
  DB_INIT: "/api/db-init",
} as const;

// Match Status
export const MATCH_STATUS = {
  UPCOMING: "upcoming",
  COMPLETED: "completed",
} as const;

// Default Values
export const DEFAULTS = {
  SLOTS_PER_MATCH: 20,
  PREVIEW_LIMIT: {
    ALBUMS: 4,
    MATCHES: 3,
    NEWS: 3,
    FAQS: 3,
  },
  PAGINATION: {
    PAGE_SIZE: 12,
  },
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH: "clash-soccer-auth",
  ADMIN_USERNAME: "adminUsername",
  ADMIN_AUTH_COOKIE: "clash_admin_session",
} as const;

// Animation Durations (in seconds)
export const ANIMATION = {
  FAST: 0.3,
  NORMAL: 0.5,
  SLOW: 0.8,
  PARTICLE_MIN: 4,
  PARTICLE_MAX: 10,
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;

// Social Media Prefixes
export const SOCIAL_PREFIXES = {
  WHATSAPP: "https://wa.me/",
  INSTAGRAM: "https://instagram.com/",
  FACEBOOK: "https://facebook.com/",
  TWITTER: "https://twitter.com/",
} as const;

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_TITLE_LENGTH: 100,
  MAX_EXCERPT_LENGTH: 200,
  PHONE_REGEX: /^(\+62|62|0)[0-9]{9,12}$/,
  SLUG_REGEX: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: "Gagal terhubung ke server. Periksa koneksi internet Anda.",
  UNAUTHORIZED: "Sesi Anda telah berakhir. Silakan login kembali.",
  NOT_FOUND: "Data tidak ditemukan.",
  SERVER_ERROR: "Terjadi kesalahan pada server. Silakan coba lagi.",
  VALIDATION: "Data yang Anda masukkan tidak valid.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: "Data berhasil ditambahkan.",
  UPDATED: "Data berhasil diperbarui.",
  DELETED: "Data berhasil dihapus.",
  LOGIN: "Login berhasil.",
  RSVP: "RSVP berhasil. Terima kasih!",
} as const;