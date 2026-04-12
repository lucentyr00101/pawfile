import { User } from '~~/server/models/user.model'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await connectDB()

  const user = await User.findById(session.user.id).select('-password')

  if (!user) {
    await clearUserSession(event)
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    avatar: user.avatar ?? null,
    provider: user.provider,
    createdAt: user.createdAt,
  }
})
