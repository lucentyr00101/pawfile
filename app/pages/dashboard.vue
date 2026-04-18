<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Pet {
  _id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  photo?: string
}

const { user } = useAuth()
const { data: pets, status } = useFetch<Pet[]>('/api/pets', { lazy: true })

const isLoading = computed(() => status.value === 'pending')
const isEmpty = computed(() => !isLoading.value && (!pets.value || pets.value.length === 0))
const petCount = computed(() => pets.value?.length ?? 0)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const firstName = computed(() => user.value?.name?.split(' ')[0] ?? 'there')

const stats = computed(() => [
  {
    icon: 'i-heroicons-heart',
    label: 'Pets',
    value: petCount.value,
    unit: petCount.value === 1 ? 'profile' : 'profiles',
    hint: isEmpty.value ? 'Add your first' : 'all synced',
    tone: 'info',
  },
  {
    icon: 'i-heroicons-bell',
    label: 'Reminders',
    value: '—',
    hint: 'Coming soon',
    tone: 'warn',
  },
  {
    icon: 'i-heroicons-check-circle',
    label: 'Health',
    value: '—',
    hint: 'Coming soon',
    tone: 'ok',
  },
  {
    icon: 'i-heroicons-calendar',
    label: 'Next visit',
    value: '—',
    hint: 'Coming soon',
    tone: 'info',
  },
])

const toneClass: Record<string, string> = {
  ok: '#c2ef4e',
  warn: '#ffb287',
  danger: '#fa7faa',
  info: '#9a8ee8',
}

const search = ref('')
const filteredPets = computed(() => {
  if (!pets.value) return []
  if (!search.value.trim()) return pets.value
  const q = search.value.toLowerCase()
  return pets.value.filter(
    p => p.name.toLowerCase().includes(q) || p.breed?.toLowerCase().includes(q),
  )
})

const quickActions = [
  { icon: 'i-heroicons-beaker', label: 'Log vaccination' },
  { icon: 'i-heroicons-clipboard-document-list', label: 'Log vet visit' },
  { icon: 'i-heroicons-sparkles', label: 'Log medication' },
  { icon: 'i-heroicons-scale', label: 'Update weight' },
]
</script>

