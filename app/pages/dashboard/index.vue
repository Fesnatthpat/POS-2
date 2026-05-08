<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'
import { useProducts } from '~/composables/useProducts'
import { useCustomers } from '~/composables/useCustomers'
import { useSettings } from '~/composables/useSettings'
import { useFeatures } from '~/composables/useFeatures'
import { Bar } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement)

const { orders } = useOrders()
const { products } = useProducts()
const { customers, redeemReward } = useCustomers()
const { settings } = useSettings()
const { features } = useFeatures()

definePageMeta({
  layout: 'dashboard'
})

// --- Computed Stats ---
const today = new Date().toDateString()
const todayOrders = computed(() => orders.value.filter(o => new Date(o.timestamp).toDateString() === today))
const todayRevenue = computed(() => todayOrders.value.reduce((sum, o) => sum + o.total, 0))
const todayProfit = computed(() => todayOrders.value.reduce((sum, o) => sum + (o.profit || 0), 0))

const lowStockItems = computed(() => products.value.filter(p => p.stock > 0 && p.stock <= 5))
const outOfStockItems = computed(() => products.value.filter(p => p.stock === 0))

// Recent Transactions (Last 5)
const recentTransactions = computed(() => {
  return [...orders.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)
})

// Today's Best Sellers
const todayBestSellers = computed(() => {
  const items: Record<number, { name: string, quantity: number }> = {}
  todayOrders.value.forEach(order => {
    order.items.forEach(item => {
      if (!items[item.id]) items[item.id] = { name: item.name, quantity: 0 }
      items[item.id].quantity += item.quantity
    })
  })
  return Object.values(items).sort((a, b) => b.quantity - a.quantity).slice(0, 3)
})

// Payment Split for Today
const paymentSplit = computed(() => {
  const methods = { cash: 0, transfer: 0, qr: 0 }
  todayOrders.value.forEach(o => {
    methods[o.paymentMethod] += o.total
  })
  return methods
})

// Chart.js Data
const salesTrendData = computed(() => {
  const labels = []
  const totals = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('th-TH', { weekday: 'short' }))
    const dateStr = d.toDateString()
    const dayTotal = orders.value
      .filter(o => new Date(o.timestamp).toDateString() === dateStr)
      .reduce((sum, o) => sum + o.total, 0)
    totals.push(dayTotal)
  }

  return {
    labels,
    datasets: [
      {
        label: 'ยอดขายรายวัน',
        data: totals,
        backgroundColor: '#4f46e5',
        borderRadius: 12,
        barThickness: 24,
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      displayColors: false,
    }
  },
  scales: {
    y: { display: false, beginAtZero: true },
    x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } }
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

const handleRedeemReward = (customer: any) => {
  const threshold = settings.value.loyaltyPointThreshold || 10
  if (confirm(`ยืนยันการแลกรางวัลสำหรับลูกค้า "${customer.name}"? (จะหัก ${threshold} แต้ม)`)) {
    redeemReward(customer.id, threshold)
  }
}

