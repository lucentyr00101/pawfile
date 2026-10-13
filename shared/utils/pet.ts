// Single source of truth for species — used by the pet form, API validation, and the Mongoose enum.
export const PET_SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'other'] as const

export type PetSpecies = (typeof PET_SPECIES)[number]

export const PET_GENDERS = ['male', 'female', 'unknown'] as const

export type PetGender = (typeof PET_GENDERS)[number]
