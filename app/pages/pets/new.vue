<script setup lang="ts">
import { FREE_PET_LIMIT } from '#shared/utils/pet'
import type { CurrentUser, Pet } from '#shared/types/models'
import type { PetFormData } from '~/components/pet/PetForm.vue'

const toast = useToast()
const loading = ref(false)

const [{ data: me }, { data: pets }] = await Promise.all([
  useFetch<CurrentUser>('/api/auth/me'),
  useFetch<Pet[]>('/api/pets'),
])

const atLimit = computed(() =>
  me.value?.plan !== 'premium' && (pets.value?.length ?? 0) >= FREE_PET_LIMIT,
)

async function onSubmit(data: PetFormData) {
  loading.value = true
  try {
    const body: Record<string, unknown> = {
      name: data.name,
      species: data.species,
      isPublic: data.isPublic,
    }
    if (data.breed) body.breed = data.breed
    if (data.birthday) body.birthday = data.birthday
    if (data.gender) body.gender = data.gender
    if (data.weight !== '') body.weight = Number(data.weight)
    if (data.notes) body.notes = data.notes

    const pet = await $fetch<Pet>('/api/pets', { method: 'POST', body })

    toast.add({
      title: 'Pet added',
      description: `${pet.name} has been added to your profile.`,
      color: 'success',
    })
    await navigateTo(`/pets/${pet._id}`)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string, message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Failed to add pet', description: message, color: 'error' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
    <NuxtLink
      to="/pets"
      class="flex items-center gap-1.5 text-sm text-dusk-300 hover:text-white transition-colors w-fit"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 shrink-0" />
      Back to My Pets
    </NuxtLink>

    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-dusk-900 border border-border-dark shadow-[0_0_24px_rgba(106,95,193,0.15)]">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-sentry-500" aria-hidden="true">
          <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
          <circle cx="6.5" cy="9.5" r="1.8" />
          <circle cx="10" cy="7.2" r="1.8" />
          <circle cx="14" cy="7.2" r="1.8" />
          <circle cx="17.5" cy="9.5" r="1.8" />
        </svg>
      </div>

      <div class="flex flex-col gap-0.5">
        <h1 class="text-white text-2xl font-semibold">
          Add a New Pet
        </h1>
        <p class="text-dusk-300 text-sm">
          Fill in your pet's details to create their health profile.
        </p>
      </div>
    </div>

    <!-- Free plan limit reached -->
    <div
      v-if="atLimit"
      class="rounded-2xl p-8 text-center flex flex-col items-center gap-4 bg-dusk-950 border border-border-dark"
    >
      <span class="w-12 h-12 rounded-xl grid place-items-center bg-dusk-900 border border-border-dark text-sentry-300">
        <UIcon name="i-heroicons-lock-closed" class="w-6 h-6" />
      </span>
      <div>
        <h2 class="text-white text-lg font-semibold">
          You've reached the free plan limit
        </h2>
        <p class="text-dusk-300 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
          The free plan includes up to {{ FREE_PET_LIMIT }} pets. Premium (coming soon) adds unlimited pets,
          reminders, PDF export and family sharing.
        </p>
      </div>
      <UButton to="/pets" color="secondary">
        Back to My Pets
      </UButton>
    </div>

    <UCard v-else :ui="{ root: 'bg-dusk-950 border border-border-dark rounded-2xl' }">
      <PetForm :loading="loading" @submit="onSubmit" />
    </UCard>
  </div>
</template>
