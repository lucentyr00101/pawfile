<script setup lang="ts">
import type { HealthRecord, Pet } from '#shared/types/models'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const toast = useToast()

const { data: pet, status, error, refresh } = useFetch<Pet>(`/api/pets/${id}`, { lazy: true })

const isLoading = computed(() => status.value === 'pending')

watch(error, (err) => {
  if (err?.statusCode === 404) {
    navigateTo('/dashboard')
  }
})

function apiErrorMessage(err: unknown) {
  const e = err as { data?: { statusMessage?: string, message?: string } }
  return e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
}

const petAge = computed(() => pet.value?.birthday ? formatPetAge(pet.value.birthday) : null)

// ── Tabs (synced to ?tab= so refresh/back/share keep the view) ─────────────
type TabId = 'overview' | 'health' | 'timeline' | 'meds' | 'documents'
const tabs: { id: TabId, label: string, icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'i-heroicons-home' },
  { id: 'health', label: 'Health Records', icon: 'i-heroicons-heart' },
  { id: 'timeline', label: 'Timeline', icon: 'i-heroicons-clock' },
  { id: 'documents', label: 'Documents', icon: 'i-heroicons-document' },
  { id: 'meds', label: 'Medications', icon: 'i-heroicons-sparkles' },
]

const tab = computed<TabId>({
  get: () => {
    const q = route.query.tab as TabId
    return tabs.some(t => t.id === q) ? q : 'overview'
  },
  set: (value) => {
    router.replace({ query: { ...route.query, tab: value === 'overview' ? undefined : value } })
  },
})

function onTabKeydown(event: KeyboardEvent, index: number) {
  const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!delta) return
  event.preventDefault()
  const next = tabs[(index + delta + tabs.length) % tabs.length]!
  tab.value = next.id
  nextTick(() => document.getElementById(`tab-${next.id}`)?.focus())
}

// ── Health records ──────────────────────────────────────────────────────────
const { data: allHealthRecords, status: healthStatus } = useFetch<HealthRecord[]>(
  `/api/pets/${id}/health-records`,
  { lazy: true, default: () => [] },
)
const isHealthLoading = computed(() => healthStatus.value === 'pending')

const activeFilter = ref<'all' | 'vet_visit' | 'vaccination'>('all')
const healthRecords = computed(() => {
  if (activeFilter.value === 'all') return allHealthRecords.value
  return allHealthRecords.value.filter(r => r.type === activeFilter.value)
})

const dueItems = computed(() => getDueItems(allHealthRecords.value))
const dueByRecord = computed(() => new Map(dueItems.value.map(item => [item.record._id, item])))
const nextDue = computed(() => dueItems.value[0])

const vaccinationCount = computed(() => allHealthRecords.value.filter(r => r.type === 'vaccination').length)
const lastVetVisit = computed(() => allHealthRecords.value.find(r => r.type === 'vet_visit'))
const recentRecords = computed(() => allHealthRecords.value.slice(0, 5))
const attachmentCount = computed(() =>
  allHealthRecords.value.reduce((n, r) => n + (r.attachments?.length ?? 0), 0),
)

const vitals = computed(() => [
  { k: 'Records', v: String(allHealthRecords.value.length), tone: 'text-white' },
  { k: 'Vaccines', v: String(vaccinationCount.value), tone: 'text-white' },
  { k: 'Last vet', v: lastVetVisit.value ? formatDate(lastVetVisit.value.date) : '—', tone: 'text-white' },
  {
    k: 'Next due',
    v: nextDue.value ? formatDate(nextDue.value.dueDate) : '—',
    tone: nextDue.value?.status === 'overdue'
      ? 'text-red-400'
      : nextDue.value?.status === 'due-soon' ? 'text-amber-400' : 'text-white',
  },
])

