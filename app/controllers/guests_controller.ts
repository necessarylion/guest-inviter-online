import Event from '#models/event'
import Guest from '#models/guest'
import Invitation from '#models/invitation'
import invitationService from '#services/invitation_service'
import type { HttpContext } from '@adonisjs/core/http'
import { createGuestValidator, updateGuestValidator, bulkGuestsValidator } from '#validators/guest'

export default class GuestsController {
  async store({ params, request, auth, response, session }: HttpContext) {
    const event = await this.findOwnedEvent(auth.user!.id, params.eventId)
    if (!event) {
      return response.notFound('Event not found')
    }

    const payload = await createGuestValidator.validate(
      normalizeGuest(request.only(['name', 'email', 'phone']))
    )
    const guest = await Guest.create({ ...payload, eventId: event.id })
    await invitationService.forGuest(guest, 'link')

    session.flash('success', `${guest.name} added to the guest list.`)
    return response.redirect().toRoute('events.show', { id: event.id })
  }

  /**
   * Bulk add guests (e.g. pasted rows / CSV import).
   */
  async bulkStore({ params, request, auth, response, session }: HttpContext) {
    const event = await this.findOwnedEvent(auth.user!.id, params.eventId)
    if (!event) {
      return response.notFound('Event not found')
    }

    const rawGuests = (request.input('guests', []) as unknown[]).map((row) =>
      normalizeGuest(row as Record<string, unknown>)
    )
    const { guests } = await bulkGuestsValidator.validate({ guests: rawGuests })

    const created = await Guest.createMany(guests.map((guest) => ({ ...guest, eventId: event.id })))
    await Invitation.createMany(
      created.map((guest) => ({
        guestId: guest.id,
        eventId: event.id,
        method: 'link' as const,
        token: invitationService.generateToken(),
        status: 'pending' as const,
      }))
    )

    session.flash('success', `${created.length} guests imported.`)
    return response.redirect().toRoute('events.show', { id: event.id })
  }

  async update({ params, request, auth, response, session }: HttpContext) {
    const guest = await this.findOwnedGuest(auth.user!.id, params.eventId, params.id)
    if (!guest) {
      return response.notFound('Guest not found')
    }

    const payload = await updateGuestValidator.validate(
      normalizeGuest(request.only(['name', 'email', 'phone']))
    )
    guest.merge(payload)
    await guest.save()

    session.flash('success', 'Guest updated.')
    return response.redirect().toRoute('events.show', { id: guest.eventId })
  }

  async destroy({ params, auth, response, session }: HttpContext) {
    const guest = await this.findOwnedGuest(auth.user!.id, params.eventId, params.id)
    if (!guest) {
      return response.notFound('Guest not found')
    }

    const eventId = guest.eventId
    await guest.delete()

    session.flash('success', 'Guest removed.')
    return response.redirect().toRoute('events.show', { id: eventId })
  }

  private findOwnedEvent(userId: number, eventId: number | string) {
    return Event.query().where('id', eventId).where('userId', userId).first()
  }

  private async findOwnedGuest(userId: number, eventId: number | string, guestId: number | string) {
    const event = await this.findOwnedEvent(userId, eventId)
    if (!event) {
      return null
    }
    return Guest.query().where('id', guestId).where('eventId', event.id).first()
  }
}

/**
 * Normalizes a raw guest row: trims strings and converts empty optional fields to null.
 */
function normalizeGuest(row: Record<string, unknown>) {
  const clean = (value: unknown) => {
    const trimmed = typeof value === 'string' ? value.trim() : value
    return trimmed === '' || trimmed === undefined ? null : trimmed
  }
  return {
    name: typeof row.name === 'string' ? row.name.trim() : row.name,
    email: clean(row.email),
    phone: clean(row.phone),
  }
}
