import { randomBytes } from 'node:crypto'
import env from '#start/env'
import type Guest from '#models/guest'
import Invitation from '#models/invitation'
import type { InvitationMethod } from '#models/invitation'

/**
 * Owns invitation tokens and the URLs/QR payloads derived from them.
 *
 * Every (guest, method) pair gets its own unique token — so a guest invited by
 * both email and a printed card has a distinct QR code per channel, while any of
 * those QR codes resolves back to the same guest for check-in.
 */
class InvitationService {
  /**
   * Cryptographically-random, URL-safe token used as the QR/link credential.
   */
  generateToken() {
    return randomBytes(18).toString('base64url')
  }

  /**
   * Absolute public invite URL for a token (what the QR code encodes).
   */
  inviteUrl(token: string) {
    return new URL(`/i/${token}`, env.get('APP_URL')).toString()
  }

  /**
   * Find or create an invitation row for a guest + delivery method.
   */
  async forGuest(guest: Guest, method: InvitationMethod) {
    const existing = await Invitation.query()
      .where('guestId', guest.id)
      .where('method', method)
      .first()

    if (existing) {
      return existing
    }

    return Invitation.create({
      guestId: guest.id,
      eventId: guest.eventId,
      method,
      token: this.generateToken(),
      status: 'pending',
    })
  }

  /**
   * Resolve a scanned QR payload (a raw token or a full invite URL) to its token.
   */
  extractToken(payload: string) {
    const trimmed = payload.trim()
    const match = trimmed.match(/\/i\/([^/?#]+)/)
    return match ? decodeURIComponent(match[1]) : trimmed
  }
}

export default new InvitationService()
