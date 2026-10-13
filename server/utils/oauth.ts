import type { H3Event } from 'h3'
import { User } from '~~/server/models/user.model'

export interface OAuthProfile {
  provider: 'google' | 'github'
  providerId: string
  email?: string | null
  emailVerified: boolean
  name: string
  avatar?: string
}

/**
 * Resolves (or creates) the user for an OAuth login, starts the session, and redirects.
 *
 * Accounts are matched by email only when the provider vouches the email is verified —
 * otherwise anyone could claim an existing account by registering that address with the provider.
 */
export async function signInWithOAuth(event: H3Event, profile: OAuthProfile) {
  await connectDB()

  // Returning user of this provider
  let user = await User.findOne({ provider: profile.provider, providerId: profile.providerId })

  if (!user) {
    if (!profile.email) {
      return sendRedirect(event, '/login?error=oauth_email_missing')
    }
    if (!profile.emailVerified) {
      return sendRedirect(event, '/login?error=oauth_email_unverified')
    }

    const email = profile.email.toLowerCase()
    const existingByEmail = await User.findOne({ email })

    if (existingByEmail) {
      // Email already registered under a different provider — link this provider to it
      existingByEmail.providerId = profile.providerId
      if (profile.avatar) existingByEmail.avatar = profile.avatar
      await existingByEmail.save()
      user = existingByEmail
    }
    else {
      user = await User.create({
        email,
        name: profile.name,
        provider: profile.provider,
        providerId: profile.providerId,
        avatar: profile.avatar,
      })
    }
  }

  await setUserSession(event, {
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  })

  return sendRedirect(event, '/dashboard')
}
