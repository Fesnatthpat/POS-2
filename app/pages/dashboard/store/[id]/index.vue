<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useStores } from '~/composables/useStores'
import { computed } from 'vue'

const route = useRoute()
const { stores } = useStores()
const storeId = route.params.id as string

const store = computed(() => stores.value.find(s => s.id === storeId))

definePageMeta({
  layout: 'dashboard'
})

// Simulated data for this specific store
const storeStats = computed(() => [
  { name: 'Today Sales', value: `${store.value?.currency || 'THB'} 3,450.00`, change: '+12%', icon: '💰' },
  { name: 'Active Orders', value: '12', change: '+2', icon: '📝' },
  { name: 'Low Stock Items', value: '3', change: '-1', icon: '⚠️' },
  { name: 'Customer Visits', value: '45', change: '+8%', icon: '👥' },
])

const recentTransactions = [
  { id: '#TRX-9821', customer: 'Walking Customer', items: 3, total: '฿450.00', time: '10 mins ago' },
  { id: '#TRX-9820', customer: 'John Doe', items: 1, total: '฿120.00', time: '25 mins ago' },
  { id: '#TRX-9819', customer: 'Jane Smith', items: 5, total: '฿1,200.00', time: '1 hour ago' },
]
</script>

<template>
  <div v-if="store" class="p-8">
    <!-- Store Header -->
    <div class="flex items-center justify-between mb-10">
      <div class="flex items-center space-x-4">
        <NuxtLink to="/dashboard" class="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </NuxtLink>
        <div>
          <div class="flex items-center space-x-3">
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">{{ store.name }}</h1>
            <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full tracking-wider border border-indigo-100">
              {{ store.type }}
            </span>
          </div>
          <p class="text-slate-500 font-medium mt-1">Dashboard summary and real-time operations.</p>
        </div>
      </div>
      <div class="flex space-x-3">
        <button class="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">
          Quick Report
        </button>
        <NuxtLink to="/dashboard/pos" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          Open POS
        </NuxtLink>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div v-for="stat in storeStats" :key="stat.name" 
        class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl">
            {{ stat.icon }}
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">{{ stat.change }}</span>
        </div>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{{ stat.name }}</p>
        <h3 class="text-2xl font-black text-slate-900">{{ stat.value }}</h3>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Activity -->
      <div class="lg:col-span-2 space-y-8">
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-xl font-bold text-slate-900">Recent Transactions</h3>
            <button class="text-sm font-bold text-indigo-600 hover:underline">View All</button>
          </div>
          <div class="space-y-4">
            <div v-for="trx in recentTransactions" :key="trx.id" 
              class="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-slate-900">{{ trx.id }}</p>
                  <p class="text-xs text-slate-500 font-medium">{{ trx.customer }} • {{ trx.items }} items</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-black text-slate-900">{{ trx.total }}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase">{{ trx.time }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-slate-900 p-8 rounded-[32px] text-white overflow-hidden relative">
          <div class="relative z-10">
            <h3 class="text-2xl font-black mb-2">POS is Ready</h3>
            <p class="text-slate-400 font-medium mb-6">Start processing new orders for {{ store.name }}</p>
            <NuxtLink to="/dashboard/pos" class="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold transition-all">
              <span>Launch Point of Sale</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </NuxtLink>
          </div>
          <div class="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
        </div>
      </div>

      <!-- Quick Actions / Right Column -->
      <div class="space-y-8">
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 class="text-xl font-bold text-slate-900 mb-6">Store Quick Actions</h3>
          <div class="grid grid-cols-2 gap-4">
            <button v-for="action in ['Add Product', 'New Order', 'View Stock', 'Customer']" :key="action"
              class="p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all text-center">
              <div class="w-8 h-8 bg-white rounded-lg shadow-sm mx-auto mb-2 flex items-center justify-center">✨</div>
              <span class="text-[10px] font-black uppercase tracking-wider">{{ action }}</span>
            </button>
          </div>
        </div>

        <div class="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
          <h3 class="text-lg font-bold text-indigo-900 mb-2">Help Center</h3>
          <p class="text-sm text-indigo-700/70 font-medium mb-4">Need help managing {{ store.name }}? Check our guides.</p>
          <button class="text-sm font-bold text-indigo-600 hover:underline">Read Documentation →</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="p-8 text-center">
    <div class="max-w-md mx-auto py-20">
      <h2 class="text-2xl font-black text-slate-900 mb-4">Store Not Found</h2>
      <NuxtLink to="/dashboard" class="text-indigo-600 font-bold hover:underline">Back to Overview</NuxtLink>
    </div>
  </div>
</template>
