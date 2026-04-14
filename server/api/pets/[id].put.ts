import { updatePet, type UpdatePetInput } from '~~/server/services/pet.service'

const ALLOWED_SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'other'] as const

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')

  const body = await readBody(event)
  const { name, species, breed, birthday, gender, weight, notes, isPublic } = body ?? {}

  if (species !== undefined && !ALLOWED_SPECIES.includes(species)) {
    throw createError({
      statusCode: 400,
      statusMessage: `species must be one of: ${ALLOWED_SPECIES.join(', ')}`,
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

  const input: UpdatePetInput = {}
  if (name !== undefined) input.name = name
  if (species !== undefined) input.species = species
  if (breed !== undefined) input.breed = breed
  if (gender !== undefined) input.gender = gender
  if (notes !== undefined) input.notes = notes
  if (isPublic !== undefined) input.isPublic = isPublic
  if (weight !== undefined) input.weight = weight
  if (birthday !== undefined) input.birthday = new Date(birthday)

  const pet = await updatePet(id!, session.user.id, input)

  return pet
})
