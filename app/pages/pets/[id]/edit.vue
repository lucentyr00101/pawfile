<script setup lang="ts">
import type { Pet } from '#shared/types/models'
import type { PetFormData } from '~/components/pet/PetForm.vue'

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: pet, status, error } = useFetch<Pet>(`/api/pets/${id}`, { lazy: true })

const isLoading = computed(() => status.value === 'pending')

watch(error, (err) => {
  if (err?.statusCode === 404) {
    navigateTo('/dashboard')
  }
})

const isSaving = ref(false)

async function onSubmit(data: PetFormData) {
  isSaving.value = true
  try {
    // Send null for emptied optional fields so the API clears them
    const body = {
      name: data.name,
      species: data.species,
      isPublic: data.isPublic,
      breed: data.breed || null,
      birthday: data.birthday || null,
      gender: data.gender || null,
      weight: data.weight === '' ? null : Number(data.weight),
      notes: data.notes || null,
    }

    await $fetch(`/api/pets/${id}`, { method: 'PUT', body })

    toast.add({
      title: 'Pet updated',
      description: `${data.name}'s profile has been saved.`,
      color: 'success',
    })
    await navigateTo(`/pets/${id}`)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Failed to update pet', description: message, color: 'error' })
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">

    <!-- Back link -->
    <NuxtLink
      :to="`/pets/${id}`"
      class="flex items-center gap-1.5 text-sm text-dusk-300 hover:text-white transition-colors w-fit"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 shrink-0" />
      Back to Profile
    </NuxtLink>

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <div class="flex items-center gap-4">
        <USkeleton class="w-12 h-12 rounded-xl shrink-0" />
        <div class="flex flex-col gap-2">
          <USkeleton class="h-6 w-44 rounded" />
          <USkeleton class="h-4 w-56 rounded" />
        </div>
      </div>
      <USkeleton class="h-96 rounded-2xl" />
    </template>

    <!-- Error state -->
    <template v-else-if="error">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-dusk-300 mb-4" />
        <p class="text-white text-xl font-semibold mb-2">
          Pet not found
        </p>
        <p class="text-dusk-300 text-sm mb-6">
          This pet profile doesn't exist or you don't have access.
        </p>
        <UButton to="/dashboard" color="primary">
          Back to Dashboard
        </UButton>
      </div>
    </template>

    <!-- Edit form -->
    <template v-else-if="pet">
      <!-- Page header -->
      <div class="flex items-center gap-4">
        <!-- Pencil icon badge -->
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style="background: var(--color-dusk-900); border: 1px solid var(--color-border-dark); box-shadow: 0 0 24px rgba(106,95,193,0.15)"
        >
          <UIcon name="i-heroicons-pencil-square" class="w-6 h-6 text-sentry-500" />
        </div>

        <div class="flex flex-col gap-0.5 min-w-0">
          <h1
            class="text-white text-2xl font-semibold leading-tight truncate"
          >
            Edit {{ pet.name }}
          </h1>
          <p class="text-dusk-300 text-sm">
            Update your pet's profile information.
          </p>
        </div>
      </div>

      <!-- Form card -->
      <UCard
        :ui="{
          root: 'bg-dusk-950 border border-border-dark rounded-2xl',
        }"
      >
        <PetForm :key="pet.updatedAt" :pet="pet" :loading="isSaving" @submit="onSubmit" />
        <div class="flex justify-center pt-4">
          <NuxtLink
            :to="`/pets/${id}`"
            class="text-sm text-dusk-300 hover:text-white transition-colors"
          >
            Cancel
          </NuxtLink>
        </div>
      </UCard>
    </template>

  </div>
</template>
