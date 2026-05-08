import { ref, onMounted } from 'vue'

export interface PointLog {
  id: number
  date: string
  amount: number
  after: number
  note: string
}

export interface Customer {
  id: number
  name: string
  phone: string
  points: number
  level: string
  joinDate: string
  pointLogs?: any[]
  rewardsEarned: number
}

export const useCustomers = () => {
  const customers = ref<Customer[]>([])
  const isLoading = ref(false)

  const loadCustomers = async () => {
    isLoading.value = true
    try {
      customers.value = await $fetch<Customer[]>('/api/customers')
    } catch (err) {
      console.error('Failed to load customers:', err)
    } finally {
      isLoading.value = false
    }
  }

  const addCustomer = async (customer: any) => {
    try {
      await $fetch('/api/customers', { method: 'POST', body: customer })
      await loadCustomers()
    } catch (err) {
      console.error('Failed to add customer:', err)
    }
  }

  const updateCustomer = async (id: number, updates: Partial<Customer>) => {
    try {
      await $fetch('/api/customers', { method: 'PUT', body: { id, ...updates } })
      await loadCustomers()
    } catch (err) {
      console.error('Failed to update customer:', err)
    }
  }

  const deleteCustomer = async (id: number) => {
    try {
      await $fetch(`/api/customers?id=${id}`, { method: 'DELETE' })
      await loadCustomers()
    } catch (err) {
      console.error('Failed to delete customer:', err)
    }
  }

  const redeemReward = async (id: number, pointsToDeduct: number) => {
    try {
      await $fetch('/api/customers', { 
        method: 'PUT', 
        body: { id, points: pointsToDeduct, action: 'redeem' } 
      })
      await loadCustomers()
      return true
    } catch (err) {
      console.error('Failed to redeem reward:', err)
      return false
    }
  }

  onMounted(() => {
    loadCustomers()
  })

  return {
    customers,
    isLoading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    redeemReward,
    refresh: loadCustomers
  }
}
