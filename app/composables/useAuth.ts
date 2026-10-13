export function useAuth() {
  const session = useUserSession()

  const user = computed(() => session.user.value)
  const isLoggedIn = computed(() => session.loggedIn.value)

  async function logout() {
    await session.clear()
    await navigateTo('/login')
  }

  /** Re-reads the session cookie (e.g. after login/register set it). */
  async function refresh() {
    await session.fetch()
  }

  return { user, isLoggedIn, logout, refresh }
}
