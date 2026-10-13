import { getPetById, updatePet } from '~~/server/services/pet.service'
import { deleteFile } from '~~/server/utils/storage'
import { requireObjectIdParam } from '~~/server/utils/params'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const id = requireObjectIdParam(event, 'id', 'pet')

  await connectDB()

  const pet = await getPetById(id, user.id)

  if (!pet.photo) {
    throw createError({ statusCode: 400, statusMessage: 'Pet has no photo' })
  }

  // Clear the reference first so a storage failure can't leave the pet pointing at a deleted file
  const updated = await updatePet(id, user.id, { photo: null })

  // Best-effort: the pet no longer references the file
  await deleteFile(pet.photo).catch(err => console.error('[photo] Failed to delete photo:', err))

  return updated
})
