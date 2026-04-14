<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

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

interface CreatedPet {
  _id: string
  name: string
}

const toast = useToast()
const loading = ref(false)

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

    const pet = await $fetch<CreatedPet>('/api/pets', { method: 'POST', body })

    toast.add({
      title: 'Pet added',
      description: `${pet.name} has been added to your profile.`,
      color: 'success',
    })
    await navigateTo(`/pets/${pet._id}`)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; message?: string } }
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

    <!-- Back link -->
    <NuxtLink
      to="/dashboard"
      class="flex items-center gap-1.5 text-sm text-[#a49bc9] hover:text-white transition-colors w-fit"
      style="font-family: Rubik, sans-serif"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 shrink-0" />
      Back to Dashboard
    </NuxtLink>

    <!-- Page header -->
    <div class="flex items-center gap-4">
      <!-- Paw icon badge -->
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style="background: #1f1633; border: 1px solid #362d59; box-shadow: 0 0 24px rgba(106,95,193,0.15)"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          class="w-6 h-6 text-[#6a5fc1]"
          aria-hidden="true"
        >
          <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
          <circle cx="6.5" cy="9.5" r="1.8" />
          <circle cx="10" cy="7.2" r="1.8" />
          <circle cx="14" cy="7.2" r="1.8" />
          <circle cx="17.5" cy="9.5" r="1.8" />
        </svg>
      </div>

      <div class="flex flex-col gap-0.5">
        <h1
          class="text-white text-2xl font-semibold"
          style="font-family: Rubik, sans-serif"
        >
          Add a New Pet
        </h1>
        <p class="text-[#a49bc9] text-sm" style="font-family: Rubik, sans-serif">
          Fill in your pet's details to create their health profile.
        </p>
      </div>
    </div>

    <!-- Form card -->
    <UCard
      :ui="{
        root: 'bg-dusk-950 border border-border-dark rounded-2xl',
      }"
    >
      <PetForm :loading="loading" @submit="onSubmit" />
    </UCard>

  </div>
</template>
