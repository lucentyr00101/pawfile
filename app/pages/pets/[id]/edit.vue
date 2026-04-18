<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Pet {
  _id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  birthday?: string
  gender?: 'male' | 'female' | 'unknown'
  weight?: number
  photo?: string
  isPublic: boolean
  notes?: string
}

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
    const body: Record<string, unknown> = {
      name: data.name,
      species: data.species,
      isPublic: data.isPublic,
    }
    if (data.breed !== undefined) body.breed = data.breed || null
    if (data.birthday) body.birthday = data.birthday
    if (data.gender) body.gender = data.gender
    if (data.weight !== '') body.weight = Number(data.weight)
    if (data.notes !== undefined) body.notes = data.notes || null

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
      class="flex items-center gap-1.5 text-sm text-[#a49bc9] hover:text-white transition-colors w-fit"
      style="font-family: Rubik, sans-serif"
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
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-[#a49bc9] mb-4" />
        <p class="text-white text-xl font-semibold mb-2" style="font-family: Rubik, sans-serif">
          Pet not found
        </p>
        <p class="text-[#a49bc9] text-sm mb-6">
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
          style="background: #1f1633; border: 1px solid #362d59; box-shadow: 0 0 24px rgba(106,95,193,0.15)"
        >
          <UIcon name="i-heroicons-pencil-square" class="w-6 h-6 text-[#6a5fc1]" />
        </div>

        <div class="flex flex-col gap-0.5 min-w-0">
          <h1
            class="text-white text-2xl font-semibold leading-tight truncate"
            style="font-family: Rubik, sans-serif"
          >
            Edit {{ pet.name }}
          </h1>
          <p class="text-[#a49bc9] text-sm" style="font-family: Rubik, sans-serif">
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
        <PetForm :pet="pet" :loading="isSaving" @submit="onSubmit" />
        <div class="flex justify-center pt-4">
          <NuxtLink
            :to="`/pets/${id}`"
            class="text-sm text-[#a49bc9] hover:text-white transition-colors"
            style="font-family: Rubik, sans-serif"
          >
            Cancel
          </NuxtLink>
        </div>
      </UCard>
    </template>

  </div>
</template>
