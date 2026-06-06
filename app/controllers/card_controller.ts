import { Buffer } from 'node:buffer'
import { DateTime } from 'luxon'
import Event from '#models/event'
import Guest from '#models/guest'
import CardTemplate from '#models/card_template'
import mailerFactory from '#services/mailer_factory'
import cardRenderService from '#services/card_render_service'
import invitationService from '#services/invitation_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { CardDesign } from '#models/card_template'

const DEFAULT_WIDTH = 600
const DEFAULT_HEIGHT = 840

export default class CardController {
  /**
   * The card designer page.
   */
  async design({ params, auth, inertia, response }: HttpContext) {
    const event = await this.findOwnedEvent(auth.user!.id, params.eventId)
    if (!event) {
      return response.notFound('Event not found')
    }

    const template = await CardTemplate.findBy('eventId', event.id)

    return inertia.render('events/card_designer', {
      event: { id: event.id, title: event.title },
      template: {
        name: template?.name ?? 'Invitation card',
        width: template?.width ?? DEFAULT_WIDTH,
        height: template?.height ?? DEFAULT_HEIGHT,
        design: template ? template.design : defaultDesign(event.title),
      },
      // A real QR (sample token) so the editor preview looks accurate.
      sampleQrUrl: invitationService.inviteUrl('SAMPLE'),
    })
  }

  /**
   * Persist the design. Enforces that a QR element is present (it's mandatory).
   */
  async save({ params, request, auth, response, session }: HttpContext) {
    const event = await this.findOwnedEvent(auth.user!.id, params.eventId)
    if (!event) {
      return response.notFound('Event not found')
    }

    const name = String(request.input('name', 'Invitation card')).slice(0, 120)
    const width = Number(request.input('width', DEFAULT_WIDTH))
    const height = Number(request.input('height', DEFAULT_HEIGHT))
    const design = request.input('design') as CardDesign | undefined

    if (
      !design ||
      !Array.isArray(design.elements) ||
      !design.elements.some((e) => e.type === 'qr')
    ) {
      session.flash('error', 'The card must include the QR code element.')
      return response.redirect().back()
    }

    await CardTemplate.updateOrCreate(
      { eventId: event.id },
      { eventId: event.id, name, width, height, designJson: design }
    )

    session.flash('success', 'Card design saved.')
    return response.redirect().back()
  }

  /**
   * Download a guest's personalized card as a PDF.
   */
  async generate({ params, auth, response, session }: HttpContext) {
    const found = await this.findOwnedGuest(auth.user!.id, params.eventId, params.guestId)
    if (!found) {
      return response.notFound('Guest not found')
    }
    const { event, guest } = found

    const template = await CardTemplate.findBy('eventId', event.id)
    if (!template) {
      session.flash('error', 'Design a card for this event first.')
      return response.redirect().toRoute('cards.design', { eventId: event.id })
    }

    const pdf = await this.renderForGuest(template, guest)

    response.header('Content-Type', 'application/pdf')
    response.header(
      'Content-Disposition',
      `attachment; filename="invitation-${event.id}-${guest.id}.pdf"`
    )
    return response.send(Buffer.from(pdf))
  }

  /**
   * Email a guest their personalized card as a PDF attachment.
   */
  async emailCard({ params, auth, response, session }: HttpContext) {
    const user = auth.user!
    const found = await this.findOwnedGuest(user.id, params.eventId, params.guestId)
    if (!found) {
      return response.notFound('Guest not found')
    }
    const { event, guest } = found

    if (!guest.email) {
      session.flash('error', `${guest.name} has no email address.`)
      return response.redirect().toRoute('events.show', { id: event.id })
    }

    const template = await CardTemplate.findBy('eventId', event.id)
    if (!template) {
      session.flash('error', 'Design a card for this event first.')
      return response.redirect().toRoute('cards.design', { eventId: event.id })
    }

    const invitation = await invitationService.forGuest(guest, 'card')
    const pdf = await cardRenderService.toPdf(
      template,
      invitationService.inviteUrl(invitation.token)
    )

    try {
      const { mailer, from } = await mailerFactory.forUser(user.id)
      await mailer.send((message) => {
        if (from) {
          message.from(from.address, from.name)
        }
        message
          .to(guest.email!)
          .subject(`Your invitation card — ${event.title}`)
          .html(
            '<p>Your personalized invitation card is attached. Show its QR code at the door.</p>'
          )
        message.attachData(Buffer.from(pdf), {
          filename: 'invitation.pdf',
          contentType: 'application/pdf',
        })
      })
      invitation.status = 'sent'
      invitation.sentAt = DateTime.now()
      await invitation.save()
      session.flash('success', `Card emailed to ${guest.email}.`)
    } catch {
      invitation.status = 'failed'
      await invitation.save()
      session.flash('error', `Could not email the card to ${guest.email}.`)
    }

    return response.redirect().toRoute('events.show', { id: event.id })
  }

  private async renderForGuest(template: CardTemplate, guest: Guest) {
    const invitation = await invitationService.forGuest(guest, 'card')
    return cardRenderService.toPdf(template, invitationService.inviteUrl(invitation.token))
  }

  private findOwnedEvent(userId: number, eventId: number | string) {
    return Event.query().where('id', eventId).where('userId', userId).first()
  }

  private async findOwnedGuest(userId: number, eventId: number | string, guestId: number | string) {
    const event = await this.findOwnedEvent(userId, eventId)
    if (!event) {
      return null
    }
    const guest = await Guest.query().where('id', guestId).where('eventId', event.id).first()
    return guest ? { event, guest } : null
  }
}

/**
 * Starter design for events that have not been customized yet.
 */
function defaultDesign(title: string): CardDesign {
  return {
    background: '#111827',
    elements: [
      { id: 'bg-band', type: 'rect', x: 40, y: 40, width: 520, height: 760, fill: '#1f2937' },
      {
        id: 'eyebrow',
        type: 'text',
        x: 60,
        y: 90,
        width: 480,
        fontSize: 22,
        fill: '#9ca3af',
        align: 'center',
        bold: false,
        text: "YOU'RE INVITED",
      },
      {
        id: 'title',
        type: 'text',
        x: 60,
        y: 140,
        width: 480,
        fontSize: 40,
        fill: '#ffffff',
        align: 'center',
        bold: true,
        text: title,
      },
      { id: 'qr', type: 'qr', x: 200, y: 460, size: 200 },
      {
        id: 'qr-label',
        type: 'text',
        x: 60,
        y: 690,
        width: 480,
        fontSize: 18,
        fill: '#9ca3af',
        align: 'center',
        bold: false,
        text: 'Scan at the entrance',
      },
    ],
  }
}
