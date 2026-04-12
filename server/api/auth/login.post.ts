import { User } from '~~/server/models/user.model'

const GENERIC_401 = 'Invalid email or password'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body ?? {}

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'email and password are required' })
  }

  await connectDB()

  const user = await User.findOne({ email: email.toLowerCase() })

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

  await setUserSession(event, { user: { id: String(user._id), email: user.email, name: user.name } })

  return { id: String(user._id), email: user.email, name: user.name }
})
