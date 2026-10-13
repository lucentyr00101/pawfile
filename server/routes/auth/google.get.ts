import { signInWithOAuth } from '~~/server/utils/oauth'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleProfile }) {
    return signInWithOAuth(event, {
      provider: 'google',
      providerId: googleProfile.sub as string,
      email: googleProfile.email as string | null,
      emailVerified: googleProfile.email_verified === true,
      name: googleProfile.name as string,
      avatar: googleProfile.picture as string | undefined,
    })
  },

  onError(event, error) {
    console.error('[oauth:google]', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  },
})
