import Event from '#models/event'
import Guest from '#models/guest'
import { InvitationSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export const INVITATION_METHODS = ['email', 'link', 'card'] as const
export type InvitationMethod = (typeof INVITATION_METHODS)[number]

export const INVITATION_STATUSES = ['pending', 'sent', 'failed', 'viewed'] as const
export type InvitationStatus = (typeof INVITATION_STATUSES)[number]

export default class Invitation extends InvitationSchema {
  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => Guest)
  declare guest: BelongsTo<typeof Guest>
}
