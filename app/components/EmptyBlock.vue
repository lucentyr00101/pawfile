<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  desc?: string
}>()
</script>

<template>
  <div
    class="px-5 py-9 text-center flex flex-col items-center gap-3.5"
  >
    <div
      class="w-12 h-12 rounded-xl grid place-items-center"
      style="background: var(--color-dusk-900); border: 1px solid var(--color-border-dark); color: var(--color-sentry-500)"
    >
      <UIcon :name="icon" class="w-6 h-6" />
    </div>
    <div>
      <div class="text-white text-sm font-semibold">{{ title }}</div>
      <div
        v-if="desc"
        class="text-dusk-300 text-xs mt-1 leading-relaxed max-w-[280px] mx-auto"
      >
        {{ desc }}
      </div>
    </div>
    <slot />
  </div>
</template>
