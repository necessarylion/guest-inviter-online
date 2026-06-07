import env from '#start/env'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'

/**
 * Wraps the Firebase Admin SDK, used to verify Google sign-in ID tokens minted
 * by the Firebase Web SDK in the browser. The admin app is initialized lazily
 * from the service-account env vars (see `.env.example`) the first time a token
 * is verified, and reused across the process.
 */
class FirebaseService {
  private app?: App

  /** Whether the server has the Firebase Admin credentials configured. */
  get isConfigured(): boolean {
    return Boolean(
      env.get('FIREBASE_PROJECT_ID') &&
      env.get('FIREBASE_CLIENT_EMAIL') &&
      env.get('FIREBASE_PRIVATE_KEY')
    )
  }

  private getApp(): App {
    if (this.app) return this.app

    const projectId = env.get('FIREBASE_PROJECT_ID')
    const clientEmail = env.get('FIREBASE_CLIENT_EMAIL')
    // Private keys are stored single-line with escaped newlines in .env.
    const privateKey = env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n')

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials are not configured')
    }

    // Reuse an already-initialized app across HMR reloads in dev.
    this.app =
      getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })

    return this.app
  }

  /**
   * Verifies a Firebase ID token and returns its decoded claims (uid, email,
   * name, …). Throws if the token is invalid, expired, or credentials are
   * missing.
   */
  verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return getAuth(this.getApp()).verifyIdToken(idToken)
  }
}

export default new FirebaseService()
