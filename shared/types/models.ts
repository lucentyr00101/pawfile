// API response shapes (serialized JSON — dates are ISO strings)
import type { PetGender, PetSpecies, UserPlan } from '../utils/pet'

export interface Pet {
  _id: string
  name: string
  species: PetSpecies
  breed?: string | null
  birthday?: string | null
  gender?: PetGender | null
  weight?: number | null
  photo?: string | null
  isPublic: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type PublicPet = Pick<Pet, '_id' | 'name' | 'species' | 'breed' | 'birthday' | 'gender' | 'photo' | 'isPublic'>

export type HealthRecordType = 'vet_visit' | 'vaccination'

export interface VetVisitMetadata {
  clinicName?: string
  vetName?: string
  diagnosis?: string
  followUpDate?: string
}

export interface VaccinationMetadata {
  vaccineName?: string
  batchNumber?: string
  nextDueDate?: string
}

export interface HealthRecord {
  _id: string
  petId: string
  type: HealthRecordType
  title: string
  date: string
  notes?: string | null
  metadata?: VetVisitMetadata & VaccinationMetadata
  attachments?: string[]
  createdAt: string
  updatedAt?: string
}

export interface CurrentUser {
  id: string
  email: string
  name: string
  avatar: string | null
  provider: string
  plan: UserPlan
  createdAt: string
}
