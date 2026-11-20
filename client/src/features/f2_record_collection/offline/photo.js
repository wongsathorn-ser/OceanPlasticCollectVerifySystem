// Decode on the phone, resize to at most 1600px, and send an ordinary JPEG.
export async function preparePhoto(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Choose an image file.')
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('This photo could not be opened. Choose a JPEG, PNG or WebP image.'))
      img.src = url
    })
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Photo processing is unavailable in this browser.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob || blob.size > 5 * 1024 * 1024) throw new Error('The processed photo must be 5 MB or smaller.')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
