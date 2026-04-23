<script setup lang="ts">
export interface VetVisitMetadata {
  clinicName?: string
  vetName?: string
  diagnosis?: string
  followUpDate?: string
}

export interface VaccinationMetadata {
  vaccineName?: string
  batchNumber?: string
  nextDueDate?: string
}

export interface HealthRecord {
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

const props = defineProps<{ record: HealthRecord }>()
const emit = defineEmits<{ click: [record: HealthRecord] }>()

const formattedDate = computed(() =>
  new Date(props.record.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
)

const isVetVisit = computed(() => props.record.type === 'vet_visit')
const vetMeta = computed(() => isVetVisit.value ? (props.record.metadata as VetVisitMetadata) : null)
const vacMeta = computed(() => !isVetVisit.value ? (props.record.metadata as VaccinationMetadata) : null)

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
  return new Date(raw).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})
</script>

<template>
  <button
    type="button"
    class="w-full text-left group cursor-pointer transition-all duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5fc1]"
    @click="emit('click', record)"
  >
    <div
      class="flex gap-3 px-4 py-3.5 rounded-xl transition-colors duration-150 group-hover:border-[#6a5fc1]"
      style="
        background: #1f1633;
        border: 1px solid #362d59;
        font-family: Rubik, sans-serif;
        box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px;
      "
    >
      <!-- Type icon -->
      <div
        class="shrink-0 w-9 h-9 rounded-lg grid place-items-center mt-0.5"
        :style="isVetVisit
          ? 'background: color-mix(in oklch, #6a5fc1 15%, transparent); border: 1px solid color-mix(in oklch, #6a5fc1 35%, transparent); color: #9a8ee8'
          : 'background: color-mix(in oklch, #c2ef4e 10%, transparent); border: 1px solid color-mix(in oklch, #c2ef4e 30%, transparent); color: #c2ef4e'"
      >
        <UIcon
          :name="isVetVisit ? 'i-heroicons-clipboard-document-list' : 'i-heroicons-beaker'"
          class="w-4 h-4"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Title + date row -->
        <div class="flex items-start justify-between gap-2">
          <p class="text-white text-[13px] font-semibold leading-snug truncate">
            {{ record.title }}
          </p>
          <span
            class="shrink-0 text-[10px] font-semibold uppercase text-[#a49bc9] mt-0.5 whitespace-nowrap"
            style="letter-spacing: 0.25px"
          >
            {{ formattedDate }}
          </span>
        </div>

        <!-- Type label -->
        <div
          class="mt-0.5 text-[10px] font-semibold uppercase"
          :style="isVetVisit ? 'color: #9a8ee8; letter-spacing: 0.25px' : 'color: #c2ef4e; letter-spacing: 0.25px'"
        >
          {{ isVetVisit ? 'Vet Visit' : 'Vaccination' }}
        </div>

        <!-- Vet visit metadata -->
        <template v-if="isVetVisit && vetMeta">
          <div
            v-if="vetMeta.clinicName || vetMeta.diagnosis"
            class="mt-1.5 flex flex-col gap-1"
          >
            <span
              v-if="vetMeta.clinicName"
              class="text-[#a49bc9] text-[12px] flex items-center gap-1 truncate"
            >
              <UIcon name="i-heroicons-building-office-2" class="w-3 h-3 shrink-0" />
              {{ vetMeta.clinicName }}
            </span>
            <span
              v-if="vetMeta.diagnosis"
              class="text-[#e5e7eb] text-[12px] flex items-start gap-1 line-clamp-2 whitespace-pre-line"
            >
              <UIcon name="i-heroicons-document-text" class="w-3 h-3 shrink-0 mt-0.5" />
              {{ vetMeta.diagnosis }}
            </span>
          </div>
        </template>

        <!-- Vaccination metadata -->
        <template v-if="!isVetVisit && vacMeta">
          <div class="mt-1.5 flex flex-col gap-1">
            <span
              v-if="vacMeta.vaccineName"
              class="text-[#a49bc9] text-[12px] flex items-center gap-1 truncate"
            >
              <UIcon name="i-heroicons-tag" class="w-3 h-3 shrink-0" />
              {{ vacMeta.vaccineName }}
            </span>
            <template v-if="formattedNextDue">
              <span
                v-if="nextDueStatus === 'overdue'"
                class="self-start inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full"
                style="
                  color: #ef4444;
                  background: color-mix(in oklch, #ef4444 12%, transparent);
                  border: 1px solid color-mix(in oklch, #ef4444 30%, transparent);
                  letter-spacing: 0.2px;
                "
              >
                <UIcon name="i-heroicons-exclamation-circle" class="w-3 h-3" />
                Overdue · {{ formattedNextDue }}
              </span>
              <span
                v-else-if="nextDueStatus === 'due-soon'"
                class="self-start inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full"
                style="
                  color: #f59e0b;
                  background: color-mix(in oklch, #f59e0b 12%, transparent);
                  border: 1px solid color-mix(in oklch, #f59e0b 30%, transparent);
                  letter-spacing: 0.2px;
                "
              >
                <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                Due {{ formattedNextDue }}
              </span>
              <span
                v-else
                class="text-[#a49bc9] text-[12px] flex items-center gap-1"
              >
                <UIcon name="i-heroicons-calendar" class="w-3 h-3 shrink-0" />
                Next due {{ formattedNextDue }}
              </span>
            </template>
          </div>
        </template>

        <!-- Notes preview -->
        <p
          v-if="record.notes"
          class="mt-1.5 text-[#a49bc9] text-[12px] leading-relaxed line-clamp-3 whitespace-pre-line"
        >
          {{ record.notes }}
        </p>
      </div>
    </div>
  </button>
</template>
