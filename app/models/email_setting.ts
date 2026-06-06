import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import { EmailSettingSchema } from '#database/schema'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export const EMAIL_PROVIDERS = ['smtp', 'resend', 'ses'] as const
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number]

/**
 * Shape of the decrypted `credentials` blob, per provider.
 */
export interface SmtpCredentials {
  host: string
  port: number
  secure: boolean
  username?: string
  password?: string
}
export interface ResendCredentials {
  apiKey: string
}
export interface SesCredentials {
  region: string
  accessKeyId: string
  secretAccessKey: string
}
export type EmailCredentials = SmtpCredentials | ResendCredentials | SesCredentials

export default class EmailSetting extends EmailSettingSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
