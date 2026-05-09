<template>
  <div class="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
    <!-- Sidebar (Desktop) -->
    <aside class="w-64 lg:w-72 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col hidden lg:flex">
      <!-- Sidebar Header / Logo -->
      <div class="h-20 flex items-center px-8 border-b border-slate-800">
        <NuxtLink to="/dashboard" class="flex items-center space-x-2 group">
          <div
            class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 leading-none">
            <span class="font-black text-sm italic">V</span>
          </div>
          <span class="text-xl font-bold tracking-tight text-white uppercase italic">Vendora<span
              class="text-indigo-500">.</span></span>
        </NuxtLink>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 py-8 px-4 space-y-2 overflow-y-auto font-medium custom-scrollbar">
        <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
          class="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all"
          :class="[ $route.path === link.to ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white text-slate-400' ]">
          <component :is="link.icon" class="h-5 w-5 flex-shrink-0" />
          <span class="text-sm truncate">{{ link.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-slate-800">
        <div class="bg-slate-800/50 rounded-2xl p-4 flex flex-col space-y-3 text-left">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
              {{ user?.name?.substring(0, 2) || 'US' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-white truncate">{{ user?.name || 'User' }}</p>
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{{ user?.role || 'Staff' }}</p>
            </div>
          </div>
          <button @click="logout" class="w-full py-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Sidebar & Backdrop -->
    <div class="lg:hidden">
      <Transition enter-active-class="transition-opacity ease-linear duration-300" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition-opacity ease-linear duration-300"
        leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="isMobileMenuOpen" @click="isMobileMenuOpen = false"
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]"></div>
      </Transition>

      <Transition enter-active-class="transition ease-in-out duration-300 transform"
        enter-from-class="-translate-x-full" enter-to-class="translate-x-0"
        leave-active-class="transition ease-in-out duration-300 transform" leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full">
        <aside v-if="isMobileMenuOpen"
          class="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 flex flex-col z-[100] shadow-2xl">
          <div class="h-20 flex items-center justify-between px-8 border-b border-slate-800">
            <NuxtLink to="/dashboard" class="flex items-center space-x-2" @click="isMobileMenuOpen = false">
              <div
                class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic">V
              </div>
              <span class="text-xl font-bold text-white tracking-tight uppercase italic">Vendora.</span>
            </NuxtLink>
            <button @click="isMobileMenuOpen = false" class="p-2 text-slate-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav class="flex-1 py-8 px-4 space-y-2 overflow-y-auto font-medium">
            <NuxtLink @click="isMobileMenuOpen = false" v-for="link in navLinks" :key="link.to" :to="link.to"
              class="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all"
              :class="[ $route.path === link.to ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400' ]">
              <component :is="link.icon" class="h-5 w-5 flex-shrink-0" />
              <span class="text-sm">{{ link.label }}</span>
            </NuxtLink>
          </nav>
          <div class="p-4 border-t border-slate-800">
            <div class="bg-slate-800/50 rounded-2xl p-4 flex flex-col space-y-3 text-left">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {{ user?.name?.substring(0, 2) || 'US' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-white truncate">{{ user?.name || 'User' }}</p>
                  <p class="text-[10px] text-slate-500 font-bold uppercase">{{ user?.role || 'Staff' }}</p>
                </div>
              </div>
              <button @click="logout" class="w-full py-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
      <!-- Top Header -->
      <header
        class="h-16 lg:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 z-40">
        <div class="flex items-center space-x-4">
          <button @click="isMobileMenuOpen = true"
            class="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div class="hidden sm:block relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input type="text" placeholder="ค้นหา..."
              class="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 md:w-64 lg:w-80 transition-all" />
          </div>

          <!-- Mobile Title -->
          <span class="lg:hidden font-black text-slate-900 tracking-tight text-lg uppercase italic">Vendora<span
              class="text-indigo-500">.</span></span>
        </div>

        <div class="flex items-center space-x-2 sm:space-x-4">
          <button
            class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <div class="flex items-center space-x-3 ml-2">
            <div class="hidden md:block text-right">
              <p class="text-xs font-bold text-slate-900">{{ user?.name }}</p>
              <p class="text-[10px] text-slate-500 font-medium">{{ user?.role }}</p>
            </div>
            <div
              class="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs lg:text-sm font-bold shadow-lg shadow-indigo-200">
              {{ user?.name?.substring(0, 2) || 'US' }}</div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h, computed, onMounted } from 'vue'
import { useFeatures } from '~/composables/useFeatures'
import { useAuth } from '~/composables/useAuth'

const isMobileMenuOpen = ref(false)
const route = useRoute()
const { features } = useFeatures()
const { user, isAdmin, initAuth, logout } = useAuth()

onMounted(() => {
  initAuth()
})

// Dynamic Head Title
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Vendora` : 'Vendora - ระบบจัดการร้านค้า'
  }
})

const IconOverview = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [ h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }) ])
const IconPOS = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [ h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' }) ])
const IconOrders = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [ h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' }) ])
const IconInventory = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [ h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' }) ])
const IconCustomers = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [ h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }) ])
const IconStaff = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [ h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }) ])
const IconReports = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [ h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }) ])
const IconSettings = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [ h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }), h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' }) ])
const IconDev = () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [ h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' }) ])

const navLinks = computed(() => {
  const links = [
    { to: '/dashboard', label: 'ภาพรวม', icon: IconOverview },
    { to: '/dashboard/pos', label: 'ระบบขายหน้าร้าน', icon: IconPOS, feature: 'enablePOS' },
    { to: '/dashboard/orders', label: 'ประวัติคำสั่งซื้อ', icon: IconOrders, feature: 'enableOrders' },
    { to: '/dashboard/products', label: 'คลังสินค้า', icon: IconInventory, feature: 'enableProducts' },
    { to: '/dashboard/stock-in', label: 'รับสินค้าเข้า (Stock In)', icon: IconInventory, feature: 'enableProducts' },
    { to: '/dashboard/customers', label: 'ลูกค้า', icon: IconCustomers, feature: 'enableCustomers' },
    { to: '/dashboard/staff', label: 'การจัดการพนักงาน', icon: IconStaff, feature: 'enableStaff' },
    { to: '/dashboard/reports', label: 'รายงาน', icon: IconReports, feature: 'enableReports' },
    { to: '/dashboard/settings', label: 'การตั้งค่า', icon: IconSettings, feature: 'enableSettings' },
    { to: '/dashboard/dev', label: 'Dev Management', icon: IconDev },
  ]

  return links.filter(link => {
    // Only check Feature Flag
    if (link.feature && !(features.value as any)[ link.feature ]) return false
    return true
  })
})
</script>
