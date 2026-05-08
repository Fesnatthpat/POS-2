<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Developer Management</h1>
        <p class="text-slate-500 text-sm">จัดการระบบและเปิด-ปิดฟีเจอร์สำหรับนักพัฒนา</p>
      </div>
      <div class="flex items-center space-x-3">
        <button @click="toggleAllFeatures(true)" class="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-all">
          เปิดทั้งหมด
        </button>
        <button @click="toggleAllFeatures(false)" class="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-sm font-bold hover:bg-rose-200 transition-all">
          ปิดทั้งหมด
        </button>
        <button @click="handleReset" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-all">
          คืนค่าเริ่มต้น
        </button>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition
      enter-active-class="transition ease-out duration-300 transform"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-to-class="opacity-0"
    >
      <div v-if="showToast" class="fixed bottom-8 right-8 z-[100]">
        <div class="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-white/10">
          <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span class="font-bold">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Feature Flags -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 class="font-bold text-slate-900">Feature Flags Control</h2>
            </div>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="(value, key) in features" :key="key" class="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
              <div>
                <p class="font-bold text-slate-900 capitalize">{{ formatKey(key) }}</p>
                <p class="text-xs text-slate-500 mt-0.5">{{ getDescription(key) }}</p>
              </div>
              <div class="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                <button 
                  @click="setFeatureValue(key, true)"
                  class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  :class="value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
                >
                  เปิดใช้งาน
                </button>
                <button 
                  @click="setFeatureValue(key, false)"
                  class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  :class="!value ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
                >
                  ปิดใช้งาน
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h3 class="font-bold text-slate-900 mb-4">System Information</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Environment</p>
              <p class="text-sm font-bold text-slate-900">{{ envName }}</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client Side</p>
              <p class="text-sm font-bold text-slate-900">{{ isClient ? 'Yes' : 'No' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions / Sidebar -->
      <div class="space-y-6">
        <div class="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
          <div class="relative z-10">
            <h3 class="text-xl font-bold mb-2">Dev Shortcuts</h3>
            <p class="text-indigo-200 text-sm mb-6">เครื่องมือช่วยสำหรับการทดสอบระบบ</p>
            <div class="space-y-3">
              <button @click="printCurrentState" class="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10 text-left flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Print State to Console</span>
              </button>
              <button @click="simulateError" class="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10 text-left flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Simulate Error</span>
              </button>
            </div>
          </div>
          <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        <div class="bg-rose-50 rounded-3xl p-8 border border-rose-100 shadow-sm space-y-6">
          <div>
            <h3 class="font-bold text-rose-900 mb-2">Danger Zone</h3>
            <p class="text-rose-600 text-xs mb-4">ระวัง! การดำเนินการเหล่านี้ส่งผลต่อข้อมูลในเบราว์เซอร์ของคุณ</p>
          </div>
          
          <button @click="clearLocalStorage" class="w-full py-3 px-4 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl text-sm font-bold transition-all flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear Local Storage</span>
          </button>

          <button @click="forceLogout" class="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20">
            Force Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFeatures } from '~/composables/useFeatures'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'dashboard',
  middleware: ['feature-gate']
})

useHead({
  title: 'Dev Management'
})

const { features, toggleFeature, setFeature, resetFeatures, saveFeatures } = useFeatures()
const { logout } = useAuth()

const showToast = ref(false)
const toastMessage = ref('')

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

const setFeatureValue = (key: any, value: boolean) => {
  setFeature(key, value)
  triggerToast(`อัปเดตฟีเจอร์ ${formatKey(key)} แล้ว`)
}

const handleReset = () => {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการคืนค่าเริ่มต้นทั้งหมด?')) {
    resetFeatures()
    triggerToast('คืนค่าเริ่มต้นเรียบร้อยแล้ว')
  }
}

const toggleAllFeatures = (value: boolean) => {
  const status = value ? 'เปิด' : 'ปิด'
  if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการ${status}ทุกฟีเจอร์?`)) {
    Object.keys(features.value).forEach((key) => {
      setFeature(key as any, value)
    })
    triggerToast(`${status}ใช้งานทุกฟีเจอร์แล้ว`)
  }
}

const envName = computed(() => process.env.NODE_ENV || 'development')
const isClient = computed(() => !!process.client)

const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^enable /, '')
    .trim()
}

const getDescription = (key: string) => {
  const descriptions: Record<string, string> = {
    enablePOS: 'ระบบขายหน้าร้าน (Point of Sale)',
    enableOrders: 'ระบบจัดการและประวัติคำสั่งซื้อ',
    enableProducts: 'ระบบจัดการคลังสินค้าและรายการสินค้า',
    enableCustomers: 'ระบบจัดการฐานข้อมูลลูกค้า',
    enableStaff: 'ระบบจัดการข้อมูลและสิทธิ์พนักงาน',
    enableReports: 'ระบบรายงานสรุปผลและกราฟวิเคราะห์',
    enableSettings: 'ระบบตั้งค่าข้อมูลร้านค้าเบื้องต้น',
    enableInventoryAlerts: 'แสดงการแจ้งเตือนเมื่อสินค้าใกล้หมดใน Dashboard',
    debugMode: 'แสดงข้อมูลสำหรับการตรวจสอบข้อผิดพลาด (Debug)'
  }
  return descriptions[key] || 'ไม่มีคำอธิบายสำหรับฟีเจอร์นี้'
}

const clearLocalStorage = () => {
  if (confirm('อันตราย! คุณแน่ใจหรือไม่ว่าต้องการล้าง Local Storage ทั้งหมด? ข้อมูลการตั้งค่าจะหายไปและแอปจะรีสตาร์ท')) {
    localStorage.clear()
    window.location.reload()
  }
}

const printCurrentState = () => {
  console.log('--- Dev Management State ---')
  console.log('Features:', JSON.parse(JSON.stringify(features.value)))
  alert('สถานะถูกพิมพ์ลงใน Console (F12) แล้ว')
}

const simulateError = () => {
  alert('กำลังจำลอง Error ใน Console...')
  console.error('[DEV ERROR] This is a simulated error for debugging.')
}

const forceLogout = () => {
  if (confirm('คุณต้องการออกจากระบบทันทีหรือไม่?')) {
    logout()
  }
}
</script>
