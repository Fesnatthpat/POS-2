export default defineNuxtRouteMiddleware((to, from) => {
  const { user, initAuth } = useAuth()
  
  // Ensure user state is synced from cookie
  initAuth()

  // Pages that don't require authentication
  const publicPages = ['/login', '/register', '/']
  const isPublicPage = publicPages.includes(to.path)

  if (process.client) {
    console.log(`[Middleware] Path: ${to.path}, User:`, user.value)
  }

  if (!user.value && !isPublicPage) {
    return navigateTo('/login')
  }

  if (user.value && isPublicPage && to.path !== '/') {
    return navigateTo('/dashboard')
  }
})
