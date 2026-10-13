// Every page requires a session unless listed here, so new pages are protected by default.
const PUBLIC_PATHS = new Set(['/', '/login', '/register'])

function isPublic(path: string) {
  return PUBLIC_PATHS.has(path) || path.startsWith('/p/')
}

export default defineNuxtRouteMiddleware((to) => {
  if (isPublic(to.path)) return

  const { isLoggedIn } = useAuth()
  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }
})
