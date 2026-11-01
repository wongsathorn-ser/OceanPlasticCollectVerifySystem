// F1 · Accounts & access - constants used by the F1 screens (owner: Wongsathorn Sereephap).
// Role names match the backend enum (spec section 3). Display labels come from
// shared/layout/navConfig.js (ROLE_LABELS) so every feature shows the same words.

// BR-9: ADMIN is never offered when someone requests an account.
export const REGISTRATION_ROLES = ['CREW_MEMBER', 'SPONSOR_MANAGEMENT']

// Where each role lands after signing in (first item of its side navigation in Figma).
export const ROLE_HOME = {
  CREW_MEMBER: '/home',
  SPONSOR_MANAGEMENT: '/fleet',
  ADMIN: '/admin/requests',
}

// FR-1.4: passwords need at least 8 characters.
export const MIN_PASSWORD_LENGTH = 8

export const APP_VERSION = '0.1.0'
