<script setup lang="ts">
defineProps<{
  loading?: boolean
  label: string
  loadingLabel?: string
}>()
</script>

<template>
  <button
    type="submit"
    :disabled="loading"
    :aria-busy="loading"
    class="w-full h-11 rounded-[13px] text-white text-sm font-bold uppercase tracking-[0.2px] bg-mauve-500 border border-border-button shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] transition-shadow duration-150 hover:enabled:shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.18),inset_0_1px_3px_rgba(0,0,0,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sentry-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
  >
    <UIcon v-if="loading" name="i-heroicons-arrow-path" class="animate-spin w-4 h-4 shrink-0" />
    {{ loading ? (loadingLabel ?? 'Saving…') : label }}
  </button>
</template>
