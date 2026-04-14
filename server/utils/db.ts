import mongoose from 'mongoose'

let isConnected = false

export async function connectDB(): Promise<void> {
  if (isConnected) return

  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  try {
    const dbName = process.env.MONGODB_DB_NAME || 'pawfile'
    await mongoose.connect(uri, { dbName })
    isConnected = true
    console.log('[db] Connected to MongoDB')
  } catch (error) {
    console.error('[db] Failed to connect to MongoDB:', error)
    throw error
  }
}

export default mongoose
