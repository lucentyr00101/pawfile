<script setup lang="ts">
const { user } = useAuth()
const route = useRoute()

interface NavItem {
  id: string
  label: string
  icon: string
  to?: string
  count?: number | null
  accent?: boolean
  disabled?: boolean
}

const items: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'i-heroicons-home', to: '/dashboard' },
  { id: 'pets', label: 'My Pets', icon: 'i-heroicons-heart', to: '/dashboard' },
  { id: 'reminders', label: 'Reminders', icon: 'i-heroicons-bell', disabled: true },
  { id: 'timeline', label: 'Timeline', icon: 'i-heroicons-clock', disabled: true },
  { id: 'vaccines', label: 'Vaccinations', icon: 'i-heroicons-beaker', disabled: true },
  { id: 'vets', label: 'Vet Visits', icon: 'i-heroicons-clipboard-document-list', disabled: true },
  { id: 'meds', label: 'Medications', icon: 'i-heroicons-sparkles', disabled: true },
  { id: 'documents', label: 'Documents', icon: 'i-heroicons-document', disabled: true },
]

const secondary: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'i-heroicons-cog-6-tooth', disabled: true },
  { id: 'help', label: 'Help', icon: 'i-heroicons-question-mark-circle', disabled: true },
]

const userInitial = computed(() => user.value?.name?.[0]?.toUpperCase() ?? 'U')

function isActive(item: NavItem): boolean {
  if (!item.to) return false
  if (item.id === 'pets') return route.path.startsWith('/pets')
  if (item.id === 'dashboard') return route.path === '/dashboard'
  return route.path === item.to
}
</script>

<template>
  <aside
    class="hidden lg:flex sticky top-14 self-start shrink-0 w-60 flex-col gap-1 px-3 py-5 overflow-y-auto"
    style="
      height: calc(100dvh - 56px);
      background: #150f23;
      border-right: 1px solid #362d59;
      font-family: Rubik, sans-serif;
    "
  >
    <div class="px-1 pb-3 flex flex-col gap-2">
      <NuxtLink
        to="/pets/new"
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-white text-[13px] font-bold uppercase cursor-pointer transition-shadow"
        style="
          background: #79628c;
          border: 1px solid #584674;
          letter-spacing: 0.2px;
          box-shadow: inset 0 1px 0 rgba(0,0,0,0.10);
        "
      >
        <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
        Add Pet
      </NuxtLink>
    </div>

    <template v-for="item in items" :key="item.id">
      <NuxtLink
        v-if="!item.disabled && item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm w-full text-left transition-colors cursor-pointer"
        :class="
          isActive(item)
            ? 'text-white font-semibold'
            : 'text-[#a49bc9] font-medium hover:text-white'
        "
        :style="isActive(item) ? 'background: #1f1633; border: 1px solid #362d59;' : 'border: 1px solid transparent;'"
      >
        <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
        <span class="flex-1">{{ item.label }}</span>
        <span
          v-if="item.count != null"
          class="text-[11px] font-semibold rounded-full px-2 py-0.5 min-w-[22px] text-center"
          :style="
            item.accent
              ? 'background: #c2ef4e; color: #150f23;'
              : 'background: #1f1633; color: #a49bc9; border: 1px solid #362d59;'
          "
        >
          {{ item.count }}
        </span>
      </NuxtLink>
      <button
        v-else
        disabled
        class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm w-full text-left text-[#a49bc9] font-medium opacity-50 cursor-not-allowed"
        style="border: 1px solid transparent"
      >
        <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
        <span class="flex-1">{{ item.label }}</span>
      </button>
    </template>

    <div class="flex-1" />

    <div class="h-px mx-1 my-2" style="background: #362d59" />

    <button
      v-for="item in secondary"
      :key="item.id"
      disabled
      class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm w-full text-left text-[#a49bc9] font-medium opacity-50 cursor-not-allowed"
      style="border: 1px solid transparent"
    >
      <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
      <span class="flex-1">{{ item.label }}</span>
    </button>

    <div
      class="mt-2 p-3 rounded-xl flex items-center gap-2.5"
      style="background: #1f1633; border: 1px solid #362d59"
    >
      <div
        class="w-8 h-8 rounded-full grid place-items-center text-white text-[13px] font-bold shrink-0"
        style="background: linear-gradient(140deg,#4a3f80,#857ab7)"
      >
        {{ userInitial }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-white text-[13px] font-semibold truncate">
          {{ user?.name ?? 'Guest' }}
        </div>
        <div class="text-[#a49bc9] text-[11px] truncate">
          {{ user?.email ?? '' }}
        </div>
      </div>
      <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-[#a49bc9] shrink-0" />
    </div>
  </aside>
</template>
