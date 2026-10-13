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
  notes?: string | null
  metadata?: HealthRecordMetadata
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}

// Union of every type's metadata fields. Typed (not Mixed) so dates are stored as Dates
// and unknown keys are stripped; per-type field selection happens in parseHealthRecordMetadata().
const HealthRecordMetadataSchema = new Schema(
  {
    clinicName: { type: String, trim: true, maxlength: 200 },
    vetName: { type: String, trim: true, maxlength: 200 },
    diagnosis: { type: String, trim: true, maxlength: 2000 },
    followUpDate: { type: Date },
    vaccineName: { type: String, trim: true, maxlength: 200 },
    batchNumber: { type: String, trim: true, maxlength: 100 },
    nextDueDate: { type: Date },
  },
  { _id: false },
)

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
      type: HealthRecordMetadataSchema,
      default: undefined,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  // Mongoose maintains createdAt/updatedAt on every write, including findOneAndUpdate
  { timestamps: true },
)

HealthRecordSchema.index({ petId: 1 })
HealthRecordSchema.index({ userId: 1 })
HealthRecordSchema.index({ petId: 1, type: 1 })

export const HealthRecord =
  mongoose.models.HealthRecord ?? mongoose.model<IHealthRecord>('HealthRecord', HealthRecordSchema)
