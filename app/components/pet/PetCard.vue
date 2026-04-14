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
  <NuxtLink :to="`/pets/${pet._id}`" class="group block">
    <UCard
      :ui="{
        root: 'bg-dusk-950 border border-border-dark rounded-2xl overflow-hidden transition-colors group-hover:border-sentry-500 cursor-pointer',
      }"
      style="box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px"
    >
      <div class="flex flex-col items-center gap-4 py-2 text-center">
        <!-- Avatar: shows pet photo when available, user icon otherwise -->
        <UAvatar
          :src="pet.photo"
          :icon="!pet.photo ? 'i-heroicons-user' : undefined"
          :alt="pet.photo ? pet.name : undefined"
          size="2xl"
          class="ring-2 ring-[#362d59]"
        />

        <!-- Pet info -->
        <div>
          <p
            class="text-[10px] font-semibold uppercase text-[#a49bc9] mb-0.5"
            style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
          >
            {{ pet.species }}
          </p>
          <p
            class="text-white font-semibold text-base leading-tight"
            style="font-family: Rubik, sans-serif"
          >
            {{ pet.name }}
          </p>
          <p class="text-[#a49bc9] text-sm mt-0.5">{{ pet.breed || '—' }}</p>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>
