<script setup lang="ts">
import type { Pet } from '#shared/types/models'
import type { VetVisitFormData } from '~/components/health/VetVisitForm.vue'
import type { VaccinationFormData } from '~/components/health/VaccinationForm.vue'

type HealthFormData = VetVisitFormData | VaccinationFormData

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const type = computed(() => {
  const t = route.query.type
  if (t === 'vet_visit' || t === 'vaccination') return t
  return null
})

if (!type.value) {
  await navigateTo(`/pets/${id}?tab=health`)
}

const { data: pet } = useFetch<Pet>(`/api/pets/${id}`, { lazy: true })

const isVetVisit = computed(() => type.value === 'vet_visit')
const pageTitle = computed(() => isVetVisit.value ? 'New Vet Visit' : 'New Vaccination')
const pageDesc = computed(() =>
  isVetVisit.value
    ? 'Log a clinic visit, checkup, or treatment.'
    : 'Record a vaccine with due date tracking.',
)

const isSaving = ref(false)

async function onSubmit(data: HealthFormData) {
  isSaving.value = true
  try {
    await $fetch(`/api/pets/${id}/health-records`, { method: 'POST', body: data })
    toast.add({ title: 'Record added', description: 'Health record has been saved.', color: 'success' })
    await navigateTo(`/pets/${id}?tab=health`)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string, message?: string } }
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
      :to="`/pets/${id}?tab=health`"
      class="inline-flex items-center gap-1.5 text-[13px] text-dusk-300 hover:text-white transition-colors w-fit"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 shrink-0" />
      <span>{{ pet?.name ?? 'Pet' }} / Health Records</span>
    </NuxtLink>

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
        :loading="isSaving"
        @submit="onSubmit"
      />
      <HealthVaccinationForm
        v-else
        :loading="isSaving"
        @submit="onSubmit"
      />
    </UCard>

  </div>
</template>
