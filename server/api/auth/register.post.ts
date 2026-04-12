import { connectDB } from '~~/server/utils/db'
import { User } from '~~/server/models/user.model'
import { hashPassword } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, name } = body ?? {}

  if (!email || !password || !name) {
    throw createError({ statusCode: 400, statusMessage: 'email, password, and name are required' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email format' })
  }

  await connectDB()

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'An account with that email already exists' })
  }

  const hashed = await hashPassword(password)
  const user = await User.create({ email, password: hashed, name, provider: 'credentials' })

  await setUserSession(event, { user: { id: String(user._id), email: user.email, name: user.name } })

  return { id: String(user._id), email: user.email, name: user.name }
})
