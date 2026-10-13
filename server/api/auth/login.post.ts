import { User } from '~~/server/models/user.model'
import { comparePassword } from '~~/server/utils/auth'
import { assertRateLimit, clientIp, resetRateLimit } from '~~/server/utils/rate-limit'

const GENERIC_401 = 'Invalid email or password'
const WINDOW_MS = 15 * 60 * 1000

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body ?? {}

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'email and password are required' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const emailKey = `login:email:${normalizedEmail}`

  // Throttle both per account (guessing one password) and per IP (spraying many accounts)
  assertRateLimit(event, emailKey, { limit: 10, windowMs: WINDOW_MS })
  assertRateLimit(event, `login:ip:${clientIp(event)}`, { limit: 30, windowMs: WINDOW_MS })

  await connectDB()

  const user = await User.findOne({ email: normalizedEmail })

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: GENERIC_401 })
  }

  if (user.provider !== 'credentials') {
    throw createError({
      statusCode: 401,
      statusMessage: `This account was registered with ${user.provider}. Please log in with that provider instead.`,
    })
  }

  const valid = await comparePassword(password, user.password!)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: GENERIC_401 })
  }

  resetRateLimit(emailKey)

  await setUserSession(event, { user: { id: String(user._id), email: user.email, name: user.name } })

  return { id: String(user._id), email: user.email, name: user.name }
})
