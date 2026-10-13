<script setup lang="ts">
import type { Pet } from '#shared/types/models'

defineProps<{ pet: Pick<Pet, '_id' | 'name' | 'species' | 'breed' | 'photo'> }>()
</script>

<template>
  <NuxtLink :to="`/pets/${pet._id}`" class="group block">
    <div
      class="rounded-2xl overflow-hidden flex flex-col items-center gap-3 px-4 py-5 text-center transition-colors group-hover:border-sentry-500"
      style="
        background: var(--color-dusk-900);
        border: 1px solid var(--color-border-dark);
        box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px;
      "
    >
      <UAvatar
        :src="pet.photo ?? undefined"
        :icon="!pet.photo ? 'i-heroicons-user' : undefined"
        :alt="pet.photo ? pet.name : undefined"
        size="2xl"
        class="ring-2 ring-border-dark"
      />

      <div>
        <p
          class="text-[10px] font-semibold uppercase text-dusk-300 mb-0.5"
          style="letter-spacing: 0.25px;"
        >
          {{ pet.species }}
        </p>
        <p
          class="text-white font-semibold text-base leading-tight"
        >
          {{ pet.name }}
        </p>
        <p
          class="text-dusk-300 text-sm mt-0.5"
        >
          {{ pet.breed || '—' }}
        </p>
      </div>
    </div>
  </NuxtLink>
</template>
