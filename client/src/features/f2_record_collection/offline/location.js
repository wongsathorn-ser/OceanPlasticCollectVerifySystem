export function captureLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation || !window.isSecureContext) {
      reject(new Error('GPS requires HTTPS or localhost and a browser with location support.'))
      return
    }
    navigator.geolocation.getCurrentPosition(({ coords, timestamp }) => resolve({
      latitude: coords.latitude,
      longitude: coords.longitude,
      gps_accuracy_m: coords.accuracy,
      gps_captured_at: new Date(timestamp).toISOString(),
    }), (error) => reject(new Error(error.code === 1
      ? 'Location permission was denied. Allow location in your browser site settings and try again.'
      : 'Could not get GPS. Enable device location and try again.')),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 })
  })
}
