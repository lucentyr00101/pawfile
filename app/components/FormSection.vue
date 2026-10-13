<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="flex items-center gap-3">
    <p class="text-[10px] font-semibold uppercase text-dusk-300 shrink-0 tracking-[0.25px]">
      {{ title }}
    </p>
    <div class="flex-1 h-px bg-border-dark" />
  </div>
</template>
