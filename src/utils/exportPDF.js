import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const exportPDF = async (elementId, filename = 'cotizacion.pdf') => {
  const el = document.getElementById(elementId)
  if (!el) return

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgH = (canvas.height * pageW) / canvas.width

  let y = 0
  while (y < imgH) {
    pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH)
    y += pageH
    if (y < imgH) pdf.addPage()
  }

  pdf.save(filename)
}
