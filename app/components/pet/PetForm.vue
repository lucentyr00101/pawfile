<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

interface PetFormData {
  name: string
  species: string
  breed: string
  birthday: string
  gender: string
  weight: string
  notes: string
  isPublic: boolean
}

interface Pet {
  _id?: string
  name: string
  species: string
  breed?: string
  birthday?: string | Date
  gender?: string
  weight?: number
  notes?: string
  isPublic?: boolean
}

const props = defineProps<{
  pet?: Pet
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: PetFormData]
}>()

const SPECIES_OPTIONS = [
  { label: 'Dog', value: 'dog' },
  { label: 'Cat', value: 'cat' },
  { label: 'Bird', value: 'bird' },
  { label: 'Fish', value: 'fish' },
  { label: 'Rabbit', value: 'rabbit' },
  { label: 'Hamster', value: 'hamster' },
  { label: 'Reptile', value: 'reptile' },
  { label: 'Other', value: 'other' },
]

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Unknown', value: 'unknown' },
]

const state = reactive({
  name: props.pet?.name ?? '',
  species: props.pet?.species ?? '',
  breed: props.pet?.breed ?? '',
  birthday: props.pet?.birthday
    ? new Date(props.pet.birthday).toISOString().slice(0, 10)
    : '',
  gender: props.pet?.gender ?? '',
  weight: props.pet?.weight != null ? String(props.pet.weight) : '',
  notes: props.pet?.notes ?? '',
  isPublic: props.pet?.isPublic ?? false,
})

function validate(data: typeof state): FormError[] {
  const errors: FormError[] = []

  if (!data.name.trim())
    errors.push({ name: 'name', message: 'Name is required' })

  if (!data.species)
    errors.push({ name: 'species', message: 'Species is required' })

  if (data.weight !== '' && (isNaN(Number(data.weight)) || Number(data.weight) <= 0))
    errors.push({ name: 'weight', message: 'Weight must be a positive number' })

  if (data.birthday && new Date(data.birthday) > new Date())
    errors.push({ name: 'birthday', message: 'Birthday cannot be in the future' })

  return errors
}

function onSubmit(event: FormSubmitEvent<typeof state>) {
  emit('submit', { ...event.data })
}

const formFieldUi = { label: 'text-[#e5e7eb] text-sm font-medium mb-1.5' }
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">

    <!-- Name -->
    <UFormField label="Pet Name" name="name" required :ui="formFieldUi">
      <UInput
        v-model="state.name"
        type="text"
        placeholder="e.g. Buddy"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Species -->
    <UFormField label="Species" name="species" required :ui="formFieldUi">
      <USelect
        v-model="state.species"
        :items="SPECIES_OPTIONS"
        placeholder="Select species"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Breed + Birthday (two-column on sm+) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UFormField label="Breed" name="breed" :ui="formFieldUi">
        <UInput
          v-model="state.breed"
          type="text"
          placeholder="e.g. Golden Retriever"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Birthday" name="birthday" :ui="formFieldUi">
        <UInput
          v-model="state.birthday"
          type="date"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- Gender + Weight (two-column on sm+) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UFormField label="Gender" name="gender" :ui="formFieldUi">
        <USelect
          v-model="state.gender"
          :items="GENDER_OPTIONS"
          placeholder="Select gender"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Weight" name="weight" :ui="formFieldUi">
        <UInput
          v-model="state.weight"
          type="number"
          placeholder="0.0"
          min="0"
          step="0.1"
          size="lg"
          class="w-full"
        >
          <template #trailing>
            <span
              class="text-[#a49bc9] text-sm select-none"
              style="font-family: Rubik, sans-serif"
            >kg</span>
          </template>
        </UInput>
      </UFormField>
    </div>

    <!-- Notes -->
    <UFormField label="Notes" name="notes" :ui="formFieldUi">
      <UTextarea
        v-model="state.notes"
        placeholder="Any additional notes about your pet…"
        :rows="3"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- isPublic toggle -->
    <div class="flex items-center justify-between py-1">
      <div>
        <p
          class="text-[#e5e7eb] text-sm font-medium"
          style="font-family: Rubik, sans-serif"
        >
          Public profile
        </p>
        <p class="text-[#a49bc9] text-xs mt-0.5">
          Allow others to view this pet's profile
        </p>
      </div>
      <UToggle v-model="state.isPublic" color="primary" />
    </div>

    <!-- Submit -->
    <div class="pt-2">
      <button
        type="submit"
        :disabled="loading"
        class="w-full h-11 rounded-[13px] text-white text-sm font-bold uppercase tracking-wider transition-shadow duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        style="background-color: #79628c; border: 1px solid #584674; box-shadow: rgba(0,0,0,0.1) 0px 1px 3px 0px inset; font-family: Rubik, sans-serif; letter-spacing: 0.2px"
        onmouseover="if (!this.disabled) this.style.boxShadow='rgba(0,0,0,0.18) 0px 0.5rem 1.5rem, rgba(0,0,0,0.1) 0px 1px 3px 0px inset'"
        onmouseout="this.style.boxShadow='rgba(0,0,0,0.1) 0px 1px 3px 0px inset'"
      >
        <svg v-if="loading" class="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ loading ? 'Saving…' : 'Save Pet' }}
      </button>
    </div>

  </UForm>
</template>
