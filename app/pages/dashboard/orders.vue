<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'
import { useCustomers } from '~/composables/useCustomers'
import { useSettings } from '~/composables/useSettings'

const { orders, voidOrder } = useOrders()
const { customers } = useCustomers()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard',
  middleware: ['feature-gate']
})

// --- State ---
const searchQuery = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const isReceiptModalOpen = ref(false)
const selectedOrder = ref<any>(null)

// --- Computed ---
const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (o.notes && o.notes.toLowerCase().includes(searchQuery.value.toLowerCase()))
    
    const matchesDate = new Date(o.timestamp).toDateString() === new Date(selectedDate.value).toDateString()
    return matchesSearch && matchesDate
  }).slice().reverse()
})

const getCustomerName = (id?: number) => {
  if (!id) return 'ลูกค้าทั่วไป'
  const customer = customers.value.find(c => c.id === id)
  return customer ? customer.name : 'ไม่ทราบชื่อ'
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

// --- Actions ---
const viewReceipt = (order: any) => {
  selectedOrder.value = order
  isReceiptModalOpen.value = true
}

const handleVoidOrder = (orderId: string) => {
  if (confirm('คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
    voidOrder(orderId)
    isReceiptModalOpen.value = false
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 mb-8 lg:mb-10">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">ประวัติคำสั่งซื้อ</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">ดูและจัดการรายการย้อนหลังทั้งหมด</p>
      </div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">วันที่:</span>
          <input type="date" v-model="selectedDate" 
            class="bg-slate-50 border-none rounded-lg px-2 py-1.5 font-bold text-slate-900 focus:ring-0 text-xs" />
        </div>
        <div class="relative flex-1 sm:flex-none">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input type="text" v-model="searchQuery" placeholder="ค้นหารหัส..." 
            class="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 w-full sm:w-48 transition-all" />
        </div>
        <NuxtLink to="/dashboard/pos" class="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-xs text-center">
           <span>สร้างคำสั่งซื้อ</span>
        </NuxtLink>
      </div>
    </div>

    <div class="bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">รหัสอ้างอิง</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ลูกค้า</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่และเวลา</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">สถานะ</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ยอดรวม</th>
              <th class="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="filteredOrders.length === 0">
               <td colspan="6" class="px-8 py-10 text-center text-slate-400 font-bold">ไม่พบรายการคำสั่งซื้อในวันที่เลือก</td>
            </tr>
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-slate-50/50 transition-colors group" :class="{ 'opacity-50 grayscale': order.status === 'voided' }">
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                 <p class="font-bold text-slate-900 text-xs lg:text-sm">{{ order.id }}</p>
                 <span class="text-[9px] font-black uppercase text-slate-400">{{ order.paymentMethod }}</span>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5">
                 <div class="flex items-center gap-2">
                    <div class="w-7 h-7 lg:w-8 lg:h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] lg:text-xs text-slate-500 font-bold flex-shrink-0">
                       {{ getCustomerName(order.customerId).charAt(0) }}
                    </div>
                    <span class="text-xs lg:text-sm text-slate-900 font-bold truncate max-w-[120px] lg:max-w-none">{{ getCustomerName(order.customerId) }}</span>
                 </div>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm text-slate-600 font-medium">{{ formatDate(order.timestamp) }}</td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-center">
                <span class="px-2 lg:px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-black uppercase whitespace-nowrap"
                  :class="order.status === 'voided' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'">
                  {{ order.status === 'voided' ? 'ยกเลิกแล้ว' : 'สำเร็จ' }}
                </span>
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-right font-black text-slate-900 text-xs lg:text-sm" :class="{ 'line-through text-slate-400': order.status === 'voided' }">
                {{ formatCurrency(order.total) }}
              </td>
              <td class="px-6 lg:px-8 py-4 lg:py-5 text-right">
                <button @click="viewReceipt(order)" class="text-slate-400 hover:text-indigo-600 transition-colors p-2 bg-slate-50 rounded-xl text-xs font-bold">
                  รายละเอียด
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div v-if="isReceiptModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-2 lg:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2rem] lg:rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        <div class="p-6 lg:p-8 text-center border-b border-dashed border-slate-200 flex-shrink-0 relative">
           <button @click="isReceiptModalOpen = false" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           <div class="w-14 h-14 lg:w-16 lg:h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl lg:text-2xl">📋</div>
           <h3 class="text-xl lg:text-2xl font-black text-slate-900" :class="{ 'text-rose-600': selectedOrder?.status === 'voided' }">
              {{ selectedOrder?.status === 'voided' ? 'บิลถูกยกเลิก' : 'ใบเสร็จรับเงิน' }}
           </h3>
           <p class="text-slate-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-1">{{ selectedOrder?.id }}</p>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50 custom-scrollbar">
           <div class="space-y-4 font-mono text-[10px] lg:text-xs border-b border-dashed border-slate-300 pb-4 lg:pb-6 mb-4 lg:mb-6" id="printable-receipt">
            <div class="text-center font-bold mb-4">
               <p class="text-base lg:text-lg">{{ settings.name }}</p>
               <p>{{ settings.address }}</p>
               <p>โทร: {{ settings.phone }}</p>
            </div>
            <div class="flex justify-between">
              <span>เลขที่ใบเสร็จ:</span>
              <span class="font-bold">{{ selectedOrder?.id }}</span>
            </div>
            <div class="flex justify-between">
              <span>วันที่:</span>
              <span>{{ formatDate(selectedOrder?.timestamp) }}</span>
            </div>
            <div class="flex justify-between">
              <span>ลูกค้า:</span>
              <span class="truncate ml-4">{{ getCustomerName(selectedOrder?.customerId) }}</span>
            </div>
            <div class="py-3 lg:py-4 border-y border-dashed border-slate-300">
              <div v-for="item in selectedOrder?.items" :key="item.id" class="flex justify-between mb-1 gap-4">
                <span class="truncate">{{ item.name }} x{{ item.quantity }}</span>
                <span class="flex-shrink-0">{{ formatCurrency(item.price * item.quantity) }}</span>
              </div>
            </div>
            <div class="flex justify-between">
              <span>รวมเงิน:</span>
              <span>{{ formatCurrency(selectedOrder?.subtotal) }}</span>
            </div>
            <div v-if="selectedOrder?.discount" class="flex justify-between text-rose-500">
              <span>ส่วนลด:</span>
              <span>-{{ formatCurrency(selectedOrder?.discount) }}</span>
            </div>
            <div class="flex justify-between text-base lg:text-lg font-black pt-2 border-t border-slate-200 mt-2">
              <span>ยอดรวมทั้งสิ้น:</span>
              <span>{{ formatCurrency(selectedOrder?.total) }}</span>
            </div>
            <div v-if="selectedOrder?.status === 'voided'" class="mt-4 p-2 bg-rose-100 text-rose-700 text-center rounded font-black uppercase text-[10px]">
               ยกเลิกเมื่อ: {{ formatDate(selectedOrder.voidedAt) }}
            </div>
           </div>

           <div v-if="selectedOrder?.paymentSlip" class="mb-6">
             <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">หลักฐานการชำระเงิน</p>
             <div class="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img :src="selectedOrder.paymentSlip" class="w-full h-auto" />
             </div>
          </div>
          
          <div class="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {{ settings.receiptNote }}
          </div>
        </div>

        <div class="p-6 lg:p-8 bg-white border-t border-slate-100 flex-shrink-0">
           <div class="grid grid-cols-2 gap-3 mb-4">
              <button @click="window.print()" class="py-3 bg-slate-900 text-white rounded-xl font-black text-xs">พิมพ์ใบเสร็จ</button>
              <button v-if="selectedOrder?.status !== 'voided'" @click="handleVoidOrder(selectedOrder.id)" 
                class="py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-xs hover:bg-rose-100 transition-all">ยกเลิกบิลนี้</button>
           </div>
           <button @click="isReceiptModalOpen = false" class="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  </div>
</template>