const customersReachedThreshold = computed(() => {
   if (!features.value.enableCustomers) return []
   return customers.value
      .filter(c => c.points >= (settings.value.loyaltyPointThreshold || 10))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 lg:space-y-10">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">ภาพรวมแผงควบคุม</h1>
        <p class="text-slate-500 font-medium text-xs sm:text-sm mt-1">ยินดีต้อนรับกลับมา! นี่คือรายงานสรุปของร้านคุณวันนี้</p>
      </div>
      <div class="flex gap-2">
         <NuxtLink to="/dashboard/pos" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
            <span>✨ ขายหน้าร้าน</span>
         </NuxtLink>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <div class="bg-indigo-600 p-5 lg:p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between aspect-square sm:aspect-auto">
         <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl mb-4">💰</div>
         <div>
            <p class="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">ยอดขายวันนี้</p>
            <p class="text-xl sm:text-2xl font-black truncate">{{ formatCurrency(todayRevenue) }}</p>
         </div>
      </div>
      <div class="bg-white p-5 lg:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between aspect-square sm:aspect-auto">
         <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl mb-4">📈</div>
         <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">กำไรวันนี้</p>
            <p class="text-xl sm:text-2xl font-black text-emerald-600 truncate">{{ formatCurrency(todayProfit) }}</p>
         </div>
      </div>
      <div class="bg-white p-5 lg:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between aspect-square sm:aspect-auto">
         <div class="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl mb-4">📦</div>
         <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">คำสั่งซื้อ</p>
            <p class="text-xl sm:text-2xl font-black text-slate-900">{{ todayOrders.length }}</p>
         </div>
      </div>
      <div class="bg-white p-5 lg:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between aspect-square sm:aspect-auto">
         <div class="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl mb-4">⚠️</div>
         <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">สินค้าที่ต้องดูแล</p>
            <p class="text-xl sm:text-2xl font-black text-rose-600">{{ lowStockItems.length + outOfStockItems.length }}</p>
         </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Analytics -->
      <div class="lg:col-span-2 space-y-8">
         <!-- Chart.js Visualization -->
         <div class="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div class="flex items-center justify-between mb-8">
               <div>
                  <h3 class="text-xl font-black text-slate-900">แนวโน้มรายได้ 7 วัน</h3>
                  <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">WEEKLY PERFORMANCE</p>
               </div>
               <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-indigo-600 rounded-full"></div>
                  <span class="text-[10px] font-black text-slate-400 uppercase">ยอดรวมรายวัน</span>
               </div>
            </div>
            <div class="h-64 sm:h-80">
               <Bar :data="salesTrendData" :options="chartOptions" />
            </div>
         </div>

         <!-- Recent Transactions Table -->
         <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div class="p-8 border-b border-slate-50 flex justify-between items-center">
               <h3 class="text-xl font-black text-slate-900">ธุรกรรมล่าสุด</h3>
               <NuxtLink to="/dashboard/orders" class="text-xs font-bold text-indigo-600 hover:underline">ดูทั้งหมด</NuxtLink>
            </div>
            <div class="overflow-x-auto">
               <table class="w-full text-left">
                  <thead>
                     <tr class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th class="px-8 py-4">เวลา</th>
                        <th class="px-8 py-4">ลูกค้า</th>
                        <th class="px-8 py-4">ช่องทาง</th>
                        <th class="px-8 py-4 text-right">ยอดรวม</th>
                     </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                     <tr v-for="order in recentTransactions" :key="order.id" class="hover:bg-slate-50/50 transition-colors group">
                        <td class="px-8 py-5">
                           <div class="flex flex-col">
                              <span class="text-sm font-bold text-slate-900">{{ formatDate(order.timestamp) }}</span>
                              <span class="text-[10px] text-slate-400 font-medium truncate w-24">#{{ order.id }}</span>
                           </div>
                        </td>
                        <td class="px-8 py-5 text-sm font-medium text-slate-600">
                           {{ order.customerId ? 'สมาชิก' : 'ลูกค้าทั่วไป' }}
                        </td>
                        <td class="px-8 py-5">
                           <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase" 
                              :class="order.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'">
                              {{ order.paymentMethod }}
                           </span>
                        </td>
                        <td class="px-8 py-5 text-right font-black text-slate-900 text-sm">
                           {{ formatCurrency(order.total) }}
                        </td>
                     </tr>
                     <tr v-if="recentTransactions.length === 0">
                        <td colspan="4" class="px-8 py-10 text-center text-slate-400 font-bold">ยังไม่มีรายการในวันนี้</td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <!-- Sidebar Info -->
      <div class="space-y-8">
         <!-- Actionable Inventory Alerts -->
         <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 class="text-xl font-black text-slate-900">สินค้าต้องเติมสต็อก</h3>
            <div v-if="lowStockItems.length === 0 && outOfStockItems.length === 0" class="text-center py-6 opacity-40">
               <p class="text-4xl mb-2">✅</p>
               <p class="font-bold text-xs">สต็อกสินค้าพร้อมขาย</p>
            </div>
            <div class="space-y-4">
               <div v-for="item in [...outOfStockItems, ...lowStockItems].slice(0, 4)" :key="item.id" 
                  class="flex items-center justify-between group">
                  <div class="flex items-center gap-3 min-w-0">
                     <div class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black"
                        :class="item.stock === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'">
                        {{ item.stock }}
                     </div>
                     <div class="min-w-0">
                        <p class="font-bold text-slate-900 text-xs truncate">{{ item.name }}</p>
                        <p class="text-[9px] font-black uppercase text-slate-400">คงเหลือปัจจุบัน</p>
                     </div>
                  </div>
                  <NuxtLink :to="`/dashboard/stock-in?productId=${item.id}`" 
                     class="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">
                     รับเข้า
                  </NuxtLink>
               </div>
            </div>
         </div>

         <!-- Payment Split Visualization -->
         <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <h3 class="text-lg font-black mb-6">ยอดรวมตามวิธีชำระเงิน</h3>
            <div class="space-y-4">
               <div v-for="(val, key) in paymentSplit" :key="key" class="space-y-2">
                  <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>{{ key === 'cash' ? 'เงินสด' : key === 'qr' ? 'QR Code' : 'โอนเงิน' }}</span>
                     <span class="text-white">{{ formatCurrency(val) }}</span>
                  </div>
                  <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                     <div class="h-full bg-indigo-500 rounded-full" 
                        :style="{ width: todayRevenue > 0 ? (val / todayRevenue * 100) + '%' : '0%' }"></div>
                  </div>
               </div>
            </div>
         </div>

         <!-- Today's Top Sellers -->
         <div class="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100">
            <h3 class="text-lg font-black text-indigo-900 mb-6">3 อันดับขายดีวันนี้</h3>
            <div class="space-y-4">
               <div v-for="(item, idx) in todayBestSellers" :key="idx" class="flex items-center gap-4">
                  <span class="text-2xl font-black text-indigo-200">0{{ idx + 1 }}</span>
                  <div class="flex-1 min-w-0">
                     <p class="font-black text-indigo-900 text-sm truncate">{{ item.name }}</p>
                     <p class="text-[10px] font-bold text-indigo-400 uppercase">ขายได้ {{ item.quantity }} ชิ้น</p>
                  </div>
               </div>
               <p v-if="todayBestSellers.length === 0" class="text-center py-4 text-indigo-300 font-bold text-xs uppercase">ยังไม่มีรายการขาย</p>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>
