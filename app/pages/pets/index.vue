<script setup lang="ts">

import { FREE_PET_LIMIT, type PetSpecies as Species } from '#shared/utils/pet'
import type { CurrentUser, Pet } from '#shared/types/models'

type SpeciesFilter = 'all' | Species
type SortMode = 'recent' | 'oldest' | 'name_asc'


const { data: pets, status } = useFetch<Pet[]>('/api/pets', { lazy: true })
const { data: me } = useFetch<CurrentUser>('/api/auth/me', { lazy: true })
const isFreePlan = computed(() => me.value?.plan !== 'premium')

const isLoading = computed(() => status.value === 'pending')
const petCount = computed(() => pets.value?.length ?? 0)
const isEmpty = computed(() => !isLoading.value && petCount.value === 0)

const search = ref('')
const speciesFilter = ref<SpeciesFilter>('all')
const sortMode = ref<SortMode>('recent')

const speciesCounts = computed(() => {
  const counts: Record<Species, number> = { dog: 0, cat: 0, bird: 0, rabbit: 0, other: 0 }
  for (const p of pets.value ?? []) counts[p.species]++
  return counts
})

const speciesFilters = computed<{ id: SpeciesFilter, label: string, count: number }[]>(() => [
  { id: 'all', label: 'All', count: petCount.value },
  { id: 'dog', label: 'Dogs', count: speciesCounts.value.dog },
  { id: 'cat', label: 'Cats', count: speciesCounts.value.cat },
  { id: 'bird', label: 'Birds', count: speciesCounts.value.bird },
  { id: 'rabbit', label: 'Rabbits', count: speciesCounts.value.rabbit },
  { id: 'other', label: 'Other', count: speciesCounts.value.other },
])

