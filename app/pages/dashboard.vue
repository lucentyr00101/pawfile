<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user, logout } = useAuth()
</script>

<template>
  <div class="min-h-dvh bg-dusk-900 flex flex-col items-center justify-center p-6">
    <div class="w-full max-w-md bg-dusk-950 border border-border-dark rounded-2xl p-8 text-center" style="box-shadow: rgba(0,0,0,0.35) 0px 12px 48px">
      <p class="text-2xl font-semibold text-white mb-1">Welcome back{{ user?.name ? `, ${user.name}` : '' }}!</p>
      <p class="text-[#a49bc9] text-sm mb-8">Dashboard coming soon.</p>
      <button
        class="w-full h-11 rounded-[13px] text-white text-sm font-bold uppercase tracking-wider transition-shadow duration-150 cursor-pointer flex items-center justify-center"
        style="background-color: #79628c; border: 1px solid #584674; box-shadow: rgba(0,0,0,0.1) 0px 1px 3px 0px inset; font-family: Rubik, sans-serif; letter-spacing: 0.2px"
        onmouseover="this.style.boxShadow='rgba(0,0,0,0.18) 0px 0.5rem 1.5rem, rgba(0,0,0,0.1) 0px 1px 3px 0px inset'"
        onmouseout="this.style.boxShadow='rgba(0,0,0,0.1) 0px 1px 3px 0px inset'"
        @click="logout"
      >
        Sign Out
      </button>
    </div>
  </div>
</template>
