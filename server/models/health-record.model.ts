import mongoose, { Schema, type Document } from 'mongoose'

export type HealthRecordType = 'vet_visit' | 'vaccination'

export interface VetVisitMetadata {
  clinicName?: string
  vetName?: string
  diagnosis?: string
  followUpDate?: Date
}

export interface VaccinationMetadata {
  vaccineName?: string
  batchNumber?: string
  nextDueDate?: Date
}

export type HealthRecordMetadata = VetVisitMetadata | VaccinationMetadata

export interface IHealthRecord extends Document {
  petId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: HealthRecordType
  title: string
  date: Date
  notes?: string
  metadata?: HealthRecordMetadata
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}

const HealthRecordSchema = new Schema<IHealthRecord>(
  {
    petId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Pet',
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: ['vet_visit', 'vaccination'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    attachments: {
      type: [String],
      default: [],
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

HealthRecordSchema.index({ petId: 1 })
HealthRecordSchema.index({ userId: 1 })
HealthRecordSchema.index({ petId: 1, type: 1 })

HealthRecordSchema.pre('save', async function () {
  this.updatedAt = new Date()
})

export const HealthRecord =
  mongoose.models.HealthRecord ?? mongoose.model<IHealthRecord>('HealthRecord', HealthRecordSchema)
