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
</script>

<template>
  <div class="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">

    <!-- Breadcrumb -->
    <NuxtLink
      :to="`/pets/${id}?tab=health`"
      class="inline-flex items-center gap-1.5 text-[13px] text-[#a49bc9] hover:text-white transition-colors w-fit"
      style="font-family: Rubik, sans-serif"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 shrink-0" />
      <span>{{ pet?.name ?? 'Pet' }} / Health Records</span>
    </NuxtLink>

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <div class="flex items-center gap-4">
        <USkeleton class="w-12 h-12 rounded-xl shrink-0" />
        <div class="flex flex-col gap-2 flex-1">
          <USkeleton class="h-6 w-48 rounded-lg" />
          <USkeleton class="h-4 w-32 rounded-lg" />
        </div>
        <div class="flex gap-2">
          <USkeleton class="h-8 w-16 rounded-lg" />
          <USkeleton class="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <USkeleton class="h-40 rounded-2xl" />
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

      <!-- Header -->
      <div class="flex items-start gap-4">
        <!-- Type icon -->
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          :style="isVetVisit
            ? 'background: color-mix(in oklch, #6a5fc1 15%, transparent); border: 1px solid color-mix(in oklch, #6a5fc1 35%, transparent); box-shadow: 0 0 24px rgba(106,95,193,0.15)'
            : 'background: color-mix(in oklch, #c2ef4e 10%, transparent); border: 1px solid color-mix(in oklch, #c2ef4e 30%, transparent); box-shadow: 0 0 24px rgba(194,239,78,0.1)'"
        >
          <UIcon
            :name="isVetVisit ? 'i-heroicons-clipboard-document-list' : 'i-heroicons-beaker'"
            class="w-6 h-6"
            :style="isVetVisit ? 'color: #9a8ee8' : 'color: #c2ef4e'"
          />
        </div>

        <!-- Title + type + date -->
        <div class="flex-1 min-w-0" style="font-family: Rubik, sans-serif">
          <div class="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
              :style="isVetVisit
                ? 'color: #9a8ee8; background: color-mix(in oklch, #6a5fc1 15%, transparent); border: 1px solid color-mix(in oklch, #6a5fc1 30%, transparent); letter-spacing: 0.25px'
                : 'color: #c2ef4e; background: color-mix(in oklch, #c2ef4e 10%, transparent); border: 1px solid color-mix(in oklch, #c2ef4e 30%, transparent); letter-spacing: 0.25px'"
            >
              {{ isVetVisit ? 'Vet Visit' : 'Vaccination' }}
            </span>
          </div>
          <h1 class="text-white text-2xl font-semibold leading-tight">
            {{ record.title }}
          </h1>
          <p class="text-[#a49bc9] text-sm mt-0.5">
            {{ formattedDate }}
          </p>
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
            @click="isDeleteOpen = true"
          >
            Delete
          </UButton>
        </div>
      </div>

      <!-- Vet visit metadata -->
      <UCard
        v-if="isVetVisit && vetMeta && (vetMeta.clinicName || vetMeta.vetName || vetMeta.diagnosis || vetMeta.followUpDate)"
        :ui="{ root: 'bg-[#150f23] border border-[#362d59] rounded-2xl' }"
      >
        <div
          class="flex items-center gap-2.5 px-5 py-3.5"
          style="border-bottom: 1px solid #362d59; font-family: Rubik, sans-serif"
        >
          <span
            class="w-6 h-6 rounded-md grid place-items-center shrink-0"
            style="background: #1f1633; border: 1px solid #362d59; color: #9a8ee8"
          >
            <UIcon name="i-heroicons-clipboard-document-list" class="w-3.5 h-3.5" />
          </span>
          <span class="text-white text-sm font-semibold">Visit Details</span>
        </div>

        <div class="divide-y" style="border-color: #362d59; font-family: Rubik, sans-serif">
          <div v-if="vetMeta.clinicName" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-building-office-2" class="w-4 h-4 text-[#a49bc9] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Clinic</span>
            <span class="text-white text-sm">{{ vetMeta.clinicName }}</span>
          </div>
          <div v-if="vetMeta.vetName" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-user" class="w-4 h-4 text-[#a49bc9] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Veterinarian</span>
            <span class="text-white text-sm">{{ vetMeta.vetName }}</span>
          </div>
          <div v-if="vetMeta.diagnosis" class="flex items-start gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-[#a49bc9] shrink-0 mt-0.5" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0 mt-0.5"
              style="letter-spacing: 0.25px"
            >Diagnosis</span>
            <span class="text-[#e5e7eb] text-sm leading-relaxed">{{ vetMeta.diagnosis }}</span>
          </div>
          <div v-if="formattedFollowUp" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-[#a49bc9] shrink-0" />
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
      </UCard>

      <!-- Vaccination metadata -->
      <UCard
        v-if="!isVetVisit && vacMeta && (vacMeta.vaccineName || vacMeta.batchNumber || vacMeta.nextDueDate)"
        :ui="{ root: 'bg-[#150f23] border border-[#362d59] rounded-2xl' }"
      >
        <div
          class="flex items-center gap-2.5 px-5 py-3.5"
          style="border-bottom: 1px solid #362d59; font-family: Rubik, sans-serif"
        >
          <span
            class="w-6 h-6 rounded-md grid place-items-center shrink-0"
            style="background: #1f1633; border: 1px solid #362d59; color: #c2ef4e"
          >
            <UIcon name="i-heroicons-beaker" class="w-3.5 h-3.5" />
          </span>
          <span class="text-white text-sm font-semibold">Vaccine Details</span>
        </div>

        <div class="divide-y" style="border-color: #362d59; font-family: Rubik, sans-serif">
          <div v-if="vacMeta.vaccineName" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-tag" class="w-4 h-4 text-[#a49bc9] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Vaccine</span>
            <span class="text-white text-sm">{{ vacMeta.vaccineName }}</span>
          </div>
          <div v-if="vacMeta.batchNumber" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-hashtag" class="w-4 h-4 text-[#a49bc9] shrink-0" />
            <span
              class="text-[10px] font-semibold uppercase text-[#a49bc9] w-28 shrink-0"
              style="letter-spacing: 0.25px"
            >Batch No.</span>
            <span class="text-[#e5e7eb] text-sm font-mono">{{ vacMeta.batchNumber }}</span>
          </div>
          <div v-if="formattedNextDue" class="flex items-center gap-3 px-5 py-3.5">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-[#a49bc9] shrink-0" />
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
      </UCard>

      <!-- Notes -->
      <UCard
        v-if="record.notes"
        :ui="{ root: 'bg-[#150f23] border border-[#362d59] rounded-2xl' }"
      >
        <div
          class="flex items-center gap-2.5 px-5 py-3.5"
          style="border-bottom: 1px solid #362d59; font-family: Rubik, sans-serif"
        >
          <span
            class="w-6 h-6 rounded-md grid place-items-center shrink-0"
            style="background: #1f1633; border: 1px solid #362d59; color: #9a8ee8"
          >
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-3.5 h-3.5" />
          </span>
          <span class="text-white text-sm font-semibold">Notes</span>
        </div>
        <div
          class="px-5 py-4 text-[#e5e7eb] text-sm leading-relaxed whitespace-pre-wrap"
          style="font-family: Rubik, sans-serif"
        >
          {{ record.notes }}
        </div>
      </UCard>

      <!-- Attachments -->
      <UCard
        v-if="record.attachments?.length"
        :ui="{ root: 'bg-[#150f23] border border-[#362d59] rounded-2xl' }"
      >
        <div
          class="flex items-center gap-2.5 px-5 py-3.5"
          style="border-bottom: 1px solid #362d59; font-family: Rubik, sans-serif"
        >
          <span
            class="w-6 h-6 rounded-md grid place-items-center shrink-0"
            style="background: #1f1633; border: 1px solid #362d59; color: #9a8ee8"
          >
            <UIcon name="i-heroicons-paper-clip" class="w-3.5 h-3.5" />
          </span>
          <span class="text-white text-sm font-semibold">Attachments</span>
          <span
            class="ml-auto text-[11px] font-semibold text-[#a49bc9]"
            style="font-family: Rubik, sans-serif"
          >{{ record.attachments.length }}</span>
        </div>

        <div class="p-5 flex flex-col gap-3">
          <!-- Image thumbnails grid -->
          <div
            v-if="record.attachments.some(isImage)"
            class="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            <a
              v-for="url in record.attachments.filter(isImage)"
              :key="url"
              :href="url"
              target="_blank"
              rel="noopener noreferrer"
              class="group block rounded-lg overflow-hidden aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5fc1]"
              style="border: 1px solid #362d59"
            >
              <img
                :src="url"
                :alt="fileName(url)"
                class="w-full h-full object-cover transition-opacity duration-150 group-hover:opacity-80"
                loading="lazy"
              >
            </a>
          </div>

          <!-- PDF / other file links -->
          <div
            v-if="record.attachments.some(u => !isImage(u))"
            class="flex flex-col gap-1.5"
          >
            <a
              v-for="url in record.attachments.filter(u => !isImage(u))"
              :key="url"
              :href="url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] text-[#a49bc9] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5fc1]"
              style="background: #1f1633; border: 1px solid #362d59; font-family: Rubik, sans-serif"
            >
              <UIcon name="i-heroicons-document" class="w-4 h-4 shrink-0 text-[#6a5fc1]" />
              <span class="truncate">{{ fileName(url) }}</span>
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 shrink-0 ml-auto" />
            </a>
          </div>
        </div>
      </UCard>

    </template>

    <!-- Delete confirmation modal -->
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

  </div>
</template>
