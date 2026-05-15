/**
 * Converts any uploaded image to PNG via canvas.
 * Handles JPEG, PNG, WebP, HEIC and any other format the browser can decode.
 * Returns { dataUrl, mimeType } always as image/png.
 */
export function convertImageToPng(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = ev => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          mimeType: 'image/png'
        })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Extracts base64 data from a data URL.
 */
export function getBase64(dataUrl) {
  return dataUrl.split(',')[1]
}
