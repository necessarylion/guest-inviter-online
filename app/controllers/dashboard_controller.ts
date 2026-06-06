import Event from '#models/event'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  /**
   * Portal home: the authenticated user's events with guest/check-in counts.
   */
  async index({ auth, inertia }: HttpContext) {
    const user = auth.user!

    const events = await Event.query()
      .where('userId', user.id)
      .withCount('guests', (q) => q.as('guestsCount'))
      .withCount('guests', (q) => q.whereNotNull('checked_in_at').as('checkedInCount'))
      .orderBy('startsAt', 'desc')

    const totals = await db.from('events').where('user_id', user.id).count('* as events').first()

    return inertia.render('dashboard/index', {
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        status: event.status,
        location: event.location,
        startsAt: event.startsAt?.toISO() ?? null,
        guestsCount: Number(event.$extras.guestsCount ?? 0),
        checkedInCount: Number(event.$extras.checkedInCount ?? 0),
      })),
      totalEvents: Number(totals?.events ?? 0),
    })
  }
}
