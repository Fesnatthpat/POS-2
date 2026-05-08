<script setup lang="ts">
import { useCustomers } from '~/composables/useCustomers'
import { useOrders } from '~/composables/useOrders'
import { useSettings } from '~/composables/useSettings'

const { customers, addCustomer, updateCustomer, deleteCustomer, redeemReward } = useCustomers()
const { orders } = useOrders()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard',
  middleware: ['feature-gate']
})

// --- State ---
const searchQuery = ref('')
const isModalOpen = ref(false)
const isHistoryModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const selectedCustomerForHistory = ref<any>(null)

const form = ref<any>({
  name: '',
  phone: '',
  level: 'Silver'
})

// --- Computed ---
const filteredCustomers = computed(() => {
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.phone.includes(searchQuery.value)
  ).sort((a, b) => b.points - a.points)
})

const getCustomerOrdersCount = (customerId: number) => {
  return orders.value.filter(o => o.customerId === customerId && o.status !== 'voided').length
}

// --- Actions ---
const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { name: '', phone: '', level: 'Silver' }
  isModalOpen.value = true
}

const openEditModal = (customer: any) => {
  isEditing.value = true
  editingId.value = customer.id
  form.value = { ...customer }
  isModalOpen.value = true
}

const openHistoryModal = (customer: any) => {
  selectedCustomerForHistory.value = customer
  isHistoryModalOpen.value = true
}

const saveCustomer = () => {
  if (isEditing.value && editingId.value) {
    updateCustomer(editingId.value, form.value)
  } else {
    addCustomer(form.value)
  }
  isModalOpen.value = false
}

const handleDelete = (id: number) => {
  if (confirm('ยืนยันการลบข้อมูลสมาชิก?')) {
    deleteCustomer(id)
  }
}

const handleRedeem = (customer: any) => {
  const threshold = settings.value.loyaltyPointThreshold || 100
  if (customer.points < threshold) {
    alert(`แต้มไม่พอ! ต้องมีอย่างน้อย ${threshold} แต้ม`)
    return
  }
  if (confirm(`ยืนยันการแลกรางวัล? (หัก ${threshold} แต้ม)`)) {
    redeemReward(customer.id, threshold)
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('th-TH', { dateStyle: 'medium' })
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">สมาชิก (Loyalty)</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">จัดการข้อมูลลูกค้าและระบบสะสมแต้ม</p>
      </div>
      <button @click="openAddModal" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
         <span>+ เพิ่มสมาชิกใหม่</span>
      </button>
    </div>

    <!-- Search bar -->
    <div class="relative max-w-xl">
       <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
       </span>
       <input type="text" v-model="searchQuery" placeholder="ค้นหาด้วยชื่อ หรือ เบอร์โทรศัพท์..." 
         class="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="customer in filteredCustomers" :key="customer.id" 
        class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
        <div class="space-y-6">
           <div class="flex justify-between items-start">
             <div class="flex items-center gap-4">
               <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black">
                 {{ customer.name.charAt(0) }}
               </div>
               <div>
                 <h3 class="font-black text-slate-900 text-lg">{{ customer.name }}</h3>
                 <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">{{ customer.phone }}</p>
               </div>
             </div>
             <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase"
               :class="customer.level === 'Platinum' ? 'bg-slate-900 text-indigo-400' : customer.level === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'">
               {{ customer.level }}
             </span>
           </div>

           <div class="grid grid-cols-2 gap-4">
             <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">แต้มสะสม</p>
                <p class="text-2xl font-black text-indigo-600">{{ customer.points }}</p>
             </div>
             <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ซื้อทั้งหมด</p>
                <p class="text-2xl font-black text-slate-900">{{ getCustomerOrdersCount(customer.id) }} <span class="text-[10px] text-slate-400">ครั้ง</span></p>
             </div>
           </div>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
           <div class="flex gap-1">
              <button @click="openEditModal(customer)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.25 2.25 0 113.182 3.182L12.75 20.25 7.5 21.75l1.5-5.25L18.586 2.586z" /></svg>
              </button>
              <button @click="openHistoryModal(customer)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
              <button @click="handleDelete(customer.id)" class="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
           </div>
           <button @click="handleRedeem(customer)" :disabled="customer.points < (settings.loyaltyPointThreshold || 100)"
              class="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-900/10 hover:bg-amber-600 disabled:opacity-30 transition-all flex items-center gap-2">
              <span>แลกรางวัล</span>
           </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-xl font-black text-slate-900">{{ isEditing ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่' }}</h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="saveCustomer" class="p-8 space-y-6">
          <div class="space-y-4">
             <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ชื่อ-นามสกุล</label>
               <input type="text" v-model="form.name" required class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="ระบุชื่อลูกค้า..." />
             </div>
             <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">เบอร์โทรศัพท์</label>
               <input type="tel" v-model="form.phone" required class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="08x-xxx-xxxx" />
             </div>
             <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ระดับสมาชิก</label>
               <select v-model="form.level" class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 appearance-none">
                 <option value="Silver">Silver</option>
                 <option value="Gold">Gold</option>
                 <option value="Platinum">Platinum</option>
               </select>
             </div>
          </div>
          <div class="pt-4 grid grid-cols-2 gap-3">
            <button type="button" @click="isModalOpen = false" class="py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all">ยกเลิก</button>
            <button type="submit" class="py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">บันทึกข้อมูล</button>
          </div>
        </form>
      </div>
    </div>

    <!-- History Modal -->
    <div v-if="isHistoryModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 class="text-xl font-black text-slate-900">ประวัติแต้มสะสม</h3>
            <p class="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-1">{{ selectedCustomerForHistory?.name }}</p>
          </div>
          <button @click="isHistoryModalOpen = false" class="text-slate-400 hover:text-slate-600">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div class="space-y-4">
              <div v-for="log in (selectedCustomerForHistory?.pointHistory || []).slice().reverse()" :key="log.id" 
                class="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                 <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black" :class="log.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'">
                       {{ log.amount > 0 ? '+' : '' }}{{ log.amount }}
                    </div>
                    <div>
                       <p class="font-bold text-slate-900 text-sm">{{ log.note }}</p>
                       <p class="text-[10px] text-slate-400 font-medium">{{ formatDateTime(log.date) }}</p>
                    </div>
                 </div>
                 <div class="text-right">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">แต้มหลังปรับปรุง</p>
                    <p class="font-black text-slate-900">{{ log.after }}</p>
                 </div>
              </div>
              <div v-if="!selectedCustomerForHistory?.pointHistory || selectedCustomerForHistory.pointHistory.length === 0" class="text-center py-12 opacity-30">
                 <p class="text-4xl mb-2">📜</p>
                 <p class="font-bold">ยังไม่มีประวัติการสะสมแต้ม</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
