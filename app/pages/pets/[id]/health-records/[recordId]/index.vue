<script setup lang="ts">
import type { HealthRecord, Pet } from '#shared/types/models'

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

// Sibling records decide whether this record's due date was superseded by a later dose/visit
const { data: petRecords } = useFetch<HealthRecord[]>(`/api/pets/${id}/health-records`, { lazy: true })

const isLoading = computed(() => status.value === 'pending')
const is404 = computed(() => error.value?.statusCode === 404)

const isVetVisit = computed(() => record.value?.type === 'vet_visit')
const meta = computed(() => record.value?.metadata ?? {})

const rawDueDate = computed(() => isVetVisit.value ? meta.value.followUpDate : meta.value.nextDueDate)
const activeDue = computed(() =>
  petRecords.value ? getDueItems(petRecords.value).find(item => item.record._id === recordId) : undefined,
)
const isSuperseded = computed(() => !!rawDueDate.value && !!petRecords.value && !activeDue.value)

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

function apiErrorMessage(err: unknown) {
  const e = err as { data?: { statusMessage?: string, message?: string } }
  return e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
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
    toast.add({ title: 'Failed to delete', description: apiErrorMessage(err), color: 'error' })
  }
  finally {
    isDeleting.value = false
    isDeleteOpen.value = false
  }
}

// Attachment upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024

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
  input.value = ''
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.add({ title: 'Unsupported file type', description: 'Attachments must be a JPEG, PNG, WebP image, or PDF.', color: 'error' })
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    toast.add({ title: 'File too large', description: 'Attachments must be 5MB or smaller.', color: 'error' })
    return
  }

  selectedFile.value = file
  previewUrl.value = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
  isUploadPreviewOpen.value = true
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
    toast.add({ title: 'Upload failed', description: apiErrorMessage(err), color: 'error' })
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
    toast.add({ title: 'Failed to remove', description: apiErrorMessage(err), color: 'error' })
  }
  finally {
    isRemoving.value = false
    isRemoveOpen.value = false
    attachmentToRemove.value = null
  }
}

const imageAttachments = computed(() => record.value?.attachments?.filter(isImage) ?? [])
const fileAttachments = computed(() => record.value?.attachments?.filter(u => !isImage(u)) ?? [])

