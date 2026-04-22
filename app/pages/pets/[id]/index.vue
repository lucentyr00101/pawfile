<script setup lang="ts">
import type { HealthRecord } from '~/components/health/HealthRecordCard.vue'

definePageMeta({ middleware: 'auth' })

interface Pet {
  _id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  birthday?: string
  gender?: 'male' | 'female' | 'unknown'
  weight?: number
  photo?: string
  isPublic: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: pet, status, error, refresh } = useFetch<Pet>(`/api/pets/${id}`, { lazy: true })

const isLoading = computed(() => status.value === 'pending')

watch(error, (err) => {
  if (err?.statusCode === 404) {
    navigateTo('/dashboard')
  }
})

const formattedBirthday = computed(() => {
  if (!pet.value?.birthday) return null
  return new Date(pet.value.birthday).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const petAge = computed(() => {
  if (!pet.value?.birthday) return null

  const birth = new Date(pet.value.birthday)
  const now = new Date()

  let years = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    years--
  }

  if (years >= 1) {
    return `${years} ${years === 1 ? 'year' : 'years'} old`
  }

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months--
  if (months < 0) months = 0

  return `${months} ${months === 1 ? 'month' : 'months'} old`
})

type TabId = 'overview' | 'health' | 'timeline' | 'meds' | 'documents'
const validTabs: TabId[] = ['overview', 'health', 'timeline', 'meds', 'documents']
const queryTab = route.query.tab as TabId
const tab = ref<TabId>(validTabs.includes(queryTab) ? queryTab : 'overview')

const tabs: { id: TabId, label: string, icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'i-heroicons-home' },
  { id: 'health', label: 'Health Records', icon: 'i-heroicons-heart' },
  { id: 'timeline', label: 'Timeline', icon: 'i-heroicons-clock' },
  { id: 'meds', label: 'Medications', icon: 'i-heroicons-sparkles' },
  { id: 'documents', label: 'Documents', icon: 'i-heroicons-document' },
]

const isDeleteOpen = ref(false)
const isDeleting = ref(false)

// Photo upload state
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
    toast.add({
      title: 'Unsupported file type',
      description: 'Photo must be a JPEG, PNG, or WebP image.',
      color: 'error',
    })
    resetFileInput()
    return
  }

  if (file.size > MAX_PHOTO_SIZE) {
    toast.add({
      title: 'File too large',
      description: 'Photo must be 5MB or smaller.',
      color: 'error',
    })
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
    toast.add({
      title: 'Photo updated',
      description: `${pet.value?.name}'s photo has been updated.`,
      color: 'success',
    })
    isPreviewOpen.value = false
    clearPreview()
    resetFileInput()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string, message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Upload failed', description: message, color: 'error' })
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
    toast.add({
      title: 'Photo removed',
      description: `${pet.value?.name}'s photo has been removed.`,
      color: 'success',
    })
    isRemoveOpen.value = false
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string, message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Failed to remove photo', description: message, color: 'error' })
  }
  finally {
    isRemoving.value = false
  }
}

const photoMenuItems = computed(() => {
  const items: { label: string, icon: string, onSelect: () => void, color?: 'error' }[] = [
    {
      label: 'Change photo',
      icon: 'i-heroicons-arrow-up-tray',
      onSelect: openFilePicker,
    },
  ]
  if (pet.value?.photo) {
    items.push({
      label: 'Remove photo',
      icon: 'i-heroicons-trash',
      color: 'error',
      onSelect: () => { isRemoveOpen.value = true },
    })
  }
  return items
})

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

// Health records
const { data: allHealthRecords, status: healthStatus } = useFetch<HealthRecord[]>(
  `/api/pets/${id}/health-records`,
  { lazy: true },
)
const isHealthLoading = computed(() => healthStatus.value === 'pending')
const activeFilter = ref<'all' | 'vet_visit' | 'vaccination'>('all')
const healthRecords = computed(() => {
  if (!allHealthRecords.value) return []
  if (activeFilter.value === 'all') return allHealthRecords.value
  return allHealthRecords.value.filter(r => r.type === activeFilter.value)
})

// Add Record modal
const isAddOpen = ref(false)

function openAddRecord() {
  isAddOpen.value = true
}

function selectType(type: 'vet_visit' | 'vaccination') {
  isAddOpen.value = false
  navigateTo(`/pets/${id}/health-records/new?type=${type}`)
}

