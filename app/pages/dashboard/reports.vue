<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'
import { useSettings } from '~/composables/useSettings'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler, ArcElement)

const { orders } = useOrders()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard',
  middleware: [ 'feature-gate' ]
})

// --- State ---
const selectedDate = ref(new Date().toISOString().split('T')[ 0 ])

// --- Computed ---
const targetDateObj = computed(() => new Date(selectedDate.value).toDateString())

const dayOrdersAll = computed(() => orders.value.filter(o => new Date(o.timestamp).toDateString() === targetDateObj.value))
const dayOrdersValid = computed(() => dayOrdersAll.value.filter(o => o.status !== 'voided'))
const dayOrdersVoided = computed(() => dayOrdersAll.value.filter(o => o.status === 'voided'))

const dailyStats = computed(() => {
  const revenue = dayOrdersValid.value.reduce((sum, o) => sum + o.total, 0)
  const count = dayOrdersValid.value.length
  const avg = count > 0 ? revenue / count : 0
  return { revenue, count, avg }
})

const profitStats = computed(() => {
  const totalCost = dayOrdersValid.value.reduce((sum, o) => sum + (o.totalCost || 0), 0)
  const totalProfit = dayOrdersValid.value.reduce((sum, o) => sum + (o.profit || 0), 0)
  const margin = dailyStats.value.revenue > 0 ? (totalProfit / dailyStats.value.revenue) * 100 : 0

  return { totalCost, totalProfit, margin }
})

