import mail from '@adonisjs/mail/services/main'
import { Mailer } from '@adonisjs/mail'
import EmailSetting from '#models/email_setting'
import emitter from '@adonisjs/core/services/emitter'
import encryption from '@adonisjs/core/services/encryption'
import { SMTPTransport } from '@adonisjs/mail/transports/smtp'
import { SESTransport } from '@adonisjs/mail/transports/ses'
import { ResendTransport } from '@adonisjs/mail/transports/resend'
import type { Sender } from '#mails/invitation_notification'
import type {
  EmailCredentials,
  SmtpCredentials,
  ResendCredentials,
  SesCredentials,
} from '#models/email_setting'

type ResolvedMailer = { mailer: ReturnType<typeof mail.use>; from?: Sender }

/**
 * Resolves which mailer to use when sending on behalf of a user.
 *
 * If the user has saved (and verified) their own email provider, a transport is
 * built at runtime from those credentials. Otherwise the system default mailer
 * (config/mail.ts) is used.
 */
class MailerFactory {
  /**
   * Mailer for a user, preferring their verified custom provider.
   */
  async forUser(userId: number): Promise<ResolvedMailer> {
    const setting = await EmailSetting.query()
      .where('userId', userId)
      .where('isVerified', true)
      .first()

    return setting ? this.fromSetting(setting) : { mailer: mail.use() }
  }

  /**
   * Build a mailer directly from a setting (used by "send test email", even
   * before the setting is marked verified).
   */
  fromSetting(setting: EmailSetting): ResolvedMailer {
    const credentials = encryption.decrypt<EmailCredentials>(setting.credentials)
    if (!credentials) {
      throw new Error('Unable to decrypt email credentials')
    }

    const transport = this.buildTransport(setting.provider, credentials)
    const mailer = new Mailer('user', transport, emitter as never) as ReturnType<typeof mail.use>

    return {
      mailer,
      from: { address: setting.fromEmail, name: setting.fromName ?? undefined },
    }
  }

  private buildTransport(provider: string, credentials: EmailCredentials) {
    switch (provider) {
      case 'smtp': {
        const c = credentials as SmtpCredentials
        return new SMTPTransport({
          host: c.host,
          port: c.port,
          secure: c.secure,
          auth: c.username
            ? { type: 'login', user: c.username, pass: c.password ?? '' }
            : undefined,
        })
      }
      case 'resend': {
        const c = credentials as ResendCredentials
        return new ResendTransport({ key: c.apiKey, baseUrl: 'https://api.resend.com' })
      }
      case 'ses': {
        const c = credentials as SesCredentials
        return new SESTransport({
          region: c.region,
          credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
        })
      }
      default:
        throw new Error(`Unsupported email provider: ${provider}`)
    }
  }
}

export default new MailerFactory()
