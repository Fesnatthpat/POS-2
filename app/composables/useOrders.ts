import { ref, onMounted } from 'vue'

export interface OrderItem {
  id: number
  name: string
  price: number
  cost: number
  quantity: number
}

export interface Order {
  id: string
  items: any // Json
  subtotal: number
  discount: number
  total: number
  totalCost: number
  profit: number
  paymentMethod: string
  timestamp: string
  customerId?: number
  receivedAmount?: number
  changeDue?: number
  notes?: string
  paymentSlip?: string
  status: string
  voidedAt?: string
}

export const useOrders = () => {
  const orders = ref<Order[]>([])
  const heldBills = ref<{ id: number, items: OrderItem[], timestamp: string, note: string }[]>([])
  const isLoading = ref(false)

  const loadOrders = async () => {
    isLoading.value = true
    try {
      orders.value = await $fetch<Order[]>('/api/orders')
      
      if (process.client) {
        const savedHeld = localStorage.getItem('pos_held_bills')
        if (savedHeld) heldBills.value = JSON.parse(savedHeld)
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      isLoading.value = false
    }
  }

  const addOrder = async (order: any) => {
    try {
      const newOrder = await $fetch<Order>('/api/orders', { method: 'POST', body: order })
      await loadOrders()
      return newOrder
    } catch (err) {
      console.error('Failed to add order:', err)
      throw err
    }
  }

  const voidOrder = async (orderId: string) => {
    try {
      await $fetch('/api/orders', { method: 'PUT', body: { id: orderId, status: 'voided' } })
      await loadOrders()
      return true
    } catch (err) {
      console.error('Failed to void order:', err)
      return false
    }
  }

  const holdBill = (items: OrderItem[], note: string = '') => {
    heldBills.value.push({
      id: Date.now(),
      items: JSON.parse(JSON.stringify(items)),
      timestamp: new Date().toISOString(),
      note
    })
    if (process.client) localStorage.setItem('pos_held_bills', JSON.stringify(heldBills.value))
  }

  const resumeBill = (id: number) => {
    const index = heldBills.value.findIndex(b => b.id === id)
    if (index !== -1) {
      const bill = heldBills.value[index]
      heldBills.value.splice(index, 1)
      if (process.client) localStorage.setItem('pos_held_bills', JSON.stringify(heldBills.value))
      return bill
    }
    return null
  }

  const deleteHeldBill = (id: number) => {
    heldBills.value = heldBills.value.filter(b => b.id !== id)
    if (process.client) localStorage.setItem('pos_held_bills', JSON.stringify(heldBills.value))
  }

  onMounted(() => {
    loadOrders()
  })

  return {
    orders,
    heldBills,
    isLoading,
    addOrder,
    voidOrder,
    holdBill,
    resumeBill,
    deleteHeldBill,
    refresh: loadOrders
  }
}
