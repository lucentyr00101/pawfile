<script setup lang="ts">
import type { HealthRecord } from '#shared/types/models'
import type { DueItem } from '~/utils/health'

const props = defineProps<{
  record: HealthRecord
  /** Active (not superseded) due date for this record, if any */
  due?: DueItem
}>()
const emit = defineEmits<{ click: [record: HealthRecord] }>()

const isVetVisit = computed(() => props.record.type === 'vet_visit')
const meta = computed(() => props.record.metadata ?? {})
</script>

<template>
  <button
    type="button"
    class="w-full text-left group cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sentry-500"
    @click="emit('click', record)"
  >
    <div
      class="flex gap-3 px-4 py-3.5 rounded-xl bg-dusk-900 border border-border-dark shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-colors duration-150 group-hover:border-sentry-500"
    >
      <!-- Type icon -->
      <div
        class="shrink-0 w-9 h-9 rounded-lg grid place-items-center mt-0.5 border"
        :class="isVetVisit
          ? 'bg-sentry-500/15 border-sentry-500/35 text-sentry-300'
          : 'bg-neon-300/10 border-neon-300/30 text-neon-300'"
      >
        <UIcon
          :name="isVetVisit ? 'i-heroicons-clipboard-document-list' : 'i-heroicons-beaker'"
          class="w-4 h-4"
          aria-hidden="true"
        />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <p class="text-white text-[13px] font-semibold leading-snug truncate">
            {{ record.title }}
          </p>
          <span class="shrink-0 text-[10px] font-semibold uppercase text-dusk-300 mt-0.5 whitespace-nowrap tracking-[0.25px]">
            {{ formatDate(record.date) }}
          </span>
        </div>

        <div
          class="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.25px]"
          :class="isVetVisit ? 'text-sentry-300' : 'text-neon-300'"
        >
          {{ isVetVisit ? 'Vet Visit' : 'Vaccination' }}
        </div>

        <!-- Vet visit metadata -->
        <div v-if="isVetVisit && (meta.clinicName || meta.diagnosis)" class="mt-1.5 flex flex-col gap-1">
          <span v-if="meta.clinicName" class="text-dusk-300 text-[12px] flex items-center gap-1 min-w-0">
            <UIcon name="i-heroicons-building-office-2" class="w-3 h-3 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ meta.clinicName }}</span>
          </span>
          <span v-if="meta.diagnosis" class="text-gray-200 text-[12px] flex items-start gap-1 min-w-0">
            <UIcon name="i-heroicons-document-text" class="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" />
            <span class="line-clamp-2 whitespace-pre-line">{{ meta.diagnosis }}</span>
          </span>
        </div>

        <!-- Vaccination metadata -->
        <div v-if="!isVetVisit && meta.vaccineName" class="mt-1.5">
          <span class="text-dusk-300 text-[12px] flex items-center gap-1 min-w-0">
            <UIcon name="i-heroicons-tag" class="w-3 h-3 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ meta.vaccineName }}</span>
          </span>
        </div>

        <!-- Active due date (next dose / follow-up) -->
        <div v-if="due" class="mt-1.5 flex items-center gap-2 flex-wrap">
          <DueBadge :status="due.status" :label="due.status === 'ok' ? undefined : dueLabel(due.days)" />
          <span class="text-dusk-300 text-[12px]">
            {{ due.kind === 'vaccination' ? 'Next dose' : 'Follow-up' }} · {{ formatDate(due.dueDate) }}
          </span>
        </div>

        <p
          v-if="record.notes"
          class="mt-1.5 text-dusk-300 text-[12px] leading-relaxed line-clamp-3 whitespace-pre-line"
        >
          {{ record.notes }}
        </p>
      </div>
    </div>
  </button>
</template>
