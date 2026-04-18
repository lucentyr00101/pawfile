export default defineNuxtRouteMiddleware(() => {
  const { isLoggedIn } = useAuth()
  return navigateTo(isLoggedIn.value ? '/dashboard' : '/login')
})
