<script setup lang="ts">
const emit = defineEmits<{ navigate: [] }>()

const { user, logout } = useAuth()
const route = useRoute()

interface NavItem {
  id: string
  label: string
  icon: string
  to?: string
}

const items: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'i-heroicons-home', to: '/dashboard' },
  { id: 'pets', label: 'My Pets', icon: 'i-heroicons-heart', to: '/pets' },
  { id: 'reminders', label: 'Reminders', icon: 'i-heroicons-bell' },
  { id: 'timeline', label: 'Timeline', icon: 'i-heroicons-clock' },
  { id: 'vaccines', label: 'Vaccinations', icon: 'i-heroicons-beaker' },
  { id: 'vets', label: 'Vet Visits', icon: 'i-heroicons-clipboard-document-list' },
  { id: 'meds', label: 'Medications', icon: 'i-heroicons-sparkles' },
  { id: 'documents', label: 'Documents', icon: 'i-heroicons-document' },
]

const secondary: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'i-heroicons-cog-6-tooth' },
  { id: 'help', label: 'Help', icon: 'i-heroicons-question-mark-circle' },
]

const userInitial = computed(() => user.value?.name?.[0]?.toUpperCase() ?? 'U')

function isActive(item: NavItem): boolean {
  if (!item.to) return false
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

const userMenu = [[
  { label: 'Sign out', icon: 'i-heroicons-arrow-right-on-rectangle', onSelect: () => logout() },
]]
</script>

<template>
  <nav aria-label="Main" class="flex flex-col gap-1 h-full">
    <div class="px-1 pb-3">
      <NuxtLink
        to="/pets/new"
        class="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-white text-[13px] font-bold uppercase tracking-[0.2px] bg-mauve-500 border border-border-button shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.18)] focus-visible:outline-2 focus-visible:outline-sentry-500"
        @click="emit('navigate')"
      >
        <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
        Add Pet
      </NuxtLink>
    </div>

    <template v-for="item in items" :key="item.id">
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        :aria-current="isActive(item) ? 'page' : undefined"
        class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm w-full border transition-colors focus-visible:outline-2 focus-visible:outline-sentry-500"
        :class="isActive(item)
          ? 'text-white font-semibold bg-dusk-900 border-border-dark'
          : 'text-dusk-300 font-medium border-transparent hover:text-white'"
        @click="emit('navigate')"
      >
        <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
        <span class="flex-1">{{ item.label }}</span>
      </NuxtLink>
      <div
        v-else
        aria-disabled="true"
        :title="`${item.label} is coming soon`"
        class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm w-full text-dusk-300/60 font-medium border border-transparent cursor-default"
      >
        <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
        <span class="flex-1">{{ item.label }}</span>
        <span class="text-[10px] font-semibold uppercase tracking-[0.25px] px-1.5 py-0.5 rounded-md bg-dusk-900 border border-border-dark text-dusk-300">
          Soon
        </span>
      </div>
    </template>

    <div class="flex-1" />

    <div class="h-px mx-1 my-2 bg-border-dark" />

    <div
      v-for="item in secondary"
      :key="item.id"
      aria-disabled="true"
      :title="`${item.label} is coming soon`"
      class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm w-full text-dusk-300/60 font-medium cursor-default"
    >
      <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
      <span class="flex-1">{{ item.label }}</span>
      <span class="text-[10px] font-semibold uppercase tracking-[0.25px] px-1.5 py-0.5 rounded-md bg-dusk-900 border border-border-dark text-dusk-300">
        Soon
      </span>
    </div>

    <UDropdownMenu :items="userMenu" :content="{ side: 'top', align: 'start' }">
      <button
        type="button"
        class="mt-2 p-3 rounded-xl flex items-center gap-2.5 w-full text-left bg-dusk-900 border border-border-dark cursor-pointer hover:border-border-button transition-colors focus-visible:outline-2 focus-visible:outline-sentry-500"
        aria-label="Account menu"
      >
        <UAvatar
          v-if="user?.avatar"
          :src="user.avatar"
          :alt="user.name"
          size="sm"
        />
        <span
          v-else
          class="w-8 h-8 rounded-full grid place-items-center text-white text-[13px] font-bold shrink-0 bg-linear-140 from-dusk-600 to-dusk-400"
          aria-hidden="true"
        >
          {{ userInitial }}
        </span>
        <span class="flex-1 min-w-0">
          <span class="block text-white text-[13px] font-semibold truncate">{{ user?.name ?? 'Guest' }}</span>
          <span class="block text-dusk-300 text-[11px] truncate">{{ user?.email ?? '' }}</span>
        </span>
        <UIcon name="i-heroicons-chevron-up-down" class="w-3.5 h-3.5 text-dusk-300 shrink-0" />
      </button>
    </UDropdownMenu>
  </nav>
</template>
