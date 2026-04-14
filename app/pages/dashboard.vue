<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Pet {
  _id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  photo?: string
}

const { data: pets, status } = useFetch<Pet[]>('/api/pets', { lazy: true })

const isLoading = computed(() => status.value === 'pending')
const isEmpty = computed(() => !isLoading.value && (!pets.value || pets.value.length === 0))
</script>

<template>
  <div class="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="text-white text-2xl font-semibold" style="font-family: Rubik, sans-serif">
        My Pets
      </h1>
      <UButton to="/pets/new" color="primary" icon="i-heroicons-plus">
        Add Pet
      </UButton>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <USkeleton v-for="n in 6" :key="n" class="h-64 rounded-2xl" />
    </div>

    <!-- Empty state -->
    <div v-else-if="isEmpty" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="max-w-sm">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 text-[#a49bc9] mx-auto mb-4" aria-hidden="true">
          <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
          <circle cx="6.5" cy="9.5" r="1.8" />
          <circle cx="10" cy="7.2" r="1.8" />
          <circle cx="14" cy="7.2" r="1.8" />
          <circle cx="17.5" cy="9.5" r="1.8" />
        </svg>
        <p class="text-white text-xl font-semibold mb-2" style="font-family: Rubik, sans-serif">
          No pets yet
        </p>
        <p class="text-[#a49bc9] text-sm mb-6">
          Add your first pet to get started tracking their health.
        </p>
        <UButton to="/pets/new" color="primary" icon="i-heroicons-plus">
          Add Pet
        </UButton>
      </div>
    </div>

    <!-- Pet grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <PetCard v-for="pet in pets" :key="pet._id" :pet="pet" />
    </div>
  </div>
</template>
