import mongoose, { Schema, type Document } from 'mongoose'
import { PET_GENDERS, PET_SPECIES, type PetGender, type PetSpecies } from '#shared/utils/pet'

export interface IPet extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  species: PetSpecies
  breed?: string
  birthday?: Date
  gender?: PetGender
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
      enum: [...PET_SPECIES],
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
      enum: [...PET_GENDERS],
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
  },
  // Mongoose maintains createdAt/updatedAt on every write, including findOneAndUpdate
  { timestamps: true },
)

PetSchema.index({ userId: 1 })

export const Pet = mongoose.models.Pet ?? mongoose.model<IPet>('Pet', PetSchema)
