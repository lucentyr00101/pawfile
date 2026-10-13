<script setup lang="ts">
import type { HealthRecord, Pet } from '#shared/types/models'

const { user } = useAuth()
const { data: pets, status } = useFetch<Pet[]>('/api/pets', { lazy: true, default: () => [] })
const { data: records, status: recordsStatus } = useFetch<HealthRecord[]>('/api/health-records', {
  lazy: true,
  default: () => [],
})

const isLoading = computed(() => status.value === 'pending')
const isRecordsLoading = computed(() => recordsStatus.value === 'pending')
const isEmpty = computed(() => !isLoading.value && pets.value.length === 0)
const petCount = computed(() => pets.value.length)
const petName = computed(() => new Map(pets.value.map(p => [p._id, p.name])))

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const firstName = computed(() => user.value?.name?.split(' ')[0] ?? 'there')

// ── Derived health data ─────────────────────────────────────────────────────
const REMINDER_WINDOW_DAYS = 30

const dueItems = computed(() => getDueItems(records.value))
const overdueItems = computed(() => dueItems.value.filter(i => i.status === 'overdue'))
const reminders = computed(() => dueItems.value.filter(i => i.days <= REMINDER_WINDOW_DAYS))
const nextFollowUp = computed(() => dueItems.value.find(i => i.kind === 'follow_up' && i.days >= 0))
const recentRecords = computed(() => records.value.slice(0, 5))

const snapshot = computed(() => {
  const vaccinated = new Set(records.value.filter(r => r.type === 'vaccination').map(r => r.petId))
  const overduePets = new Set(overdueItems.value.filter(i => i.kind === 'vaccination').map(i => i.record.petId))
  const followUps = dueItems.value.filter(i => i.kind === 'follow_up')
  const overdueFollowUps = followUps.filter(i => i.status === 'overdue').length

  return [
    {
      label: 'Vaccinations up to date',
      hint: vaccinated.size ? `${vaccinated.size - overduePets.size} of ${vaccinated.size} vaccinated pets` : 'No vaccinations logged',
      pct: vaccinated.size ? ((vaccinated.size - overduePets.size) / vaccinated.size) * 100 : 0,
      tone: 'bg-neon-300',
    },
    {
      label: 'Vet follow-ups on track',
      hint: followUps.length ? `${followUps.length - overdueFollowUps} of ${followUps.length} follow-ups` : 'No follow-ups scheduled',
      pct: followUps.length ? ((followUps.length - overdueFollowUps) / followUps.length) * 100 : 0,
      tone: 'bg-coral',
    },
  ]
})

const stats = computed(() => [
  {
    icon: 'i-heroicons-heart',
    label: 'Pets',
    value: String(petCount.value),
    unit: petCount.value === 1 ? 'profile' : 'profiles',
    hint: isEmpty.value ? 'Add your first' : `${records.value.length} health ${records.value.length === 1 ? 'record' : 'records'}`,
    tone: 'text-sentry-300',
  },
  {
    icon: 'i-heroicons-bell',
    label: 'Reminders',
    value: String(reminders.value.length),
    unit: 'upcoming',
    hint: `Due in the next ${REMINDER_WINDOW_DAYS} days`,
    tone: 'text-coral',
  },
  {
    icon: overdueItems.value.length ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle',
    label: 'Overdue',
    value: String(overdueItems.value.length),
    unit: overdueItems.value.length === 1 ? 'item' : 'items',
    hint: overdueItems.value.length ? 'Needs attention' : 'All caught up',
    tone: overdueItems.value.length ? 'text-red-400' : 'text-neon-300',
  },
  {
    icon: 'i-heroicons-calendar',
    label: 'Next visit',
    value: nextFollowUp.value ? formatDate(nextFollowUp.value.dueDate) : '—',
    hint: nextFollowUp.value
      ? `${petName.value.get(nextFollowUp.value.record.petId) ?? 'Pet'} · follow-up`
      : 'No follow-up scheduled',
    tone: 'text-sentry-300',
  },
])

