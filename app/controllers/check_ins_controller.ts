import { DateTime } from 'luxon'
import Event from '#models/event'
import Invitation from '#models/invitation'
import invitationService from '#services/invitation_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class CheckInsController {
  /**
   * The camera scanner page for an event (organizer only).
   */
  async scan({ params, auth, inertia, response }: HttpContext) {
    const event = await this.findOwnedEvent(auth.user!.id, params.eventId)
    if (!event) {
      return response.notFound('Event not found')
    }

    return inertia.render('checkins/scan', {
      event: { id: event.id, title: event.title },
    })
  }

  /**
   * Verify a scanned QR payload and check the guest in. Returns JSON consumed by
   * the scanner UI: `ok` (just checked in), `already` (previously checked in), or
   * `invalid` (token not recognized for this event).
   */
  async verify({ params, request, auth, response }: HttpContext) {
    const user = auth.user!
    const event = await this.findOwnedEvent(user.id, params.eventId)
    if (!event) {
      return response.notFound('Event not found')
    }

    const code = String(request.input('code', ''))
    const token = invitationService.extractToken(code)

    const invitation = await Invitation.query()
      .where('token', token)
      .where('eventId', event.id)
      .preload('guest')
      .first()

    if (!invitation) {
      return response.json({ status: 'invalid' })
    }

    invitation.scannedAt = DateTime.now()
    await invitation.save()

    const guest = invitation.guest
    const guestData = {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      rsvpStatus: guest.rsvpStatus,
    }

    if (guest.checkedInAt) {
      return response.json({
        status: 'already',
        guest: guestData,
        checkedInAt: guest.checkedInAt,
      })
    }

    guest.checkedInAt = DateTime.now()
    guest.checkedInById = user.id
    await guest.save()

    return response.json({ status: 'ok', guest: guestData, checkedInAt: guest.checkedInAt })
  }

  private findOwnedEvent(userId: number, eventId: number | string) {
    return Event.query().where('id', eventId).where('userId', userId).first()
  }
}
