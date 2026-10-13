<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { HealthRecord, VetVisitMetadata } from '#shared/types/models'

export interface VetVisitFormData {
  type: 'vet_visit'
  title: string
  date: string
  notes?: string
  metadata: VetVisitMetadata
}

const props = defineProps<{
  record?: Pick<HealthRecord, 'title' | 'date' | 'notes' | 'metadata'>
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: VetVisitFormData]
}>()

const state = reactive({
  title: props.record?.title ?? '',
  date: toDateInputValue(props.record?.date),
  clinicName: props.record?.metadata?.clinicName ?? '',
  vetName: props.record?.metadata?.vetName ?? '',
  diagnosis: props.record?.metadata?.diagnosis ?? '',
  followUpDate: toDateInputValue(props.record?.metadata?.followUpDate),
  notes: props.record?.notes ?? '',
})

const initialState = JSON.stringify(state)
useUnsavedChangesGuard(() => !props.loading && JSON.stringify(state) !== initialState)

function validate(data: typeof state): FormError[] {
  const errors: FormError[] = []

  if (!data.title.trim())
    errors.push({ name: 'title', message: 'Title is required' })

  if (!data.date)
    errors.push({ name: 'date', message: 'Visit date is required' })
  else if (daysUntil(data.date) > 0)
    errors.push({ name: 'date', message: 'Visit date cannot be in the future' })

  if (data.followUpDate && data.date && data.followUpDate <= data.date)
    errors.push({ name: 'followUpDate', message: 'Follow-up date must be after the visit date' })

  return errors
}

function onSubmit(event: FormSubmitEvent<typeof state>) {
  const { title, date, notes, clinicName, vetName, diagnosis, followUpDate } = event.data
  emit('submit', {
    type: 'vet_visit',
    title,
    date,
    notes: notes || undefined,
    metadata: {
      clinicName: clinicName || undefined,
      vetName: vetName || undefined,
      diagnosis: diagnosis || undefined,
      followUpDate: followUpDate || undefined,
    },
  })
}

const labelUi = { label: 'text-gray-200 text-sm font-medium mb-1.5' }
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmit">
    <FormSection title="Visit Details" />

    <div class="space-y-4">
      <UFormField label="Title" name="title" :ui="labelUi" required>
        <UInput
          v-model="state.title"
          type="text"
          placeholder="e.g. Annual checkup"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Visit Date" name="date" :ui="labelUi" required>
          <UInput
            v-model="state.date"
            type="date"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Follow-up Date" name="followUpDate" :ui="labelUi">
          <UInput
            v-model="state.followUpDate"
            type="date"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <FormSection title="Clinic & Vet" />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UFormField label="Clinic Name" name="clinicName" :ui="labelUi">
        <UInput
          v-model="state.clinicName"
          type="text"
          placeholder="e.g. PetCare Clinic"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Vet Name" name="vetName" :ui="labelUi">
        <UInput
          v-model="state.vetName"
          type="text"
          placeholder="e.g. Dr. Santos"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </div>

    <FormSection title="Medical Notes" />

    <div class="space-y-4">
      <UFormField label="Diagnosis" name="diagnosis" :ui="labelUi">
        <UTextarea
          v-model="state.diagnosis"
          placeholder="e.g. Mild ear infection, prescribed antibiotics…"
          :rows="3"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Notes" name="notes" :ui="labelUi">
        <UTextarea
          v-model="state.notes"
          placeholder="Any additional notes about this visit…"
          :rows="3"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="pt-2">
      <SubmitButton :loading="loading" label="Save Record" />
    </div>
  </UForm>
</template>
