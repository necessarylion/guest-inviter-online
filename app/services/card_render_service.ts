import { Buffer } from 'node:buffer'
import qrService from '#services/qr_service'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import type CardTemplate from '#models/card_template'
import type { CardElement } from '#models/card_template'

/**
 * Renders an invitation card to a PDF using pdf-lib (no headless browser/canvas).
 * The QR element's content is injected from `qrPayload` so the organizer can scan
 * and verify it at the door.
 */
class CardRenderService {
  async toPdf(template: CardTemplate, qrPayload: string): Promise<Uint8Array> {
    const { width, height } = template
    const design = template.design

    const pdf = await PDFDocument.create()
    const page = pdf.addPage([width, height])
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: hexToRgb(design.background || '#ffffff'),
    })

    for (const element of design.elements ?? []) {
      await this.drawElement(pdf, page, element, { width, height, font, boldFont, qrPayload })
    }

    return pdf.save()
  }

  private async drawElement(
    pdf: PDFDocument,
    page: PDFPage,
    element: CardElement,
    ctx: { width: number; height: number; font: PDFFont; boldFont: PDFFont; qrPayload: string }
  ) {
    const { height } = ctx

    if (element.type === 'rect') {
      page.drawRectangle({
        x: element.x,
        y: height - element.y - element.height,
        width: element.width,
        height: element.height,
        color: hexToRgb(element.fill),
      })
      return
    }

    if (element.type === 'text') {
      const font = element.bold ? ctx.boldFont : ctx.font
      const lines = String(element.text ?? '').split('\n')
      const lineHeight = element.fontSize * 1.25
      lines.forEach((line, index) => {
        const textWidth = font.widthOfTextAtSize(line, element.fontSize)
        let x = element.x
        if (element.align === 'center') x = element.x + (element.width - textWidth) / 2
        else if (element.align === 'right') x = element.x + element.width - textWidth
        page.drawText(line, {
          x,
          y: height - element.y - element.fontSize - index * lineHeight,
          size: element.fontSize,
          font,
          color: hexToRgb(element.fill),
        })
      })
      return
    }

    if (element.type === 'qr') {
      const png = await qrService.toBuffer(ctx.qrPayload)
      const image = await pdf.embedPng(png)
      page.drawImage(image, {
        x: element.x,
        y: height - element.y - element.size,
        width: element.size,
        height: element.size,
      })
      return
    }

    if (element.type === 'image') {
      const embedded = await this.embedImage(pdf, element.src)
      if (embedded) {
        page.drawImage(embedded, {
          x: element.x,
          y: height - element.y - element.height,
          width: element.width,
          height: element.height,
        })
      }
    }
  }

  private async embedImage(pdf: PDFDocument, src: string) {
    try {
      const bytes = await loadImageBytes(src)
      if (!bytes) return null
      // PNG magic number: 0x89 0x50; otherwise assume JPEG.
      return bytes[0] === 0x89 ? pdf.embedPng(bytes) : pdf.embedJpg(bytes)
    } catch {
      return null
    }
  }
}

async function loadImageBytes(src: string): Promise<Uint8Array | null> {
  if (src.startsWith('data:')) {
    const base64 = src.split(',')[1] ?? ''
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
  if (src.startsWith('http://') || src.startsWith('https://')) {
    const response = await fetch(src)
    if (!response.ok) return null
    return new Uint8Array(await response.arrayBuffer())
  }
  return null
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
  const int = Number.parseInt(full, 16)
  if (Number.isNaN(int) || full.length !== 6) {
    return rgb(0, 0, 0)
  }
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255)
}

export default new CardRenderService()
