<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Pet {
  _id: string
  name: string
}

interface VetVisitMetadata {
  clinicName?: string
  vetName?: string
  diagnosis?: string
  followUpDate?: string
}

interface VaccinationMetadata {
  vaccineName?: string
  batchNumber?: string
  nextDueDate?: string
}

interface HealthRecord {
  _id: string
  petId: string
  type: 'vet_visit' | 'vaccination'
  title: string
  date: string
  notes?: string
  metadata?: VetVisitMetadata | VaccinationMetadata
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const id = route.params.id as string
const recordId = route.params.recordId as string
const toast = useToast()

const { data: pet } = useFetch<Pet>(`/api/pets/${id}`, { lazy: true })

const {
  data: record,
  status,
  error,
} = useFetch<HealthRecord>(`/api/pets/${id}/health-records/${recordId}`, { lazy: true })

const isLoading = computed(() => status.value === 'pending')
const is404 = computed(() => error.value?.statusCode === 404)

const isVetVisit = computed(() => record.value?.type === 'vet_visit')
const vetMeta = computed(() =>
  isVetVisit.value ? (record.value?.metadata as VetVisitMetadata) : null,
)
const vacMeta = computed(() =>
  !isVetVisit.value ? (record.value?.metadata as VaccinationMetadata) : null,
)

const formattedDate = computed(() => {
  if (!record.value?.date) return ''
  return new Date(record.value.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const followUpStatus = computed(() => {
  const raw = vetMeta.value?.followUpDate
  if (!raw) return null
  const diff = (new Date(raw).getTime() - Date.now()) / 86_400_000
  return diff < 0 ? 'overdue' : null
})

const formattedFollowUp = computed(() => {
  const raw = vetMeta.value?.followUpDate
  if (!raw) return null
  return new Date(raw).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

const nextDueStatus = computed(() => {
  const raw = vacMeta.value?.nextDueDate
  if (!raw) return null
  const diff = (new Date(raw).getTime() - Date.now()) / 86_400_000
  if (diff < 0) return 'overdue' as const
  if (diff <= 7) return 'due-soon' as const
  return 'ok' as const
})

const formattedNextDue = computed(() => {
  const raw = vacMeta.value?.nextDueDate
  if (!raw) return null
  return new Date(raw).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

function isImage(url: string) {
  return /\.(jpe?g|png|webp|gif|avif)$/i.test(url)
}

function fileName(url: string) {
  return url.split('/').pop() ?? url
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Delete record
const isDeleteOpen = ref(false)
const isDeleting = ref(false)

async function confirmDelete() {
  isDeleting.value = true
  try {
    await $fetch(`/api/pets/${id}/health-records/${recordId}`, { method: 'DELETE' })
    toast.add({
      title: 'Record deleted',
      description: 'Health record has been removed.',
      color: 'success',
    })
    await navigateTo(`/pets/${id}?tab=health`)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Failed to delete', description: message, color: 'error' })
  }
  finally {
    isDeleting.value = false
    isDeleteOpen.value = false
  }
}

// Attachment upload
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const isUploadPreviewOpen = ref(false)
const isUploading = ref(false)

function openFilePicker() {
  fileInputRef.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  selectedFile.value = file
  previewUrl.value = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
  isUploadPreviewOpen.value = true
  input.value = ''
}

function cancelUpload() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  selectedFile.value = null
  previewUrl.value = null
  isUploadPreviewOpen.value = false
}

async function uploadAttachment() {
  if (!selectedFile.value) return

  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const updated = await $fetch<HealthRecord>(
      `/api/pets/${id}/health-records/${recordId}/attachments`,
      { method: 'POST', body: formData },
    )

    if (record.value) {
      record.value.attachments = updated.attachments
    }

    toast.add({ title: 'Attachment uploaded', description: 'File added to the health record.', color: 'success' })
    cancelUpload()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Upload failed', description: message, color: 'error' })
  }
  finally {
    isUploading.value = false
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

// Attachment remove
const attachmentToRemove = ref<string | null>(null)
const isRemoveOpen = ref(false)
const isRemoving = ref(false)

function promptRemoveAttachment(url: string) {
  attachmentToRemove.value = url
  isRemoveOpen.value = true
}

async function confirmRemoveAttachment() {
  if (!attachmentToRemove.value) return

  isRemoving.value = true
  try {
    const updated = await $fetch<HealthRecord>(
      `/api/pets/${id}/health-records/${recordId}/attachments`,
      { method: 'DELETE', body: { url: attachmentToRemove.value } },
    )

    if (record.value) {
      record.value.attachments = updated.attachments
    }

    toast.add({ title: 'Attachment removed', description: 'File removed from the health record.', color: 'success' })
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Failed to remove', description: message, color: 'error' })
  }
  finally {
    isRemoving.value = false
    isRemoveOpen.value = false
    attachmentToRemove.value = null
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-5">

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,application/pdf"
      class="hidden"
      @change="onFileSelected"
    >

    <!-- Breadcrumb -->
    <NuxtLink
      :to="`/pets/${id}?tab=health`"
      class="inline-flex items-center gap-1.5 text-[13px] text-[#a49bc9] hover:text-white transition-colors w-fit"
      style="font-family: Rubik, sans-serif"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 shrink-0" />
      <span>{{ pet?.name ?? 'Pet' }}</span>
      <span class="text-[#584674] mx-0.5">/</span>
      <span>Health Records</span>
    </NuxtLink>

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <USkeleton class="h-36 rounded-2xl" />
      <USkeleton class="h-44 rounded-2xl" />
      <USkeleton class="h-24 rounded-2xl" />
    </template>

    <!-- 404 / error state -->
    <template v-else-if="is404 || (error && !record)">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <div
          class="w-14 h-14 rounded-2xl grid place-items-center mb-5"
          style="background: #1f1633; border: 1px solid #362d59"
        >
          <UIcon name="i-heroicons-document-magnifying-glass" class="w-7 h-7 text-[#6a5fc1]" />
        </div>
        <p
          class="text-white text-xl font-semibold mb-2"
          style="font-family: Rubik, sans-serif"
        >
          Record not found
        </p>
        <p
          class="text-[#a49bc9] text-sm mb-6"
          style="font-family: Rubik, sans-serif"
        >
          This health record doesn't exist or you don't have access.
        </p>
        <UButton :to="`/pets/${id}?tab=health`" color="primary">
          Back to Health Records
        </UButton>
      </div>
    </template>

    <!-- Record detail -->
    <template v-else-if="record">

      <!-- Hero card -->
      <div
        class="rounded-2xl overflow-hidden"
        style="background: #150f23; border: 1px solid #362d59; box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px;"
      >
        <!-- Type-colored accent stripe -->
        <div
          class="h-px w-full"
          :style="isVetVisit
            ? 'background: linear-gradient(90deg, transparent 0%, #6a5fc1 25%, #9a8ee8 60%, transparent 100%)'
            : 'background: linear-gradient(90deg, transparent 0%, #c2ef4e 25%, #a3d422 60%, transparent 100%)'"
        />

        <div class="p-6 flex items-start gap-5">
          <!-- Type icon -->
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            :style="isVetVisit
              ? 'background: color-mix(in oklch, #6a5fc1 15%, transparent); border: 1px solid color-mix(in oklch, #6a5fc1 35%, transparent); box-shadow: 0 0 28px rgba(106,95,193,0.2)'
              : 'background: color-mix(in oklch, #c2ef4e 10%, transparent); border: 1px solid color-mix(in oklch, #c2ef4e 30%, transparent); box-shadow: 0 0 28px rgba(194,239,78,0.12)'"
          >
            <UIcon
              :name="isVetVisit ? 'i-heroicons-clipboard-document-list' : 'i-heroicons-beaker'"
              class="w-7 h-7"
              :style="isVetVisit ? 'color: #9a8ee8' : 'color: #c2ef4e'"
            />
          </div>

          <!-- Title + type + date -->
          <div class="flex-1 min-w-0" style="font-family: Rubik, sans-serif">
            <span
              class="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-2"
              :style="isVetVisit
                ? 'color: #9a8ee8; background: color-mix(in oklch, #6a5fc1 15%, transparent); border: 1px solid color-mix(in oklch, #6a5fc1 30%, transparent); letter-spacing: 0.25px'
                : 'color: #c2ef4e; background: color-mix(in oklch, #c2ef4e 10%, transparent); border: 1px solid color-mix(in oklch, #c2ef4e 30%, transparent); letter-spacing: 0.25px'"
            >
              {{ isVetVisit ? 'Vet Visit' : 'Vaccination' }}
            </span>
            <h1 class="text-white text-[22px] font-semibold leading-tight mb-1.5">
              {{ record.title }}
            </h1>
            <div class="flex items-center gap-1.5 text-[#a49bc9] text-sm">
              <UIcon name="i-heroicons-calendar-days" class="w-3.5 h-3.5 text-[#584674] shrink-0" />
              {{ formattedDate }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 shrink-0">
            <UButton
              :to="`/pets/${id}/health-records/${recordId}/edit`"
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
              aria-label="Delete record"
              @click="isDeleteOpen = true"
            />
          </div>
        </div>
      </div>

      <!-- Vet visit metadata -->
      <div
        v-if="isVetVisit && vetMeta && (vetMeta.clinicName || vetMeta.vetName || vetMeta.diagnosis || vetMeta.followUpDate)"
        class="rounded-2xl overflow-hidden"
        style="background: #150f23; border: 1px solid #362d59; box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px; font-family: Rubik, sans-serif"
      >
        <div
          class="flex items-center gap-3 px-5 py-4"
          style="border-bottom: 1px solid #362d59"
        >
          <span
            class="w-7 h-7 rounded-lg grid place-items-center shrink-0"
            style="background: color-mix(in oklch, #6a5fc1 15%, transparent); border: 1px solid color-mix(in oklch, #6a5fc1 35%, transparent)"
          >
            <UIcon name="i-heroicons-clipboard-document-list" class="w-3.5 h-3.5 text-[#9a8ee8]" />
          </span>
          <span class="text-white text-sm font-semibold">Visit Details</span>
        </div>

        <div class="divide-y" style="border-color: #362d59">
          <div v-if="vetMeta.clinicName" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-building-office-2" class="w-4 h-4 text-[#584674] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Clinic</span>
            <span class="text-white text-sm">{{ vetMeta.clinicName }}</span>
          </div>
          <div v-if="vetMeta.vetName" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-user" class="w-4 h-4 text-[#584674] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Veterinarian</span>
            <span class="text-white text-sm">{{ vetMeta.vetName }}</span>
          </div>
          <div v-if="vetMeta.diagnosis" class="flex items-start gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-[#584674] shrink-0 mt-0.5" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0 mt-0.5"
              style="letter-spacing: 0.25px"
            >Diagnosis</span>
            <span class="text-[#e5e7eb] text-sm leading-relaxed whitespace-pre-wrap">{{ vetMeta.diagnosis }}</span>
          </div>
          <div v-if="formattedFollowUp" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-[#584674] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Follow-up</span>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-white text-sm">{{ formattedFollowUp }}</span>
              <span
                v-if="followUpStatus === 'overdue'"
                class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full"
                style="
                  color: #ef4444;
                  background: color-mix(in oklch, #ef4444 12%, transparent);
                  border: 1px solid color-mix(in oklch, #ef4444 30%, transparent);
                  letter-spacing: 0.2px;
                "
              >
                <UIcon name="i-heroicons-exclamation-circle" class="w-3 h-3" />
                Overdue
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vaccination metadata -->
      <div
        v-if="!isVetVisit && vacMeta && (vacMeta.vaccineName || vacMeta.batchNumber || vacMeta.nextDueDate)"
        class="rounded-2xl overflow-hidden"
        style="background: #150f23; border: 1px solid #362d59; box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px; font-family: Rubik, sans-serif"
      >
        <div
          class="flex items-center gap-3 px-5 py-4"
          style="border-bottom: 1px solid #362d59"
        >
          <span
            class="w-7 h-7 rounded-lg grid place-items-center shrink-0"
            style="background: color-mix(in oklch, #c2ef4e 10%, transparent); border: 1px solid color-mix(in oklch, #c2ef4e 30%, transparent)"
          >
            <UIcon name="i-heroicons-beaker" class="w-3.5 h-3.5 text-[#c2ef4e]" />
          </span>
          <span class="text-white text-sm font-semibold">Vaccine Details</span>
        </div>

        <div class="divide-y" style="border-color: #362d59">
          <div v-if="vacMeta.vaccineName" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-tag" class="w-4 h-4 text-[#584674] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Vaccine</span>
            <span class="text-white text-sm">{{ vacMeta.vaccineName }}</span>
          </div>
          <div v-if="vacMeta.batchNumber" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-hashtag" class="w-4 h-4 text-[#584674] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Batch No.</span>
            <span class="text-[#e5e7eb] text-sm font-mono">{{ vacMeta.batchNumber }}</span>
          </div>
          <div v-if="formattedNextDue" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-[#584674] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Next Due</span>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-white text-sm">{{ formattedNextDue }}</span>
              <span
                v-if="nextDueStatus === 'overdue'"
                class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full"
                style="
                  color: #ef4444;
                  background: color-mix(in oklch, #ef4444 12%, transparent);
                  border: 1px solid color-mix(in oklch, #ef4444 30%, transparent);
                  letter-spacing: 0.2px;
                "
              >
                <UIcon name="i-heroicons-exclamation-circle" class="w-3 h-3" />
                Overdue
              </span>
              <span
                v-else-if="nextDueStatus === 'due-soon'"
                class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full"
                style="
                  color: #f59e0b;
                  background: color-mix(in oklch, #f59e0b 12%, transparent);
                  border: 1px solid color-mix(in oklch, #f59e0b 30%, transparent);
                  letter-spacing: 0.2px;
                "
              >
                <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                Due Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div
        v-if="record.notes"
        class="rounded-2xl overflow-hidden"
        style="background: #150f23; border: 1px solid #362d59; box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px; font-family: Rubik, sans-serif"
      >
        <div
          class="flex items-center gap-3 px-5 py-4"
          style="border-bottom: 1px solid #362d59"
        >
          <span
            class="w-7 h-7 rounded-lg grid place-items-center shrink-0"
            style="background: #1f1633; border: 1px solid #362d59"
          >
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-3.5 h-3.5 text-[#9a8ee8]" />
          </span>
          <span class="text-white text-sm font-semibold">Notes</span>
        </div>
        <div class="px-5 py-4 text-[#e5e7eb] text-sm leading-relaxed whitespace-pre-wrap">
          {{ record.notes }}
        </div>
      </div>

      <!-- Attachments -->
      <div
        class="rounded-2xl overflow-hidden"
        style="background: #150f23; border: 1px solid #362d59; box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px; font-family: Rubik, sans-serif"
      >
        <div
          class="flex items-center gap-3 px-5 py-4"
          style="border-bottom: 1px solid #362d59"
        >
          <span
            class="w-7 h-7 rounded-lg grid place-items-center shrink-0"
            style="background: #1f1633; border: 1px solid #362d59"
          >
            <UIcon name="i-heroicons-paper-clip" class="w-3.5 h-3.5 text-[#9a8ee8]" />
          </span>
          <span class="text-white text-sm font-semibold flex-1">Attachments</span>
          <span
            v-if="record.attachments?.length"
            class="text-[11px] font-semibold text-[#a49bc9] mr-2"
          >{{ record.attachments.length }}</span>
          <UButton
            size="xs"
            color="secondary"
            variant="solid"
            icon="i-heroicons-plus"
            :disabled="isUploading"
            @click="openFilePicker"
          >
            Add
          </UButton>
        </div>

        <!-- Empty state -->
        <div
          v-if="!record.attachments?.length"
          class="flex flex-col items-center justify-center py-10 gap-3"
        >
          <span
            class="w-11 h-11 rounded-xl grid place-items-center"
            style="background: #1f1633; border: 1px solid #362d59"
          >
            <UIcon name="i-heroicons-paper-clip" class="w-5 h-5 text-[#6a5fc1]" />
          </span>
          <p class="text-[#a49bc9] text-sm">No attachments yet</p>
          <UButton
            size="sm"
            color="secondary"
            variant="solid"
            icon="i-heroicons-arrow-up-tray"
            @click="openFilePicker"
          >
            Add Attachment
          </UButton>
        </div>

        <!-- Attachments content -->
        <div v-else class="p-5 flex flex-col gap-3">
          <!-- Image thumbnails grid -->
          <div
            v-if="record.attachments.some(isImage)"
            class="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            <div
              v-for="url in record.attachments.filter(isImage)"
              :key="url"
              class="relative group"
            >
              <a
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="block rounded-lg overflow-hidden aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5fc1]"
                style="border: 1px solid #362d59"
              >
                <img
                  :src="url"
                  :alt="fileName(url)"
                  class="w-full h-full object-cover transition-opacity duration-150 group-hover:opacity-60"
                  loading="lazy"
                >
              </a>
              <button
                type="button"
                class="absolute top-1.5 right-1.5 w-6 h-6 rounded-md grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5fc1]"
                style="background: rgba(21, 15, 35, 0.88); border: 1px solid #4b3f7a; color: #f87171; backdrop-filter: blur(4px)"
                :aria-label="`Remove ${fileName(url)}`"
                @click.prevent="promptRemoveAttachment(url)"
              >
                <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- PDF / other file links -->
          <div
            v-if="record.attachments.some(u => !isImage(u))"
            class="flex flex-col gap-1.5"
          >
            <div
              v-for="url in record.attachments.filter(u => !isImage(u))"
              :key="url"
              class="flex items-center gap-2"
            >
              <a
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] text-[#a49bc9] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5fc1]"
                style="background: #1f1633; border: 1px solid #362d59; font-family: Rubik, sans-serif"
              >
                <UIcon name="i-heroicons-document" class="w-4 h-4 shrink-0 text-[#6a5fc1]" />
                <span class="truncate">{{ fileName(url) }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 shrink-0 ml-auto" />
              </a>
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                size="xs"
                :aria-label="`Remove ${fileName(url)}`"
                @click="promptRemoveAttachment(url)"
              />
            </div>
          </div>

          <!-- Add more -->
          <UButton
            size="sm"
            color="secondary"
            variant="ghost"
            icon="i-heroicons-plus"
            class="self-start mt-1"
            @click="openFilePicker"
          >
            Add more
          </UButton>
        </div>
      </div>

    </template>

    <!-- Delete record confirmation modal -->
    <UModal v-model:open="isDeleteOpen" :title="`Delete '${record?.title}'?`" :dismissible="!isDeleting">
      <template #body>
        <p class="text-[#e5e7eb] text-sm" style="font-family: Rubik, sans-serif">
          Are you sure you want to delete
          <strong class="text-white">{{ record?.title }}</strong>?
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

    <!-- Upload preview modal -->
    <UModal
      v-model:open="isUploadPreviewOpen"
      title="Add Attachment"
      :dismissible="!isUploading"
      @update:open="(v) => { if (!v) cancelUpload() }"
    >
      <template #body>
        <div class="flex flex-col gap-4" style="font-family: Rubik, sans-serif">
          <!-- Image preview -->
          <div
            v-if="previewUrl"
            class="w-full rounded-xl overflow-hidden flex items-center justify-center"
            style="background: #1a1230; border: 1px solid #362d59; min-height: 180px; max-height: 320px"
          >
            <img
              :src="previewUrl"
              :alt="selectedFile?.name"
              class="max-w-full max-h-80 object-contain"
            >
          </div>

          <!-- PDF / file preview -->
          <div
            v-else-if="selectedFile"
            class="flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style="background: #1f1633; border: 1px solid #362d59"
          >
            <span
              class="w-10 h-10 rounded-lg grid place-items-center shrink-0"
              style="background: color-mix(in oklch, #6a5fc1 15%, transparent); border: 1px solid color-mix(in oklch, #6a5fc1 30%, transparent)"
            >
              <UIcon name="i-heroicons-document" class="w-5 h-5 text-[#9a8ee8]" />
            </span>
            <div class="flex flex-col min-w-0">
              <span class="text-white text-sm font-medium truncate">{{ selectedFile.name }}</span>
              <span class="text-[#a49bc9] text-xs mt-0.5">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
          </div>

          <p class="text-[#a49bc9] text-sm text-center">
            Upload this file to the health record?
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton
            variant="ghost"
            :disabled="isUploading"
            @click="cancelUpload"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="isUploading"
            icon="i-heroicons-arrow-up-tray"
            @click="uploadAttachment"
          >
            Upload
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Remove attachment confirmation modal -->
    <UModal v-model:open="isRemoveOpen" title="Remove Attachment?" :dismissible="!isRemoving">
      <template #body>
        <p class="text-[#e5e7eb] text-sm" style="font-family: Rubik, sans-serif">
          Are you sure you want to remove
          <strong class="text-white">{{ attachmentToRemove ? fileName(attachmentToRemove) : '' }}</strong>?
          This can't be undone.
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
            @click="confirmRemoveAttachment"
          >
            Remove
          </UButton>
        </div>
      </template>
    </UModal>

  </div>
</template>
