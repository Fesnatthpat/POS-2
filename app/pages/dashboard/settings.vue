<script setup lang="ts">
import { useSettings, type StoreSettings } from '~/composables/useSettings'

const { settings, saveSettings, exportBackup, importBackup } = useSettings()

definePageMeta({
  layout: 'dashboard',
  middleware: ['feature-gate']
})

// --- State ---
const form = ref<StoreSettings>({ ...settings.value })
const isSaving = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// --- Actions ---
const handleSave = async () => {
  isSaving.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  saveSettings(form.value)
  isSaving.value = false
  alert('บันทึกการตั้งค่าสำเร็จ')
}

const triggerImport = () => {
  fileInput.value?.click()
}

const handleImport = (event: any) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (confirm('การคืนค่าข้อมูลจะทับข้อมูลปัจจุบันทั้งหมดและเริ่มระบบใหม่ คุณแน่ใจใช่หรือไม่?')) {
        const success = importBackup(content)
        if (!success) alert('เกิดข้อผิดพลาด: ไฟล์สำรองข้อมูลไม่ถูกต้อง')
      }
    }
    reader.readAsText(file)
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-10">
    <div>
      <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">การตั้งค่าร้านค้า</h1>
      <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">จัดการโปรไฟล์ร้าน ระบบภาษี และการสำรองข้อมูล</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
       <!-- Left: Form -->
       <div class="lg:col-span-2 space-y-8">
          <!-- Store Profile -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <div class="flex items-center gap-4 mb-2">
                <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">🏪</div>
                <h3 class="text-xl font-black text-slate-900">โปรไฟล์ร้านค้า</h3>
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อร้านค้า</label>
                   <input type="text" v-model="form.name" class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div class="space-y-2">
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">เบอร์โทรศัพท์</label>
                   <input type="tel" v-model="form.phone" class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div class="md:col-span-2 space-y-2">
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ที่อยู่ร้านค้า</label>
                   <textarea v-model="form.address" rows="3" class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"></textarea>
                </div>
             </div>
          </div>

          <!-- Tax & Currency -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <div class="flex items-center gap-4 mb-2">
                <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">🧾</div>
                <h3 class="text-xl font-black text-slate-900">ระบบภาษีและสกุลเงิน</h3>
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-4">
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">การคำนวณภาษี</label>
                   <div class="flex items-center gap-4">
                      <button type="button" @click="form.includeTax = true" 
                        class="flex-1 py-4 rounded-2xl border-2 font-bold text-sm transition-all"
                        :class="form.includeTax ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'">ราคารวมภาษีแล้ว</button>
                      <button type="button" @click="form.includeTax = false" 
                        class="flex-1 py-4 rounded-2xl border-2 font-bold text-sm transition-all"
                        :class="!form.includeTax ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'">แยกภาษีต่างหาก</button>
                   </div>
                </div>
                <div class="space-y-4">
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">อัตราภาษี (%)</label>
                   <input type="number" v-model="form.taxRate" class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
             </div>
          </div>

          <!-- Loyalty Points -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <div class="flex items-center gap-4 mb-2">
                <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl">⭐</div>
                <h3 class="text-xl font-black text-slate-900">ระบบสมาชิกและแต้มสะสม</h3>
             </div>
             
             <div class="space-y-4">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">รูปแบบการสะสมแต้ม</label>
                <div class="flex items-center gap-4">
                   <button type="button" @click="form.loyaltyPointType = 'amount'" 
                     class="flex-1 py-4 rounded-2xl border-2 font-bold text-sm transition-all"
                     :class="form.loyaltyPointType === 'amount' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'">ตามยอดซื้อ (฿)</button>
                   <button type="button" @click="form.loyaltyPointType = 'item'" 
                     class="flex-1 py-4 rounded-2xl border-2 font-bold text-sm transition-all"
                     :class="form.loyaltyPointType === 'item' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'">ตามจำนวนชิ้น</button>
                </div>
             </div>

             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {{ form.loyaltyPointType === 'amount' ? 'จำนวนเงินต่อ 1 แต้ม (฿)' : 'จำนวนแต้มต่อสินค้า 1 ชิ้น' }}
                   </label>
                   <input type="number" v-model="form.loyaltyPointRate" class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div class="space-y-2">
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">แต้มขั้นต่ำเพื่อแลกรางวัล</label>
                   <input type="number" v-model="form.loyaltyPointThreshold" class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" />
                </div>
             </div>
          </div>
       </div>

       <!-- Right: Sidebar -->
       <div class="space-y-8">
          <!-- System Management -->
          <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl">
             <h3 class="text-lg font-black uppercase tracking-[0.2em] text-indigo-400">System Backup</h3>
             <p class="text-xs text-slate-400 leading-relaxed">เนื่องจากข้อมูลถูกเก็บไว้ในเบราว์เซอร์ (Local Storage) การล้างแคชอาจทำให้ข้อมูลหายได้ ควรสำรองข้อมูลไว้อย่างสม่ำเสมอ</p>
             
             <div class="space-y-3 pt-2">
                <button @click="exportBackup" class="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                   <span>📥 สำรองข้อมูล (JSON)</span>
                </button>
                <button @click="triggerImport" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50">
                   <span>📤 คืนค่าข้อมูล</span>
                </button>
                <input type="file" ref="fileInput" accept=".json" class="hidden" @change="handleImport" />
             </div>
          </div>

          <!-- Receipt Note -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
             <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ข้อความท้ายใบเสร็จ</label>
             <textarea v-model="form.receiptNote" rows="4" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="เช่น ขอบคุณที่ใช้บริการ..."></textarea>
          </div>

          <!-- Save Button -->
          <button @click="handleSave" :disabled="isSaving"
            class="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
            <span v-if="isSaving" class="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
          </button>
       </div>
    </div>
  </div>
</template>
