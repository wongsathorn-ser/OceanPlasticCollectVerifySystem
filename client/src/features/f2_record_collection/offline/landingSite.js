// Client-side check is needed for offline capture. The server uses the PM's
// evidence.py helper again and flags stale/outside locations authoritatively.
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const rad = (value) => value * Math.PI / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))))
}
export function checkLocation(config, gps) {
  if (!config || !gps || !Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) return null
  let site = null
  let distance = Infinity
  for (const row of config.sites) {
    const value = distanceMeters(gps.latitude, gps.longitude, row.latitude, row.longitude)
    if (value < distance) { site = row; distance = value }
  }
  return { site, distance, allowed: Boolean(site && distance <= config.radius_m), radius: config.radius_m }
}
