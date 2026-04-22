<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

interface VetVisitRecord {
  type: 'vet_visit'
  title: string
  date: string
  notes?: string
  metadata?: {
    clinicName?: string
    vetName?: string
    diagnosis?: string
    followUpDate?: string
  }
}

interface RecordProp {
  type: 'vet_visit'
  title: string
  date: string
  notes?: string
  metadata?: {
    clinicName?: string
    vetName?: string
    diagnosis?: string
    followUpDate?: string
  }
}

const props = defineProps<{
  record?: RecordProp
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: VetVisitRecord]
}>()

const state = reactive({
  title: props.record?.title ?? '',
  date: props.record?.date
    ? new Date(props.record.date).toISOString().slice(0, 10)
    : '',
  clinicName: props.record?.metadata?.clinicName ?? '',
  vetName: props.record?.metadata?.vetName ?? '',
  diagnosis: props.record?.metadata?.diagnosis ?? '',
  followUpDate: props.record?.metadata?.followUpDate
    ? new Date(props.record.metadata.followUpDate).toISOString().slice(0, 10)
    : '',
  notes: props.record?.notes ?? '',
})

function validate(data: typeof state): FormError[] {
  const errors: FormError[] = []

  if (!data.title.trim())
    errors.push({ name: 'title', message: 'Title is required' })

  if (!data.date)
    errors.push({ name: 'date', message: 'Visit date is required' })
  else if (new Date(data.date) > new Date())
    errors.push({ name: 'date', message: 'Visit date cannot be in the future' })

  if (data.followUpDate && data.date && new Date(data.followUpDate) <= new Date(data.date))
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

const labelUi = { label: 'text-[#e5e7eb] text-sm font-medium mb-1.5' }
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmit">

    <!-- ── Section: Visit Details ──────────────────────────────── -->
    <div class="flex items-center gap-3">
      <p
        class="text-[10px] font-semibold uppercase text-[#a49bc9] shrink-0"
        style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
      >
        Visit Details
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
          placeholder="e.g. Annual checkup"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <!-- Date + Follow-up Date -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField name="date" :ui="labelUi" required>
          <template #label>
            Visit Date
            <span class="text-[#fa7faa] ml-0.5">*</span>
          </template>
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

    <!-- ── Section: Clinic & Vet ───────────────────────────────── -->
    <div class="flex items-center gap-3">
      <p
        class="text-[10px] font-semibold uppercase text-[#a49bc9] shrink-0"
        style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
      >
        Clinic &amp; Vet
      </p>
      <div class="flex-1 h-px" style="background: #362d59" />
    </div>

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

    <!-- ── Section: Medical Notes ──────────────────────────────── -->
    <div class="flex items-center gap-3">
      <p
        class="text-[10px] font-semibold uppercase text-[#a49bc9] shrink-0"
        style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
      >
        Medical Notes
      </p>
      <div class="flex-1 h-px" style="background: #362d59" />
    </div>

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

    <!-- ── Submit ──────────────────────────────────────────────── -->
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
