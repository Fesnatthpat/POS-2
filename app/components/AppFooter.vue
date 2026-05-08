<template>
    <footer class="bg-slate-900 text-slate-300 py-16">
        <div class="container mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div class="col-span-1 md:col-span-1">
                    <NuxtLink to="/" class="flex items-center space-x-2 mb-6 group">
                        <div
                            class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg leading-none">
                            <span class="font-black text-sm italic">V</span>
                        </div>
                        <span class="text-xl font-bold tracking-tight text-white italic">Vendora.</span>
                    </NuxtLink>
                    <p class="text-sm leading-relaxed text-slate-400">
                        ทำให้การจัดการธุรกิจเป็นเรื่องง่าย มีประสิทธิภาพ และเข้าถึงได้สำหรับทุกคน
                    </p>
                </div>

                <div>
                    <h4 class="text-white font-bold mb-6">ผลิตภัณฑ์</h4>
                    <ul class="space-y-4 text-sm">
                        <li><a href="#" class="hover:text-indigo-400 transition-colors">คุณสมบัติ</a></li>
                        <li><a href="#" class="hover:text-indigo-400 transition-colors">การเชื่อมต่อ</a></li>
                        <li><a href="#" class="hover:text-indigo-400 transition-colors">ราคา</a></li>
                        <li><a href="#" class="hover:text-indigo-400 transition-colors">บันทึกการเปลี่ยนแปลง</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="text-white font-bold mb-6">บริษัท</h4>
                    <ul class="space-y-4 text-sm">
                        <li><a href="#" class="hover:text-indigo-400 transition-colors">เกี่ยวกับเรา</a></li>
                        <li><a href="#" class="hover:text-indigo-400 transition-colors">ร่วมงานกับเรา</a></li>
                        <li><a href="#" class="hover:text-indigo-400 transition-colors">ติดต่อเรา</a></li>
                        <li><a href="#" class="hover:text-indigo-400 transition-colors">ความเป็นส่วนตัว</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="text-white font-bold mb-6">จดหมายข่าว</h4>
                    <p class="text-sm text-slate-400 mb-4">ติดตามข่าวสารและเทรนด์ POS ล่าสุด</p>
                    <div class="flex">
                        <input type="email" placeholder="อีเมลของคุณ"
                            class="bg-slate-800 border-none rounded-l-lg px-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 w-full" />
                        <button
                            class="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-r-lg text-white transition-colors">
                            ไป
                        </button>
                    </div>
                </div>
            </div>

            <div
                class="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
                <p>© 2026 ระบบ Vendora POS สงวนลิขสิทธิ์ทั้งหมด</p>
                <div class="flex space-x-6 mt-4 md:mt-0">
                    <a href="#" class="hover:text-white transition-colors">Twitter</a>
                    <a href="#" class="hover:text-white transition-colors">LinkedIn</a>
                    <a href="#" class="hover:text-white transition-colors">GitHub</a>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
</script>