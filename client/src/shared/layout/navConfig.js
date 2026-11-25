// SHARED FILE - side navigation per role, as drawn in Figma.
// Role names match the backend enum (spec section 3).
export const ROLE_LABELS = {
  CREW_MEMBER: 'Crew member',
  SPONSOR_MANAGEMENT: 'Sponsor / Management',
  ADMIN: 'Administrator',
}

// CHG-001: translation keys (client/translations.json) for screens crews can see
export const ROLE_KEYS = {
  CREW_MEMBER: 'role.crew_member',
  SPONSOR_MANAGEMENT: 'role.sponsor_management',
  ADMIN: 'role.administrator',
}

export const NAV_BY_ROLE = {
  CREW_MEMBER: [
    // `key` = translation key; only the crew menu is translated (CHG-001)
    { to: '/home', label: 'Home', key: 'nav.home' },
    { to: '/history', label: 'History', key: 'nav.history' },
    { to: '/profile', label: 'Profile', key: 'nav.profile' },
  ],
  SPONSOR_MANAGEMENT: [
    { to: '/fleet', label: 'Fleet' },
    { to: '/crew', label: 'Crew' },
    { to: '/verify', label: 'Verify' },
    { to: '/profile', label: 'Profile' },
  ],
  ADMIN: [
    { to: '/admin/requests', label: 'Requests' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/boats', label: 'Boats' },
    { to: '/profile', label: 'Profile' },
  ],
}
