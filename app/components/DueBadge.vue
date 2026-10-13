<script setup lang="ts">
import type { DueStatus } from '~/utils/health'

const props = defineProps<{
  status: DueStatus
  /** Text shown in the pill; defaults to a label for the status */
  label?: string
}>()

const STYLES: Record<DueStatus, { icon: string, cls: string, text: string }> = {
  'overdue': {
    icon: 'i-heroicons-exclamation-circle',
    cls: 'text-red-400 bg-red-500/12 border-red-500/30',
    text: 'Overdue',
  },
  'due-soon': {
    icon: 'i-heroicons-clock',
    cls: 'text-amber-400 bg-amber-500/12 border-amber-500/30',
    text: 'Due soon',
  },
  'ok': {
    icon: 'i-heroicons-calendar',
    cls: 'text-dusk-300 bg-dusk-900 border-border-dark',
    text: 'Scheduled',
  },
}

const style = computed(() => STYLES[props.status])
</script>

<template>
  <span
    class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full border tracking-[0.2px] whitespace-nowrap"
    :class="style.cls"
  >
    <UIcon :name="style.icon" class="w-3 h-3 shrink-0" aria-hidden="true" />
    {{ label ?? style.text }}
  </span>
</template>
