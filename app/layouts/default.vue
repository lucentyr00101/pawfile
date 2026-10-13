<script setup lang="ts">
const { user, logout } = useAuth()

const isNavOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { isNavOpen.value = false })
</script>

<template>
  <div class="min-h-dvh bg-dusk-900 flex flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-sentry-500 focus:text-white"
    >
      Skip to content
    </a>

    <header class="sticky top-0 z-50 border-b border-border-dark bg-dusk-950/80 backdrop-blur-sm">
      <div class="px-4 sm:px-6 h-14 flex items-center gap-3">
        <!-- Mobile nav toggle -->
        <UButton
          class="lg:hidden -ml-2"
          color="neutral"
          variant="ghost"
          size="lg"
          icon="i-heroicons-bars-3"
          aria-label="Open navigation"
          @click="() => { isNavOpen = true }"
        />

        <!-- Brand -->
        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 lg:w-[216px] shrink-0">
          <div class="w-8 h-8 bg-sentry-500 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(106,95,193,0.4)]">
            <svg viewBox="0 0 24 24" fill="white" class="w-5 h-5" aria-hidden="true">
              <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
              <circle cx="6.5" cy="9.5" r="1.8" />
              <circle cx="10" cy="7.2" r="1.8" />
              <circle cx="14" cy="7.2" r="1.8" />
              <circle cx="17.5" cy="9.5" r="1.8" />
            </svg>
          </div>
          <span class="text-base font-bold text-white tracking-[-0.02em]">PawFile</span>
        </NuxtLink>

        <div class="flex-1" />

        <!-- Right cluster -->
        <div class="flex items-center gap-2">
          <span v-if="user?.name" class="text-sm text-dusk-300 hidden sm:inline pl-1">
            {{ user.name }}
          </span>
          <button
            type="button"
            class="bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold uppercase tracking-[0.2px] rounded-xl px-3 py-1.5 pointer-coarse:py-2.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-sentry-500"
            @click="logout"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile navigation drawer -->
    <USlideover
      v-model:open="isNavOpen"
      side="left"
      title="Navigation"
      :ui="{ content: 'max-w-[280px] bg-dusk-950', body: 'p-3' }"
    >
      <template #body>
        <AppNav @navigate="isNavOpen = false" />
      </template>
    </USlideover>

    <div class="flex-1 flex">
      <AppSidebar />
      <main id="main" class="flex-1 flex flex-col min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
