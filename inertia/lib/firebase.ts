import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

/** Public Firebase Web SDK config, shared from the server (see inertia_middleware). */
export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
}

let app: FirebaseApp | undefined

function ensureApp(config: FirebaseWebConfig): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(config)
  }
  return app
}

/**
 * Opens the Google sign-in popup and returns a Firebase ID token to post to the
 * backend (`session.google` route), which verifies it and starts a session.
 */
export async function signInWithGoogle(config: FirebaseWebConfig): Promise<string> {
  const auth = getAuth(ensureApp(config))
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user.getIdToken()
}
