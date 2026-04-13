<script setup lang="ts">
const { user, logout } = useAuth()
</script>

<template>
  <div class="min-h-dvh bg-dusk-900 flex flex-col">
    <header class="sticky top-0 z-50 border-b border-border-dark bg-dusk-950/80 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <!-- Brand -->
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-sentry-500 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(106,95,193,0.4)]">
            <svg viewBox="0 0 24 24" fill="white" class="w-5 h-5" aria-hidden="true">
              <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
              <circle cx="6.5" cy="9.5" r="1.8" />
              <circle cx="10" cy="7.2" r="1.8" />
              <circle cx="14" cy="7.2" r="1.8" />
              <circle cx="17.5" cy="9.5" r="1.8" />
            </svg>
          </div>
          <span class="text-base font-bold text-white tracking-tight">PawFile</span>
        </div>

        <!-- User + Sign Out -->
        <div class="flex items-center gap-3">
          <span v-if="user?.name" class="text-sm text-[#a49bc9] hidden sm:inline">{{ user.name }}</span>
          <button
            class="bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold uppercase tracking-wider rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
            style="letter-spacing: 0.2px; font-family: Rubik, sans-serif"
            @click="logout"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>
