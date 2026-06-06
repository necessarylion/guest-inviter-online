import vine from '@vinejs/vine'

/**
 * A guest requires a name; email and phone are optional. Empty strings coming
 * from forms are normalized to `null` by the controllers before validation.
 */
const guestFields = {
  name: vine.string().trim().minLength(1).maxLength(150),
  email: vine.string().trim().email().maxLength(254).nullable().optional(),
  phone: vine.string().trim().maxLength(40).nullable().optional(),
}

export const createGuestValidator = vine.create({ ...guestFields })
export const updateGuestValidator = vine.create({ ...guestFields })

/**
 * Bulk import: an array of guest rows (e.g. pasted or parsed from CSV).
 */
export const bulkGuestsValidator = vine.create({
  guests: vine.array(vine.object(guestFields)).minLength(1).maxLength(1000),
})

/**
 * Public RSVP submission from the invite page.
 */
export const rsvpValidator = vine.create({
  rsvpStatus: vine.enum(['confirmed', 'declined'] as const),
})
