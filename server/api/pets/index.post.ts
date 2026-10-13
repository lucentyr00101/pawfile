import { createPet, type CreatePetInput } from '~~/server/services/pet.service'
import { PET_GENDERS, PET_SPECIES } from '#shared/utils/pet'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const body = await readBody(event)
  const { name, species, breed, birthday, gender, weight, notes, isPublic } = body ?? {}

  if (!name || !species) {
    throw createError({ statusCode: 400, statusMessage: 'name and species are required' })
  }

  if (!PET_SPECIES.includes(species)) {
    throw createError({
      statusCode: 400,
      statusMessage: `species must be one of: ${PET_SPECIES.join(', ')}`,
    })
  }

  if (gender !== undefined && !PET_GENDERS.includes(gender)) {
    throw createError({
      statusCode: 400,
      statusMessage: `gender must be one of: ${PET_GENDERS.join(', ')}`,
    })
  }

  if (weight !== undefined && (typeof weight !== 'number' || weight <= 0)) {
    throw createError({ statusCode: 400, statusMessage: 'weight must be a positive number' })
  }

  if (birthday !== undefined) {
    const birthdayDate = new Date(birthday)
    if (isNaN(birthdayDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'birthday must be a valid date' })
    }
    if (birthdayDate > new Date()) {
      throw createError({ statusCode: 400, statusMessage: 'birthday cannot be in the future' })
    }
  }

  await connectDB()

  const input: CreatePetInput = { name, species, breed, gender, notes, isPublic }
  if (weight !== undefined) input.weight = weight
  if (birthday !== undefined) input.birthday = new Date(birthday)

  const pet = await createPet(user.id, input)

  setResponseStatus(event, 201)
  return pet
})
