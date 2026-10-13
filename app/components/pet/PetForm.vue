<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { PET_GENDERS, PET_SPECIES, type PetGender, type PetSpecies } from '#shared/utils/pet'
import type { Pet } from '#shared/types/models'

export interface PetFormData {
  name: string
  species: PetSpecies | undefined
  breed: string
  birthday: string
  gender: PetGender | undefined
  weight: string
  notes: string
  isPublic: boolean
}

const props = defineProps<{
  pet?: Pet
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: PetFormData]
}>()

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const SPECIES_OPTIONS = PET_SPECIES.map(value => ({ label: capitalize(value), value }))
const GENDER_OPTIONS = PET_GENDERS.map(value => ({ label: capitalize(value), value }))

const state = reactive<PetFormData>({
  name: props.pet?.name ?? '',
  species: props.pet?.species ?? undefined,
  breed: props.pet?.breed ?? '',
  birthday: toDateInputValue(props.pet?.birthday),
  gender: props.pet?.gender ?? undefined,
  weight: props.pet?.weight != null ? String(props.pet.weight) : '',
  notes: props.pet?.notes ?? '',
  isPublic: props.pet?.isPublic ?? false,
})

const initialState = JSON.stringify(state)
// While `loading`, the parent is saving and will navigate away on success
useUnsavedChangesGuard(() => !props.loading && JSON.stringify(state) !== initialState)

function validate(data: typeof state): FormError[] {
  const errors: FormError[] = []

  if (!data.name.trim())
    errors.push({ name: 'name', message: 'Name is required' })

  if (!data.species)
    errors.push({ name: 'species', message: 'Species is required' })

  if (data.weight !== '' && (isNaN(Number(data.weight)) || Number(data.weight) <= 0))
    errors.push({ name: 'weight', message: 'Weight must be a positive number' })

  if (data.birthday && daysUntil(data.birthday) > 0)
    errors.push({ name: 'birthday', message: 'Birthday cannot be in the future' })

  return errors
}

function onSubmit(event: FormSubmitEvent<typeof state>) {
  emit('submit', { ...event.data })
}

const labelUi = { label: 'text-gray-200 text-sm font-medium mb-1.5' }
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmit">
    <FormSection title="Identity" />

    <div class="space-y-4">
      <UFormField label="Pet Name" name="name" :ui="labelUi" required>
        <UInput
          v-model="state.name"
          type="text"
          placeholder="e.g. Buddy"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Species" name="species" :ui="labelUi" required>
        <USelect
          v-model="state.species"
          :items="SPECIES_OPTIONS"
          placeholder="Select species"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Breed" name="breed" :ui="labelUi">
          <UInput
            v-model="state.breed"
            type="text"
            placeholder="e.g. Golden Retriever"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Birthday" name="birthday" :ui="labelUi">
          <UInput
            v-model="state.birthday"
            type="date"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <FormSection title="Physical Details" />

    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Gender" name="gender" :ui="labelUi">
          <USelect
            v-model="state.gender"
            :items="GENDER_OPTIONS"
            placeholder="Select gender"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Weight" name="weight" :ui="labelUi">
          <UInput
            v-model="state.weight"
            type="number"
            inputmode="decimal"
            placeholder="0.0"
            min="0"
            step="0.1"
            size="lg"
            class="w-full"
          >
            <template #trailing>
              <span class="text-dusk-300 text-sm select-none">kg</span>
            </template>
          </UInput>
        </UFormField>
      </div>

      <UFormField label="Notes" name="notes" :ui="labelUi">
        <UTextarea
          v-model="state.notes"
          placeholder="Any additional notes about your pet…"
          :rows="3"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </div>

    <FormSection title="Privacy" />

    <div class="flex items-center justify-between gap-4 rounded-xl px-4 py-3 bg-dusk-900 border border-border-dark">
      <div>
        <p id="public-profile-label" class="text-gray-200 text-sm font-medium">
          Public profile
        </p>
        <p class="text-dusk-300 text-xs mt-0.5">
          Anyone with the link can view this pet's name, photo, breed and birthday
        </p>
      </div>
      <USwitch v-model="state.isPublic" color="primary" aria-labelledby="public-profile-label" />
    </div>

    <div class="pt-2">
      <SubmitButton :loading="loading" label="Save Pet" />
    </div>
  </UForm>
</template>
