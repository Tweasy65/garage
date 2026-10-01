export async function resizeDataUrl(
  dataUrl: string,
  maxEdge = 1280,
  quality = 0.82,
  mime: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<string> {
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = dataUrl
  })
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not compress image')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL(mime, quality)
}
