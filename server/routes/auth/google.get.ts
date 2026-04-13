import { connectDB } from '~~/server/utils/db'
import { User } from '~~/server/models/user.model'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleProfile }) {
    await connectDB()

    const googleId = googleProfile.sub as string
    const email = (googleProfile.email as string).toLowerCase()
    const name = googleProfile.name as string
    const avatar = googleProfile.picture as string | undefined

    // First: look up by provider + providerId (returning Google users)
    let user = await User.findOne({ provider: 'google', providerId: googleId })

    if (!user) {
      const existingByEmail = await User.findOne({ email })

      if (existingByEmail) {
        // Email already registered under a different provider — link the Google account
        existingByEmail.providerId = googleId
        if (avatar) existingByEmail.avatar = avatar
        await existingByEmail.save()
        user = existingByEmail
      } else {
        // No account found — create a new Google-authenticated user
        user = await User.create({
          email,
          name,
          provider: 'google',
          providerId: googleId,
          avatar,
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
  },

  onError(event, error) {
    console.error('[oauth:google]', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  },
})
