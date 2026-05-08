<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
    <div class="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-50"></div>

    <div class="max-w-md w-full z-10">
      <div class="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 p-10 border border-slate-100">
        <div class="text-center mb-10">
          <NuxtLink to="/" class="inline-flex items-center space-x-2 mb-8 group">
            <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg group-hover:bg-indigo-700 transition-colors">
              <span class="font-black text-xl italic leading-none">P</span>
            </div>
            <span class="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">POS.</span>
          </NuxtLink>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">สร้างบัญชี</h2>
          <p class="mt-3 text-slate-500 font-medium">เข้าร่วมกับเราเพื่อเริ่มจัดการธุรกิจของคุณ</p>
        </div>

        <form class="space-y-5" @submit.prevent="handleRegister">
          <div>
            <label for="name" class="block text-sm font-bold text-slate-700 mb-2">ชื่อ-นามสกุล</label>
            <input id="name" type="text" required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="สมชาย ใจดี" v-model="name" />
          </div>

          <div>
            <label for="email" class="block text-sm font-bold text-slate-700 mb-2">ที่อยู่อีเมล</label>
            <input id="email" type="email" required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="name@company.com" v-model="email" />
          </div>

          <div>
            <label for="password" class="block text-sm font-bold text-slate-700 mb-2">รหัสผ่าน</label>
            <input id="password" type="password" required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="••••••••" v-model="password" />
          </div>

          <div class="pt-2">
            <button type="submit"
              class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all">
              สร้างบัญชีของฉัน
            </button>
          </div>
        </form>

        <p class="mt-10 text-center text-sm font-medium text-slate-500">
          มีบัญชีอยู่แล้วใช่ไหม?
          <NuxtLink to="/login" class="text-indigo-600 font-bold hover:text-indigo-700 underline underline-offset-4">
            เข้าสู่ระบบแทน
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const name = ref('')
const email = ref('')
const password = ref('')

const handleRegister = () => {
  console.log('Registration attempt:', { name: name.value, email: email.value, password: password.value })
}
</script>

