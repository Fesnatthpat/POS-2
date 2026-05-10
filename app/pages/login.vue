<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
    <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-50"></div>

    <div class="max-w-md w-full z-10">
      <div class="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 p-10 border border-slate-100">
        <div class="text-center mb-10">
          <NuxtLink to="/" class="inline-flex items-center space-x-2 mb-8 group">
            <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg group-hover:bg-indigo-700 transition-colors">
              <span class="font-black text-xl italic leading-none">P</span>
            </div>
            <span class="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">POS.</span>
          </NuxtLink>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">ยินดีต้อนรับกลับมา</h2>
          <p class="mt-3 text-slate-500 font-medium">กรุณากรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ</p>
        </div>

        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center">
          <span class="mr-2">⚠️</span> {{ error }}
        </div>

        <div v-if="successMsg" class="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium flex items-center">
          <span class="mr-2">✅</span> {{ successMsg }}
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="username" class="block text-sm font-bold text-slate-700 mb-2">ชื่อผู้ใช้งาน</label>
            <input id="username" type="text" required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="admin" v-model="username" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="text-sm font-bold text-slate-700">รหัสผ่าน</label>
              <a href="#" class="text-xs font-bold text-indigo-600 hover:text-indigo-700">ลืมรหัสผ่าน?</a>
            </div>
            <input id="password" type="password" required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="••••••••" v-model="password" />
          </div>

          <div class="flex items-center">
            <input id="remember" type="checkbox"
              class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
            <label for="remember" class="ml-2 block text-sm font-medium text-slate-600">
              จดจำการเข้าสู่ระบบเป็นเวลา 30 วัน
            </label>
          </div>

          <button type="submit" :disabled="loading"
            class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังเข้าสู่ระบบ...
            </span>
            <span v-else>เข้าสู่ระบบ</span>
          </button>
        </form>

        <p class="mt-10 text-center text-sm font-medium text-slate-500">
          ยังไม่มีบัญชีใช่ไหม?
          <NuxtLink to="/register" class="text-indigo-600 font-bold hover:text-indigo-700 underline underline-offset-4">
            สร้างบัญชีใหม่
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const username = ref('')
const password = ref('')
const successMsg = ref('')
const { login, loading, error } = useAuth()

const handleLogin = async () => {
  successMsg.value = ''
  const success = await login(username.value, password.value)
  if (success) {
    successMsg.value = 'เข้าสู่ระบบสำเร็จ! กำลังนำคุณไปที่หน้าหลัก...'
    // ใช้ window.location.href เพื่อความแน่นอนในการโหลดสถานะใหม่
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 500)
  }
}
</script>


