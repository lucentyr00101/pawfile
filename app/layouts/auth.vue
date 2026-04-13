<template>
  <div class="min-h-dvh bg-dusk-900 flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-[440px]">

      <!-- Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center gap-2.5 mb-3">
          <div class="w-10 h-10 bg-sentry-500 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(106,95,193,0.4)]">
            <svg viewBox="0 0 24 24" fill="white" class="w-6 h-6" aria-hidden="true">
              <ellipse cx="12" cy="15.5" rx="4.5" ry="3.8" />
              <circle cx="6.5" cy="9.5" r="1.8" />
              <circle cx="10" cy="7.2" r="1.8" />
              <circle cx="14" cy="7.2" r="1.8" />
              <circle cx="17.5" cy="9.5" r="1.8" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-white tracking-tight">PawFile</span>
        </div>
      </div>

      <!-- Page content -->
      <slot />

    </div>
  </div>
</template>
