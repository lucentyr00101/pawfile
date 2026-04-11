import mongoose, { Schema, type Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  password?: string | null
  name: string
  provider: string
  providerId?: string
  avatar?: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
    },
    providerId: {
      type: String,
    },
    avatar: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
)

UserSchema.index({ provider: 1, providerId: 1 })

export const User = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)