// Timeline grouped by month, newest first
const timelineGroups = computed(() => {
  const groups: { label: string, records: HealthRecord[] }[] = []
  for (const r of allHealthRecords.value) {
    const label = new Date(r.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    const last = groups.at(-1)
    if (last?.label === label) last.records.push(r)
    else groups.push({ label, records: [r] })
  }
  return groups
})

function openRecord(record: HealthRecord) {
  navigateTo(`/pets/${id}/health-records/${record._id}`)
}

// ── Add record ──────────────────────────────────────────────────────────────
const isAddOpen = ref(false)

function selectType(type: 'vet_visit' | 'vaccination') {
  isAddOpen.value = false
  navigateTo(`/pets/${id}/health-records/new?type=${type}`)
}

// ── Public link ─────────────────────────────────────────────────────────────
const publicUrl = `${useRequestURL().origin}/p/${id}`

async function copyPublicLink() {
  try {
    await navigator.clipboard.writeText(publicUrl)
    toast.add({ title: 'Link copied', description: 'Anyone with this link can view the public profile.', color: 'success' })
  }
  catch {
    toast.add({ title: 'Couldn\'t copy link', description: publicUrl, color: 'warning' })
  }
}

// ── Photo upload ────────────────────────────────────────────────────────────
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_SIZE = 5 * 1024 * 1024

const fileInput = ref<HTMLInputElement | null>(null)
const isPreviewOpen = ref(false)
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const isRemoveOpen = ref(false)
const isRemoving = ref(false)

function openFilePicker() {
  fileInput.value?.click()
}

function resetFileInput() {
  if (fileInput.value) fileInput.value.value = ''
}

function clearPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  selectedFile.value = null
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    toast.add({ title: 'Unsupported file type', description: 'Photo must be a JPEG, PNG, or WebP image.', color: 'error' })
    resetFileInput()
    return
  }

  if (file.size > MAX_PHOTO_SIZE) {
    toast.add({ title: 'File too large', description: 'Photo must be 5MB or smaller.', color: 'error' })
    resetFileInput()
    return
  }

  clearPreview()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  isPreviewOpen.value = true
}

function cancelPreview() {
  isPreviewOpen.value = false
  clearPreview()
  resetFileInput()
}

async function confirmUpload() {
  if (!selectedFile.value) return

  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('photo', selectedFile.value)
    await $fetch(`/api/pets/${id}/photo`, { method: 'POST', body: formData })
    await refresh()
    toast.add({ title: 'Photo updated', description: `${pet.value?.name}'s photo has been updated.`, color: 'success' })
    isPreviewOpen.value = false
    clearPreview()
    resetFileInput()
  }
  catch (err: unknown) {
    toast.add({ title: 'Upload failed', description: apiErrorMessage(err), color: 'error' })
  }
  finally {
    isUploading.value = false
  }
}

async function confirmRemovePhoto() {
  isRemoving.value = true
  try {
    await $fetch(`/api/pets/${id}/photo`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: 'Photo removed', description: `${pet.value?.name}'s photo has been removed.`, color: 'success' })
    isRemoveOpen.value = false
  }
  catch (err: unknown) {
    toast.add({ title: 'Failed to remove photo', description: apiErrorMessage(err), color: 'error' })
  }
  finally {
    isRemoving.value = false
  }
}

const photoMenuItems = computed(() => {
  const items: { label: string, icon: string, onSelect: () => void, color?: 'error' }[] = [
    { label: pet.value?.photo ? 'Change photo' : 'Add photo', icon: 'i-heroicons-arrow-up-tray', onSelect: openFilePicker },
  ]
  if (pet.value?.photo) {
    items.push({ label: 'Remove photo', icon: 'i-heroicons-trash', color: 'error', onSelect: () => { isRemoveOpen.value = true } })
  }
  return items
})

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

// ── Delete pet ──────────────────────────────────────────────────────────────
const isDeleteOpen = ref(false)
const isDeleting = ref(false)

