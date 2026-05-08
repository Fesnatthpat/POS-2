<script setup lang="ts">
import { useCustomers } from '~/composables/useCustomers'
import { useProducts } from '~/composables/useProducts'
import { useOrders } from '~/composables/useOrders'
import { useSettings } from '~/composables/useSettings'
import { useFeatures } from '~/composables/useFeatures'
import { compressAndUpload } from '~/utils/storage'

const { customers } = useCustomers()
const { products } = useProducts()
const { addOrder, holdBill, heldBills, resumeBill, deleteHeldBill } = useOrders()
const { settings } = useSettings()
const { features } = useFeatures()

definePageMeta({
  layout: 'dashboard',
  middleware: [ 'feature-gate' ]
})

useHead({
  title: 'ระบบขายหน้าร้าน (POS)'
})

// --- State ---
const cart = ref<any[]>([])
const searchQuery = ref('')
const barcodeInput = ref('')
const selectedCategory = ref('ทั้งหมด')

// --- Discount State ---
const discountType = ref<'amount' | 'percent'>('percent')
const discountValue = ref(0)

// --- Modal States ---
const isProductModalOpen = ref(false)
const selectedProduct = ref<any>(null)
const selectedQuantity = ref(1)

const isCheckoutModalOpen = ref(false)
const isReceiptModalOpen = ref(false)
const isHeldBillsModalOpen = ref(false)
const isCartOpenMobile = ref(false)

const paymentMethod = ref<'cash' | 'transfer' | 'qr'>('cash')
const amountReceived = ref<number | null>(null)
const paymentSlip = ref<string | null>(null)
const isUploadingSlip = ref(false)
const notes = ref('')
const selectedCustomerId = ref<number | null>(null)
const lastOrder = ref<any>(null)

