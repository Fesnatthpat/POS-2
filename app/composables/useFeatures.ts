import { useState } from '#app'

export interface FeatureFlags {
  enablePOS: boolean
  enableOrders: boolean
  enableProducts: boolean
  enableCustomers: boolean
  enableStaff: boolean
  enableReports: boolean
  enableSettings: boolean
  enableInventoryAlerts: boolean
  debugMode: boolean
}

const DEFAULT_FEATURES: FeatureFlags = {
  enablePOS: true,
  enableOrders: true,
  enableProducts: true,
  enableCustomers: true,
  enableStaff: true,
  enableReports: true,
  enableSettings: true,
  enableInventoryAlerts: true,
  debugMode: false
}

export const useFeatures = () => {
  // Use Nuxt useState for global reactive state
  const features = useState<FeatureFlags>('features', () => ({ ...DEFAULT_FEATURES }))
  const isLoaded = useState<boolean>('features_loaded', () => false)

  const loadFeatures = () => {
    if (process.client && !isLoaded.value) {
      const saved = localStorage.getItem('pos_features')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          features.value = { ...DEFAULT_FEATURES, ...parsed }
        } catch (e) {
          console.error('Failed to parse features', e)
        }
      }
      isLoaded.value = true
    }
  }

  const saveFeatures = () => {
    if (process.client) {
      localStorage.setItem('pos_features', JSON.stringify(features.value))
    }
  }

  const toggleFeature = (key: keyof FeatureFlags) => {
    features.value[key] = !features.value[key]
    saveFeatures()
  }

  const setFeature = (key: keyof FeatureFlags, value: boolean) => {
    features.value[key] = value
    saveFeatures()
  }

  const resetFeatures = () => {
    features.value = { ...DEFAULT_FEATURES }
    saveFeatures()
  }

  // Auto-load on client side
  if (process.client && !isLoaded.value) {
    loadFeatures()
  }

  return {
    features,
    toggleFeature,
    setFeature,
    resetFeatures,
    saveFeatures
  }
}