async function confirmDelete() {
  isDeleting.value = true
  try {
    await $fetch(`/api/pets/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Pet deleted', description: `${pet.value?.name} has been removed from your profile.`, color: 'success' })
    await navigateTo('/pets')
  }
  catch (err: unknown) {
    toast.add({ title: 'Failed to delete pet', description: apiErrorMessage(err), color: 'error' })
  }
  finally {
    isDeleting.value = false
  }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const iconBtn = 'pointer-coarse:min-h-11 pointer-coarse:min-w-11 justify-center'
</script>

<template>
  <div class="w-full px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-5 min-w-0">
    <!-- Breadcrumb -->
    <NuxtLink
      to="/pets"
      class="inline-flex items-center gap-1.5 text-[13px] text-dusk-300 hover:text-white transition-colors w-fit"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 shrink-0" />
      <span>My Pets{{ pet ? ' /' : '' }}</span>
      <span v-if="pet" class="text-white">{{ pet.name }}</span>
    </NuxtLink>

    <!-- Loading -->
    <template v-if="isLoading">
      <USkeleton class="h-44 rounded-2xl" />
      <USkeleton class="h-12 w-full max-w-xl rounded-xl" />
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <USkeleton class="h-72 rounded-2xl xl:col-span-2" />
        <USkeleton class="h-72 rounded-2xl" />
      </div>
    </template>

    <!-- Error -->
    <template v-else-if="error">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-dusk-300 mb-4" />
        <p class="text-white text-xl font-semibold mb-2">
          Pet not found
        </p>
        <p class="text-dusk-300 text-sm mb-6">
          This pet profile doesn't exist or you don't have access.
        </p>
        <UButton to="/pets" color="primary">
          Back to My Pets
        </UButton>
      </div>
    </template>

    <template v-else-if="pet">
      <!-- Hero -->
      <div class="rounded-2xl p-5 sm:p-6 grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-x-5 gap-y-4 items-center bg-dusk-950 border border-border-dark">
        <!-- Avatar -->
        <div class="relative self-start">
          <button
            type="button"
            class="group relative rounded-full cursor-pointer shadow-[0_0_40px_rgba(106,95,193,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sentry-500"
            :aria-label="pet.photo ? 'Change photo' : 'Add photo'"
            :disabled="isUploading || isRemoving"
            @click="openFilePicker"
          >
            <UAvatar
              :src="pet.photo ?? undefined"
              :icon="!pet.photo ? 'i-heroicons-user' : undefined"
              :alt="pet.photo ? pet.name : undefined"
              size="3xl"
              class="ring-2 ring-border-dark"
            />
            <span
              class="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1 text-white text-[10px] font-semibold uppercase tracking-[0.3px] bg-dusk-950/65 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150"
            >
              <UIcon name="i-heroicons-camera" class="w-5 h-5" />
              <span>{{ pet.photo ? 'Change' : 'Add photo' }}</span>
            </span>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="onFileChange"
          >
        </div>

        <!-- Identity + vitals -->
        <div class="min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="text-[10px] font-bold uppercase text-dusk-300 tracking-[0.3px]">{{ pet.species }}</span>
            <span
              v-if="pet.isPublic"
              class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-[0.3px] text-neon-300 bg-neon-300/12 border border-neon-300/35"
            >Public profile</span>
          </div>
          <h1 class="mt-1 mb-0.5 text-white text-[26px] sm:text-[28px] font-semibold leading-tight tracking-[-0.01em] break-words">
            {{ pet.name }}
          </h1>
          <div class="text-dusk-300 text-sm">
            {{ pet.breed || '—' }}
            <template v-if="petAge">
              · {{ petAge }}
            </template>
            <template v-if="pet.weight != null">
              · {{ pet.weight }} kg
            </template>
          </div>

          <dl class="flex gap-x-5 gap-y-2 mt-3.5 flex-wrap">
            <div v-for="s in vitals" :key="s.k">
              <dt class="text-[10px] font-semibold uppercase text-dusk-300 whitespace-nowrap tracking-[0.25px]">
                {{ s.k }}
              </dt>
              <dd class="text-sm font-semibold mt-0.5 whitespace-nowrap" :class="s.tone">
                {{ isHealthLoading ? '…' : s.v }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Actions -->
        <div class="col-span-2 md:col-span-1 flex flex-wrap gap-2 md:self-start md:justify-end">
          <UButton
            v-if="pet.isPublic"
            color="secondary"
            variant="outline"
            icon="i-heroicons-link"
            :class="iconBtn"
            @click="copyPublicLink"
          >
            Copy link
          </UButton>
          <UButton
            :to="`/pets/${id}/edit`"
            color="secondary"
            variant="solid"
            icon="i-heroicons-pencil-square"
            :class="iconBtn"
          >
            Edit
          </UButton>
          <UDropdownMenu :items="photoMenuItems">
            <UButton
              color="secondary"
              variant="ghost"
              icon="i-heroicons-photo"
              aria-label="Photo options"
              :class="iconBtn"
            />
          </UDropdownMenu>
          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            aria-label="Delete pet"
            :class="iconBtn"
            @click="() => { isDeleteOpen = true }"
          />
        </div>
      </div>

      <!-- Tabs -->
      <div
        role="tablist"
        aria-label="Pet sections"
        class="flex gap-1 p-1 w-fit max-w-full overflow-x-auto rounded-xl bg-dusk-950 border border-border-dark"
      >
        <button
          v-for="(t, i) in tabs"
          :id="`tab-${t.id}`"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="t.id === tab"
          :aria-controls="`panel-${t.id}`"
          :tabindex="t.id === tab ? 0 : -1"
          class="inline-flex items-center gap-2 px-3.5 py-2 pointer-coarse:py-3 rounded-lg text-[13px] cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-sentry-500"
          :class="t.id === tab ? 'text-white font-semibold bg-violet-deep' : 'text-dusk-300 font-medium hover:text-white'"
          @click="() => { tab = t.id }"
          @keydown="onTabKeydown($event, i)"
        >
          <UIcon :name="t.icon" class="w-3.5 h-3.5" />
          {{ t.label }}
        </button>
      </div>

      <!-- Overview tab -->
      <div
        v-if="tab === 'overview'"
        id="panel-overview"
        role="tabpanel"
        aria-labelledby="tab-overview"
        class="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start"
      >
        <div class="flex flex-col gap-5 xl:col-span-2 min-w-0">
          <PanelCard
            title="Recent activity"
            :subtitle="allHealthRecords.length ? `Latest of ${allHealthRecords.length} records` : 'Everything logged for this pet'"
            icon="i-heroicons-clock"
            :padded="false"
          >
            <template v-if="allHealthRecords.length" #right>
              <UButton size="sm" variant="ghost" color="secondary" trailing-icon="i-heroicons-arrow-right" @click="() => { tab = 'timeline' }">
                View all
              </UButton>
            </template>

            <div v-if="isHealthLoading" class="flex flex-col gap-3 px-5 py-4">
              <USkeleton v-for="i in 3" :key="i" class="h-14 rounded-xl w-full" />
            </div>
            <EmptyBlock
              v-else-if="!recentRecords.length"
              icon="i-heroicons-clock"
              title="No events logged yet"
              desc="Vet visits and vaccinations will show up here in chronological order."
            >
              <UButton color="primary" size="sm" icon="i-heroicons-plus" @click="() => { isAddOpen = true }">
                Add Record
              </UButton>
            </EmptyBlock>
            <ol v-else class="px-5 py-4 flex flex-col">
              <li v-for="r in recentRecords" :key="r._id" class="relative pl-6 pb-4 last:pb-0">
                <span class="absolute left-[5px] top-3 bottom-0 w-px bg-border-dark" aria-hidden="true" />
                <span
                  class="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-dusk-950"
                  :class="r.type === 'vet_visit' ? 'bg-sentry-300' : 'bg-neon-300'"
                  aria-hidden="true"
                />
                <NuxtLink
                  :to="`/pets/${id}/health-records/${r._id}`"
                  class="block rounded-lg -mx-2 px-2 py-1 hover:bg-dusk-900 transition-colors focus-visible:outline-2 focus-visible:outline-sentry-500"
                >
                  <div class="flex items-baseline justify-between gap-3">
                    <span class="text-white text-sm font-medium truncate">{{ r.title }}</span>
                    <span class="text-dusk-300 text-xs whitespace-nowrap">{{ formatDate(r.date) }}</span>
                  </div>
                  <div class="text-[10px] font-semibold uppercase tracking-[0.25px] mt-0.5" :class="r.type === 'vet_visit' ? 'text-sentry-300' : 'text-neon-300'">
                    {{ r.type === 'vet_visit' ? 'Vet Visit' : 'Vaccination' }}
                  </div>
                </NuxtLink>
              </li>
            </ol>
          </PanelCard>

          <PanelCard
            v-if="dueItems.length"
            title="Upcoming"
            subtitle="Next doses and follow-ups"
            icon="i-heroicons-bell"
            :padded="false"
          >
            <ul class="divide-y divide-border-dark">
              <li v-for="item in dueItems" :key="item.record._id">
                <NuxtLink
                  :to="`/pets/${id}/health-records/${item.record._id}`"
                  class="flex items-center gap-3 px-5 py-3 hover:bg-dusk-900 transition-colors focus-visible:outline-2 focus-visible:outline-sentry-500"
                >
                  <div class="min-w-0 flex-1">
                    <div class="text-white text-sm font-medium truncate">
                      {{ item.record.metadata?.vaccineName || item.record.title }}
                    </div>
                    <div class="text-dusk-300 text-xs">
                      {{ item.kind === 'vaccination' ? 'Next dose' : 'Vet follow-up' }} · {{ formatDate(item.dueDate) }}
                    </div>
                  </div>
                  <DueBadge :status="item.status" :label="dueLabel(item.days)" />
                </NuxtLink>
              </li>
            </ul>
          </PanelCard>
        </div>

        <div class="flex flex-col gap-5 min-w-0">
          <PanelCard title="Details" icon="i-heroicons-identification">
            <dl class="px-5 divide-y divide-border-dark">
              <div class="flex justify-between items-center gap-3 py-3">
                <dt class="text-[10px] font-semibold uppercase text-dusk-300 tracking-[0.25px]">
                  Birthday
                </dt>
                <dd class="text-sm text-right">
                  <template v-if="pet.birthday">
                    <span class="text-white">{{ formatDate(pet.birthday, 'long') }}</span>
                    <span class="text-dusk-300 ml-1">· {{ petAge }}</span>
                  </template>
                  <span v-else class="text-dusk-300">—</span>
                </dd>
              </div>
              <div class="flex justify-between items-center gap-3 py-3">
                <dt class="text-[10px] font-semibold uppercase text-dusk-300 tracking-[0.25px]">
                  Gender
                </dt>
                <dd class="text-sm" :class="pet.gender ? 'text-white' : 'text-dusk-300'">
                  {{ pet.gender ? capitalize(pet.gender) : '—' }}
                </dd>
              </div>
              <div class="flex justify-between items-center gap-3 py-3">
                <dt class="text-[10px] font-semibold uppercase text-dusk-300 tracking-[0.25px]">
                  Weight
                </dt>
                <dd class="text-sm">
                  <template v-if="pet.weight != null">
                    <span class="text-white">{{ pet.weight }}</span>
                    <span class="text-dusk-300 ml-1">kg</span>
                  </template>
                  <span v-else class="text-dusk-300">—</span>
                </dd>
              </div>
              <div class="flex justify-between items-center gap-3 py-3">
                <dt class="text-[10px] font-semibold uppercase text-dusk-300 tracking-[0.25px]">
                  Visibility
                </dt>
                <dd class="text-sm text-white flex items-center gap-2">
                  {{ pet.isPublic ? 'Public' : 'Private' }}
                  <NuxtLink
                    v-if="pet.isPublic"
                    :to="`/p/${id}`"
                    target="_blank"
                    class="text-sentry-300 hover:underline text-xs"
                  >
                    View page
                  </NuxtLink>
                </dd>
              </div>
            </dl>
            <div v-if="pet.notes" class="px-5 pt-3 pb-4 border-t border-border-dark">
              <div class="text-[10px] font-semibold uppercase text-dusk-300 mb-1.5 tracking-[0.25px]">
                Notes
              </div>
              <div class="text-gray-200 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                {{ pet.notes }}
              </div>
            </div>
          </PanelCard>

          <PanelCard
            title="Documents"
            :subtitle="attachmentCount ? `${attachmentCount} ${attachmentCount === 1 ? 'file' : 'files'} across health records` : 'Lab results, prescriptions, certificates'"
            icon="i-heroicons-document"
            :padded="false"
          >
            <template v-if="attachmentCount > 4" #right>
              <UButton size="sm" variant="ghost" color="secondary" trailing-icon="i-heroicons-arrow-right" @click="() => { tab = 'documents' }">
                All
              </UButton>
            </template>
            <AttachmentList v-if="attachmentCount" :records="allHealthRecords" :pet-id="id" :limit="4" />
            <EmptyBlock
              v-else
              icon="i-heroicons-document"
              title="No documents yet"
              desc="Attach PDFs and images to a health record to keep them here."
            />
          </PanelCard>
        </div>
      </div>

      <!-- Health Records tab -->
      <div v-else-if="tab === 'health'" id="panel-health" role="tabpanel" aria-labelledby="tab-health">
        <PanelCard
          title="Health Records"
          subtitle="All health events for this pet"
          icon="i-heroicons-heart"
          :padded="false"
        >
          <template #right>
            <UButton color="primary" size="sm" icon="i-heroicons-plus" class="pointer-coarse:min-h-11" @click="() => { isAddOpen = true }">
              Add Record
            </UButton>
          </template>

          <div class="flex gap-2 px-5 py-3.5 flex-wrap border-b border-border-dark" role="group" aria-label="Filter records">
            <button
              v-for="f in [
                { key: 'all' as const, label: 'All' },
                { key: 'vet_visit' as const, label: 'Vet Visits' },
                { key: 'vaccination' as const, label: 'Vaccinations' },
              ]"
              :key="f.key"
              type="button"
              :aria-pressed="activeFilter === f.key"
              class="inline-flex items-center px-3 py-1 pointer-coarse:py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-[0.2px] cursor-pointer transition-colors border focus-visible:outline-2 focus-visible:outline-sentry-500"
              :class="activeFilter === f.key
                ? 'bg-violet-deep text-white border-sentry-500'
                : 'bg-transparent text-dusk-300 border-border-dark hover:text-white'"
              @click="() => { activeFilter = f.key }"
            >
              {{ f.label }}
            </button>
          </div>

          <div v-if="isHealthLoading" class="flex flex-col gap-3 px-5 py-4">
            <USkeleton v-for="i in 3" :key="i" class="h-[72px] rounded-xl w-full" />
          </div>

          <EmptyBlock
            v-else-if="!healthRecords.length"
            icon="i-heroicons-heart"
            title="No health records yet"
            :desc="activeFilter === 'all'
              ? `Start tracking ${pet.name}'s health by adding a vet visit or vaccination.`
              : activeFilter === 'vet_visit'
                ? 'No vet visits recorded yet.'
                : 'No vaccinations recorded yet.'"
          >
            <UButton color="primary" size="sm" icon="i-heroicons-plus" @click="() => { isAddOpen = true }">
              Add Record
            </UButton>
          </EmptyBlock>

          <div v-else class="flex flex-col gap-3 px-5 py-4">
            <HealthRecordCard
              v-for="record in healthRecords"
              :key="record._id"
              :record="record"
              :due="dueByRecord.get(record._id)"
              @click="openRecord"
            />
          </div>
        </PanelCard>
      </div>

      <!-- Timeline tab -->
      <div v-else-if="tab === 'timeline'" id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline">
        <PanelCard
          title="Full Timeline"
          subtitle="All events for this pet, newest first"
          icon="i-heroicons-clock"
          :padded="false"
        >
          <div v-if="isHealthLoading" class="flex flex-col gap-3 px-5 py-4">
            <USkeleton v-for="i in 3" :key="i" class="h-[72px] rounded-xl w-full" />
          </div>
          <EmptyBlock
            v-else-if="!timelineGroups.length"
            icon="i-heroicons-clock"
            title="No events logged yet"
            desc="Once you log vet visits and vaccinations, they'll appear here."
          />
          <div v-else class="px-5 py-4 flex flex-col gap-5">
            <section v-for="group in timelineGroups" :key="group.label">
              <h3 class="text-[10px] font-semibold uppercase text-dusk-300 tracking-[0.25px] mb-2">
                {{ group.label }}
              </h3>
              <div class="flex flex-col gap-3">
                <HealthRecordCard
                  v-for="record in group.records"
                  :key="record._id"
                  :record="record"
                  :due="dueByRecord.get(record._id)"
                  @click="openRecord"
                />
              </div>
            </section>
          </div>
        </PanelCard>
      </div>

      <!-- Documents tab -->
      <div v-else-if="tab === 'documents'" id="panel-documents" role="tabpanel" aria-labelledby="tab-documents">
        <PanelCard
          title="All Documents"
          subtitle="Files attached to this pet's health records"
          icon="i-heroicons-document"
          :padded="false"
        >
          <AttachmentList v-if="attachmentCount" :records="allHealthRecords" :pet-id="id" />
          <EmptyBlock
            v-else
            icon="i-heroicons-document"
            title="No documents yet"
            desc="Open a health record and use “Add” under Attachments to upload PDFs and images."
          />
        </PanelCard>
      </div>

      <!-- Medications tab -->
      <div v-else-if="tab === 'meds'" id="panel-meds" role="tabpanel" aria-labelledby="tab-meds">
        <PanelCard title="Medications" icon="i-heroicons-sparkles" :padded="false">
          <EmptyBlock
            icon="i-heroicons-sparkles"
            title="Medication tracking is coming soon"
            :desc="`You'll be able to track ${pet.name}'s prescriptions, dosages, and schedules here. For now, note medications on a vet visit.`"
          />
        </PanelCard>
      </div>
    </template>

    <!-- Photo preview / upload modal -->
    <UModal v-model:open="isPreviewOpen" title="Upload photo" :dismissible="!isUploading">
      <template #body>
        <div class="flex flex-col items-center gap-4">
          <div class="w-full rounded-xl overflow-hidden flex items-center justify-center bg-dusk-900 border border-border-dark min-h-[220px]">
            <img
              v-if="previewUrl"
              :src="previewUrl"
              :alt="selectedFile?.name"
              class="max-h-[320px] w-auto object-contain"
            >
          </div>
          <p v-if="selectedFile" class="text-dusk-300 text-xs truncate w-full text-center">
            {{ selectedFile.name }} · {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton variant="ghost" :disabled="isUploading" @click="cancelPreview">
            Cancel
          </UButton>
          <UButton color="primary" :loading="isUploading" @click="confirmUpload">
            Upload
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Remove photo confirmation modal -->
    <UModal v-model:open="isRemoveOpen" title="Remove Photo" :dismissible="!isRemoving">
      <template #body>
        <p class="text-gray-200 text-sm">
          Are you sure you want to remove
          <strong class="text-white">{{ pet?.name }}</strong>'s photo?
        </p>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton variant="ghost" :disabled="isRemoving" @click="() => { isRemoveOpen = false }">
            Cancel
          </UButton>
          <UButton color="error" :loading="isRemoving" @click="confirmRemovePhoto">
            Remove
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Add Health Record modal -->
    <UModal v-model:open="isAddOpen" title="Add Health Record">
      <template #body>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            class="flex flex-col items-center gap-3 rounded-xl px-4 py-6 text-center cursor-pointer transition-colors duration-150 bg-dusk-900 border border-border-dark hover:border-sentry-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sentry-500"
            @click="selectType('vet_visit')"
          >
            <span class="w-11 h-11 rounded-xl grid place-items-center bg-sentry-500/15 border border-sentry-500/35 text-sentry-300">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5" />
            </span>
            <span>
              <span class="block text-white text-sm font-semibold">Vet Visit</span>
              <span class="block text-dusk-300 text-xs mt-0.5 leading-relaxed">Log a clinic visit, checkup, or treatment</span>
            </span>
          </button>

          <button
            type="button"
            class="flex flex-col items-center gap-3 rounded-xl px-4 py-6 text-center cursor-pointer transition-colors duration-150 bg-dusk-900 border border-border-dark hover:border-neon-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sentry-500"
            @click="selectType('vaccination')"
          >
            <span class="w-11 h-11 rounded-xl grid place-items-center bg-neon-300/10 border border-neon-300/30 text-neon-300">
              <UIcon name="i-heroicons-beaker" class="w-5 h-5" />
            </span>
            <span>
              <span class="block text-white text-sm font-semibold">Vaccination</span>
              <span class="block text-dusk-300 text-xs mt-0.5 leading-relaxed">Record a vaccine with due date tracking</span>
            </span>
          </button>
        </div>
      </template>
    </UModal>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="isDeleteOpen" title="Delete Pet" :dismissible="!isDeleting">
      <template #body>
        <p class="text-gray-200 text-sm">
          Are you sure you want to delete
          <strong class="text-white">{{ pet?.name }}</strong>?
          All of their health records and attachments will be deleted too.
          This can't be undone.
        </p>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton variant="ghost" :disabled="isDeleting" @click="() => { isDeleteOpen = false }">
            Cancel
          </UButton>
          <UButton color="error" :loading="isDeleting" @click="confirmDelete">
            Delete
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
