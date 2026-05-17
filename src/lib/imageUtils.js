/**
 * Converts any image file to PNG via canvas.
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
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            mimeType: 'image/png'
          })
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
