import { updatePet, type UpdatePetInput } from '~~/server/services/pet.service'
import { PET_GENDERS, PET_SPECIES } from '#shared/utils/pet'
import { requireObjectIdParam } from '~~/server/utils/params'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const id = requireObjectIdParam(event, 'id', 'pet')

  const body = await readBody(event)
  const { name, species, breed, birthday, gender, weight, notes, isPublic } = body ?? {}

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    throw createError({ statusCode: 400, statusMessage: 'name must be a non-empty string' })
  }

  if (species !== undefined && !PET_SPECIES.includes(species)) {
    throw createError({
      statusCode: 400,
      statusMessage: `species must be one of: ${PET_SPECIES.join(', ')}`,
    })
  }

  if (isPublic !== undefined && typeof isPublic !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'isPublic must be a boolean' })
  }

  // Optional fields below accept null (or '') to clear them
  if (gender != null && gender !== '' && !PET_GENDERS.includes(gender)) {
    throw createError({
      statusCode: 400,
      statusMessage: `gender must be one of: ${PET_GENDERS.join(', ')}`,
    })
  }

  if (weight != null && (typeof weight !== 'number' || weight <= 0)) {
    throw createError({ statusCode: 400, statusMessage: 'weight must be a positive number' })
  }

  if (birthday != null && birthday !== '') {
    const birthdayDate = new Date(birthday)
    if (isNaN(birthdayDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'birthday must be a valid date' })
    }
    if (birthdayDate > new Date()) {
      throw createError({ statusCode: 400, statusMessage: 'birthday cannot be in the future' })
    }
  }

  await connectDB()

  const input: UpdatePetInput = {}
  if (name !== undefined) input.name = name
  if (species !== undefined) input.species = species
  if (isPublic !== undefined) input.isPublic = isPublic
  if (breed !== undefined) input.breed = breed || null
  if (gender !== undefined) input.gender = gender || null
  if (notes !== undefined) input.notes = notes || null
  if (weight !== undefined) input.weight = weight
  if (birthday !== undefined) input.birthday = birthday ? new Date(birthday) : null

  const pet = await updatePet(id, user.id, input)

  return pet
})
