<script setup lang="ts">
import { useStaff, type Staff } from '~/composables/useStaff'

const { staffMembers, addStaff, updateStaff, deleteStaff } = useStaff()

definePageMeta({
  layout: 'dashboard',
  middleware: ['feature-gate']
})

// --- State ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)

const form = ref<any>({
  name: '',
  username: '',
  password: '',
  role: 'Cashier'
})

// --- Actions ---
const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { name: '', username: '', password: '', role: 'Cashier' }
  isModalOpen.value = true
}

const openEditModal = (staff: Staff) => {
  isEditing.value = true
  editingId.value = staff.id
  form.value = { ...staff }
  isModalOpen.value = true
}

const saveStaffMember = () => {
  if (isEditing.value && editingId.value) {
    updateStaff(editingId.value, form.value)
  } else {
    addStaff(form.value)
  }
  isModalOpen.value = false
}

const toggleStatus = (staff: Staff) => {
  updateStaff(staff.id, { status: staff.status === 'Active' ? 'Inactive' : 'Active' })
}

const handleDelete = (id: number) => {
  if (confirm('ยืนยันการลบรายชื่อพนักงาน?')) {
    deleteStaff(id)
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('th-TH', { dateStyle: 'medium' })
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">การจัดการพนักงาน</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">จัดการรายชื่อพนักงานและกำหนดสิทธิ์การเข้าถึง</p>
      </div>
      <button @click="openAddModal" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
         <span>+ เพิ่มพนักงานใหม่</span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="staff in staffMembers" :key="staff.id" 
        class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
        :class="{ 'opacity-60 grayscale-[50%]': staff.status === 'Inactive' }">
        
        <div class="absolute top-0 right-0 p-4">
           <span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
             :class="staff.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'">
             {{ staff.role }}
           </span>
        </div>

        <div class="flex items-center gap-4 mb-8">
          <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl font-black border border-slate-100">
            {{ staff.name.charAt(0) }}
          </div>
          <div>
            <h3 class="font-black text-slate-900 text-lg">{{ staff.name }}</h3>
            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">@{{ staff.username }}</p>
          </div>
        </div>

        <div class="space-y-4">
           <div class="flex justify-between text-xs">
              <span class="text-slate-400 font-bold">วันที่เริ่มงาน:</span>
              <span class="text-slate-600 font-black">{{ formatDate(staff.joinDate) }}</span>
           </div>
           <div class="flex justify-between text-xs items-center">
              <span class="text-slate-400 font-bold">สถานะ:</span>
              <button @click="toggleStatus(staff)" class="flex items-center gap-1.5 group/btn">
                 <div class="w-2 h-2 rounded-full" :class="staff.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'"></div>
                 <span class="font-black uppercase tracking-tighter group-hover/btn:underline" :class="staff.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'">{{ staff.status === 'Active' ? 'กำลังทำงาน' : 'ระงับการใช้งาน' }}</span>
              </button>
           </div>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-50 flex items-center justify-end gap-2">
           <button @click="openEditModal(staff)" class="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.25 2.25 0 113.182 3.182L12.75 20.25 7.5 21.75l1.5-5.25L18.586 2.586z" /></svg>
           </button>
           <button @click="handleDelete(staff.id)" class="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </button>
        </div>
      </div>
    </div>

    <!-- Modal (Add/Edit) -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-xl font-black text-slate-900">{{ isEditing ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่' }}</h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="saveStaffMember" class="p-8 space-y-6">
          <div class="space-y-4">
             <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ชื่อ-นามสกุล</label>
               <input type="text" v-model="form.name" required class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="ระบุชื่อจริง..." />
             </div>
             <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ชื่อผู้ใช้ (Username)</label>
               <input type="text" v-model="form.username" required class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="ภาษาอังกฤษเท่านั้น..." />
             </div>
             <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">รหัสผ่าน</label>
               <input type="password" v-model="form.password" class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
               <p v-if="isEditing" class="text-[9px] text-slate-400 mt-1">* เว้นว่างไว้หากไม่ต้องการเปลี่ยน</p>
             </div>
             <div>
               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">บทบาท (Role)</label>
               <div class="grid grid-cols-2 gap-3">
                  <button type="button" @click="form.role = 'Admin'" 
                    class="py-3 rounded-xl border-2 font-bold text-xs transition-all"
                    :class="form.role === 'Admin' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 text-slate-400'">ผู้ดูแลระบบ</button>
                  <button type="button" @click="form.role = 'Cashier'" 
                    class="py-3 rounded-xl border-2 font-bold text-xs transition-all"
                    :class="form.role === 'Cashier' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 text-slate-400'">พนักงานขาย</button>
               </div>
             </div>
          </div>
          <div class="pt-4 grid grid-cols-2 gap-3">
            <button type="button" @click="isModalOpen = false" class="py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all">ยกเลิก</button>
            <button type="submit" class="py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">บันทึกข้อมูล</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