// ── Search ──────────────────────────────────────────────────────────────────
const search = ref('')
const filteredPets = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return pets.value
  return pets.value.filter(p => p.name.toLowerCase().includes(q) || p.breed?.toLowerCase().includes(q))
})

// ── Quick actions (pick a pet when there's more than one) ───────────────────
type QuickAction = 'vaccination' | 'vet_visit' | 'weight'

const quickActions: { id: QuickAction, icon: string, label: string }[] = [
  { id: 'vaccination', icon: 'i-heroicons-beaker', label: 'Log vaccination' },
  { id: 'vet_visit', icon: 'i-heroicons-clipboard-document-list', label: 'Log vet visit' },
  { id: 'weight', icon: 'i-heroicons-scale', label: 'Update weight' },
]

const pendingAction = ref<QuickAction | null>(null)
const isPickerOpen = computed({
  get: () => pendingAction.value !== null,
  set: (open) => { if (!open) pendingAction.value = null },
})

function actionPath(action: QuickAction, petId: string) {
  return action === 'weight'
    ? `/pets/${petId}/edit`
    : `/pets/${petId}/health-records/new?type=${action}`
}

function runQuickAction(action: QuickAction) {
  if (pets.value.length === 0) return navigateTo('/pets/new')
  if (pets.value.length === 1) return navigateTo(actionPath(action, pets.value[0]!._id))
  pendingAction.value = action
}

function pickPet(petId: string) {
  const action = pendingAction.value
  pendingAction.value = null
  if (action) navigateTo(actionPath(action, petId))
}
</script>

