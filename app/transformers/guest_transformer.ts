import type Guest from '#models/guest'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class GuestTransformer extends BaseTransformer<Guest> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'email', 'phone', 'rsvpStatus', 'checkedInAt']),
      isCheckedIn: this.resource.isCheckedIn,
    }
  }
}
