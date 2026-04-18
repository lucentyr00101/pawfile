<template>
  <div class="min-h-dvh bg-dusk-900 flex flex-col">
    <header class="border-b border-border-dark bg-dusk-950/60 backdrop-blur-sm">
      <div class="px-4 sm:px-6 h-14 flex items-center">
        <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0">
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
      </div>
    </header>

    <main class="flex-1 flex items-start justify-center px-4 py-10">
      <div class="w-full max-w-xl">
        <slot />
      </div>
    </main>

    <footer class="border-t border-border-dark">
      <div
        class="px-4 sm:px-6 py-5 text-center text-[#a49bc9] text-xs"
        style="font-family: Rubik, sans-serif"
      >
        Want a profile for your pet?
        <NuxtLink to="/register" class="text-white hover:underline ml-1">
          Create one on PawFile
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>
