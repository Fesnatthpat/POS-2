import { ref, onMounted, watch } from 'vue'

export interface Store {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive'
  revenue: number
  orders: number
  createdAt: string
  description?: string
  currency: string
}

export const useStores = () => {
  const stores = ref<Store[]>([])
  const isInitialLoad = ref(true)

  const loadStores = () => {
    if (process.client) {
      const saved = localStorage.getItem('pos_stores')
      if (saved) {
        stores.value = JSON.parse(saved)
      }
      isInitialLoad.value = false
    }
  }

  const saveStores = () => {
    if (process.client) {
      localStorage.setItem('pos_stores', JSON.stringify(stores.value))
    }
  }

  const addStore = (store: Omit<Store, 'id' | 'createdAt' | 'status' | 'revenue' | 'orders'>) => {
    const newStore: Store = {
      ...store,
      id: Math.random().toString(36).substr(2, 9),
      status: 'active',
      revenue: 0,
      orders: 0,
      createdAt: new Date().toISOString()
    }
    stores.value.push(newStore)
    saveStores()
  }

  // Watch for changes to persist
  watch(stores, () => {
    if (!isInitialLoad.value) {
      saveStores()
    }
  }, { deep: true })

  onMounted(() => {
    loadStores()
  })

  return {
    stores,
    addStore,
    saveStores
  }
}
