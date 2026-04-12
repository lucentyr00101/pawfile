<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: false })

const toast = useToast()
const router = useRouter()

const state = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

type FormError = { path: string; message: string }

function validate(data: typeof state): FormError[] {
  const errors: FormError[] = []

  if (!data.name.trim()) {
    errors.push({ path: 'name', message: 'Name is required' })
  }

  if (!data.email.trim()) {
    errors.push({ path: 'email', message: 'Email is required' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ path: 'email', message: 'Please enter a valid email address' })
  }

  if (!data.password) {
    errors.push({ path: 'password', message: 'Password is required' })
  } else if (data.password.length < 8) {
    errors.push({ path: 'password', message: 'Password must be at least 8 characters' })
  }

  if (!data.confirmPassword) {
    errors.push({ path: 'confirmPassword', message: 'Please confirm your password' })
  } else if (data.password !== data.confirmPassword) {
    errors.push({ path: 'confirmPassword', message: 'Passwords do not match' })
  }

  return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: event.data.name,
        email: event.data.email,
        password: event.data.password,
      },
    })
    toast.add({
      title: 'Welcome to PawFile!',
      description: 'Your account has been created successfully.',
      color: 'success',
    })
    await router.push('/dashboard')
  } catch (err: unknown) {
    const apiErr = err as { data?: { statusMessage?: string; message?: string } }
    const message = apiErr?.data?.statusMessage ?? apiErr?.data?.message ?? 'Something went wrong. Please try again.'
    toast.add({
      title: 'Registration failed',
      description: message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

const formFieldUi = { label: 'text-[#e5e7eb] text-sm font-medium mb-1.5' }
</script>

<template>
  <div class="min-h-dvh bg-dusk-900 flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-[440px]">

      <!-- Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center gap-2.5 mb-3">
          <!-- Paw icon -->
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
        <h1 class="text-2xl font-semibold text-white">Create your account</h1>
        <p class="text-[#e5e7eb] text-sm mt-1">Track your pet's health in one place</p>
      </div>

      <!-- Card -->
      <div
        class="bg-dusk-950 border border-border-dark rounded-2xl p-8"
        style="box-shadow: rgba(0, 0, 0, 0.35) 0px 12px 48px"
      >

        <!-- OAuth Buttons -->
        <div class="space-y-3 mb-6">
          <!-- Google -->
          <a
            href="/auth/google"
            class="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-border-dark text-white text-sm font-medium transition-colors duration-150 cursor-pointer"
            style="background: rgba(255,255,255,0.06); font-family: Rubik, sans-serif"
            onmouseover="this.style.background='rgba(255,255,255,0.11)'"
            onmouseout="this.style.background='rgba(255,255,255,0.06)'"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5 shrink-0" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </a>

          <!-- GitHub -->
          <a
            href="/auth/github"
            class="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-border-dark text-white text-sm font-medium transition-colors duration-150 cursor-pointer"
            style="background: rgba(255,255,255,0.06); font-family: Rubik, sans-serif"
            onmouseover="this.style.background='rgba(255,255,255,0.11)'"
            onmouseout="this.style.background='rgba(255,255,255,0.06)'"
          >
            <svg viewBox="0 0 24 24" fill="white" class="w-5 h-5 shrink-0" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </a>
        </div>

        <!-- Divider -->
        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-dark" />
          </div>
          <div class="relative flex justify-center">
            <span
              class="bg-dusk-950 px-3 text-[#e5e7eb] text-xs uppercase"
              style="letter-spacing: 0.2px; font-family: Rubik, sans-serif"
            >
              or register with email
            </span>
          </div>
        </div>

        <!-- Form -->
        <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">

          <!-- Name -->
          <UFormField label="Full Name" name="name" required :ui="formFieldUi">
            <UInput
              v-model="state.name"
              type="text"
              placeholder="Your full name"
              size="lg"
              class="w-full"
              autocomplete="name"
            />
          </UFormField>

          <!-- Email -->
          <UFormField label="Email" name="email" required :ui="formFieldUi">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="you@example.com"
              size="lg"
              class="w-full"
              autocomplete="email"
            />
          </UFormField>

          <!-- Password -->
          <UFormField
            label="Password"
            name="password"
            required
            hint="Minimum 8 characters"
            :ui="{ ...formFieldUi, hint: 'text-[#a49bc9] text-xs' }"
          >
            <UInput
              v-model="state.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              size="lg"
              class="w-full"
              autocomplete="new-password"
            >
              <template #trailing>
                <button
                  type="button"
                  class="text-[#a49bc9] hover:text-white transition-colors duration-150 cursor-pointer"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <!-- Eye icon -->
                  <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4.5 h-4.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4.5 h-4.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                </button>
              </template>
            </UInput>
          </UFormField>

          <!-- Confirm Password -->
          <UFormField label="Confirm Password" name="confirmPassword" required :ui="formFieldUi">
            <UInput
              v-model="state.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••"
              size="lg"
              class="w-full"
              autocomplete="new-password"
            >
              <template #trailing>
                <button
                  type="button"
                  class="text-[#a49bc9] hover:text-white transition-colors duration-150 cursor-pointer"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <svg v-if="!showConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4.5 h-4.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4.5 h-4.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                </button>
              </template>
            </UInput>
          </UFormField>

          <!-- Submit -->
          <div class="pt-2">
            <button
              type="submit"
              :disabled="loading"
              class="w-full h-11 rounded-[13px] text-white text-sm font-bold uppercase tracking-wider transition-shadow duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              style="background-color: #79628c; border: 1px solid #584674; box-shadow: rgba(0,0,0,0.1) 0px 1px 3px 0px inset; font-family: Rubik, sans-serif; letter-spacing: 0.2px"
              onmouseover="if (!this.disabled) this.style.boxShadow='rgba(0,0,0,0.18) 0px 0.5rem 1.5rem, rgba(0,0,0,0.1) 0px 1px 3px 0px inset'"
              onmouseout="this.style.boxShadow='rgba(0,0,0,0.1) 0px 1px 3px 0px inset'"
            >
              <svg v-if="loading" class="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ loading ? 'Creating Account…' : 'Create Account' }}
            </button>
          </div>

        </UForm>
      </div>

      <!-- Sign in link -->
      <p class="text-center mt-6 text-sm text-[#e5e7eb]" style="font-family: Rubik, sans-serif">
        Already have an account?
        <NuxtLink
          to="/login"
          class="text-sentry-500 hover:underline ml-1 font-medium"
        >
          Sign in
        </NuxtLink>
      </p>

    </div>
  </div>
</template>