<template>
  <div class="w-full px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6 min-w-0">
    <!-- Title row -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div style="font-family: Rubik, sans-serif">
        <div class="text-[#a49bc9] text-xs font-medium mb-1">
          {{ greeting }}, {{ firstName }}.
        </div>
        <h1
          class="text-white text-[26px] sm:text-[28px] font-semibold leading-tight"
          style="letter-spacing: -0.01em"
        >
          Here's the latest on your pets.
        </h1>
      </div>
      <div class="flex gap-2">
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
    </div>

    <!-- Stat strip -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="(s, i) in stats"
        :key="i"
        class="rounded-2xl px-4 py-4 flex flex-col gap-2.5"
        style="background: #150f23; border: 1px solid #362d59; font-family: Rubik, sans-serif"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="w-8 h-8 rounded-lg grid place-items-center shrink-0"
            style="background: #1f1633; border: 1px solid #362d59"
            :style="{ color: toneClass[s.tone] }"
          >
            <UIcon :name="s.icon" class="w-4 h-4" />
          </span>
          <span
            class="text-[10px] font-semibold uppercase text-[#a49bc9] whitespace-nowrap text-right"
            style="letter-spacing: 0.3px"
          >
            {{ s.label }}
          </span>
        </div>
        <div class="flex items-baseline gap-1.5">
          <span
            class="text-white text-[26px] font-bold leading-none"
            style="letter-spacing: -0.01em"
          >{{ s.value }}</span>
          <span v-if="s.unit" class="text-[#a49bc9] text-[13px]">{{ s.unit }}</span>
        </div>
        <div v-if="s.hint" class="text-[#a49bc9] text-xs truncate">{{ s.hint }}</div>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
      <!-- Left column (spans 2) -->
      <div class="flex flex-col gap-5 xl:col-span-2 min-w-0">
        <PanelCard
          title="My Pets"
          :subtitle="`${petCount} ${petCount === 1 ? 'pet' : 'pets'} in your care`"
          icon="i-heroicons-heart"
          :padded="false"
        >
          <template #right>
            <div class="relative w-full max-w-[260px]">
              <UIcon
                name="i-heroicons-magnifying-glass"
                class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a49bc9] pointer-events-none"
              />
              <input
                v-model="search"
                placeholder="Search pets…"
                class="w-full h-9 pl-9 pr-3 text-[13px] text-white outline-none"
                style="
                  background: #1f1633;
                  border: 1px solid #362d59;
                  border-radius: 10px;
                  font-family: Rubik, sans-serif;
                "
              >
            </div>
          </template>

          <!-- Loading -->
          <div v-if="isLoading" class="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="n in 6"
              :key="n"
              class="rounded-2xl flex flex-col items-center gap-3 px-4 py-6"
              style="background: #1f1633; border: 1px solid #362d59"
            >
              <USkeleton class="w-14 h-14 rounded-full" />
              <USkeleton class="h-3 w-12 rounded" />
              <USkeleton class="h-4 w-20 rounded" />
            </div>
          </div>

          <!-- Empty -->
          <EmptyBlock
            v-else-if="isEmpty"
            icon="i-heroicons-heart"
            title="No pets yet"
            desc="Add your first pet to start tracking their health records, vet visits, and milestones."
          >
            <NuxtLink
              to="/pets/new"
              class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[13px] text-[#150f23] text-[13px] font-bold uppercase cursor-pointer"
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
          </EmptyBlock>

          <!-- Empty after filter -->
          <EmptyBlock
            v-else-if="filteredPets.length === 0"
            icon="i-heroicons-magnifying-glass"
            title="No matches"
            :desc="`No pets match &quot;${search}&quot;.`"
          />

          <!-- Pet grid -->
          <div
            v-else
            class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <PetCard v-for="pet in filteredPets" :key="pet._id" :pet="pet" />
          </div>
        </PanelCard>

        <PanelCard
          title="Recent Activity"
          subtitle="Last 7 days across all pets"
          icon="i-heroicons-clock"
          :padded="false"
        >
          <EmptyBlock
            icon="i-heroicons-clock"
            title="Nothing here yet"
            desc="Activity across all your pets will show up here once health records are tracked."
          />
        </PanelCard>
      </div>

      <!-- Right column -->
      <div class="flex flex-col gap-5 min-w-0">
        <PanelCard
          title="Upcoming Reminders"
          subtitle="No reminders yet"
          icon="i-heroicons-bell"
          :padded="false"
        >
          <EmptyBlock
            icon="i-heroicons-bell"
            title="All clear"
            desc="You have no upcoming reminders. We'll surface vaccination renewals and vet visits here."
          />
        </PanelCard>

        <PanelCard title="Quick actions" icon="i-heroicons-sparkles" :padded="false">
          <div class="p-4 grid grid-cols-2 gap-2">
            <button
              v-for="(q, i) in quickActions"
              :key="i"
              disabled
              class="flex flex-col items-start gap-2.5 p-3.5 rounded-xl text-white text-[13px] font-medium text-left cursor-not-allowed opacity-60"
              style="
                background: #1f1633;
                border: 1px solid #362d59;
                font-family: Rubik, sans-serif;
              "
            >
              <span style="color: #9a8ee8">
                <UIcon :name="q.icon" class="w-[18px] h-[18px]" />
              </span>
              {{ q.label }}
            </button>
          </div>
        </PanelCard>

        <PanelCard
          title="Health snapshot"
          subtitle="Across all pets"
          icon="i-heroicons-heart"
          :padded="false"
        >
          <div class="p-5 flex flex-col gap-3.5" style="font-family: Rubik, sans-serif">
            <div
              v-for="(row, i) in [
                { label: 'Vaccinations up to date', tone: '#c2ef4e' },
                { label: 'Medications on schedule', tone: '#9a8ee8' },
                { label: 'Vet checkups current', tone: '#ffb287' },
              ]"
              :key="i"
            >
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-[#e5e7eb]">{{ row.label }}</span>
                <span class="text-[#a49bc9] font-semibold">—</span>
              </div>
              <div
                class="h-1.5 rounded-full overflow-hidden"
                style="background: #1f1633"
              >
                <div
                  class="h-full rounded-full"
                  style="width: 0%; transition: width 400ms"
                  :style="{ background: row.tone }"
                />
              </div>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  </div>
</template>