// --- Computed ---
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.barcode?.includes(searchQuery.value) ||
      p.sku?.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory = selectedCategory.value === 'ทั้งหมด' || p.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const subtotal = computed(() => {
  return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

const discountAmount = computed(() => {
  if (discountType.value === 'percent') {
    return (subtotal.value * discountValue.value) / 100
  }
  return discountValue.value
})

const beforeTax = computed(() => {
  const amount = Math.max(0, subtotal.value - discountAmount.value)
  if (settings.value.includeTax) {
    return amount / (1 + (settings.value.taxRate / 100))
  }
  return amount
})

const taxAmount = computed(() => {
  if (settings.value.includeTax) {
    return cartTotal.value - beforeTax.value
  }
  return beforeTax.value * (settings.value.taxRate / 100)
})

const cartTotal = computed(() => {
  const base = Math.max(0, subtotal.value - discountAmount.value)
  if (settings.value.includeTax) return base
  return base + taxAmount.value
})

const changeDue = computed(() => {
  if (paymentMethod.value === 'cash' && amountReceived.value !== null) {
    return Math.max(0, amountReceived.value - cartTotal.value)
  }
  return 0
})

// --- Actions ---
const handleSlipUpload = async (event: any) => {
  const file = event.target.files[ 0 ]
  if (file) {
    isUploadingSlip.value = true
    try {
      const publicUrl = await compressAndUpload(file, 'slips')
      if (publicUrl) {
        paymentSlip.value = publicUrl
      } else {
        alert('อัปโหลดสลิปไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า Supabase')
      }
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการอัปโหลดสลิป')
    } finally {
      isUploadingSlip.value = false
    }
  }
}

const handleBarcodeScan = () => {
  const product = products.value.find(p => p.barcode === barcodeInput.value)
  if (product) {
    if (product.stock > 0) {
      addToCart(product, 1)
      barcodeInput.value = ''
    } else {
      alert('สินค้าหมด!')
    }
  }
}

const openProductModal = (product: any) => {
  if (product.stock <= 0) {
    alert('สินค้าหมด!')
    return
  }
  selectedProduct.value = product
  selectedQuantity.value = 1
  isProductModalOpen.value = true
}

const addToCart = (product: any, quantity: number) => {
  const existingItem = cart.value.find(item => item.id === product.id)
  if (existingItem) {
    const totalQty = existingItem.quantity + quantity
    if (totalQty <= product.stock) {
      existingItem.quantity = totalQty
    } else {
      alert(`มีสินค้าในคลังเหลือเพียง ${product.stock} ชิ้น`)
    }
  } else {
    cart.value.push({
      ...product,
      quantity,
      cost: product.cost || 0
    })
  }
}

const confirmAddToCart = () => {
  if (!selectedProduct.value) return
  addToCart(selectedProduct.value, selectedQuantity.value)
  isProductModalOpen.value = false
}

const updateQuantity = (productId: number, delta: number) => {
  const item = cart.value.find(i => i.id === productId)
  const product = products.value.find(p => p.id === productId)
  if (item && product) {
    const newQty = item.quantity + delta
    if (newQty > 0 && newQty <= product.stock) {
      item.quantity = newQty
    }
  }
}

const removeFromCart = (productId: number) => {
  cart.value = cart.value.filter(item => item.id !== productId)
}

const clearCart = () => {
  if (confirm('ต้องการล้างรายการปัจจุบันใช่หรือไม่?')) {
    cart.value = []
    discountValue.value = 0
  }
}

const handleHoldBill = () => {
  if (cart.value.length === 0) return
  const note = prompt('ระบุหมายเหตุสำหรับบิลนี้:') || ''
  holdBill(cart.value, note)
  cart.value = []
  discountValue.value = 0
}

const handleResumeBill = (id: number) => {
  const bill = resumeBill(id)
  if (bill) {
    cart.value = bill.items
    isHeldBillsModalOpen.value = false
    isCartOpenMobile.value = true
  }
}

const openCheckout = () => {
  if (cart.value.length === 0) return
  amountReceived.value = paymentMethod.value === 'cash' ? null : cartTotal.value
  paymentSlip.value = null
  notes.value = ''
  selectedCustomerId.value = null
  isCheckoutModalOpen.value = true
}

// ฟังก์ชัน Checkout ที่แก้ไขดัก Error แล้ว
const completeCheckout = async () => {
  if (paymentMethod.value === 'cash' && (amountReceived.value || 0) < cartTotal.value) {
    alert('จำนวนเงินที่ได้รับน้อยกว่ายอดรวม!')
    return
  }

  if ((paymentMethod.value === 'qr' || paymentMethod.value === 'transfer') && !paymentSlip.value) {
    alert('กรุณาถ่ายภาพหรืออัปโหลดสลิปการชำระเงิน!')
    return
  }

  try {
    const totalCost = cart.value.reduce((sum, item) => sum + (item.cost * item.quantity), 0)

    // Calculate points earned
    let pointsEarned = 0
    if (selectedCustomerId.value) {
      if (settings.value.loyaltyPointType === 'amount') {
        pointsEarned = Math.floor(cartTotal.value / (settings.value.loyaltyPointRate || 20))
      } else {
        const totalItems = cart.value.reduce((sum, item) => sum + item.quantity, 0)
        pointsEarned = totalItems * (settings.value.loyaltyPointRate || 1)
      }
    }

    // Create Order - The backend now handles stock deduction and points update in a transaction
    const orderData = {
      items: cart.value.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        cost: item.cost,
        quantity: item.quantity
      })),
      subtotal: subtotal.value,
      discount: discountAmount.value,
      total: cartTotal.value,
      totalCost: totalCost,
      profit: cartTotal.value - totalCost,
      paymentMethod: paymentMethod.value,
      customerId: selectedCustomerId.value || undefined,
      receivedAmount: amountReceived.value || undefined,
      changeDue: changeDue.value,
      notes: notes.value,
      paymentSlip: paymentSlip.value || undefined,
      pointsEarned: pointsEarned > 0 ? pointsEarned : undefined
    }

    const order = await addOrder(orderData)

    lastOrder.value = order
    isCheckoutModalOpen.value = false
    isReceiptModalOpen.value = true
    cart.value = []
    discountValue.value = 0
    isCartOpenMobile.value = false

  } catch (error: any) {
    console.error("Checkout Error: ", error)
    alert('เกิดข้อผิดพลาดระหว่างชำระเงิน: ' + (error.message || error))
  }
}

