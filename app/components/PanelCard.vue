<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  icon?: string
  padded?: boolean
}>()
</script>

<template>
  <div
    class="rounded-2xl overflow-hidden"
    style="
      background: var(--color-dusk-950);
      border: 1px solid var(--color-border-dark);
      box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px;
    "
  >
    <div
      class="flex items-center gap-3 px-5 py-4"
      style="border-bottom: 1px solid var(--color-border-dark)"
    >
      <span
        v-if="icon"
        class="w-7 h-7 rounded-lg grid place-items-center shrink-0"
        style="background: var(--color-dusk-900); border: 1px solid var(--color-border-dark); color: var(--color-sentry-300)"
      >
        <UIcon :name="icon" class="w-3.5 h-3.5" />
      </span>
      <div class="flex-1 min-w-0">
        <div class="text-white text-sm font-semibold">{{ title }}</div>
        <div v-if="subtitle" class="text-dusk-300 text-xs mt-0.5">
          {{ subtitle }}
        </div>
      </div>
      <slot name="right" />
    </div>
    <div :class="padded === false ? '' : 'py-1'">
      <slot />
    </div>
  </div>
</template>
