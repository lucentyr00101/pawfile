import { connectDB } from '~~/server/utils/db'
import { User } from '~~/server/models/user.model'

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user: githubProfile }) {
    await connectDB()

    const githubId = String(githubProfile.id)
    const email = (githubProfile.email as string).toLowerCase()
    const name = (githubProfile.name || githubProfile.login) as string
    const avatar = githubProfile.avatar_url as string | undefined

    // First: look up by provider + providerId (returning GitHub users)
    let user = await User.findOne({ provider: 'github', providerId: githubId })

    if (!user) {
      const existingByEmail = await User.findOne({ email })

      if (existingByEmail) {
        // Email already registered under a different provider — link the GitHub account
        existingByEmail.providerId = githubId
        if (avatar) existingByEmail.avatar = avatar
        await existingByEmail.save()
        user = existingByEmail
      } else {
        // No account found — create a new GitHub-authenticated user
        user = await User.create({
          email,
          name,
          provider: 'github',
          providerId: githubId,
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

    return sendRedirect(event, '/')
  },

  onError(event, error) {
    console.error('[oauth:github]', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  },
})