const envName = computed(() => process.env.NODE_ENV || 'development')

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('th-TH')
}
</script>

<template>
  <div class="h-full flex -m-4 sm:-m-6 lg:-m-8 overflow-hidden bg-slate-50">
    <!-- Left: Products Area -->
    <div class="flex-1 flex flex-col min-w-0 h-full p-4 lg:p-8 overflow-y-auto custom-scrollbar">
      <div class="mb-6 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">ระบบขายหน้าร้าน (POS)</h1>
          <p class="text-slate-500 font-medium text-sm mt-1">เครื่อง: {{ settings.name }}</p>
        </div>
        <button @click="isHeldBillsModalOpen = true"
          class="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm border border-amber-200/50 hover:bg-amber-200 transition-all">
          <span class="relative flex h-2.5 w-2.5" v-if="heldBills.length > 0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          บิลที่พักไว้ ({{ heldBills.length }})
        </button>
      </div>

      <!-- Header & Tools (Sticky) -->
      <div class="sticky top-0 z-30 bg-slate-50 pt-2 pb-4 -mx-4 px-4 lg:-mx-8 lg:px-8 shadow-sm">
        <!-- Search & Scan -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div class="md:col-span-2 relative">
            <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input type="text" v-model="searchQuery" placeholder="ค้นหาสินค้า..."
              class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs lg:text-sm" />
          </div>
          <div class="relative hidden md:block">
            <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </span>
            <input type="text" v-model="barcodeInput" @keyup.enter="handleBarcodeScan" placeholder="สแกนบาร์โค้ด..."
              class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs lg:text-sm" />
          </div>
        </div>

        <!-- Categories Navigation -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 px-1 custom-scrollbar no-scrollbar">
          <button @click="selectedCategory = 'ทั้งหมด'"
            class="px-5 py-2.5 rounded-full font-black text-[10px] lg:text-xs whitespace-nowrap transition-all border shadow-sm"
            :class="selectedCategory === 'ทั้งหมด' ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'">
            สินค้าทั้งหมด
          </button>
          <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
            class="px-5 py-2.5 rounded-full font-black text-[10px] lg:text-xs whitespace-nowrap transition-all border shadow-sm"
            :class="selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'">
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20 lg:pb-0">
        <button v-for="product in filteredProducts" :key="product.id" @click="openProductModal(product)"
          class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group relative overflow-hidden flex flex-col">
          <div
            class="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors overflow-hidden">
            <img v-if="product.image" :src="product.image" class="w-full h-full object-cover" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 class="font-bold text-slate-900 truncate text-sm mb-0.5">{{ product.name }}</h3>
          <p class="text-[10px] font-black text-slate-400 uppercase mb-3">{{ product.category }}</p>
          <div class="mt-auto flex items-center justify-between">
            <span class="text-indigo-600 font-black">{{ formatCurrency(product.price) }}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
              :class="product.stock <= 5 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'">
              เหลือ {{ product.stock }} ชิ้น
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile Cart Backdrop -->
    <Transition enter-active-class="transition-opacity duration-300" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-300" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isCartOpenMobile" @click="isCartOpenMobile = false"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] lg:hidden"></div>
    </Transition>

    <!-- Right: Sidebar Cart Area -->
    <aside
      class="fixed inset-y-0 right-0 w-[85%] sm:w-[400px] bg-white z-[60] transform transition-transform duration-300 lg:static lg:w-[400px] lg:translate-x-0 lg:flex-shrink-0 flex flex-col h-full border-l border-slate-100 shadow-2xl lg:shadow-none"
      :class="[ isCartOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0' ]">

      <!-- Cart Header -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-black text-slate-900">รายการสั่งซื้อ</h2>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">เลือกไว้ {{ cart.length }}
            รายการ</p>
        </div>
        <div class="flex gap-2">
          <button @click="clearCart" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            title="ล้างรายการ">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button @click="isCartOpenMobile = false" class="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-center opacity-30">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">🛒</div>
          <p class="font-bold text-slate-500 uppercase tracking-widest text-xs">ตะกร้าสินค้าว่างเปล่า</p>
        </div>

        <div v-for="item in cart" :key="item.id"
          class="flex items-center gap-4 group animate-in slide-in-from-right-4 duration-200">
          <div
            class="w-12 h-12 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-100">
            <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" />
            <span v-else class="text-xl">📦</span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-slate-900 truncate text-sm">{{ item.name }}</h4>
            <p class="text-indigo-600 font-black text-xs">{{ formatCurrency(item.price) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-slate-50 rounded-lg border border-slate-100 p-0.5">
              <button @click="updateQuantity(item.id, -1)"
                class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-xs font-black">-</button>
              <span class="w-6 text-center font-bold text-xs">{{ item.quantity }}</span>
              <button @click="updateQuantity(item.id, 1)"
                class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-xs font-black">+</button>
            </div>
            <button @click="removeFromCart(item.id)" class="text-slate-300 hover:text-rose-500 transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Cart Footer / Summary -->
      <div class="p-6 bg-slate-50 border-t border-slate-100">
        <div class="space-y-2 mb-6">
          <div class="flex justify-between text-[10px]">
            <span class="text-slate-400 font-bold uppercase tracking-wider">รวมเงิน (ก่อนหักส่วนลด)</span>
            <span class="text-slate-600 font-bold">{{ formatCurrency(subtotal) }}</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">ส่วนลด</span>
              <select v-model="discountType"
                class="text-[9px] font-black bg-white border border-slate-200 rounded px-1 outline-none">
                <option value="percent">%</option>
                <option value="amount">฿</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input type="number" v-model="discountValue"
                class="w-14 text-right text-xs font-black bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" />
              <span class="text-rose-500 font-black text-[10px]">(-{{ formatCurrency(discountAmount) }})</span>
            </div>
          </div>

          <div class="flex justify-between text-[10px] pt-1">
            <span class="text-slate-400 font-bold uppercase tracking-wider">ราคาก่อนภาษี ({{ settings.taxRate
              }}%)</span>
            <span class="text-slate-600 font-bold">{{ formatCurrency(beforeTax) }}</span>
          </div>

          <div class="flex justify-between text-[10px] pb-1">
            <span class="text-slate-400 font-bold uppercase tracking-wider">ภาษีมูลค่าเพิ่ม (VAT)</span>
            <span class="text-slate-600 font-bold">{{ formatCurrency(taxAmount) }}</span>
          </div>

          <div class="flex justify-between items-center pt-4 border-t border-slate-200">
            <span class="text-slate-900 font-black text-lg">ยอดสุทธิ</span>
            <span class="text-3xl font-black text-indigo-600">{{ formatCurrency(cartTotal) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <button @click="handleHoldBill" :disabled="cart.length === 0"
            class="py-4 bg-amber-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-900/10 hover:bg-amber-600 disabled:opacity-50 transition-all">
            พักบิล
          </button>
          <button @click="openCheckout" :disabled="cart.length === 0"
            class="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 disabled:opacity-50 transition-all">
            ชำระเงิน
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile View: Floating Cart Button -->
    <button v-if="!isCartOpenMobile" @click="isCartOpenMobile = true"
      class="lg:hidden fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl z-40 flex items-center justify-center animate-bounce-slow">
      <div class="relative">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <span v-if="cart.length > 0"
          class="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
          {{ cart.length }}
        </span>
      </div>
    </button>

    <!-- Checkout Modal -->
    <div v-if="isCheckoutModalOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-2xl font-black text-slate-900">ชำระเงิน</h3>
          <button @click="isCheckoutModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <div
            class="bg-indigo-600 rounded-[2rem] p-8 flex justify-between items-center text-white shadow-xl shadow-indigo-100">
            <div>
              <p class="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">ยอดรวมสุทธิ</p>
              <p class="text-4xl font-black">{{ formatCurrency(cartTotal) }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">จำนวนรายการ</p>
              <p class="text-2xl font-black">{{ cart.length }}</p>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">สมาชิกลูกค้า</label>
              <select v-model="selectedCustomerId"
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 appearance-none text-sm transition-all">
                <option :value="null">ลูกค้าทั่วไป (ไม่สะสมแต้ม)</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.phone }}) — {{ c.points }} แต้ม
                </option>
              </select>
            </div>

            <div>
              <label
                class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">วิธีการชำระเงิน</label>
              <div class="grid grid-cols-3 gap-4">
                <button @click="paymentMethod = 'cash'; amountReceived = null"
                  class="flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all"
                  :class="[ paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400 hover:bg-slate-50' ]">
                  <span class="text-3xl mb-2">💵</span>
                  <span class="font-black text-xs uppercase tracking-widest">เงินสด</span>
                </button>
                <button @click="paymentMethod = 'qr'; amountReceived = cartTotal"
                  class="flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all"
                  :class="[ paymentMethod === 'qr' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400 hover:bg-slate-50' ]">
                  <span class="text-3xl mb-2">🔳</span>
                  <span class="font-black text-xs uppercase tracking-widest">คิวอาร์โค้ด</span>
                </button>
                <button @click="paymentMethod = 'transfer'; amountReceived = cartTotal"
                  class="flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all"
                  :class="[ paymentMethod === 'transfer' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400 hover:bg-slate-50' ]">
                  <span class="text-3xl mb-2">📱</span>
                  <span class="font-black text-xs uppercase tracking-widest">โอนเงิน</span>
                </button>
              </div>
            </div>

            <!-- Cash Input -->
            <div v-if="paymentMethod === 'cash'" class="space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div>
                <label
                  class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">จำนวนเงินที่รับมา</label>
                <div class="grid grid-cols-4 gap-2 mb-4">
                  <button v-for="amt in [ 100, 500, 1000 ]" :key="amt"
                    @click="amountReceived = (amountReceived || 0) + amt"
                    class="py-3 bg-slate-100 rounded-xl font-black text-xs hover:bg-slate-200 transition-all">+{{ amt
                    }}</button>
                  <button @click="amountReceived = cartTotal"
                    class="py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs border border-indigo-100">พอดี</button>
                </div>
                <input type="number" v-model="amountReceived" placeholder="0.00"
                  class="w-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-4xl font-black focus:ring-2 focus:ring-indigo-500 text-center outline-none" />
              </div>
              <div v-if="amountReceived"
                class="p-6 bg-emerald-50 rounded-3xl flex justify-between items-center border border-emerald-100">
                <span class="text-lg font-black text-emerald-600 uppercase tracking-widest">เงินทอน</span>
                <span class="text-4xl font-black text-emerald-700">{{ formatCurrency(changeDue) }}</span>
              </div>
            </div>

            <!-- QR/Transfer Capture -->
            <div v-if="paymentMethod === 'qr' || paymentMethod === 'transfer'"
              class="space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div v-if="paymentMethod === 'qr'"
                class="flex flex-col items-center p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <p class="font-bold text-slate-500 mb-4 uppercase tracking-widest text-[10px] text-center">
                  สแกนคิวอาร์โค้ดเพื่อชำระเงิน {{ formatCurrency(cartTotal) }}</p>
                <div
                  class="w-40 h-40 bg-white p-4 border-2 border-slate-100 rounded-2xl flex items-center justify-center relative shadow-sm mb-2">
                  <div class="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full opacity-60">
                    <div v-for="n in 16" :key="n" :class="Math.random() > 0.5 ? 'bg-slate-900' : 'bg-transparent'"
                      class="rounded-sm"></div>
                  </div>
                  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      class="bg-white p-1 rounded-md shadow-md font-black text-indigo-600 text-[10px] uppercase border border-indigo-50">
                      จ่ายผ่าน VENDORA</div>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest">หลักฐานการชำระเงิน /
                  สลิป</label>
                <div
                  class="relative w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-3xl overflow-hidden group flex items-center justify-center transition-all hover:bg-slate-200">
                  <img v-if="paymentSlip" :src="paymentSlip" class="w-full h-full object-cover" />
                  <div v-else class="text-center p-6">
                    <span class="text-4xl block mb-2">📸</span>
                    <span
                      class="text-[10px] font-black text-slate-400 uppercase tracking-widest">ถ่ายภาพหรืออัปโหลดสลิป</span>
                  </div>
                  
                  <!-- Loading Overlay -->
                  <div v-if="isUploadingSlip" class="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                    <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">กำลังอัปโหลดสลิป...</span>
                  </div>

                  <input type="file" accept="image/*" capture="environment" @change="handleSlipUpload"
                    class="absolute inset-0 opacity-0 cursor-pointer" :disabled="isUploadingSlip" />
                  <div v-if="paymentSlip && !isUploadingSlip" class="absolute top-4 right-4">
                    <button @click="paymentSlip = null"
                      class="bg-rose-500 text-white p-2 rounded-xl shadow-lg hover:bg-rose-600 transition-all font-black text-xs">ถ่ายใหม่</button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">หมายเหตุเพิ่มเติม
                (ถ้ามี)</label>
              <textarea v-model="notes" rows="2" placeholder="คำขอของลูกค้า, หมายเลขโต๊ะ..."
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm transition-all outline-none"></textarea>
            </div>
          </div>
        </div>

        <div class="p-8 bg-slate-50 border-t border-slate-100">
          <button @click="completeCheckout"
            class="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 active:translate-y-0.5 transition-all">
            เสร็จสิ้นรายการ
          </button>
        </div>
      </div>
    </div>

    <!-- Product Detail Modal -->
    <div v-if="isProductModalOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-2xl font-black text-slate-900">รายละเอียดสินค้า</h3>
          <button @click="isProductModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-8 space-y-8">
          <div class="flex gap-6">
            <div
              class="w-32 h-32 bg-slate-50 rounded-3xl flex-shrink-0 flex items-center justify-center text-slate-300 overflow-hidden border border-slate-100">
              <img v-if="selectedProduct?.image" :src="selectedProduct.image" class="w-full h-full object-cover" />
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="flex-1">
              <h4 class="text-2xl font-black text-slate-900 mb-1">{{ selectedProduct?.name }}</h4>
              <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{{ selectedProduct?.category
              }}</p>
              <p class="text-3xl font-black text-indigo-600">{{ formatCurrency(selectedProduct?.price || 0) }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-xs font-black text-slate-400 uppercase tracking-widest">เลือกจำนวน</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">
                มีอยู่ {{ selectedProduct?.stock }} ชิ้น
              </span>
            </div>
            <div class="flex items-center justify-center gap-6 bg-slate-50 rounded-[2rem] p-4 border border-slate-100">
              <button @click="selectedQuantity = Math.max(1, selectedQuantity - 1)"
                class="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-200 text-2xl font-black hover:bg-slate-50 transition-all">-</button>
              <span class="text-4xl font-black w-20 text-center text-slate-900">{{ selectedQuantity }}</span>
              <button @click="selectedQuantity = Math.min(selectedProduct?.stock || 1, selectedQuantity + 1)"
                class="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-200 text-2xl font-black hover:bg-slate-50 transition-all">+</button>
            </div>
          </div>
        </div>

        <div class="p-8 bg-slate-50 border-t border-slate-100">
          <button @click="confirmAddToCart"
            class="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all">
            เพิ่มลงในรายการ
          </button>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div v-if="isReceiptModalOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div class="p-8 text-center border-b border-dashed border-slate-200 flex-shrink-0 bg-slate-50/50">
          <div
            class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✅</div>
          <h3 class="text-2xl font-black text-slate-900">ชำระเงินสำเร็จ</h3>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">คำสั่งซื้อ #{{ lastOrder?.id }}
          </p>
        </div>

        <div class="flex-1 overflow-y-auto p-8 bg-white" id="printable-receipt">
          <div class="space-y-4 font-mono text-xs border-b border-dashed border-slate-300 pb-6 mb-6">
            <div class="text-center font-bold mb-4">
              <p class="text-lg">{{ settings.name }}</p>
              <p class="text-[10px] text-slate-500">{{ settings.address }}</p>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">วันที่:</span>
              <span class="font-bold">{{ formatDate(lastOrder?.timestamp || new Date().toISOString()) }}</span>
            </div>
            <div class="py-4 border-y border-dashed border-slate-200">
              <div v-for="item in lastOrder?.items" :key="item.id" class="flex justify-between mb-1 gap-4">
                <span class="truncate">{{ item.name }} x{{ item.quantity }}</span>
                <span class="flex-shrink-0">{{ formatCurrency(item.price * item.quantity) }}</span>
              </div>
            </div>
            <div class="flex justify-between">
              <span>รวมเงิน:</span>
              <span>{{ formatCurrency(lastOrder?.subtotal || 0) }}</span>
            </div>
            <div v-if="lastOrder?.discount" class="flex justify-between text-rose-500">
              <span>ส่วนลด:</span>
              <span>-{{ formatCurrency(lastOrder?.discount) }}</span>
            </div>
            <div class="flex justify-between text-lg font-black pt-4 border-t border-slate-200 mt-4">
              <span>ยอดรวมทั้งสิ้น:</span>
              <span>{{ formatCurrency(lastOrder?.total || 0) }}</span>
            </div>
          </div>

          <div class="text-center">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">ขอบคุณที่ใช้บริการ!
            </p>
            <button @click="isReceiptModalOpen = false"
              class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all">
              ตกลง
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Held Bills Modal -->
    <div v-if="isHeldBillsModalOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 class="text-2xl font-black text-slate-900">บิลที่พักไว้</h3>
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">มีบิลที่พักไว้ {{
              heldBills.length }} รายการ</p>
          </div>
          <button @click="isHeldBillsModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8">
          <div v-if="heldBills.length === 0"
            class="h-64 flex flex-col items-center justify-center text-center opacity-30">
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">📂</div>
            <p class="font-bold text-slate-500 uppercase tracking-widest text-xs">ไม่พบบิลที่พักไว้</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="bill in heldBills" :key="bill.id"
              class="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-between group hover:border-amber-500 transition-all">
              <div class="flex-1 min-w-0 mr-4">
                <div class="flex items-center gap-3 mb-1">
                  <span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg uppercase">#{{
                    bill.id }}</span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{
                    formatDate(bill.timestamp) }}</span>
                </div>
                <h4 class="font-black text-slate-900 truncate" v-if="bill.note">{{ bill.note }}</h4>
                <p class="text-xs font-bold text-slate-500">{{ bill.items.length }} รายการ — {{
                  formatCurrency(bill.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0))
                }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="deleteHeldBill(bill.id)"
                  class="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button @click="handleResumeBill(bill.id)"
                  class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all">
                  เรียกคืน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Debug Info -->
    <div v-if="features.debugMode"
      class="fixed bottom-4 left-4 z-[200] bg-slate-900 text-white p-4 rounded-2xl text-[10px] font-mono opacity-80 hover:opacity-100 transition-opacity max-w-xs shadow-2xl">
      <p class="font-bold border-b border-white/20 pb-1 mb-1 text-indigo-400">DEBUG MODE ENABLED</p>
      <div class="space-y-1 mt-2">
        <p><span class="text-slate-400">Cart:</span> {{ cart.length }} items</p>
        <p><span class="text-slate-400">Subtotal:</span> {{ subtotal }}</p>
        <p><span class="text-slate-400">Total:</span> {{ cartTotal }}</p>
        <p><span class="text-slate-400">Customer:</span> {{ selectedCustomerId || 'None' }}</p>
        <p><span class="text-slate-400">Payment:</span> {{ paymentMethod }}</p>
        <p class="pt-1 border-t border-white/10 mt-1"><span class="text-indigo-400">ENV:</span> {{ envName }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-bounce-slow {
  animation: bounce 2s infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(-5%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }

  50% {
    transform: none;
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

@media print {
  body * {
    visibility: hidden;
  }

  #printable-receipt,
  #printable-receipt * {
    visibility: visible;
  }

  #printable-receipt {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
