import type Guest from '#models/guest'
import type Event from '#models/event'
import qrService from '#services/qr_service'
import { BaseMail } from '@adonisjs/mail'

export type Sender = { address: string; name?: string }

/**
 * Invitation email sent to a guest who has an email address. Includes the event
 * details, a personal invite link, and the guest's unique QR code (embedded
 * inline) that the organizer scans at the door.
 */
export default class InvitationNotification extends BaseMail {
  constructor(
    private guest: Guest,
    private event: Event,
    private inviteUrl: string,
    private sender?: Sender
  ) {
    super()
  }

  async prepare() {
    const qrBuffer = await qrService.toBuffer(this.inviteUrl)

    if (this.sender) {
      this.message.from(this.sender.address, this.sender.name)
    }

    this.message
      .to(this.guest.email!)
      .subject(`You're invited to ${this.event.title}`)
      .embedData(qrBuffer, 'invite-qr')
      .html(this.html())
  }

  private html() {
    const { event, guest, inviteUrl } = this
    const when = event.startsAt
      ? event.startsAt.setZone('UTC').toFormat('cccc, dd LLLL yyyy • t')
      : ''
    const where = event.location ?? ''

    return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
      <h1 style="font-size:22px;margin:0 0 4px">You're invited 🎉</h1>
      <p style="margin:0 0 16px;color:#6b7280">Hi ${escapeHtml(guest.name)}, you're invited to:</p>

      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
        <h2 style="font-size:18px;margin:0 0 8px">${escapeHtml(event.title)}</h2>
        ${when ? `<p style="margin:0 0 4px"><strong>When:</strong> ${escapeHtml(when)}</p>` : ''}
        ${where ? `<p style="margin:0 0 4px"><strong>Where:</strong> ${escapeHtml(where)}</p>` : ''}
        ${event.description ? `<p style="margin:12px 0 0;color:#4b5563">${escapeHtml(event.description)}</p>` : ''}
      </div>

      <div style="text-align:center;margin-bottom:20px">
        <p style="margin:0 0 12px;color:#6b7280">Show this QR code at the entrance:</p>
        <img src="cid:invite-qr" width="200" height="200" alt="Your entry QR code" style="border:1px solid #e5e7eb;border-radius:12px" />
      </div>

      <div style="text-align:center">
        <a href="${inviteUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">View your invitation</a>
      </div>

      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center">
        Or open this link: <a href="${inviteUrl}" style="color:#6b7280">${inviteUrl}</a>
      </p>
    </div>`
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
