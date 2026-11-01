// SHARED FILE - side navigation per role, as drawn in Figma.
// Role names match the backend enum (spec section 3).
export const ROLE_LABELS = {
  CREW_MEMBER: 'Crew member',
  SPONSOR_MANAGEMENT: 'Sponsor / Management',
  ADMIN: 'Administrator',
}

export const NAV_BY_ROLE = {
  CREW_MEMBER: [
    { to: '/home', label: 'Home' },
    { to: '/history', label: 'History' },
    { to: '/profile', label: 'Profile' },
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
