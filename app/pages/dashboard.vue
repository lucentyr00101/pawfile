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
const petCount = computed(() => pets.value?.length ?? 0)
</script>

<template>
  <div class="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">

    <!-- Page header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-3">
          <h1
            class="text-white text-2xl font-semibold"
            style="font-family: Rubik, sans-serif"
          >
            My Pets
          </h1>

          <!-- Pet count badge -->
          <span
            v-if="!isLoading && petCount > 0"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase"
            style="
              background: #1f1633;
              border: 1px solid #362d59;
              color: #a49bc9;
              letter-spacing: 0.2px;
              font-family: Rubik, sans-serif;
            "
          >
            {{ petCount }} {{ petCount === 1 ? 'pet' : 'pets' }}
          </span>
        </div>

        <p class="text-[#a49bc9] text-sm" style="font-family: Rubik, sans-serif">
          Track health, milestones, and vet records for all your furry friends.
        </p>
      </div>

      <UButton
        to="/pets/new"
        color="primary"
        icon="i-heroicons-plus"
        class="shrink-0"
        style="font-family: Rubik, sans-serif"
      >
        Add Pet
      </UButton>
    </div>

    <!-- Loading skeletons — shaped like pet cards -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="rounded-2xl overflow-hidden flex flex-col items-center gap-4 px-6 py-8"
        style="background: #150f23; border: 1px solid #362d59"
      >
        <USkeleton class="w-16 h-16 rounded-full" />
        <div class="flex flex-col items-center gap-2 w-full">
          <USkeleton class="h-3 w-12 rounded" />
          <USkeleton class="h-5 w-28 rounded" />
          <USkeleton class="h-4 w-20 rounded" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="isEmpty"
      class="flex items-center justify-center py-12"
    >
      <div
        class="rounded-2xl px-10 py-12 flex flex-col items-center gap-6 w-full max-w-sm text-center"
        style="
          background: rgba(21, 15, 35, 0.8);
          border: 1px solid #362d59;
          backdrop-filter: blur(18px) saturate(180%);
        "
      >
        <!-- Icon box -->
        <div
          class="w-20 h-20 rounded-2xl flex items-center justify-center"
          style="
            background: #1f1633;
            border: 1px solid #362d59;
            box-shadow: 0 0 40px rgba(106, 95, 193, 0.18);
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-10 h-10 text-[#6a5fc1]"
            aria-hidden="true"
          >
            <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
            <circle cx="6.5" cy="9.5" r="1.8" />
            <circle cx="10" cy="7.2" r="1.8" />
            <circle cx="14" cy="7.2" r="1.8" />
            <circle cx="17.5" cy="9.5" r="1.8" />
          </svg>
        </div>

        <div class="flex flex-col gap-2">
          <p
            class="text-white text-xl font-semibold"
            style="font-family: Rubik, sans-serif"
          >
            No pets yet
          </p>
          <p class="text-[#a49bc9] text-sm leading-relaxed" style="font-family: Rubik, sans-serif">
            Add your first pet to start tracking their health records, vet visits, and milestones.
          </p>
        </div>

        <!-- Lime green CTA — one section max -->
        <NuxtLink
          to="/pets/new"
          class="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[13px] text-[#150f23] text-sm font-bold uppercase tracking-wider transition-shadow duration-150 cursor-pointer"
          style="
            background: #c2ef4e;
            border: 1px solid #a9d832;
            box-shadow: rgba(0,0,0,0.1) 0px 1px 3px 0px inset;
            font-family: Rubik, sans-serif;
            letter-spacing: 0.2px;
          "
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4 shrink-0" />
          Add Your First Pet
        </NuxtLink>
      </div>
    </div>

    <!-- Pet grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <PetCard v-for="pet in pets" :key="pet._id" :pet="pet" />
    </div>

  </div>
</template>
