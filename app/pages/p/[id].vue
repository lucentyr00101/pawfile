<script setup lang="ts">
import type { PublicPet } from '#shared/types/models'

definePageMeta({ layout: 'public' })


const route = useRoute()
const id = route.params.id as string

const { data: pet, error } = await useFetch<PublicPet>(`/api/public/pets/${id}`)

const isPrivate = computed(() => error.value?.statusCode === 403)
const notFound = computed(() => error.value && error.value.statusCode !== 403)

const formattedBirthday = computed(() => pet.value?.birthday ? formatDate(pet.value.birthday, 'long') : null)

const petAge = computed(() => pet.value?.birthday ? formatPetAge(pet.value.birthday) : null)

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const seoTitle = computed(() => {
  if (!pet.value) return 'PawFile'
  const parts = [pet.value.name]
  if (pet.value.breed) parts.push(pet.value.breed)
  return `${parts.join(' · ')} — PawFile`
})

const seoDescription = computed(() => {
  if (!pet.value) return 'A pet profile on PawFile.'
  const breed = pet.value.breed ? `${pet.value.breed} ` : ''
  return `Meet ${pet.value.name}, a ${breed}${pet.value.species} on PawFile.`
})

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogImage: () => pet.value?.photo || null,
  ogType: 'profile',
  twitterCard: 'summary_large_image',
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
  twitterImage: () => pet.value?.photo || null,
})
</script>

<template>
  <div>
    <!-- Private profile -->
    <div
      v-if="isPrivate"
      class="rounded-2xl p-8 text-center"
      style="background: var(--color-dusk-950); border: 1px solid var(--color-border-dark);"
    >
      <UIcon name="i-heroicons-lock-closed" class="w-10 h-10 text-dusk-300 mb-3" />
      <h1
        class="text-white text-xl font-semibold mb-2"
        style="letter-spacing: -0.01em"
      >
        This profile is private
      </h1>
      <p class="text-dusk-300 text-sm">
        The owner hasn't made this pet's profile public.
      </p>
    </div>

    <!-- Not found / error -->
    <div
      v-else-if="notFound"
      class="rounded-2xl p-8 text-center"
      style="background: var(--color-dusk-950); border: 1px solid var(--color-border-dark);"
    >
      <UIcon name="i-heroicons-question-mark-circle" class="w-10 h-10 text-dusk-300 mb-3" />
      <h1
        class="text-white text-xl font-semibold mb-2"
        style="letter-spacing: -0.01em"
      >
        Pet not found
      </h1>
      <p class="text-dusk-300 text-sm">
        This profile doesn't exist or the link is invalid.
      </p>
    </div>

    <!-- Public profile -->
    <div
      v-else-if="pet"
      class="rounded-2xl p-8"
      style="background: var(--color-dusk-950); border: 1px solid var(--color-border-dark);"
    >
      <div class="flex flex-col items-center text-center">
        <div class="relative mb-5">
          <UAvatar
            :src="pet.photo ?? undefined"
            :icon="!pet.photo ? 'i-heroicons-user' : undefined"
            :alt="pet.photo ? pet.name : undefined"
            size="3xl"
            class="ring-2 ring-border-dark"
            :style="{ boxShadow: '0 0 40px rgba(106,95,193,0.3)' }"
          />
        </div>

        <span
          class="text-[10px] font-bold uppercase text-dusk-300 mb-1"
          style="letter-spacing: 0.3px"
        >
          {{ pet.species }}
        </span>

        <h1
          class="text-white text-[28px] sm:text-[32px] font-semibold leading-tight mb-1"
          style="letter-spacing: -0.01em"
        >
          {{ pet.name }}
        </h1>

        <p class="text-dusk-300 text-sm">
          {{ pet.breed || '—' }}
          <template v-if="petAge"> · {{ petAge }}</template>
          <template v-if="pet.gender && pet.gender !== 'unknown'"> · {{ capitalize(pet.gender) }}</template>
        </p>
      </div>

      <div
        class="mt-7 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4"
        style="border-top: 1px solid var(--color-border-dark)"
      >
        <div class="text-center sm:text-left">
          <div
            class="text-[10px] font-semibold uppercase text-dusk-300 mb-1"
            style="letter-spacing: 0.25px"
          >
            Birthday
          </div>
          <div class="text-sm text-white">
            {{ formattedBirthday || '—' }}
          </div>
        </div>
        <div class="text-center sm:text-left">
          <div
            class="text-[10px] font-semibold uppercase text-dusk-300 mb-1"
            style="letter-spacing: 0.25px"
          >
            Gender
          </div>
          <div class="text-sm text-white">
            {{ pet.gender ? capitalize(pet.gender) : '—' }}
          </div>
        </div>
        <div class="text-center sm:text-left">
          <div
            class="text-[10px] font-semibold uppercase text-dusk-300 mb-1"
            style="letter-spacing: 0.25px"
          >
            Species
          </div>
          <div class="text-sm text-white">
            {{ capitalize(pet.species) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
