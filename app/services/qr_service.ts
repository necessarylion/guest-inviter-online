import QRCode from 'qrcode'

/**
 * Thin wrapper around the `qrcode` package for rendering QR codes from a string
 * payload (typically an invitation URL). Used for emails, the public invite
 * page, and the printable card.
 */
class QrService {
  /**
   * Render the payload as a PNG data URL (embeddable in <img> / emails).
   */
  toDataUrl(text: string) {
    return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 320 })
  }

  /**
   * Render the payload as an inline SVG string (crisp at any size).
   */
  toSvg(text: string) {
    return QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 })
  }

  /**
   * Render the payload as a PNG buffer (for embedding/attaching in emails).
   */
  toBuffer(text: string) {
    return QRCode.toBuffer(text, { errorCorrectionLevel: 'M', margin: 1, width: 320 })
  }
}

export default new QrService()
