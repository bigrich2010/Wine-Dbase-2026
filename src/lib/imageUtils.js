/**
 * Converts any image to compressed JPEG for API transmission.
 * Resizes to max 1600px on longest side, quality 0.85.
 * Handles JPEG, PNG, WebP, HEIC and any format the browser can decode.
 */
export function convertImageToPng(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = ev => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to decode image'))
      img.onload = () => {
        try {
          const MAX = 1600
          let { naturalWidth: w, naturalHeight: h } = img
          if (w === 0) { w = img.width; h = img.height }

          // Resize if needed
          if (w > MAX || h > MAX) {
            const ratio = Math.min(MAX / w, MAX / h)
            w = Math.round(w * ratio)
            h = Math.round(h * ratio)
          }

          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          // White background for transparency
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, w, h)
          ctx.drawImage(img, 0, 0, w, h)

          // Use JPEG at 0.85 quality — much smaller than PNG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          resolve({ dataUrl, mimeType: 'image/jpeg' })
        } catch(e) {
          reject(e)
        }
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

export function getBase64(dataUrl) {
  return dataUrl.split(',')[1]
}
