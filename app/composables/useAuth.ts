export function useAuth() {
  const session = useUserSession()

  const user = computed(() => session.user.value)
  const isLoggedIn = computed(() => session.loggedIn.value)

  async function logout() {
    await session.clear()
    await navigateTo('/login')
  }

  async function refresh() {
    await session.fetch()
    if (session.loggedIn.value) {
      await $fetch('/api/auth/me')
    }
  }

  return { user, isLoggedIn, logout, refresh }
}