const panelCls = 'rounded-2xl overflow-hidden bg-dusk-950 border border-border-dark shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]'
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
      class="inline-flex items-center gap-1.5 text-[13px] text-dusk-300 hover:text-white transition-colors w-fit"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 shrink-0" />
      <span>{{ pet?.name ?? 'Pet' }}</span>
      <span class="text-border-button mx-0.5">/</span>
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
        <div class="w-14 h-14 rounded-2xl grid place-items-center mb-5 bg-dusk-900 border border-border-dark">
          <UIcon name="i-heroicons-document-magnifying-glass" class="w-7 h-7 text-sentry-500" />
        </div>
        <p class="text-white text-xl font-semibold mb-2">
          Record not found
        </p>
        <p class="text-dusk-300 text-sm mb-6">
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
      <div :class="panelCls">
        <div
          class="h-px w-full"
          :class="isVetVisit
            ? 'bg-linear-to-r from-transparent via-sentry-500 to-transparent'
            : 'bg-linear-to-r from-transparent via-neon-300 to-transparent'"
        />

        <div class="p-5 sm:p-6 flex flex-wrap sm:flex-nowrap items-start gap-4 sm:gap-5">
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border"
            :class="isVetVisit
              ? 'bg-sentry-500/15 border-sentry-500/35 shadow-[0_0_28px_rgba(106,95,193,0.2)] text-sentry-300'
              : 'bg-neon-300/10 border-neon-300/30 shadow-[0_0_28px_rgba(194,239,78,0.12)] text-neon-300'"
          >
            <UIcon
              :name="isVetVisit ? 'i-heroicons-clipboard-document-list' : 'i-heroicons-beaker'"
              class="w-7 h-7"
              aria-hidden="true"
            />
          </div>

          <div class="flex-1 min-w-0">
            <span
              class="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-2 border tracking-[0.25px]"
              :class="isVetVisit
                ? 'text-sentry-300 bg-sentry-500/15 border-sentry-500/30'
                : 'text-neon-300 bg-neon-300/10 border-neon-300/30'"
            >
              {{ isVetVisit ? 'Vet Visit' : 'Vaccination' }}
            </span>
            <h1 class="text-white text-[22px] font-semibold leading-tight mb-1.5 break-words">
              {{ record.title }}
            </h1>
            <div class="flex items-center gap-1.5 text-dusk-300 text-sm">
              <UIcon name="i-heroicons-calendar-days" class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {{ formatDate(record.date, 'long') }}
            </div>
          </div>

          <div class="flex gap-2 shrink-0">
            <UButton
              :to="`/pets/${id}/health-records/${recordId}/edit`"
              color="secondary"
              variant="solid"
              icon="i-heroicons-pencil-square"
              class="pointer-coarse:min-h-11"
            >
              Edit
            </UButton>
            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              aria-label="Delete record"
              class="pointer-coarse:min-h-11 pointer-coarse:min-w-11 justify-center"
              @click="() => { isDeleteOpen = true }"
            />
          </div>
        </div>
      </div>

      <!-- Vet visit metadata -->
      <div
        v-if="isVetVisit && (meta.clinicName || meta.vetName || meta.diagnosis || meta.followUpDate)"
        :class="panelCls"
      >
        <div class="flex items-center gap-3 px-5 py-4 border-b border-border-dark">
          <span class="w-7 h-7 rounded-lg grid place-items-center shrink-0 bg-sentry-500/15 border border-sentry-500/35">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-3.5 h-3.5 text-sentry-300" />
          </span>
          <h2 class="text-white text-sm font-semibold">
            Visit Details
          </h2>
        </div>

        <dl class="divide-y divide-border-dark">
          <div v-if="meta.clinicName" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-building-office-2" class="w-4 h-4 text-dusk-400 shrink-0" aria-hidden="true" />
            <dt class="text-[10px] font-semibold uppercase text-dusk-300 w-28 shrink-0 tracking-[0.25px]">
              Clinic
            </dt>
            <dd class="text-white text-sm min-w-0 break-words">
              {{ meta.clinicName }}
            </dd>
          </div>
          <div v-if="meta.vetName" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-user" class="w-4 h-4 text-dusk-400 shrink-0" aria-hidden="true" />
            <dt class="text-[10px] font-semibold uppercase text-dusk-300 w-28 shrink-0 tracking-[0.25px]">
              Veterinarian
            </dt>
            <dd class="text-white text-sm min-w-0 break-words">
              {{ meta.vetName }}
            </dd>
          </div>
          <div v-if="meta.diagnosis" class="flex items-start gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-dusk-400 shrink-0 mt-0.5" aria-hidden="true" />
            <dt class="text-[10px] font-semibold uppercase text-dusk-300 w-28 shrink-0 mt-0.5 tracking-[0.25px]">
              Diagnosis
            </dt>
            <dd class="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap min-w-0 break-words">
              {{ meta.diagnosis }}
            </dd>
          </div>
          <div v-if="meta.followUpDate" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-dusk-400 shrink-0" aria-hidden="true" />
            <dt class="text-[10px] font-semibold uppercase text-dusk-300 w-28 shrink-0 tracking-[0.25px]">
              Follow-up
            </dt>
            <dd class="flex items-center gap-2 flex-wrap">
              <span class="text-white text-sm">{{ formatDate(meta.followUpDate) }}</span>
              <DueBadge
                v-if="activeDue && activeDue.status !== 'ok'"
                :status="activeDue.status"
                :label="dueLabel(activeDue.days)"
              />
              <span v-else-if="isSuperseded" class="text-dusk-300 text-xs">
                Done — a later visit was logged
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <!-- Vaccination metadata -->
      <div
        v-if="!isVetVisit && (meta.vaccineName || meta.batchNumber || meta.nextDueDate)"
        :class="panelCls"
      >
        <div class="flex items-center gap-3 px-5 py-4 border-b border-border-dark">
          <span class="w-7 h-7 rounded-lg grid place-items-center shrink-0 bg-neon-300/10 border border-neon-300/30">
            <UIcon name="i-heroicons-beaker" class="w-3.5 h-3.5 text-neon-300" />
          </span>
          <h2 class="text-white text-sm font-semibold">
            Vaccine Details
          </h2>
        </div>

        <dl class="divide-y divide-border-dark">
          <div v-if="meta.vaccineName" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-tag" class="w-4 h-4 text-dusk-400 shrink-0" aria-hidden="true" />
            <dt class="text-[10px] font-semibold uppercase text-dusk-300 w-28 shrink-0 tracking-[0.25px]">
              Vaccine
            </dt>
            <dd class="text-white text-sm min-w-0 break-words">
              {{ meta.vaccineName }}
            </dd>
          </div>
          <div v-if="meta.batchNumber" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-hashtag" class="w-4 h-4 text-dusk-400 shrink-0" aria-hidden="true" />
            <dt class="text-[10px] font-semibold uppercase text-dusk-300 w-28 shrink-0 tracking-[0.25px]">
              Batch No.
            </dt>
            <dd class="text-gray-200 text-sm font-mono min-w-0 break-all">
              {{ meta.batchNumber }}
            </dd>
          </div>
          <div v-if="meta.nextDueDate" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-dusk-400 shrink-0" aria-hidden="true" />
            <dt class="text-[10px] font-semibold uppercase text-dusk-300 w-28 shrink-0 tracking-[0.25px]">
              Next Due
            </dt>
            <dd class="flex items-center gap-2 flex-wrap">
              <span class="text-white text-sm">{{ formatDate(meta.nextDueDate) }}</span>
              <DueBadge
                v-if="activeDue && activeDue.status !== 'ok'"
                :status="activeDue.status"
                :label="dueLabel(activeDue.days)"
              />
              <span v-else-if="isSuperseded" class="text-dusk-300 text-xs">
                Superseded by a later dose
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <!-- Notes -->
      <div v-if="record.notes" :class="panelCls">
        <div class="flex items-center gap-3 px-5 py-4 border-b border-border-dark">
          <span class="w-7 h-7 rounded-lg grid place-items-center shrink-0 bg-dusk-900 border border-border-dark">
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-3.5 h-3.5 text-sentry-300" />
          </span>
          <h2 class="text-white text-sm font-semibold">
            Notes
          </h2>
        </div>
        <div class="px-5 py-4 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {{ record.notes }}
        </div>
      </div>

      <!-- Attachments -->
      <div :class="panelCls">
        <div class="flex items-center gap-3 px-5 py-4 border-b border-border-dark">
          <span class="w-7 h-7 rounded-lg grid place-items-center shrink-0 bg-dusk-900 border border-border-dark">
            <UIcon name="i-heroicons-paper-clip" class="w-3.5 h-3.5 text-sentry-300" />
          </span>
          <h2 class="text-white text-sm font-semibold flex-1">
            Attachments
          </h2>
          <span
            v-if="record.attachments?.length"
            class="text-[11px] font-semibold text-dusk-300 mr-2"
          >{{ record.attachments.length }}</span>
          <UButton
            size="sm"
            color="secondary"
            variant="solid"
            icon="i-heroicons-plus"
            class="pointer-coarse:min-h-11"
            :disabled="isUploading"
            @click="openFilePicker"
          >
            Add
          </UButton>
        </div>

        <!-- Empty state -->
        <div
          v-if="!record.attachments?.length"
          class="flex flex-col items-center justify-center py-10 gap-3 px-5 text-center"
        >
          <span class="w-11 h-11 rounded-xl grid place-items-center bg-dusk-900 border border-border-dark">
            <UIcon name="i-heroicons-paper-clip" class="w-5 h-5 text-sentry-500" />
          </span>
          <p class="text-dusk-300 text-sm">
            No attachments yet — add lab results, prescriptions or certificates (JPEG, PNG, WebP or PDF, up to 5MB).
          </p>
        </div>

        <div v-else class="p-5 flex flex-col gap-3">
          <!-- Image thumbnails -->
          <div v-if="imageAttachments.length" class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <div
              v-for="url in imageAttachments"
              :key="url"
              class="relative group"
            >
              <a
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="block rounded-lg overflow-hidden aspect-square border border-border-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-sentry-500"
              >
                <img
                  :src="url"
                  :alt="fileName(url)"
                  class="w-full h-full object-cover transition-opacity duration-150 group-hover:opacity-60"
                  loading="lazy"
                >
              </a>
              <!-- Always visible on touch screens; revealed on hover/focus with a mouse -->
              <button
                type="button"
                class="absolute top-1.5 right-1.5 w-7 h-7 pointer-coarse:w-9 pointer-coarse:h-9 rounded-md grid place-items-center text-red-400 bg-dusk-950/90 border border-dusk-600 backdrop-blur-sm transition-opacity duration-150 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sentry-500"
                :aria-label="`Remove ${fileName(url)}`"
                @click.prevent="promptRemoveAttachment(url)"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- PDF / other files -->
          <div v-if="fileAttachments.length" class="flex flex-col gap-1.5">
            <div
              v-for="url in fileAttachments"
              :key="url"
              class="flex items-center gap-2"
            >
              <a
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 min-w-0 inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] text-dusk-300 hover:text-white transition-colors bg-dusk-900 border border-border-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-sentry-500"
              >
                <UIcon name="i-heroicons-document" class="w-4 h-4 shrink-0 text-sentry-500" />
                <span class="truncate">{{ fileName(url) }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 shrink-0 ml-auto" />
              </a>
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                class="pointer-coarse:min-h-11 pointer-coarse:min-w-11 justify-center"
                :aria-label="`Remove ${fileName(url)}`"
                @click="promptRemoveAttachment(url)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete record confirmation modal -->
    <UModal v-model:open="isDeleteOpen" :title="`Delete '${record?.title}'?`" :dismissible="!isDeleting">
      <template #body>
        <p class="text-gray-200 text-sm">
          Are you sure you want to delete
          <strong class="text-white">{{ record?.title }}</strong>
          and its attachments? This can't be undone.
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

    <!-- Upload preview modal -->
    <UModal
      v-model:open="isUploadPreviewOpen"
      title="Add Attachment"
      :dismissible="!isUploading"
      @update:open="(v) => { if (!v) cancelUpload() }"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <div
            v-if="previewUrl"
            class="w-full rounded-xl overflow-hidden flex items-center justify-center bg-dusk-900 border border-border-dark min-h-[180px] max-h-[320px]"
          >
            <img
              :src="previewUrl"
              :alt="selectedFile?.name"
              class="max-w-full max-h-80 object-contain"
            >
          </div>

          <div
            v-else-if="selectedFile"
            class="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-dusk-900 border border-border-dark"
          >
            <span class="w-10 h-10 rounded-lg grid place-items-center shrink-0 bg-sentry-500/15 border border-sentry-500/30">
              <UIcon name="i-heroicons-document" class="w-5 h-5 text-sentry-300" />
            </span>
            <div class="flex flex-col min-w-0">
              <span class="text-white text-sm font-medium truncate">{{ selectedFile.name }}</span>
              <span class="text-dusk-300 text-xs mt-0.5">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
          </div>

          <p class="text-dusk-300 text-sm text-center">
            Upload this file to the health record?
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton variant="ghost" :disabled="isUploading" @click="cancelUpload">
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
        <p class="text-gray-200 text-sm">
          Are you sure you want to remove
          <strong class="text-white break-all">{{ attachmentToRemove ? fileName(attachmentToRemove) : '' }}</strong>?
          This can't be undone.
        </p>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton variant="ghost" :disabled="isRemoving" @click="() => { isRemoveOpen = false }">
            Cancel
          </UButton>
          <UButton color="error" :loading="isRemoving" @click="confirmRemoveAttachment">
            Remove
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
