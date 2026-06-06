import User from '#models/user'
import Event from '#models/event'
import Invitation from '#models/invitation'
import { GuestSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export const RSVP_STATUSES = ['pending', 'confirmed', 'declined'] as const
export type RsvpStatus = (typeof RSVP_STATUSES)[number]

export default class Guest extends GuestSchema {
  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, { foreignKey: 'checkedInById' })
  declare checkedInBy: BelongsTo<typeof User>

  @hasMany(() => Invitation)
  declare invitations: HasMany<typeof Invitation>

  get isCheckedIn() {
    return this.checkedInAt !== null
  }
}
