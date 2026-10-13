import { getRecordsByUser } from '~~/server/services/health-record.service'

// All of the user's health records across pets — feeds the dashboard's reminders and activity
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  await connectDB()

  return getRecordsByUser(user.id)
})
