import User from '#models/user'
import Guest from '#models/guest'
import Invitation from '#models/invitation'
import { EventSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Event extends EventSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Guest)
  declare guests: HasMany<typeof Guest>

  @hasMany(() => Invitation)
  declare invitations: HasMany<typeof Invitation>
}
