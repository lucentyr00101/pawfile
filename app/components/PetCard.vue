<script setup lang="ts">
interface Pet {
  _id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  photo?: string
}

defineProps<{ pet: Pet }>()
</script>

<template>
  <NuxtLink
    :to="`/pets/${pet._id}`"
    class="group block bg-dusk-950 border border-border-dark rounded-2xl overflow-hidden transition-colors hover:border-sentry-500"
    style="box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px"
  >
    <!-- Photo area -->
    <div class="aspect-square bg-dusk-900 relative overflow-hidden">
      <img
        v-if="pet.photo"
        :src="pet.photo"
        :alt="pet.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 text-[#362d59]" aria-hidden="true">
          <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
          <circle cx="6.5" cy="9.5" r="1.8" />
          <circle cx="10" cy="7.2" r="1.8" />
          <circle cx="14" cy="7.2" r="1.8" />
          <circle cx="17.5" cy="9.5" r="1.8" />
        </svg>
      </div>
    </div>

    <!-- Card body -->
    <div class="p-4">
      <p
        class="text-[10px] font-semibold uppercase text-[#a49bc9] mb-1"
        style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
      >
        {{ pet.species }}
      </p>
      <p class="text-white font-semibold text-base leading-tight" style="font-family: Rubik, sans-serif">
        {{ pet.name }}
      </p>
      <p class="text-[#a49bc9] text-sm mt-0.5">{{ pet.breed || '—' }}</p>
    </div>
  </NuxtLink>
</template>
