import { signInWithOAuth } from '~~/server/utils/oauth'

export default defineOAuthGitHubEventHandler({
  // Fetch the primary email via /user/emails when the profile email is private
  config: { emailRequired: true },

  async onSuccess(event, { user: githubProfile }) {
    return signInWithOAuth(event, {
      provider: 'github',
      providerId: String(githubProfile.id),
      email: githubProfile.email as string | null,
      // GitHub only allows verified addresses as the public profile email, so `email_verified`
      // is set (by nuxt-auth-utils) only when the email came from /user/emails.
      emailVerified: githubProfile.email_verified !== false,
      name: (githubProfile.name || githubProfile.login) as string,
      avatar: githubProfile.avatar_url as string | undefined,
    })
  },

  onError(event, error) {
    console.error('[oauth:github]', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  },
})
