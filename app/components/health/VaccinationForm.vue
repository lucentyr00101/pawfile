<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { HealthRecord, VaccinationMetadata } from '#shared/types/models'

export interface VaccinationFormData {
  type: 'vaccination'
  title: string
  date: string
  notes?: string
  metadata: VaccinationMetadata
}

const props = defineProps<{
  record?: Pick<HealthRecord, 'title' | 'date' | 'notes' | 'metadata'>
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: VaccinationFormData]
}>()

const state = reactive({
  title: props.record?.title ?? '',
  date: toDateInputValue(props.record?.date),
  vaccineName: props.record?.metadata?.vaccineName ?? '',
  batchNumber: props.record?.metadata?.batchNumber ?? '',
  nextDueDate: toDateInputValue(props.record?.metadata?.nextDueDate),
  notes: props.record?.notes ?? '',
})

const initialState = JSON.stringify(state)
useUnsavedChangesGuard(() => !props.loading && JSON.stringify(state) !== initialState)

function validate(data: typeof state): FormError[] {
  const errors: FormError[] = []

  if (!data.title.trim())
    errors.push({ name: 'title', message: 'Title is required' })

  if (!data.date)
    errors.push({ name: 'date', message: 'Vaccination date is required' })
  else if (daysUntil(data.date) > 0)
    errors.push({ name: 'date', message: 'Vaccination date cannot be in the future' })

  if (data.nextDueDate && data.date && data.nextDueDate <= data.date)
    errors.push({ name: 'nextDueDate', message: 'Next due date must be after the vaccination date' })

  return errors
}

function onSubmit(event: FormSubmitEvent<typeof state>) {
  const { title, date, notes, vaccineName, batchNumber, nextDueDate } = event.data
  emit('submit', {
    type: 'vaccination',
    title,
    date,
    notes: notes || undefined,
    metadata: {
      vaccineName: vaccineName || undefined,
      batchNumber: batchNumber || undefined,
      nextDueDate: nextDueDate || undefined,
    },
  })
}

const labelUi = { label: 'text-gray-200 text-sm font-medium mb-1.5' }
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmit">
    <FormSection title="Vaccination Details" />

    <div class="space-y-4">
      <UFormField label="Title" name="title" :ui="labelUi" required>
        <UInput
          v-model="state.title"
          type="text"
          placeholder="e.g. Rabies vaccination"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Vaccination Date" name="date" :ui="labelUi" required>
          <UInput
            v-model="state.date"
            type="date"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Next Due Date"
          name="nextDueDate"
          :ui="{ ...labelUi, help: 'text-dusk-300 text-xs' }"
          help="Shown in reminders when it's coming up"
        >
          <UInput
            v-model="state.nextDueDate"
            type="date"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <FormSection title="Vaccine Info" />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UFormField
        label="Vaccine Name"
        name="vaccineName"
        :ui="{ ...labelUi, help: 'text-dusk-300 text-xs' }"
        help="Used to match booster doses of the same vaccine"
      >
        <UInput
          v-model="state.vaccineName"
          type="text"
          placeholder="e.g. Vanguard Plus 5"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Batch Number" name="batchNumber" :ui="labelUi">
        <UInput
          v-model="state.batchNumber"
          type="text"
          placeholder="e.g. BN-20240512"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </div>

    <FormSection title="Notes" />

    <UFormField label="Notes" name="notes" :ui="labelUi">
      <UTextarea
        v-model="state.notes"
        placeholder="Any additional notes about this vaccination…"
        :rows="3"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <div class="pt-2">
      <SubmitButton :loading="loading" label="Save Record" />
    </div>
  </UForm>
</template>
