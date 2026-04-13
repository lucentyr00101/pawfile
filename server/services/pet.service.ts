import { Pet } from '~~/server/models/pet.model'

export interface CreatePetInput {
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  birthday?: Date
  gender?: 'male' | 'female' | 'unknown'
  weight?: number
  photo?: string
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
}