const filteredPets = computed(() => {
  let list = pets.value ?? []
  if (speciesFilter.value !== 'all') {
    list = list.filter(p => p.species === speciesFilter.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) || (p.breed?.toLowerCase().includes(q) ?? false),
    )
  }

  const sorted = [...list]
  if (sortMode.value === 'recent') {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  else if (sortMode.value === 'oldest') {
    sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
  else {
    sorted.sort((a, b) => a.name.localeCompare(b.name))
  }
  return sorted
})

const sortLabels: Record<SortMode, string> = {
  recent: 'Recently added',
  oldest: 'Oldest first',
  name_asc: 'Name (A–Z)',
}

const sortMenuItems = computed(() =>
  (['recent', 'oldest', 'name_asc'] as SortMode[]).map((m) => {
    const item: { label: string, icon?: string, onSelect: () => void } = {
      label: sortLabels[m],
      onSelect: () => { sortMode.value = m },
    }
    if (sortMode.value === m) item.icon = 'i-heroicons-check'
    return item
  }),
)

const hasFilters = computed(() => speciesFilter.value !== 'all' || search.value.trim().length > 0)

function clearFilters() {
  search.value = ''
  speciesFilter.value = 'all'
}
</script>

<template>
  <div class="w-full px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-5 min-w-0">

    <!-- Breadcrumb -->
    <NuxtLink
      to="/dashboard"
      class="inline-flex items-center gap-1.5 text-[13px] text-dusk-300 hover:text-white transition-colors w-fit"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 shrink-0" />
      <span>Dashboard /</span>
      <span class="text-white">My Pets</span>
    </NuxtLink>

    <!-- Title row -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <div
          class="text-dusk-300 text-[10px] font-semibold uppercase mb-1.5"
          style="letter-spacing: 0.3px"
        >
          Your household
        </div>
        <h1
          class="text-white text-[26px] sm:text-[28px] font-semibold leading-tight"
          style="letter-spacing: -0.01em"
        >
          My Pets
        </h1>
        <p class="text-dusk-300 text-sm mt-1.5">
          <template v-if="isLoading">
            Loading your pets…
          </template>
          <template v-else-if="isEmpty">
            No pets yet — add your first one to get started.
          </template>
          <template v-else>
            {{ petCount }} {{ petCount === 1 ? 'profile' : 'profiles' }} in your care
            <template v-if="hasFilters"> · {{ filteredPets.length }} shown</template>
            <template v-if="isFreePlan"> · {{ Math.min(petCount, FREE_PET_LIMIT) }} of {{ FREE_PET_LIMIT }} on the free plan</template>
          </template>
        </p>
      </div>
      <UButton
        to="/pets/new"
        color="secondary"
        icon="i-heroicons-plus"
        class="shrink-0"
      >
        Add Pet
      </UButton>
    </div>

    <!-- Full empty state -->
    <div
      v-if="isEmpty"
      class="rounded-2xl overflow-hidden"
      style="
        background: var(--color-dusk-950);
        border: 1px solid var(--color-border-dark);
        box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px;
      "
    >
      <div
        class="px-6 py-14 flex flex-col items-center text-center gap-5"
      >
        <div
          class="w-20 h-20 rounded-2xl grid place-items-center"
          style="
            background: var(--color-dusk-900);
            border: 1px solid var(--color-border-dark);
            box-shadow: 0 0 40px rgba(106,95,193,0.3);
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-10 h-10 text-sentry-500"
            aria-hidden="true"
          >
            <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
            <circle cx="6.5" cy="9.5" r="1.8" />
            <circle cx="10" cy="7.2" r="1.8" />
            <circle cx="14" cy="7.2" r="1.8" />
            <circle cx="17.5" cy="9.5" r="1.8" />
          </svg>
        </div>
        <div class="max-w-md">
          <h2 class="text-white text-xl font-semibold mb-2">
            Your pack starts here
          </h2>
          <p class="text-dusk-300 text-sm leading-relaxed">
            Add your first pet to start tracking their vaccinations, vet visits,
            medications, and milestones — all in one place.
          </p>
        </div>
        <NuxtLink
          to="/pets/new"
          class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-[13px] text-dusk-950 text-sm font-bold uppercase cursor-pointer transition-shadow hover:shadow-[rgba(0,0,0,0.18)_0px_0.5rem_1.5rem]"
          style="
            background: var(--color-neon-300);
            border: 1px solid var(--color-neon-400);
            box-shadow: rgba(0,0,0,0.1) 0px 1px 3px 0px inset;
            letter-spacing: 0.2px;
          "
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4 shrink-0" />
          Add Your First Pet
        </NuxtLink>
        <div
          class="text-sentry-500 text-[11px] font-semibold uppercase"
          style="letter-spacing: 0.3px"
        >
          Free plan · Up to {{ FREE_PET_LIMIT }} pets
        </div>
      </div>
    </div>

    <!-- Main content -->
    <template v-else>

      <!-- Toolbar: search + sort -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="relative flex-1 min-w-[220px] max-w-[420px]">
          <UIcon
            name="i-heroicons-magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dusk-300 pointer-events-none"
          />
          <input
            v-model="search"
            placeholder="Search by name or breed…"
            aria-label="Search pets"
            type="search"
            class="w-full h-9 pointer-coarse:h-11 pl-9 pr-3 text-base sm:text-[13px] text-white outline-none focus:border-sentry-500"
            style="
              background: var(--color-dusk-900);
              border: 1px solid var(--color-border-dark);
              border-radius: 10px;
            "
          >
        </div>

        <div class="flex-1" />

        <UDropdownMenu :items="sortMenuItems" :disabled="isLoading">
          <button
            type="button"
            aria-label="Sort pets"
            class="h-9 pointer-coarse:h-11 inline-flex items-center gap-2 px-3 rounded-[10px] text-[13px] text-white cursor-pointer transition-colors hover:border-border-button"
            style="
              background: var(--color-dusk-900);
              border: 1px solid var(--color-border-dark);
            "
          >
            <UIcon name="i-heroicons-arrows-up-down" class="w-3.5 h-3.5 text-dusk-300" />
            <span class="text-dusk-300 hidden sm:inline">Sort:</span>
            <span>{{ sortLabels[sortMode] }}</span>
            <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-dusk-300" />
          </button>
        </UDropdownMenu>
      </div>

      <!-- Species filter chips -->
      <div
        v-if="!isLoading"
        class="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        role="tablist"
        aria-label="Filter by species"
      >
        <button
          v-for="f in speciesFilters"
          :key="f.id"
          type="button"
          role="tab"
          :aria-selected="speciesFilter === f.id"
          :disabled="f.id !== 'all' && f.count === 0"
          class="inline-flex items-center gap-2 h-8 px-3 rounded-full text-[12px] font-semibold uppercase cursor-pointer transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          :class="speciesFilter === f.id ? 'text-white' : 'text-dusk-300 hover:text-white'"
          :style="speciesFilter === f.id
            ? 'background: var(--color-violet-deep); border: 1px solid var(--color-border-button); letter-spacing: 0.25px;'
            : 'background: var(--color-dusk-900); border: 1px solid var(--color-border-dark); letter-spacing: 0.25px;'"
          @click="() => { speciesFilter = f.id }"
        >
          <span>{{ f.label }}</span>
          <span
            class="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 grid place-items-center"
            :style="speciesFilter === f.id
              ? 'background: rgba(255,255,255,0.18); color: #ffffff;'
              : 'background: var(--color-dusk-950); color: var(--color-dusk-300); border: 1px solid var(--color-border-dark);'"
          >{{ f.count }}</span>
        </button>
      </div>

      <!-- Grid / states -->
      <PanelCard
        title="All Pets"
        :subtitle="isLoading
          ? 'Fetching…'
          : (filteredPets.length === 1 ? '1 pet' : `${filteredPets.length} pets`)"
        icon="i-heroicons-heart"
        :padded="false"
      >
        <template #right>
          <button
            v-if="hasFilters && !isLoading"
            type="button"
            class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase text-dusk-300 hover:text-white cursor-pointer"
            style="letter-spacing: 0.25px;"
            @click="clearFilters"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-3 h-3" />
            Reset filters
          </button>
        </template>

        <!-- Loading -->
        <div
          v-if="isLoading"
          class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          <div
            v-for="n in 8"
            :key="n"
            class="rounded-2xl flex flex-col items-center gap-3 px-4 py-6"
            style="background: var(--color-dusk-900); border: 1px solid var(--color-border-dark)"
          >
            <USkeleton class="w-14 h-14 rounded-full" />
            <USkeleton class="h-3 w-12 rounded" />
            <USkeleton class="h-4 w-20 rounded" />
          </div>
        </div>

        <!-- No matches -->
        <EmptyBlock
          v-else-if="filteredPets.length === 0"
          icon="i-heroicons-magnifying-glass"
          title="No matches"
          desc="We couldn't find any pets that match your filters. Try a different search or species."
        >
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[10px] text-white text-[12px] font-semibold uppercase cursor-pointer transition-colors hover:border-border-button"
            style="
              background: var(--color-dusk-900);
              border: 1px solid var(--color-border-dark);
              letter-spacing: 0.2px;
            "
            @click="clearFilters"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5" />
            Clear filters
          </button>
        </EmptyBlock>

        <!-- Pet grid -->
        <div
          v-else
          class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          <PetCard v-for="pet in filteredPets" :key="pet._id" :pet="pet" />
        </div>
      </PanelCard>

    </template>
  </div>
</template>