async function confirmDelete() {
  isDeleting.value = true
  try {
    await $fetch(`/api/pets/${id}`, { method: 'DELETE' })
    toast.add({
      title: 'Pet deleted',
      description: `${pet.value?.name} has been removed from your profile.`,
      color: 'success',
    })
    await navigateTo('/dashboard')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string, message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Failed to delete pet', description: message, color: 'error' })
  }
  finally {
    isDeleting.value = false
  }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
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
      <span>Dashboard / My Pets{{ pet ? ' /' : '' }}</span>
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
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-[#a49bc9] mb-4" />
        <p class="text-white text-xl font-semibold mb-2" style="font-family: Rubik, sans-serif">
          Pet not found
        </p>
        <p class="text-[#a49bc9] text-sm mb-6" style="font-family: Rubik, sans-serif">
          This pet profile doesn't exist or you don't have access.
        </p>
        <UButton to="/dashboard" color="primary">
          Back to Dashboard
        </UButton>
      </div>
    </template>

    <!-- Pet profile -->
    <template v-else-if="pet">

      <!-- Hero -->
      <div
        class="rounded-2xl p-6 grid gap-6 items-center"
        style="
          background: #150f23;
          border: 1px solid #362d59;
          grid-template-columns: auto 1fr auto;
        "
      >
        <!-- Avatar -->
        <div class="relative">
          <button
            type="button"
            class="group relative rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5fc1]"
            style="box-shadow: 0 0 40px rgba(106,95,193,0.3)"
            :aria-label="pet.photo ? 'Change or remove photo' : 'Add photo'"
            :disabled="isUploading || isRemoving"
            @click="openFilePicker"
          >
            <UAvatar
              :src="pet.photo"
              :icon="!pet.photo ? 'i-heroicons-user' : undefined"
              :alt="pet.photo ? pet.name : undefined"
              size="3xl"
              class="ring-2 ring-[#362d59]"
            />
            <span
              class="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1 text-white text-[10px] font-semibold uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style="background: rgba(21,15,35,0.65); letter-spacing: 0.3px; font-family: Rubik, sans-serif"
            >
              <UIcon name="i-heroicons-camera" class="w-5 h-5" />
              <span>{{ pet.photo ? 'Change' : 'Add photo' }}</span>
            </span>
          </button>
          <span
            v-if="pet.isPublic"
            class="pointer-events-none absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full"
            style="background: #c2ef4e; border: 2px solid #150f23"
            title="Public profile"
          />
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="onFileChange"
          >
        </div>

        <!-- Identity + stats -->
        <div class="min-w-0" style="font-family: Rubik, sans-serif">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span
              class="text-[10px] font-bold uppercase text-[#a49bc9]"
              style="letter-spacing: 0.3px"
            >{{ pet.species }}</span>
            <span
              v-if="pet.isPublic"
              class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
              style="
                color: #c2ef4e;
                background: color-mix(in oklch, #c2ef4e 12%, transparent);
                border: 1px solid color-mix(in oklch, #c2ef4e 35%, transparent);
                letter-spacing: 0.3px;
              "
            >Public profile</span>
          </div>
          <h1
            class="mt-1 mb-0.5 text-white text-[26px] sm:text-[28px] font-semibold leading-tight"
            style="letter-spacing: -0.01em"
          >
            {{ pet.name }}
          </h1>
          <div class="text-[#a49bc9] text-sm">
            {{ pet.breed || '—' }}
            <template v-if="petAge"> · {{ petAge }}</template>
            <template v-if="pet.weight != null"> · {{ pet.weight }} kg</template>
          </div>

          <!-- Vital stats -->
          <div class="flex gap-5 mt-3.5 flex-wrap">
            <div
              v-for="(s, i) in [
                { k: 'VACCINES', v: '—', tone: '#a49bc9' },
                { k: 'LAST VET', v: '—', tone: '#a49bc9' },
                { k: 'MEDS', v: '—', tone: '#a49bc9' },
                { k: 'NEXT DUE', v: '—', tone: '#a49bc9' },
              ]"
              :key="i"
            >
              <div
                class="text-[10px] font-semibold uppercase text-[#a49bc9] whitespace-nowrap"
                style="letter-spacing: 0.25px"
              >{{ s.k }}</div>
              <div
                class="text-sm font-semibold mt-0.5 whitespace-nowrap"
                :style="{ color: s.tone }"
              >{{ s.v }}</div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2 self-start">
          <UDropdownMenu :items="photoMenuItems">
            <UButton
              color="secondary"
              variant="ghost"
              icon="i-heroicons-photo"
              size="sm"
              aria-label="Photo options"
            />
          </UDropdownMenu>
          <UButton
            :to="`/pets/${id}/edit`"
            color="secondary"
            variant="solid"
            icon="i-heroicons-pencil-square"
            size="sm"
          >
            Edit
          </UButton>
          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            size="sm"
            @click="isDeleteOpen = true"
          />
        </div>
      </div>

      <!-- Tabs -->
      <div
        class="flex gap-1 p-1 w-fit max-w-full overflow-x-auto rounded-xl"
        style="background: #150f23; border: 1px solid #362d59; font-family: Rubik, sans-serif"
      >
        <button
          v-for="t in tabs"
          :key="t.id"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] cursor-pointer transition-colors whitespace-nowrap"
          :class="t.id === tab ? 'text-white font-semibold' : 'text-[#a49bc9] font-medium hover:text-white'"
          :style="t.id === tab ? 'background: #422082' : 'background: transparent'"
          @click="tab = t.id"
        >
          <UIcon :name="t.icon" class="w-3.5 h-3.5" />
          {{ t.label }}
        </button>
      </div>

      <!-- Overview tab -->
      <div
        v-if="tab === 'overview'"
        class="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start"
      >
        <!-- Left column -->
        <div class="flex flex-col gap-5 xl:col-span-2 min-w-0">
          <PanelCard
            title="Timeline"
            subtitle="Everything logged for this pet"
            icon="i-heroicons-clock"
            :padded="false"
          >
            <EmptyBlock
              icon="i-heroicons-clock"
              title="No events logged yet"
              desc="Vet visits, vaccinations, medications, and milestones will show up here in chronological order."
            />
          </PanelCard>

        </div>

        <!-- Right column -->
        <div class="flex flex-col gap-5 min-w-0">
          <PanelCard title="Details" icon="i-heroicons-identification">
            <div class="px-5">
              <div
                class="flex justify-between items-center py-3"
                style="border-bottom: 1px solid #362d59; font-family: Rubik, sans-serif"
              >
                <span
                  class="text-[10px] font-semibold uppercase text-[#a49bc9]"
                  style="letter-spacing: 0.25px"
                >Birthday</span>
                <span class="text-sm text-right">
                  <template v-if="formattedBirthday">
                    <span class="text-white">{{ formattedBirthday }}</span>
                    <span class="text-[#a49bc9] ml-1">· {{ petAge }}</span>
                  </template>
                  <span v-else class="text-[#a49bc9]">—</span>
                </span>
              </div>
              <div
                class="flex justify-between items-center py-3"
                style="border-bottom: 1px solid #362d59; font-family: Rubik, sans-serif"
              >
                <span
                  class="text-[10px] font-semibold uppercase text-[#a49bc9]"
                  style="letter-spacing: 0.25px"
                >Gender</span>
                <span
                  class="text-sm"
                  :class="pet.gender ? 'text-white' : 'text-[#a49bc9]'"
                >{{ pet.gender ? capitalize(pet.gender) : '—' }}</span>
              </div>
              <div
                class="flex justify-between items-center py-3"
                style="border-bottom: 1px solid #362d59; font-family: Rubik, sans-serif"
              >
                <span
                  class="text-[10px] font-semibold uppercase text-[#a49bc9]"
                  style="letter-spacing: 0.25px"
                >Weight</span>
                <span class="text-sm">
                  <template v-if="pet.weight != null">
                    <span class="text-white">{{ pet.weight }}</span>
                    <span class="text-[#a49bc9] ml-1">kg</span>
                  </template>
                  <span v-else class="text-[#a49bc9]">—</span>
                </span>
              </div>
              <div
                class="flex justify-between items-center py-3"
                style="font-family: Rubik, sans-serif"
              >
                <span
                  class="text-[10px] font-semibold uppercase text-[#a49bc9]"
                  style="letter-spacing: 0.25px"
                >Visibility</span>
                <span class="text-sm text-white">
                  {{ pet.isPublic ? 'Public' : 'Private' }}
                </span>
              </div>
            </div>
            <div
              v-if="pet.notes"
              class="px-5 pt-3 pb-4"
              style="border-top: 1px solid #362d59"
            >
              <div
                class="text-[10px] font-semibold uppercase text-[#a49bc9] mb-1.5"
                style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
              >Notes</div>
              <div
                class="text-[#e5e7eb] text-[13px] leading-relaxed whitespace-pre-wrap"
                style="font-family: Rubik, sans-serif"
              >
                {{ pet.notes }}
              </div>
            </div>
          </PanelCard>

          <PanelCard
            title="Weight"
            subtitle="History coming soon"
            icon="i-heroicons-scale"
            :padded="false"
          >
            <div class="px-5 py-5" style="font-family: Rubik, sans-serif">
              <div class="flex items-baseline gap-2.5">
                <span
                  class="text-white text-[28px] font-bold"
                  style="letter-spacing: -0.01em"
                >{{ pet.weight ?? '—' }}</span>
                <span class="text-[#a49bc9] text-sm">{{ pet.weight != null ? 'kg' : '' }}</span>
              </div>
              <div class="text-[#a49bc9] text-xs mt-2">
                Log weight over time to see trends here.
              </div>
            </div>
          </PanelCard>

          <PanelCard
            title="Documents"
            subtitle="Lab results, prescriptions, certificates"
            icon="i-heroicons-document"
            :padded="false"
          >
            <EmptyBlock
              icon="i-heroicons-document"
              title="No documents yet"
              desc="Upload PDFs and images to keep all of your pet's records in one place."
            />
          </PanelCard>
        </div>
      </div>

      <!-- Health Records tab -->
      <PanelCard
        v-else-if="tab === 'health'"
        title="Health Records"
        subtitle="All health events for this pet"
        icon="i-heroicons-heart"
        :padded="false"
      >
        <template #right>
          <UButton
            color="primary"
            size="sm"
            icon="i-heroicons-plus"
            @click="openAddRecord"
          >
            Add Record
          </UButton>
        </template>

        <!-- Filter pills -->
        <div
          class="flex gap-2 px-5 py-3.5 flex-wrap"
          style="border-bottom: 1px solid #362d59; font-family: Rubik, sans-serif"
        >
          <button
            v-for="f in [
              { key: 'all' as const, label: 'All' },
              { key: 'vet_visit' as const, label: 'Vet Visits' },
              { key: 'vaccination' as const, label: 'Vaccinations' },
            ]"
            :key="f.key"
            type="button"
            class="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold uppercase cursor-pointer transition-colors"
            :style="activeFilter === f.key
              ? 'background: #422082; color: #fff; border: 1px solid #6a5fc1; letter-spacing: 0.2px'
              : 'background: transparent; color: #a49bc9; border: 1px solid #362d59; letter-spacing: 0.2px'"
            @click="activeFilter = f.key"
          >
            {{ f.label }}
          </button>
        </div>

        <!-- Loading skeletons -->
        <div v-if="isHealthLoading" class="flex flex-col gap-3 px-5 py-4">
          <USkeleton v-for="i in 3" :key="i" class="h-[72px] rounded-xl w-full" />
        </div>

        <!-- Empty state -->
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
          <UButton
            color="primary"
            size="sm"
            icon="i-heroicons-plus"
            @click="openAddRecord"
          >
            Add Record
          </UButton>
        </EmptyBlock>

        <!-- Records list -->
        <div v-else class="flex flex-col gap-3 px-5 py-4">
          <HealthRecordCard
            v-for="record in healthRecords"
            :key="record._id"
            :record="record"
          />
        </div>
      </PanelCard>

      <!-- Other tabs (placeholder until backed by data) -->
      <PanelCard
        v-else-if="tab === 'timeline'"
        title="Full Timeline"
        subtitle="All events for this pet"
        icon="i-heroicons-clock"
        :padded="false"
      >
        <EmptyBlock
          icon="i-heroicons-clock"
          title="No events logged yet"
          desc="Once you log vet visits, vaccinations, medications and milestones, they'll appear here."
        />
      </PanelCard>

      <PanelCard
        v-else-if="tab === 'meds'"
        title="Medications"
        icon="i-heroicons-sparkles"
        :padded="false"
      >
        <EmptyBlock
          icon="i-heroicons-sparkles"
          title="No active medications"
          :desc="`Track ${pet.name}'s prescriptions, dosages, and schedules.`"
        />
      </PanelCard>

      <PanelCard
        v-else-if="tab === 'documents'"
        title="All Documents"
        icon="i-heroicons-document"
        :padded="false"
      >
        <EmptyBlock
          icon="i-heroicons-document"
          title="No documents yet"
          desc="Upload PDFs and images to keep all of your pet's records in one place."
        />
      </PanelCard>

    </template>

    <!-- Photo preview / upload modal -->
    <UModal v-model:open="isPreviewOpen" title="Upload photo" :dismissible="!isUploading">
      <template #body>
        <div class="flex flex-col items-center gap-4">
          <div
            class="w-full rounded-xl overflow-hidden flex items-center justify-center"
            style="background: #1f1633; border: 1px solid #362d59; min-height: 220px"
          >
            <img
              v-if="previewUrl"
              :src="previewUrl"
              :alt="selectedFile?.name"
              class="max-h-[320px] w-auto object-contain"
            >
          </div>
          <p
            v-if="selectedFile"
            class="text-[#a49bc9] text-xs truncate w-full text-center"
            style="font-family: Rubik, sans-serif"
          >
            {{ selectedFile.name }} · {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton
            variant="ghost"
            :disabled="isUploading"
            @click="cancelPreview"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="isUploading"
            @click="confirmUpload"
          >
            Upload
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Remove photo confirmation modal -->
    <UModal v-model:open="isRemoveOpen" title="Remove Photo">
      <template #body>
        <p class="text-[#e5e7eb] text-sm" style="font-family: Rubik, sans-serif">
          Are you sure you want to remove
          <strong class="text-white">{{ pet?.name }}</strong>'s photo?
        </p>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton
            variant="ghost"
            :disabled="isRemoving"
            @click="isRemoveOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="isRemoving"
            @click="confirmRemovePhoto"
          >
            Remove
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Add Health Record modal -->
    <UModal v-model:open="isAddOpen" title="Add Health Record">
      <template #body>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="group flex flex-col items-center gap-3 rounded-xl px-4 py-6 text-center cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5fc1]"
            style="background: #1f1633; border: 1px solid #362d59; font-family: Rubik, sans-serif"
            onmouseover="this.style.borderColor='#6a5fc1'"
            onmouseout="this.style.borderColor='#362d59'"
            @click="selectType('vet_visit')"
          >
            <span
              class="w-11 h-11 rounded-xl grid place-items-center"
              style="background: color-mix(in oklch, #6a5fc1 15%, transparent); border: 1px solid color-mix(in oklch, #6a5fc1 35%, transparent); color: #9a8ee8"
            >
              <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5" />
            </span>
            <div>
              <div class="text-white text-sm font-semibold">Vet Visit</div>
              <div class="text-[#a49bc9] text-xs mt-0.5 leading-relaxed">Log a clinic visit, checkup, or treatment</div>
            </div>
          </button>

          <button
            type="button"
            class="group flex flex-col items-center gap-3 rounded-xl px-4 py-6 text-center cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5fc1]"
            style="background: #1f1633; border: 1px solid #362d59; font-family: Rubik, sans-serif"
            onmouseover="this.style.borderColor='#c2ef4e'"
            onmouseout="this.style.borderColor='#362d59'"
            @click="selectType('vaccination')"
          >
            <span
              class="w-11 h-11 rounded-xl grid place-items-center"
              style="background: color-mix(in oklch, #c2ef4e 10%, transparent); border: 1px solid color-mix(in oklch, #c2ef4e 30%, transparent); color: #c2ef4e"
            >
              <UIcon name="i-heroicons-beaker" class="w-5 h-5" />
            </span>
            <div>
              <div class="text-white text-sm font-semibold">Vaccination</div>
              <div class="text-[#a49bc9] text-xs mt-0.5 leading-relaxed">Record a vaccine with due date tracking</div>
            </div>
          </button>
        </div>
      </template>
    </UModal>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="isDeleteOpen" title="Delete Pet" :dismissible="!isDeleting">
      <template #body>
        <p class="text-[#e5e7eb] text-sm" style="font-family: Rubik, sans-serif">
          Are you sure you want to delete
          <strong class="text-white">{{ pet?.name }}</strong>?
          This can't be undone.
        </p>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton
            variant="ghost"
            :disabled="isDeleting"
            @click="isDeleteOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UModal>

  </div>
</template>