const bestSellers = computed(() => {
  const itemsMap: Record<string, { name: string, quantity: number, revenue: number }> = {}
  dayOrdersValid.value.forEach(order => {
    order.items.forEach((item: any) => {
      if (!itemsMap[ item.id ]) {
        itemsMap[ item.id ] = { name: item.name, quantity: 0, revenue: 0 }
      }
      itemsMap[ item.id ].quantity += item.quantity
      itemsMap[ item.id ].revenue += (item.price * item.quantity)
    })
  })
  return Object.values(itemsMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5)
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

const exportToExcel = () => {
  if (dayOrdersAll.value.length === 0) {
    alert('ไม่มีข้อมูลสำหรับวันที่เลือก')
    return
  }

  const headers = [ 'Order ID', 'Time', 'Customer ID', 'Items Count', 'Subtotal', 'Discount', 'Total', 'Total Cost', 'Profit', 'Payment Method', 'Status' ]
  const rows = dayOrdersAll.value.map(o => [
    o.id,
    new Date(o.timestamp).toLocaleTimeString(),
    o.customerId || 'General',
    o.items.length,
    o.subtotal,
    o.discount,
    o.total,
    o.totalCost || 0,
    o.profit || 0,
    o.paymentMethod,
    o.status
  ])

  const csvContent = [ headers.join(','), ...rows.map(r => r.join(',')) ].join('\n')
  const blob = new Blob([ new Uint8Array([ 0xEF, 0xBB, 0xBF ]), csvContent ], { type: 'text/csv;charset=utf-8;' }) // Add BOM for Thai characters in Excel
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `sales_report_${selectedDate.value}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// --- Chart Data ---
const hourlyChartData = computed(() => {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8) // 8:00 to 22:00
  const labels = hours.map(h => `${h}:00`)
  const totals = hours.map(h => {
    return dayOrdersValid.value
      .filter(o => new Date(o.timestamp).getHours() === h)
      .reduce((sum, o) => sum + o.total, 0)
  })

  return {
    labels,
    datasets: [
      {
        label: 'ยอดขาย (บาท)',
        data: totals,
        backgroundColor: '#4f46e5', // indigo-600
        borderRadius: 8,
        barThickness: 16,
      }
    ]
  }
})

const paymentMethodData = computed(() => {
  const methods = { cash: 0, qr: 0, transfer: 0 }
  dayOrdersValid.value.forEach(o => {
    if (methods[ o.paymentMethod as keyof typeof methods ] !== undefined) {
      methods[ o.paymentMethod as keyof typeof methods ] += o.total
    }
  })

  return {
    labels: [ 'เงินสด', 'คิวอาร์โค้ด', 'โอนเงิน' ],
    datasets: [
      {
        data: [ methods.cash, methods.qr, methods.transfer ],
        backgroundColor: [ '#10b981', '#3b82f6', '#f59e0b' ], // emerald, blue, amber
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }
})

const weeklyChartData = computed(() => {
  const labels: string[] = []
  const data: number[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toDateString()
    labels.push(d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }))

    const dayTotal = orders.value
      .filter(o => new Date(o.timestamp).toDateString() === dateStr && o.status !== 'voided')
      .reduce((sum, o) => sum + o.total, 0)
    data.push(dayTotal)
  }

  return {
    labels,
    datasets: [
      {
        label: 'รายได้ 7 วันที่ผ่านมา (บาท)',
        data: data,
        borderColor: '#8b5cf6', // violet-500
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#8b5cf6',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context: any) => formatCurrency(context.raw)
      }
    }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
  }
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context: any) => formatCurrency(context.raw)
      }
    }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { usePointStyle: true, padding: 20, font: { size: 12, family: "'Plus Jakarta Sans', sans-serif" } }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      callbacks: {
        label: (context: any) => ` ${context.label}: ${formatCurrency(context.raw)}`
      }
    }
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 lg:space-y-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 lg:gap-6">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">รายงานและสถิติ</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">วิเคราะห์ยอดขายและผลการดำเนินงานของร้าน</p>
      </div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div
          class="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3">เลือกวันที่</span>
          <input type="date" v-model="selectedDate"
            class="bg-slate-50 border-none rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:ring-0 text-sm flex-1 md:flex-none cursor-pointer hover:bg-slate-100 transition-colors outline-none" />
        </div>
        <button @click="exportToExcel"
          class="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>ส่งออกข้อมูล (CSV)</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <!-- Revenue -->
      <div
        class="bg-indigo-600 p-6 lg:p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between aspect-square sm:aspect-auto relative overflow-hidden group">
        <div
          class="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500">
        </div>
        <div
          class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-4 relative z-10 backdrop-blur-sm">
          💰</div>
        <div class="relative z-10">
          <p class="text-[10px] lg:text-xs font-bold opacity-80 uppercase tracking-widest mb-1">รายได้รวมวันนี้</p>
          <p class="text-2xl lg:text-4xl font-black truncate">{{ formatCurrency(dailyStats.revenue) }}</p>
        </div>
      </div>

      <!-- Profit -->
      <div
        class="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between aspect-square sm:aspect-auto hover:shadow-md transition-shadow">
        <div
          class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-4">📈
        </div>
        <div>
          <p class="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">กำไรสุทธิ</p>
          <p class="text-2xl lg:text-4xl font-black truncate"
            :class="profitStats.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ formatCurrency(profitStats.totalProfit) }}
          </p>
        </div>
      </div>

      <!-- Orders Count -->
      <div
        class="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between aspect-square sm:aspect-auto hover:shadow-md transition-shadow">
        <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-4">🧾
        </div>
        <div>
          <p class="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">จำนวนบิล</p>
          <p class="text-2xl lg:text-4xl font-black text-slate-900">{{ dailyStats.count }} <span
              class="text-sm font-bold text-slate-400">รายการ</span></p>
        </div>
      </div>

      <!-- Average per Order -->
      <div
        class="bg-slate-900 p-6 lg:p-8 rounded-[2rem] text-white shadow-xl flex flex-col justify-between aspect-square sm:aspect-auto relative overflow-hidden">
        <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl mb-4">🎯</div>
        <div>
          <p class="text-[10px] lg:text-xs font-bold opacity-50 uppercase tracking-widest mb-1">ยอดใช้จ่ายเฉลี่ย/บิล</p>
          <p class="text-2xl lg:text-4xl font-black text-indigo-400">{{ formatCurrency(dailyStats.avg) }}</p>
        </div>
      </div>
    </div>

    <!-- Analytics Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <!-- Hourly Sales Bar Chart -->
      <div class="lg:col-span-2 bg-white p-6 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-xl font-black text-slate-900">ยอดขายรายชั่วโมง</h3>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ประจำวันที่ {{ new
              Date(selectedDate).toLocaleDateString('th-TH') }}</p>
          </div>
          <div class="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">📊</div>
        </div>
        <div class="h-[300px]">
          <Bar :data="hourlyChartData" :options="barOptions" />
        </div>
      </div>

      <!-- Payment Methods Doughnut -->
      <div class="bg-white p-6 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
        <div class="mb-8">
          <h3 class="text-xl font-black text-slate-900">สัดส่วนการชำระเงิน</h3>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">PAYMENT METHODS</p>
        </div>
        <div class="flex-1 min-h-[250px] relative flex items-center justify-center">
          <Doughnut :data="paymentMethodData" :options="doughnutOptions" v-if="dailyStats.count > 0" />
          <div v-else class="text-center text-slate-400 font-bold text-sm">ไม่มีข้อมูลการชำระเงิน</div>

          <!-- Center Text -->
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            v-if="dailyStats.count > 0">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">ยอดรวม</span>
            <span class="text-lg font-black text-slate-900">{{ formatCurrency(dailyStats.revenue) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Weekly Line Chart -->
    <div class="bg-white p-6 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-xl font-black text-slate-900">แนวโน้มยอดขาย 7 วันย้อนหลัง</h3>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">WEEKLY TREND</p>
        </div>
        <div class="w-10 h-10 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">📈</div>
      </div>
      <div class="h-[300px]">
        <Line :data="weeklyChartData" :options="lineOptions" />
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
      <!-- Best Sellers -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-black text-slate-900">5 อันดับสินค้าขายดี</h2>
          <span
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">วันนี้</span>
        </div>
        <div class="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div v-if="bestSellers.length === 0" class="text-center py-12 text-slate-400">
            <div class="text-4xl mb-4 opacity-50">🏆</div>
            <p class="font-bold">ยังไม่มีข้อมูลการขายในวันนี้</p>
          </div>
          <div v-for="(item, index) in bestSellers" :key="index" class="flex items-center gap-4 group">
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 transition-colors"
              :class="index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-100 text-slate-600' : index === 2 ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'">
              #{{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{{
                item.name }}</p>
              <p class="text-[10px] text-slate-500 font-bold mt-0.5">ขายแล้ว <span class="text-indigo-600">{{
                  item.quantity }}</span> ชิ้น</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="font-black text-slate-900 text-sm">{{ formatCurrency(item.revenue) }}</p>
            </div>
          </div>
        </div>

        <!-- Profit/Cost Summary -->
        <div class="bg-slate-50 p-6 lg:p-8 rounded-[2rem] border border-slate-200">
          <h3 class="text-sm font-black text-slate-900 mb-6">สรุปข้อมูลต้นทุนและกำไร</h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-500">ต้นทุนขายสุทธิ</span>
              <span class="text-sm font-black text-slate-900">{{ formatCurrency(profitStats.totalCost) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-500">กำไรสุทธิ</span>
              <span class="text-sm font-black"
                :class="profitStats.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'">{{
                  formatCurrency(profitStats.totalProfit) }}</span>
            </div>
            <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div class="h-full rounded-full"
                :class="profitStats.margin >= 30 ? 'bg-emerald-500' : profitStats.margin >= 15 ? 'bg-amber-500' : 'bg-rose-500'"
                :style="{ width: `${Math.min(100, Math.max(0, profitStats.margin))}%` }"></div>
            </div>
            <p class="text-[10px] text-center font-bold text-slate-400 mt-2">อัตรากำไรขั้นต้น: {{
              profitStats.margin.toFixed(2) }}%</p>
          </div>
        </div>
      </div>

      <!-- Recent Orders List -->
      <div class="xl:col-span-2 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-black text-slate-900">ประวัติการขาย (บิล)</h2>
          <div class="flex gap-2">
            <span
              class="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">สำเร็จ
              {{ dayOrdersValid.length }}</span>
            <span
              class="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full"
              v-if="dayOrdersVoided.length > 0">ยกเลิก {{ dayOrdersVoided.length }}</span>
          </div>
        </div>

        <div
          class="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
          <div class="overflow-x-auto custom-scrollbar flex-1">
            <table class="w-full text-left min-w-[700px]">
              <thead class="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10">
                <tr>
                  <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ข้อมูลบิล</th>
                  <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    ช่องทาง</th>
                  <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">สถานะ</th>
                  <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    ยอดสุทธิ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-if="dayOrdersAll.length === 0">
                  <td colspan="4" class="px-8 py-16 text-center text-slate-400">
                    <div class="text-4xl mb-4 opacity-50">🧾</div>
                    <p class="font-bold">ไม่พบรายการธุรกรรมในวันที่เลือก</p>
                  </td>
                </tr>
                <tr v-for="order in dayOrdersAll.slice().reverse()" :key="order.id"
                  class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-8 py-5">
                    <div class="flex flex-col min-w-0">
                      <span class="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">#{{
                        order.id.slice(-8).toUpperCase() }}</span>
                      <span class="text-[10px] text-slate-500 font-bold mt-1">{{ formatDate(order.timestamp) }} • {{
                        order.items.length }} รายการ</span>
                    </div>
                  </td>
                  <td class="px-8 py-5 text-center">
                    <span
                      class="inline-flex items-center justify-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border"
                      :class="order.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : order.paymentMethod === 'qr' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'">
                      {{ order.paymentMethod === 'cash' ? '💵 เงินสด' : order.paymentMethod === 'qr' ? '🔳 คิวอาร์' :
                      '📱 โอนเงิน' }}
                    </span>
                  </td>
                  <td class="px-8 py-5">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                      :class="order.status === 'voided' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'">
                      <div class="w-1.5 h-1.5 rounded-full"
                        :class="order.status === 'voided' ? 'bg-rose-500' : 'bg-emerald-500'"></div>
                      {{ order.status === 'voided' ? 'ยกเลิก' : 'สำเร็จ' }}
                    </span>
                  </td>
                  <td class="px-8 py-5 text-right">
                    <p class="font-black text-sm"
                      :class="order.status === 'voided' ? 'text-slate-400 line-through' : 'text-slate-900'">
                      {{ formatCurrency(order.total) }}
                    </p>
                    <p v-if="order.discount > 0 && order.status !== 'voided'"
                      class="text-[10px] font-bold text-rose-500 mt-1">
                      ส่วนลด {{ formatCurrency(order.discount) }}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
