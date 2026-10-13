import { User } from '~~/server/models/user.model'
import { hashPassword } from '~~/server/utils/auth'
import { assertRateLimit, clientIp } from '~~/server/utils/rate-limit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8
// bcrypt ignores everything past 72 bytes; reject rather than silently truncate
const MAX_PASSWORD = 72

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, name } = body ?? {}

  if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string'
    || !email || !password || !name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'email, password, and name are required' })
  }

  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedEmail.length > 254 || !EMAIL_REGEX.test(normalizedEmail)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email format' })
  }

  if (password.length < MIN_PASSWORD) {
    throw createError({ statusCode: 400, statusMessage: `Password must be at least ${MIN_PASSWORD} characters` })
  }

  if (new TextEncoder().encode(password).length > MAX_PASSWORD) {
    throw createError({ statusCode: 400, statusMessage: `Password must be at most ${MAX_PASSWORD} characters` })
  }

  if (name.trim().length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Name must be 100 characters or fewer' })
  }

  assertRateLimit(event, `register:ip:${clientIp(event)}`, { limit: 10, windowMs: 60 * 60 * 1000 })

  await connectDB()

  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'An account with that email already exists' })
  }

  const hashed = await hashPassword(password)

  let user
  try {
    user = await User.create({ email: normalizedEmail, password: hashed, name: name.trim(), provider: 'credentials' })
  }
  catch (err) {
    // Concurrent registration with the same email hits the unique index
    if ((err as { code?: number }).code === 11000) {
      throw createError({ statusCode: 409, statusMessage: 'An account with that email already exists' })
    }
    throw err
  }

  await setUserSession(event, { user: { id: String(user._id), email: user.email, name: user.name } })

  return { id: String(user._id), email: user.email, name: user.name }
})
