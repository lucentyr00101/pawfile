<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center p-6">
    <div class="w-full max-w-md bg-dusk-950 border border-border-dark rounded-2xl p-8 text-center" style="box-shadow: rgba(0,0,0,0.35) 0px 12px 48px">
      <p class="text-2xl font-semibold text-white mb-1">Welcome back{{ user?.name ? `, ${user.name}` : '' }}!</p>
      <p class="text-[#a49bc9] text-sm">Dashboard coming soon.</p>
    </div>
  </div>
</template>
