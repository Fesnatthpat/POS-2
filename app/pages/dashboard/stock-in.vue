<script setup lang="ts">
import { useProducts } from '~/composables/useProducts'
import { useSettings } from '~/composables/useSettings'

const { products, stockIn } = useProducts()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard',
  middleware: [ 'feature-gate' ]
})

// --- State ---
const selectedProductId = ref<number | null>(null)
const supplier = ref('')
const quantity = ref(1)
const costPrice = ref(0)
const note = ref('')
const isSubmitting = ref(false)
const showSuccess = ref(false)

const selectedProduct = computed(() => {
  return products.value.find(p => p.id === selectedProductId.value)
})

watch(selectedProductId, (newId) => {
  if (newId) {
    const product = products.value.find(p => p.id === newId)
    if (product) {
      costPrice.value = product.cost || 0
    }
  }
})

const route = useRoute()

onMounted(() => {
  const queryId = route.query.productId
  if (queryId) {
    selectedProductId.value = Number(queryId)
  }
})

const handleStockIn = async () => {
  if (!selectedProductId.value || !supplier.value || quantity.value <= 0) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  isSubmitting.value = true

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  stockIn(selectedProductId.value, quantity.value, supplier.value, costPrice.value, note.value)

  isSubmitting.value = false
  showSuccess.value = true

  // Reset form
  selectedProductId.value = null
  supplier.value = ''
  quantity.value = 1
  costPrice.value = 0
  note.value = ''

  window.scrollTo({ top: 0, behavior: 'smooth' })
  setTimeout(() => showSuccess.value = false, 3000)
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
    <!-- Header Section -->
    <div class="mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">รับสินค้าเข้า (Stock In)
        </h1>
        <p class="text-slate-500 font-medium text-[10px] sm:text-xs lg:text-sm mt-1">บันทึกการรับสินค้าจาก Supplier
          และปรับปรุงต้นทุน</p>
      </div>
      <NuxtLink to="/dashboard/products"
        class="inline-flex items-center text-indigo-600 font-bold text-xs sm:text-sm hover:underline gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        กลับไปหน้าคลังสินค้า
      </NuxtLink>
    </div>

    <div class="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden transition-all">
      <div class="p-6 sm:p-8 lg:p-12">
        <!-- Success Alert -->
        <Transition enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform -translate-y-4 opacity-0" enter-to-class="transform translate-y-0 opacity-100">
          <div v-if="showSuccess"
            class="mb-8 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <span class="text-xl">✅</span>
            <span class="font-bold text-sm sm:text-base">บันทึกการรับสินค้าสำเร็จแล้ว</span>
          </div>
        </Transition>

        <form @submit.prevent="handleStockIn" class="space-y-6 sm:space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <!-- Product Selection -->
            <div class="space-y-3 sm:space-y-4">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">เลือกสินค้า</label>
              <div class="relative">
                <select v-model="selectedProductId" required
                  class="w-full px-4 py-4 sm:px-5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 appearance-none font-bold text-sm sm:text-base pr-10">
                  <option :value="null" disabled>— เลือกสินค้าในคลัง —</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">
                    {{ p.name }} (คงเหลือ: {{ p.stock }})
                  </option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- Selected Product Info Card -->
              <div v-if="selectedProduct"
                class="p-3 sm:p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div
                  class="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-indigo-100">
                  <img v-if="selectedProduct.image" :src="selectedProduct.image" class="w-full h-full object-cover" />
                  <span v-else class="text-xl">📦</span>
                </div>
                <div class="min-w-0">
                  <p class="font-black text-indigo-900 text-xs sm:text-sm truncate">{{ selectedProduct.name }}</p>
                  <p class="text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase">ต้นทุนเดิม: {{
                    formatCurrency(selectedProduct.cost) }}</p>
                </div>
              </div>
            </div>

            <!-- Supplier -->
            <div class="space-y-3 sm:space-y-4">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier /
                ผู้จำหน่าย</label>
              <input type="text" v-model="supplier" required placeholder="ชื่อบริษัท หรือ ผู้ผลิต"
                class="w-full px-4 py-4 sm:px-5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm sm:text-base outline-none" />
            </div>

            <!-- Quantity -->
            <div class="space-y-3 sm:space-y-4">
              <label
                class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">จำนวนที่รับเข้า</label>
              <div class="flex items-center gap-2 sm:gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <button type="button" @click="quantity = Math.max(1, quantity - 1)"
                  class="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black hover:bg-slate-100 active:scale-95 transition-all">-</button>
                <input type="number" v-model="quantity" required min="1"
                  class="flex-1 bg-transparent text-center font-black text-lg sm:text-xl outline-none min-w-0" />
                <button type="button" @click="quantity++"
                  class="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black hover:bg-slate-100 active:scale-95 transition-all">+</button>
              </div>
            </div>

            <!-- Cost Price -->
            <div class="space-y-3 sm:space-y-4">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ต้นทุนใหม่ต่อหน่วย
                (฿)</label>
              <div class="relative">
                <span
                  class="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg sm:text-xl">฿</span>
                <input type="number" v-model="costPrice" required step="0.01"
                  class="w-full pl-10 pr-4 py-4 sm:pl-12 sm:pr-5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-lg sm:text-xl outline-none" />
              </div>
              <p class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">ราคาต้นทุนล่าสุดต่อ 1 หน่วย</p>
            </div>
          </div>

          <!-- Note -->
          <div class="space-y-3 sm:space-y-4">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">หมายเหตุ
              (ถ้ามี)</label>
            <textarea v-model="note" rows="2" placeholder="เช่น เลขที่ใบกำกับภาษี หรือ สภาพสินค้า"
              class="w-full px-4 py-4 sm:px-5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-sm sm:text-base outline-none"></textarea>
          </div>

          <!-- Summary Card (Responsive) -->
          <div v-if="selectedProduct"
            class="p-5 sm:p-6 bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] text-white space-y-3 sm:space-y-4 shadow-2xl shadow-slate-900/20">
            <div
              class="flex justify-between items-center text-[9px] sm:text-xs font-bold opacity-50 uppercase tracking-[0.2em]">
              <span>สรุปการทำรายการ</span>
              <span>TOTAL VALUE</span>
            </div>
            <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
              <div class="min-w-0">
                <p class="text-sm sm:text-base font-black truncate text-indigo-100">{{ selectedProduct.name }}</p>
                <p class="text-[10px] sm:text-xs font-bold text-slate-400">จำนวน {{ quantity }} ชิ้น x {{
                  formatCurrency(costPrice) }}</p>
              </div>
              <div class="text-left sm:text-right pt-2 sm:pt-0 border-t border-white/10 sm:border-0">
                <p class="text-2xl sm:text-3xl lg:text-4xl font-black text-indigo-400 tracking-tight">{{
                  formatCurrency(quantity * costPrice) }}</p>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-2 sm:pt-4">
            <button type="submit" :disabled="isSubmitting || !selectedProductId"
              class="w-full py-5 sm:py-6 bg-indigo-600 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-3">
              <span v-if="isSubmitting"
                class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการรับสินค้า' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
