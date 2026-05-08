export default defineNuxtRouteMiddleware((to) => {
  const { features } = useFeatures()
  
  // 1. Feature Toggle Check (Only block if the feature itself is disabled)
  const featureMap: Record<string, keyof typeof features.value> = {
    '/dashboard/pos': 'enablePOS',
    '/dashboard/orders': 'enableOrders',
    '/dashboard/products': 'enableProducts',
    '/dashboard/customers': 'enableCustomers',
    '/dashboard/staff': 'enableStaff',
    '/dashboard/reports': 'enableReports',
    '/dashboard/settings': 'enableSettings',
  }

  const requiredFeature = featureMap[to.path]
  
  if (requiredFeature && !features.value[requiredFeature]) {
    return navigateTo('/dashboard')
  }

  // Role checks removed as requested
})
