import vine from '@vinejs/vine'
import { EMAIL_PROVIDERS } from '#models/email_setting'

/**
 * Validates a user's email provider configuration. Provider-specific fields are
 * required only when that provider is selected. Secret fields (password / api
 * key / secret access key) may be left blank on edit to keep the stored value.
 */
export const emailSettingValidator = vine.create({
  provider: vine.enum(EMAIL_PROVIDERS),
  fromEmail: vine.string().trim().email().maxLength(254),
  fromName: vine.string().trim().maxLength(120).nullable().optional(),

  // SMTP
  host: vine.string().trim().maxLength(255).optional().requiredWhen('provider', '=', 'smtp'),
  port: vine.number().positive().optional().requiredWhen('provider', '=', 'smtp'),
  secure: vine.boolean().optional(),
  username: vine.string().trim().maxLength(255).optional(),
  password: vine.string().maxLength(255).optional(),

  // Resend
  apiKey: vine.string().trim().maxLength(255).optional(),

  // SES
  region: vine.string().trim().maxLength(64).optional().requiredWhen('provider', '=', 'ses'),
  accessKeyId: vine.string().trim().maxLength(128).optional(),
  secretAccessKey: vine.string().trim().maxLength(255).optional(),
})
