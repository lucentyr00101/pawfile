<script setup lang="ts">
import type { HealthRecord } from '#shared/types/models'

const props = defineProps<{
  records: HealthRecord[]
  petId: string
  /** Show at most this many files */
  limit?: number
}>()

const items = computed(() => {
  const all = props.records.flatMap(record =>
    (record.attachments ?? []).map(url => ({ url, record })),
  )
  return props.limit ? all.slice(0, props.limit) : all
})

function isImage(url: string) {
  return /\.(jpe?g|png|webp|gif|avif)$/i.test(url)
}
</script>

<template>
  <ul class="flex flex-col divide-y divide-border-dark">
    <li v-for="{ url, record } in items" :key="url" class="flex items-center gap-3 px-5 py-3">
      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="w-10 h-10 rounded-lg overflow-hidden shrink-0 grid place-items-center bg-dusk-900 border border-border-dark focus-visible:ring-2 focus-visible:ring-sentry-500 focus:outline-none"
        :aria-label="`Open ${isImage(url) ? 'image' : 'document'} from ${record.title}`"
      >
        <img v-if="isImage(url)" :src="url" alt="" class="w-full h-full object-cover" loading="lazy">
        <UIcon v-else name="i-heroicons-document" class="w-5 h-5 text-sentry-500" />
      </a>
      <div class="min-w-0 flex-1">
        <a
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="block text-white text-[13px] font-medium truncate hover:underline"
        >
          {{ isImage(url) ? 'Image' : 'PDF document' }}
        </a>
        <NuxtLink
          :to="`/pets/${petId}/health-records/${record._id}`"
          class="block text-dusk-300 text-xs truncate hover:text-white"
        >
          {{ record.title }} · {{ formatDate(record.date) }}
        </NuxtLink>
      </div>
    </li>
  </ul>
</template>
