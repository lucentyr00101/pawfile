import { Pet } from '~~/server/models/pet.model'
import { HealthRecord } from '~~/server/models/health-record.model'
import { deleteFile } from '~~/server/utils/storage'
import type { PetSpecies } from '#shared/utils/pet'

export interface CreatePetInput {
  name: string
  species: PetSpecies
  breed?: string
  birthday?: Date
  gender?: 'male' | 'female' | 'unknown'
  weight?: number
  photo?: string | null
  isPublic?: boolean
  notes?: string
}

export type UpdatePetInput = Partial<CreatePetInput>

export async function createPet(userId: string, data: CreatePetInput) {
  return Pet.create({ userId, ...data })
}

export async function getPetsByUser(userId: string) {
  return Pet.find({ userId }).sort({ createdAt: -1 })
}

export async function getPetById(petId: string, userId: string) {
  const pet = await Pet.findOne({ _id: petId, userId })
  if (!pet) {
    throw createError({ statusCode: 404, statusMessage: 'Pet not found' })
  }
  return pet
}

export async function getPublicPetById(petId: string) {
  const pet = await Pet.findById(petId).select('name species breed birthday gender photo isPublic')
  if (!pet) {
    throw createError({ statusCode: 404, statusMessage: 'Pet not found' })
  }
  if (!pet.isPublic) {
    throw createError({ statusCode: 403, statusMessage: 'This profile is private' })
  }
  return pet
}

export async function updatePet(petId: string, userId: string, data: UpdatePetInput) {
  const pet = await Pet.findOneAndUpdate({ _id: petId, userId }, data, { new: true, runValidators: true })
  if (!pet) {
    throw createError({ statusCode: 404, statusMessage: 'Pet not found' })
  }
  return pet
}

export async function deletePet(petId: string, userId: string) {
  const pet = await Pet.findOneAndDelete({ _id: petId, userId })
  if (!pet) {
    throw createError({ statusCode: 404, statusMessage: 'Pet not found' })
  }

  // Cascade: a pet's health records (and their files) must not outlive the pet.
  const records = await HealthRecord.find({ petId, userId }).select('attachments')
  await HealthRecord.deleteMany({ petId, userId })

  const files = [
    ...(pet.photo ? [pet.photo] : []),
    ...records.flatMap((r: { attachments?: string[] }) => r.attachments ?? []),
  ]
  // Best-effort: data is already deleted, so orphaned blobs are preferable to a failed API response.
  await Promise.allSettled(files.map((url: string) => deleteFile(url)))

  return pet
}
