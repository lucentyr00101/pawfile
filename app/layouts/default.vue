<script setup lang="ts">
const { user, logout } = useAuth()
</script>

<template>
  <div class="min-h-dvh bg-dusk-900 flex flex-col">
    <header class="sticky top-0 z-50 border-b border-border-dark bg-dusk-950/80 backdrop-blur-sm">
      <div class="px-4 sm:px-6 h-14 flex items-center gap-4">
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
          <span
            class="text-base font-bold text-white"
            style="letter-spacing: -0.02em; font-family: Rubik, sans-serif"
          >PawFile</span>
        </NuxtLink>

        <div class="flex-1" />

        <!-- Right cluster -->
        <div class="flex items-center gap-2">
          <button
            class="w-9 h-9 rounded-[10px] grid place-items-center text-[#a49bc9] cursor-pointer relative"
            style="background: rgba(255,255,255,0.06); border: 1px solid #362d59"
            title="Notifications"
          >
            <UIcon name="i-heroicons-bell" class="w-4 h-4" />
            <span
              class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style="background: #fa7faa; border: 2px solid #150f23"
            />
          </button>
          <span
            v-if="user?.name"
            class="text-sm text-[#a49bc9] hidden sm:inline pl-1"
            style="font-family: Rubik, sans-serif"
          >
            {{ user.name }}
          </span>
          <button
            class="bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold uppercase rounded-xl px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap"
            style="letter-spacing: 0.2px; font-family: Rubik, sans-serif"
            @click="logout"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>

    <div class="flex-1 flex">
      <AppSidebar />
      <main class="flex-1 flex flex-col min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
