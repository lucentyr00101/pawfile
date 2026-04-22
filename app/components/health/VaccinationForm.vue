<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

interface VaccinationRecord {
  type: 'vaccination'
  title: string
  date: string
  notes?: string
  metadata?: {
    vaccineName?: string
    batchNumber?: string
    nextDueDate?: string
  }
}

interface RecordProp {
  type: 'vaccination'
  title: string
  date: string
  notes?: string
  metadata?: {
    vaccineName?: string
    batchNumber?: string
    nextDueDate?: string
  }
}

const props = defineProps<{
  record?: RecordProp
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: VaccinationRecord]
}>()

const state = reactive({
  title: props.record?.title ?? '',
  date: props.record?.date
    ? new Date(props.record.date).toISOString().slice(0, 10)
    : '',
  vaccineName: props.record?.metadata?.vaccineName ?? '',
  batchNumber: props.record?.metadata?.batchNumber ?? '',
  nextDueDate: props.record?.metadata?.nextDueDate
    ? new Date(props.record.metadata.nextDueDate).toISOString().slice(0, 10)
    : '',
  notes: props.record?.notes ?? '',
})

function validate(data: typeof state): FormError[] {
  const errors: FormError[] = []

  if (!data.title.trim())
    errors.push({ name: 'title', message: 'Title is required' })

  if (!data.date)
    errors.push({ name: 'date', message: 'Vaccination date is required' })
  else if (new Date(data.date) > new Date())
    errors.push({ name: 'date', message: 'Vaccination date cannot be in the future' })

  if (data.nextDueDate && data.date && new Date(data.nextDueDate) <= new Date(data.date))
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

const labelUi = { label: 'text-[#e5e7eb] text-sm font-medium mb-1.5' }
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmit">

    <!-- ── Section: Vaccination Details ──────────────────────────── -->
    <div class="flex items-center gap-3">
      <p
        class="text-[10px] font-semibold uppercase text-[#a49bc9] shrink-0"
        style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
      >
        Vaccination Details
      </p>
      <div class="flex-1 h-px" style="background: #362d59" />
    </div>

    <div class="space-y-4">
      <!-- Title (required) -->
      <UFormField name="title" :ui="labelUi" required>
        <template #label>
          Title
          <span class="text-[#fa7faa] ml-0.5">*</span>
        </template>
        <UInput
          v-model="state.title"
          type="text"
          placeholder="e.g. Rabies vaccination"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <!-- Date + Next Due Date -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField name="date" :ui="labelUi" required>
          <template #label>
            Vaccination Date
            <span class="text-[#fa7faa] ml-0.5">*</span>
          </template>
          <UInput
            v-model="state.date"
            type="date"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Next Due Date" name="nextDueDate" :ui="labelUi">
          <UInput
            v-model="state.nextDueDate"
            type="date"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <!-- ── Section: Vaccine Info ───────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <p
        class="text-[10px] font-semibold uppercase text-[#a49bc9] shrink-0"
        style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
      >
        Vaccine Info
      </p>
      <div class="flex-1 h-px" style="background: #362d59" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UFormField label="Vaccine Name" name="vaccineName" :ui="labelUi">
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

    <!-- ── Section: Notes ─────────────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <p
        class="text-[10px] font-semibold uppercase text-[#a49bc9] shrink-0"
        style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
      >
        Notes
      </p>
      <div class="flex-1 h-px" style="background: #362d59" />
    </div>

    <UFormField label="Notes" name="notes" :ui="labelUi">
      <UTextarea
        v-model="state.notes"
        placeholder="Any additional notes about this vaccination…"
        :rows="3"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- ── Submit ──────────────────────────────────────────────────── -->
    <div class="pt-2">
      <button
        type="submit"
        :disabled="loading"
        class="w-full h-11 rounded-[13px] text-white text-sm font-bold uppercase tracking-wider transition-shadow duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        style="
          background-color: #79628c;
          border: 1px solid #584674;
          box-shadow: rgba(0,0,0,0.1) 0px 1px 3px 0px inset;
          font-family: Rubik, sans-serif;
          letter-spacing: 0.2px;
        "
        onmouseover="if (!this.disabled) this.style.boxShadow='rgba(0,0,0,0.18) 0px 0.5rem 1.5rem, rgba(0,0,0,0.1) 0px 1px 3px 0px inset'"
        onmouseout="this.style.boxShadow='rgba(0,0,0,0.1) 0px 1px 3px 0px inset'"
      >
        <svg v-if="loading" class="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ loading ? 'Saving…' : 'Save Record' }}
      </button>
    </div>

  </UForm>
</template>
