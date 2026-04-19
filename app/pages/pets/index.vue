<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
type SpeciesFilter = 'all' | Species
type SortMode = 'recent' | 'oldest' | 'name_asc'

interface Pet {
  _id: string
  name: string
  species: Species
  breed?: string
  photo?: string
  createdAt: string
}

const { data: pets, status } = useFetch<Pet[]>('/api/pets', { lazy: true })

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
      class="inline-flex items-center gap-1.5 text-[13px] text-[#a49bc9] hover:text-white transition-colors w-fit"
      style="font-family: Rubik, sans-serif"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 shrink-0" />
      <span>Dashboard /</span>
      <span class="text-white">My Pets</span>
    </NuxtLink>

    <!-- Title row -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div style="font-family: Rubik, sans-serif">
        <div
          class="text-[#a49bc9] text-[10px] font-semibold uppercase mb-1.5"
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
        <p class="text-[#a49bc9] text-sm mt-1.5">
          <template v-if="isLoading">
            Loading your pets…
          </template>
          <template v-else-if="isEmpty">
            No pets yet — add your first one to get started.
          </template>
          <template v-else>
            {{ petCount }} {{ petCount === 1 ? 'profile' : 'profiles' }} in your care
            <template v-if="hasFilters"> · {{ filteredPets.length }} shown</template>
          </template>
        </p>
      </div>
      <UButton
        to="/pets/new"
        color="secondary"
        icon="i-heroicons-plus"
        class="shrink-0"
        style="font-family: Rubik, sans-serif"
      >
        Add Pet
      </UButton>
    </div>

    <!-- Full empty state -->
    <div
      v-if="isEmpty"
      class="rounded-2xl overflow-hidden"
      style="
        background: #150f23;
        border: 1px solid #362d59;
        box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px;
      "
    >
      <div
        class="px-6 py-14 flex flex-col items-center text-center gap-5"
        style="font-family: Rubik, sans-serif"
      >
        <div
          class="w-20 h-20 rounded-2xl grid place-items-center"
          style="
            background: #1f1633;
            border: 1px solid #362d59;
            box-shadow: 0 0 40px rgba(106,95,193,0.3);
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
        <div class="max-w-md">
          <h2 class="text-white text-xl font-semibold mb-2">
            Your pack starts here
          </h2>
          <p class="text-[#a49bc9] text-sm leading-relaxed">
            Add your first pet to start tracking their vaccinations, vet visits,
            medications, and milestones — all in one place.
          </p>
        </div>
        <NuxtLink
          to="/pets/new"
          class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-[13px] text-[#150f23] text-sm font-bold uppercase cursor-pointer transition-shadow hover:shadow-[rgba(0,0,0,0.18)_0px_0.5rem_1.5rem]"
          style="
            background: #c2ef4e;
            border: 1px solid #a9d832;
            box-shadow: rgba(0,0,0,0.1) 0px 1px 3px 0px inset;
            letter-spacing: 0.2px;
          "
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4 shrink-0" />
          Add Your First Pet
        </NuxtLink>
        <div
          class="text-[#6a5fc1] text-[11px] font-semibold uppercase"
          style="letter-spacing: 0.3px"
        >
          Free plan · Up to 2 pets
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
            class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a49bc9] pointer-events-none"
          />
          <input
            v-model="search"
            placeholder="Search by name or breed…"
            aria-label="Search pets"
            class="w-full h-9 pl-9 pr-3 text-[13px] text-white outline-none"
            style="
              background: #1f1633;
              border: 1px solid #362d59;
              border-radius: 10px;
              font-family: Rubik, sans-serif;
            "
          >
        </div>

        <div class="flex-1" />

        <UDropdownMenu :items="sortMenuItems" :disabled="isLoading">
          <button
            type="button"
            aria-label="Sort pets"
            class="h-9 inline-flex items-center gap-2 px-3 rounded-[10px] text-[13px] text-white cursor-pointer transition-colors hover:border-[#584674]"
            style="
              background: #1f1633;
              border: 1px solid #362d59;
              font-family: Rubik, sans-serif;
            "
          >
            <UIcon name="i-heroicons-arrows-up-down" class="w-3.5 h-3.5 text-[#a49bc9]" />
            <span class="text-[#a49bc9] hidden sm:inline">Sort:</span>
            <span>{{ sortLabels[sortMode] }}</span>
            <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-[#a49bc9]" />
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
          :class="speciesFilter === f.id ? 'text-white' : 'text-[#a49bc9] hover:text-white'"
          :style="speciesFilter === f.id
            ? 'background: #422082; border: 1px solid #584674; letter-spacing: 0.25px; font-family: Rubik, sans-serif;'
            : 'background: #1f1633; border: 1px solid #362d59; letter-spacing: 0.25px; font-family: Rubik, sans-serif;'"
          @click="speciesFilter = f.id"
        >
          <span>{{ f.label }}</span>
          <span
            class="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 grid place-items-center"
            :style="speciesFilter === f.id
              ? 'background: rgba(255,255,255,0.18); color: #ffffff;'
              : 'background: #150f23; color: #a49bc9; border: 1px solid #362d59;'"
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
            class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase text-[#a49bc9] hover:text-white cursor-pointer"
            style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
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
            style="background: #1f1633; border: 1px solid #362d59"
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
            class="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[10px] text-white text-[12px] font-semibold uppercase cursor-pointer transition-colors hover:border-[#584674]"
            style="
              background: #1f1633;
              border: 1px solid #362d59;
              letter-spacing: 0.2px;
              font-family: Rubik, sans-serif;
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
