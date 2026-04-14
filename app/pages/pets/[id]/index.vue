<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Pet {
  _id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed?: string
  birthday?: string
  gender?: 'male' | 'female' | 'unknown'
  weight?: number
  photo?: string
  isPublic: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: pet, status, error } = useFetch<Pet>(`/api/pets/${id}`, { lazy: true })

const isLoading = computed(() => status.value === 'pending')

watch(error, (err) => {
  if (err?.statusCode === 404) {
    navigateTo('/dashboard')
  }
})

const formattedBirthday = computed(() => {
  if (!pet.value?.birthday) return null
  return new Date(pet.value.birthday).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const petAge = computed(() => {
  if (!pet.value?.birthday) return null

  const birth = new Date(pet.value.birthday)
  const now = new Date()

  let years = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    years--
  }

  if (years >= 1) {
    return `${years} ${years === 1 ? 'year' : 'years'} old`
  }

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months--
  if (months < 0) months = 0

  return `${months} ${months === 1 ? 'month' : 'months'} old`
})

const isDeleteOpen = ref(false)
const isDeleting = ref(false)

async function confirmDelete() {
  isDeleting.value = true
  try {
    await $fetch(`/api/pets/${id}`, { method: 'DELETE' })
    toast.add({
      title: 'Pet deleted',
      description: `${pet.value?.name} has been removed from your profile.`,
      color: 'success',
    })
    await navigateTo('/dashboard')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; message?: string } }
    const message = e?.data?.statusMessage ?? e?.data?.message ?? 'Something went wrong.'
    toast.add({ title: 'Failed to delete pet', description: message, color: 'error' })
  }
  finally {
    isDeleting.value = false
  }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<template>
  <div class="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">

    <!-- Back link -->
    <NuxtLink
      to="/dashboard"
      class="flex items-center gap-1.5 text-sm text-[#a49bc9] hover:text-white transition-colors w-fit"
      style="font-family: Rubik, sans-serif"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 shrink-0" />
      Back to Dashboard
    </NuxtLink>

    <!-- Loading skeleton -->
    <template v-if="isLoading">
      <!-- Hero skeleton -->
      <div class="flex flex-col items-center gap-4 py-4">
        <USkeleton class="w-24 h-24 rounded-full" />
        <div class="flex flex-col items-center gap-2">
          <USkeleton class="h-3 w-16 rounded" />
          <USkeleton class="h-7 w-40 rounded" />
          <USkeleton class="h-4 w-24 rounded" />
        </div>
        <div class="flex gap-2 mt-1">
          <USkeleton class="h-9 w-20 rounded-lg" />
          <USkeleton class="h-9 w-20 rounded-lg" />
        </div>
      </div>
      <!-- Card skeleton -->
      <USkeleton class="h-52 rounded-2xl" />
    </template>

    <!-- Error state -->
    <template v-else-if="error">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-[#a49bc9] mb-4" />
        <p class="text-white text-xl font-semibold mb-2" style="font-family: Rubik, sans-serif">
          Pet not found
        </p>
        <p class="text-[#a49bc9] text-sm mb-6" style="font-family: Rubik, sans-serif">
          This pet profile doesn't exist or you don't have access.
        </p>
        <UButton to="/dashboard" color="primary">
          Back to Dashboard
        </UButton>
      </div>
    </template>

    <!-- Pet profile -->
    <template v-else-if="pet">

      <!-- Hero: centred avatar + identity + actions -->
      <div
        class="flex flex-col items-center gap-5 rounded-2xl px-6 py-8 text-center"
        style="background: #150f23; border: 1px solid #362d59"
      >
        <!-- Avatar -->
        <div class="relative">
          <UAvatar
            :src="pet.photo"
            :icon="!pet.photo ? 'i-heroicons-user' : undefined"
            :alt="pet.photo ? pet.name : undefined"
            size="3xl"
            class="ring-2 ring-[#362d59]"
            style="box-shadow: 0 0 40px rgba(106, 95, 193, 0.2)"
          />
          <!-- Public indicator dot -->
          <span
            v-if="pet.isPublic"
            class="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2"
            style="background: #c2ef4e; border-color: #150f23"
            title="Public profile"
          />
        </div>

        <!-- Identity -->
        <div class="flex flex-col items-center gap-1">
          <p
            class="text-[10px] font-semibold uppercase text-[#a49bc9]"
            style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
          >
            {{ pet.species }}
          </p>
          <h1
            class="text-white text-2xl font-semibold leading-tight"
            style="font-family: Rubik, sans-serif"
          >
            {{ pet.name }}
          </h1>
          <p
            v-if="pet.breed"
            class="text-[#a49bc9] text-sm"
            style="font-family: Rubik, sans-serif"
          >
            {{ pet.breed }}
          </p>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2">
          <UButton
            :to="`/pets/${id}/edit`"
            color="secondary"
            variant="solid"
            icon="i-heroicons-pencil-square"
          >
            Edit
          </UButton>
          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            @click="isDeleteOpen = true"
          >
            Delete
          </UButton>
        </div>
      </div>

      <!-- Details card -->
      <UCard
        :ui="{
          root: 'bg-dusk-950 border border-border-dark rounded-2xl',
        }"
      >
        <!-- Section label -->
        <div class="flex items-center gap-3 mb-4">
          <p
            class="text-[10px] font-semibold uppercase text-[#a49bc9] shrink-0"
            style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
          >
            Details
          </p>
          <div class="flex-1 h-px" style="background: #362d59" />
        </div>

        <div class="divide-y divide-[#362d59]">
          <!-- Birthday -->
          <div class="flex items-start justify-between py-3 first:pt-0">
            <p
              class="text-[10px] font-semibold uppercase text-[#a49bc9] pt-0.5 shrink-0"
              style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
            >
              Birthday
            </p>
            <p class="text-sm text-right" style="font-family: Rubik, sans-serif">
              <template v-if="formattedBirthday">
                <span class="text-white">{{ formattedBirthday }}</span>
                <span class="text-[#a49bc9] ml-1">· {{ petAge }}</span>
              </template>
              <span v-else class="text-[#a49bc9]">—</span>
            </p>
          </div>

          <!-- Gender -->
          <div class="flex items-center justify-between py-3">
            <p
              class="text-[10px] font-semibold uppercase text-[#a49bc9]"
              style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
            >
              Gender
            </p>
            <p
              class="text-sm"
              :class="pet.gender ? 'text-white' : 'text-[#a49bc9]'"
              style="font-family: Rubik, sans-serif"
            >
              {{ pet.gender ? capitalize(pet.gender) : '—' }}
            </p>
          </div>

          <!-- Weight -->
          <div class="flex items-center justify-between py-3">
            <p
              class="text-[10px] font-semibold uppercase text-[#a49bc9]"
              style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
            >
              Weight
            </p>
            <p class="text-sm" style="font-family: Rubik, sans-serif">
              <template v-if="pet.weight != null">
                <span class="text-white">{{ pet.weight }}</span>
                <span class="text-[#a49bc9] ml-1">kg</span>
              </template>
              <span v-else class="text-[#a49bc9]">—</span>
            </p>
          </div>

          <!-- Notes -->
          <div v-if="pet.notes" class="flex flex-col gap-2 py-3 last:pb-0">
            <p
              class="text-[10px] font-semibold uppercase text-[#a49bc9]"
              style="letter-spacing: 0.25px; font-family: Rubik, sans-serif"
            >
              Notes
            </p>
            <p
              class="text-white text-sm leading-relaxed whitespace-pre-wrap"
              style="font-family: Rubik, sans-serif"
            >
              {{ pet.notes }}
            </p>
          </div>
        </div>
      </UCard>

    </template>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="isDeleteOpen" title="Delete Pet">
      <template #body>
        <p class="text-[#e5e7eb] text-sm" style="font-family: Rubik, sans-serif">
          Are you sure you want to delete
          <strong class="text-white">{{ pet?.name }}</strong>?
          This action cannot be undone.
        </p>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton
            variant="ghost"
            :disabled="isDeleting"
            @click="isDeleteOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UModal>

  </div>
</template>
