<template>
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div class="container mx-auto px-6 h-16 flex justify-between items-center">
            <NuxtLink to="/" class="flex items-center space-x-2 group">
                <div
                    class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg group-hover:bg-indigo-700 transition-colors">
                    <span class="font-black text-xl italic leading-none">V</span>
                </div>
                <span
                    class="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">VENDORA<span
                        class="text-indigo-600">.</span></span>
            </NuxtLink>

            <div class="hidden md:flex items-center space-x-8">
                <NuxtLink to="/" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    โซลูชัน</NuxtLink>
                <NuxtLink to="/" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    ราคา</NuxtLink>
                <NuxtLink to="/" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    เกี่ยวกับเรา</NuxtLink>
            </div>

            <div class="flex items-center space-x-4">
                <NuxtLink to="/login"
                    class="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-4 py-2 transition-colors">เข้าสู่ระบบ</NuxtLink>
                <NuxtLink to="/register"
                    class="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
                    เริ่มใช้งานฟรี
                </NuxtLink>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
</script>