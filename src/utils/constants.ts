export const WORLD_IDS = [
  'intro',
  'hub',
  'underwater',
  'space',
  'cybercity',
  'cpu',
  'quantum',
  'library',
  'dream',
  'aicore',
  'edge',
] as const

export type WorldId = (typeof WORLD_IDS)[number]

export const CAMERA = {
  BASE_SPEED: 0.55,
  MIN_SPEED: 0.15,
  MAX_SPEED: 2.5,
  BOB_AMPLITUDE: 0.015,
  BOB_FREQUENCY: 0.4,
  MOUSE_PARALLAX: 0.3,
  BANKING_AMOUNT: 0.15,
  FOV_DEFAULT: 60,
  FOV_ACCELERATING: 75,
  FOV_TUNNEL: 50,
  BARREL_ROLL_SPEED: 0.8,
  IDLE_TIMEOUT: 10000,
} as const

export const TRANSITION = {
  FADE_DURATION: 1.5,
  TOTAL_DURATION: 3.0,
  SPEED_RAMP: 2.0,
} as const

export const HUB = {
  PORTAL_SPACING: 12,
  RADIUS: 15,
  PORTAL_SIZE: 3.5,
} as const

export const WORLD_ZONES = {
  DEPTH: 200,
  PORTAL_OFFSET: 10,
} as const

export const PERFORMANCE = {
  TARGET_FPS: 60,
  LOW_FPS_THRESHOLD: 30,
  QUALITY_CHECK_INTERVAL: 2000,
  MAX_PARTICLES_DESKTOP: 50000,
  MAX_PARTICLES_MOBILE: 15000,
} as const

export const SAVE = {
  STORAGE_KEY: 'infinite-portal-save',
  AUTO_SAVE_DELAY: 2000,
  VERSION: 1,
} as const

export const FONTS = {
  SPACE_GROTESK: '/fonts/SpaceGrotesk-Regular.ttf',
  INTER: '/fonts/Inter-Regular.ttf',
} as const
