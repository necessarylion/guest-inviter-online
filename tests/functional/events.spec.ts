import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'
import Event from '#models/event'
import Guest from '#models/guest'
import Invitation from '#models/invitation'
import testUtils from '@adonisjs/core/services/test_utils'
import invitationService from '#services/invitation_service'

test.group('Events & guests', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  function makeOwner() {
    return User.create({ fullName: 'Olivia Owner', email: 'owner@test.dev', password: 'secret123' })
  }

  test('dashboard requires authentication', async ({ client }) => {
    const response = await client.get('/dashboard').redirects(0)
    response.assertStatus(302)
  })

  test('owner can create an event', async ({ client, assert }) => {
    const owner = await makeOwner()

    const response = await client
      .post('/events')
      .loginAs(owner)
      .json({
        title: 'Garden Wedding',
        startsAt: DateTime.now().plus({ days: 30 }).toFormat("yyyy-MM-dd'T'HH:mm"),
      })
      .redirects(0)
    response.assertStatus(302)

    const event = await Event.query().where('userId', owner.id).first()
    assert.isNotNull(event)
    assert.equal(event!.title, 'Garden Wedding')
    assert.isString(event!.slug)
  })

  test('adding a guest creates a link invitation automatically', async ({ client, assert }) => {
    const owner = await makeOwner()
    const event = await Event.create({
      userId: owner.id,
      title: 'Birthday Bash',
      slug: `bday-${owner.id}`,
      startsAt: DateTime.now().plus({ days: 3 }),
      timezone: 'UTC',
    })

    const response = await client
      .post(`/events/${event.id}/guests`)
      .loginAs(owner)
      .json({ name: 'Frank Friend', email: '', phone: '' })
      .redirects(0)
    response.assertStatus(302)

    const guest = await Guest.query().where('eventId', event.id).firstOrFail()
    assert.equal(guest.name, 'Frank Friend')
    assert.isNull(guest.email)

    const invitation = await Invitation.query().where('guestId', guest.id).first()
    assert.isNotNull(invitation)
    assert.equal(invitation!.method, 'link')
  })

  test('a guest cannot be added to another owner’s event', async ({ client }) => {
    const owner = await makeOwner()
    const stranger = await User.create({ email: 'stranger@test.dev', password: 'secret123' })
    const event = await Event.create({
      userId: owner.id,
      title: 'Private Gala',
      slug: `gala-${owner.id}`,
      startsAt: DateTime.now().plus({ days: 5 }),
      timezone: 'UTC',
    })

    const response = await client
      .post(`/events/${event.id}/guests`)
      .loginAs(stranger)
      .json({ name: 'Intruder' })
    response.assertStatus(404)
  })

  test('public RSVP updates the guest status', async ({ client, assert }) => {
    const owner = await makeOwner()
    const event = await Event.create({
      userId: owner.id,
      title: 'Reunion',
      slug: `reunion-${owner.id}`,
      startsAt: DateTime.now().plus({ days: 10 }),
      timezone: 'UTC',
      allowPublicRsvp: true,
    })
    const guest = await Guest.create({ eventId: event.id, name: 'Rita RSVP' })
    const invitation = await invitationService.forGuest(guest, 'link')

    const response = await client
      .post(`/i/${invitation.token}/rsvp`)
      .json({ rsvpStatus: 'confirmed' })
      .redirects(0)
    response.assertStatus(302)

    await guest.refresh()
    assert.equal(guest.rsvpStatus, 'confirmed')
  })
})