<template>
  <div class="w-full px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6 min-w-0">
    <!-- Title row -->
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <div class="text-dusk-300 text-xs font-medium mb-1">
          {{ greeting }}, {{ firstName }}.
        </div>
        <h1 class="text-white text-[26px] sm:text-[28px] font-semibold leading-tight tracking-[-0.01em]">
          Here's the latest on your pets.
        </h1>
      </div>
      <UButton to="/pets/new" color="secondary" icon="i-heroicons-plus" class="shrink-0 pointer-coarse:min-h-11">
        Add Pet
      </UButton>
    </div>

    <!-- Stat strip -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="s in stats"
        :key="s.label"
        class="rounded-2xl px-4 py-4 flex flex-col gap-2.5 bg-dusk-950 border border-border-dark min-w-0"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="w-8 h-8 rounded-lg grid place-items-center shrink-0 bg-dusk-900 border border-border-dark" :class="s.tone">
            <UIcon :name="s.icon" class="w-4 h-4" />
          </span>
          <span class="text-[10px] font-semibold uppercase text-dusk-300 whitespace-nowrap text-right tracking-[0.3px]">
            {{ s.label }}
          </span>
        </div>
        <div class="flex items-baseline gap-1.5 min-w-0">
          <USkeleton v-if="isLoading || isRecordsLoading" class="h-[26px] w-12 rounded" />
          <template v-else>
            <span class="text-white font-bold leading-none tracking-[-0.01em] truncate" :class="s.value.length > 6 ? 'text-lg' : 'text-[26px]'">{{ s.value }}</span>
            <span v-if="s.unit" class="text-dusk-300 text-[13px]">{{ s.unit }}</span>
          </template>
        </div>
        <div class="text-dusk-300 text-xs truncate">
          {{ s.hint }}
        </div>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
      <div class="flex flex-col gap-5 xl:col-span-2 min-w-0">
        <PanelCard
          title="My Pets"
          :subtitle="`${petCount} ${petCount === 1 ? 'pet' : 'pets'} in your care`"
          icon="i-heroicons-heart"
          :padded="false"
        >
          <template v-if="petCount > 3" #right>
            <div class="relative w-full max-w-[260px]">
              <UIcon
                name="i-heroicons-magnifying-glass"
                class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dusk-300 pointer-events-none"
              />
              <input
                v-model="search"
                type="search"
                placeholder="Search pets…"
                aria-label="Search pets"
                class="w-full h-9 pointer-coarse:h-11 pl-9 pr-3 text-base sm:text-[13px] text-white outline-none rounded-[10px] bg-dusk-900 border border-border-dark focus:border-sentry-500"
              >
            </div>
          </template>

          <div v-if="isLoading" class="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="n in 3"
              :key="n"
              class="rounded-2xl flex flex-col items-center gap-3 px-4 py-6 bg-dusk-900 border border-border-dark"
            >
              <USkeleton class="w-14 h-14 rounded-full" />
              <USkeleton class="h-3 w-12 rounded" />
              <USkeleton class="h-4 w-20 rounded" />
            </div>
          </div>

          <EmptyBlock
            v-else-if="isEmpty"
            icon="i-heroicons-heart"
            title="No pets yet"
            desc="Add your first pet to start tracking their health records, vet visits, and milestones."
          >
            <NuxtLink
              to="/pets/new"
              class="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[13px] text-dusk-950 text-[13px] font-bold uppercase tracking-[0.2px] bg-neon-300 border border-neon-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-300"
            >
              <UIcon name="i-heroicons-plus" class="w-4 h-4 shrink-0" />
              Add Your First Pet
            </NuxtLink>
          </EmptyBlock>

          <EmptyBlock
            v-else-if="filteredPets.length === 0"
            icon="i-heroicons-magnifying-glass"
            title="No matches"
            :desc="`No pets match “${search}”.`"
          />

          <div v-else class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <PetCard v-for="pet in filteredPets" :key="pet._id" :pet="pet" />
          </div>
        </PanelCard>

        <PanelCard
          title="Recent Activity"
          subtitle="Latest health records across all pets"
          icon="i-heroicons-clock"
          :padded="false"
        >
          <div v-if="isRecordsLoading" class="flex flex-col gap-2 p-5">
            <USkeleton v-for="i in 3" :key="i" class="h-12 rounded-xl" />
          </div>
          <EmptyBlock
            v-else-if="!recentRecords.length"
            icon="i-heroicons-clock"
            title="Nothing here yet"
            desc="Vet visits and vaccinations you log will show up here."
          />
          <ul v-else class="divide-y divide-border-dark">
            <li v-for="r in recentRecords" :key="r._id">
              <NuxtLink
                :to="`/pets/${r.petId}/health-records/${r._id}`"
                class="flex items-center gap-3 px-5 py-3 hover:bg-dusk-900 transition-colors focus-visible:outline-2 focus-visible:outline-sentry-500"
              >
                <span
                  class="w-8 h-8 rounded-lg grid place-items-center shrink-0 border"
                  :class="r.type === 'vet_visit'
                    ? 'bg-sentry-500/15 border-sentry-500/35 text-sentry-300'
                    : 'bg-neon-300/10 border-neon-300/30 text-neon-300'"
                >
                  <UIcon :name="r.type === 'vet_visit' ? 'i-heroicons-clipboard-document-list' : 'i-heroicons-beaker'" class="w-4 h-4" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-white text-sm font-medium truncate">{{ r.title }}</span>
                  <span class="block text-dusk-300 text-xs truncate">
                    {{ petName.get(r.petId) ?? 'Pet' }} · {{ r.type === 'vet_visit' ? 'Vet visit' : 'Vaccination' }}
                  </span>
                </span>
                <span class="text-dusk-300 text-xs whitespace-nowrap">{{ formatDate(r.date) }}</span>
              </NuxtLink>
            </li>
          </ul>
        </PanelCard>
      </div>

      <div class="flex flex-col gap-5 min-w-0">
        <PanelCard
          title="Upcoming Reminders"
          :subtitle="reminders.length ? `${reminders.length} in the next ${REMINDER_WINDOW_DAYS} days` : 'Vaccine boosters and vet follow-ups'"
          icon="i-heroicons-bell"
          :padded="false"
        >
          <div v-if="isRecordsLoading" class="flex flex-col gap-2 p-5">
            <USkeleton v-for="i in 2" :key="i" class="h-12 rounded-xl" />
          </div>
          <EmptyBlock
            v-else-if="!reminders.length"
            icon="i-heroicons-bell"
            title="All clear"
            desc="Add a next due date to a vaccination or a follow-up date to a vet visit and it will show up here."
          />
          <ul v-else class="divide-y divide-border-dark">
            <li v-for="item in reminders.slice(0, 6)" :key="item.record._id">
              <NuxtLink
                :to="`/pets/${item.record.petId}/health-records/${item.record._id}`"
                class="flex items-center gap-3 px-5 py-3 hover:bg-dusk-900 transition-colors focus-visible:outline-2 focus-visible:outline-sentry-500"
              >
                <span class="min-w-0 flex-1">
                  <span class="block text-white text-sm font-medium truncate">
                    {{ item.record.metadata?.vaccineName || item.record.title }}
                  </span>
                  <span class="block text-dusk-300 text-xs truncate">
                    {{ petName.get(item.record.petId) ?? 'Pet' }} · {{ item.kind === 'vaccination' ? 'Next dose' : 'Follow-up' }} · {{ formatDate(item.dueDate) }}
                  </span>
                </span>
                <DueBadge :status="item.status" :label="dueLabel(item.days)" />
              </NuxtLink>
            </li>
          </ul>
        </PanelCard>

        <PanelCard title="Quick actions" icon="i-heroicons-sparkles" :padded="false">
          <div class="p-4 grid grid-cols-2 gap-2">
            <button
              v-for="q in quickActions"
              :key="q.id"
              type="button"
              class="flex flex-col items-start gap-2.5 p-3.5 rounded-xl text-white text-[13px] font-medium text-left cursor-pointer bg-dusk-900 border border-border-dark hover:border-sentry-500 transition-colors focus-visible:outline-2 focus-visible:outline-sentry-500"
              @click="runQuickAction(q.id)"
            >
              <UIcon :name="q.icon" class="w-[18px] h-[18px] text-sentry-300" />
              {{ q.label }}
            </button>
            <NuxtLink
              to="/pets/new"
              class="flex flex-col items-start gap-2.5 p-3.5 rounded-xl text-white text-[13px] font-medium bg-dusk-900 border border-border-dark hover:border-sentry-500 transition-colors focus-visible:outline-2 focus-visible:outline-sentry-500"
            >
              <UIcon name="i-heroicons-plus-circle" class="w-[18px] h-[18px] text-sentry-300" />
              Add pet
            </NuxtLink>
          </div>
        </PanelCard>

        <PanelCard title="Health snapshot" subtitle="Across all pets" icon="i-heroicons-heart" :padded="false">
          <div class="p-5 flex flex-col gap-4">
            <div v-for="row in snapshot" :key="row.label">
              <div class="flex justify-between gap-3 text-xs mb-1.5">
                <span class="text-gray-200">{{ row.label }}</span>
                <span class="text-dusk-300 font-semibold whitespace-nowrap">{{ row.hint }}</span>
              </div>
              <div
                class="h-1.5 rounded-full overflow-hidden bg-dusk-900"
                role="progressbar"
                :aria-label="row.label"
                :aria-valuenow="Math.round(row.pct)"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div class="h-full rounded-full transition-[width] duration-300" :class="row.tone" :style="{ width: `${row.pct}%` }" />
              </div>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>

    <!-- Pet picker for quick actions -->
    <UModal v-model:open="isPickerOpen" title="Choose a pet">
      <template #body>
        <ul class="flex flex-col gap-2">
          <li v-for="pet in pets" :key="pet._id">
            <button
              type="button"
              class="w-full flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer bg-dusk-900 border border-border-dark hover:border-sentry-500 transition-colors focus-visible:outline-2 focus-visible:outline-sentry-500"
              @click="pickPet(pet._id)"
            >
              <UAvatar :src="pet.photo ?? undefined" :icon="pet.photo ? undefined : 'i-heroicons-user'" :alt="pet.name" size="md" />
              <span class="min-w-0">
                <span class="block text-white text-sm font-semibold truncate">{{ pet.name }}</span>
                <span class="block text-dusk-300 text-xs truncate capitalize">{{ pet.breed || pet.species }}</span>
              </span>
            </button>
          </li>
        </ul>
      </template>
    </UModal>
  </div>
</template>
