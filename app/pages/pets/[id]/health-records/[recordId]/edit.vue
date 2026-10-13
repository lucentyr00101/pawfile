<script setup lang="ts">
import type { HealthRecord, Pet } from '#shared/types/models'
import type { VetVisitFormData } from '~/components/health/VetVisitForm.vue'
import type { VaccinationFormData } from '~/components/health/VaccinationForm.vue'

type HealthFormData = VetVisitFormData | VaccinationFormData

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

const pageTitle = computed(() => isVetVisit.value ? 'Edit Vet Visit' : 'Edit Vaccination')
const pageDesc = computed(() =>
  isVetVisit.value
    ? 'Update clinic visit details, notes, and follow-up.'
    : 'Update vaccination details and due date.',
)

const isSaving = ref(false)

async function onSubmit(data: HealthFormData) {
  isSaving.value = true
  try {
    await $fetch(`/api/pets/${id}/health-records/${recordId}`, {
      method: 'PUT',
      // notes: null (not undefined, which JSON drops) so clearing the field actually clears it
      body: { title: data.title, date: data.date, notes: data.notes ?? null, metadata: data.metadata },
    })
    toast.add({ title: 'Record updated', description: 'Health record has been saved.', color: 'success' })
    await navigateTo(`/pets/${id}/health-records/${recordId}`)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Failed to save', description: message, color: 'error' })
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">

    <!-- Breadcrumb -->
    <NuxtLink
      :to="`/pets/${id}/health-records/${recordId}`"
      class="inline-flex items-center gap-1.5 text-[13px] text-dusk-300 hover:text-white transition-colors w-fit"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 shrink-0" />
      <span>{{ pet?.name ?? 'Pet' }} / Health Record</span>
    </NuxtLink>

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <div class="flex items-center gap-4">
        <USkeleton class="w-12 h-12 rounded-xl shrink-0" />
        <div class="flex flex-col gap-2 flex-1">
          <USkeleton class="h-6 w-48 rounded-lg" />
          <USkeleton class="h-4 w-64 rounded-lg" />
        </div>
      </div>
      <USkeleton class="h-96 rounded-2xl" />
    </template>

    <!-- 404 / error state -->
    <template v-else-if="is404 || (error && !record)">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <div
          class="w-14 h-14 rounded-2xl grid place-items-center mb-5"
          style="background: var(--color-dusk-900); border: 1px solid var(--color-border-dark)"
        >
          <UIcon name="i-heroicons-document-magnifying-glass" class="w-7 h-7 text-sentry-500" />
        </div>
        <p
          class="text-white text-xl font-semibold mb-2"
        >
          Record not found
        </p>
        <p
          class="text-dusk-300 text-sm mb-6"
        >
          This health record doesn't exist or you don't have access.
        </p>
        <UButton :to="`/pets/${id}?tab=health`" color="primary">
          Back to Health Records
        </UButton>
      </div>
    </template>

    <!-- Edit form -->
    <template v-else-if="record">

      <!-- Page header -->
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          :style="isVetVisit
            ? 'background: color-mix(in oklch, var(--color-sentry-500) 15%, transparent); border: 1px solid color-mix(in oklch, var(--color-sentry-500) 35%, transparent); box-shadow: 0 0 24px rgba(106,95,193,0.15)'
            : 'background: color-mix(in oklch, var(--color-neon-300) 10%, transparent); border: 1px solid color-mix(in oklch, var(--color-neon-300) 30%, transparent); box-shadow: 0 0 24px rgba(194,239,78,0.1)'"
        >
          <UIcon
            :name="isVetVisit ? 'i-heroicons-clipboard-document-list' : 'i-heroicons-beaker'"
            class="w-6 h-6"
            :style="isVetVisit ? 'color: var(--color-sentry-300)' : 'color: var(--color-neon-300)'"
          />
        </div>

        <div class="flex flex-col gap-0.5">
          <h1
            class="text-white text-2xl font-semibold"
          >
            {{ pageTitle }}
          </h1>
          <p class="text-dusk-300 text-sm">
            {{ pageDesc }}
          </p>
        </div>
      </div>

      <!-- Form card -->
      <UCard
        :ui="{
          root: 'bg-dusk-950 border border-border-dark rounded-2xl',
        }"
      >
        <HealthVetVisitForm
          v-if="isVetVisit"
          :record="record"
          :loading="isSaving"
          @submit="onSubmit"
        />
        <HealthVaccinationForm
          v-else
          :record="record"
          :loading="isSaving"
          @submit="onSubmit"
        />
      </UCard>

      <!-- Cancel -->
      <div class="flex justify-center">
        <NuxtLink
          :to="`/pets/${id}/health-records/${recordId}`"
          class="text-[13px] text-dusk-300 hover:text-white transition-colors"
        >
          Cancel and go back
        </NuxtLink>
      </div>

    </template>

  </div>
</template>
