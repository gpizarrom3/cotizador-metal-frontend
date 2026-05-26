import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Scans backward from targetY to find a row that is mostly white/background.
// Avoids splitting the PDF in the middle of a table row or text.
const findSafeSplit = (canvas, targetY, searchPx) => {
  const ctx = canvas.getContext('2d')
  const limit = Math.max(targetY - searchPx, 0)

  for (let y = Math.min(targetY, canvas.height - 1); y >= limit; y--) {
    const row = ctx.getImageData(0, y, canvas.width, 1).data
    let isLight = true
    for (let i = 0; i < row.length; i += 4) {
      // Accept near-white and light-gray backgrounds (#f8fafc, #f1f5f9, #fff)
      if (row[i] < 225 || row[i + 1] < 225 || row[i + 2] < 225) {
        isLight = false
        break
      }
    }
    if (isLight) return y
  }
  return targetY // fallback: cut at original point
}

export const exportPDF = async (elementId, filename = 'cotizacion.pdf') => {
  const el = document.getElementById(elementId)
  if (!el) return

  // Clone to body to avoid overflow clipping (overflow-y-auto parents) and
  // off-screen positioning issues (position:fixed with left:-9999px).
  const clone = el.cloneNode(true)
  clone.removeAttribute('id')
  Object.assign(clone.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: '-9999',
    pointerEvents: 'none',
  })
  document.body.appendChild(clone)

  let canvas
  try {
    canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    })
  } finally {
    document.body.removeChild(clone)
  }

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageW = pdf.internal.pageSize.getWidth()   // 210 mm
  const pageH = pdf.internal.pageSize.getHeight()  // 297 mm
  const pxPerMm = canvas.width / pageW
  const pageHpx = Math.floor(pageH * pxPerMm)
  // Search up to 18% of page height backwards for a safe row
  const searchPx = Math.floor(pageHpx * 0.18)

  let srcY = 0
  let isFirst = true

  while (srcY < canvas.height) {
    if (!isFirst) pdf.addPage()
    isFirst = false

    let endY = srcY + pageHpx
    if (endY < canvas.height) {
      endY = findSafeSplit(canvas, endY, searchPx)
    }
    endY = Math.min(endY, canvas.height)

    const srcH = endY - srcY

    // Paint this slice onto a full A4-height canvas (white fill for unused space)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = pageHpx
    const ctx = pageCanvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

    pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH)

    srcY = endY
  }

  pdf.save(filename)
}
