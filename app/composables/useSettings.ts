import { ref, onMounted } from 'vue'

export interface StoreSettings {
  name: string
  address: string
  phone: string
  currency: string
  taxRate: number
  includeTax: boolean
  receiptNote: string
  loyaltyPointType: string
  loyaltyPointRate: number
  loyaltyPointThreshold: number
}

export const useSettings = () => {
  const settings = ref<StoreSettings>({
    name: 'Vendora Coffee & Bistro',
    address: '',
    phone: '',
    currency: 'THB',
    taxRate: 7,
    includeTax: true,
    receiptNote: '',
    loyaltyPointType: 'amount',
    loyaltyPointRate: 20,
    loyaltyPointThreshold: 100
  })
  const isLoading = ref(false)

  const loadSettings = async () => {
    isLoading.value = true
    try {
      const data = await $fetch<StoreSettings>('/api/settings')
      if (data) settings.value = data
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      isLoading.value = false
    }
  }

  const saveSettings = async (newSettings: StoreSettings) => {
    try {
      await $fetch('/api/settings', { method: 'POST', body: newSettings })
      await loadSettings()
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  onMounted(() => {
    loadSettings()
  })

  return {
    settings,
    isLoading,
    saveSettings,
    refresh: loadSettings
  }
}
