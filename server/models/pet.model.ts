import mongoose, { Schema, type Document } from 'mongoose'

export interface IPet extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  birthday?: Date
  gender?: 'male' | 'female' | 'unknown'
  weight?: number
  photo?: string
  isPublic: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const PetSchema = new Schema<IPet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    species: {
      type: String,
      required: true,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'other'],
    },
    breed: {
      type: String,
      trim: true,
    },
    birthday: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unknown'],
    },
    weight: {
      type: Number,
    },
    photo: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
)

PetSchema.index({ userId: 1 })

PetSchema.pre('save', async function () {
  this.updatedAt = new Date()
})

export const Pet = mongoose.models.Pet ?? mongoose.model<IPet>('Pet', PetSchema)
