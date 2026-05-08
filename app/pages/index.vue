<template>
    <div class="bg-white min-h-screen">
        <!-- Hero Section -->
        <section class="relative overflow-hidden pt-16 pb-32">
            <div
                class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-50/50 rounded-[100%] blur-3xl -z-10">
            </div>

            <div class="container mx-auto px-6">
                <div class="text-center max-w-4xl mx-auto">
                    <span
                        class="inline-block py-1 px-4 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold tracking-widest uppercase mb-6">
                        ทุกสิ่งที่คุณต้องการเพื่อการขาย
                    </span>
                    <h1 class="text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
                        ยกระดับธุรกิจของคุณด้วย <span
                            class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Smart
                            POS</span>
                    </h1>
                    <p class="text-xl text-slate-600 leading-relaxed mb-12 max-w-2xl mx-auto">
                        จัดการคลังสินค้า ติดตามยอดขาย และทำให้ธุรกิจของคุณเติบโตด้วยระบบจัดการหน้าร้านแบบครบวงจร
                        ออกแบบมาเพื่อร้านค้าปลีกและร้านอาหารสมัยใหม่
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <NuxtLink to="/register"
                            class="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
                            เริ่มทดลองใช้ฟรี
                        </NuxtLink>
                        <NuxtLink to="/login"
                            class="w-full sm:w-auto px-10 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                            ดูตัวอย่างการใช้งาน
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="py-24 bg-slate-50">
            <div class="container mx-auto px-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div
                        class="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
                        <div
                            class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <span class="text-2xl font-bold">01</span>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 mb-4">การจัดการคลังสินค้า</h3>
                        <p class="text-slate-600 leading-relaxed">
                            ติดตามระดับสต็อกแบบเรียลไทม์ ตั้งค่าการแจ้งเตือนเมื่อสินค้าใกล้หมด และจัดการซัพพลายเออร์ได้อย่างง่ายดาย
                        </p>
                    </div>
                    <div
                        class="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
                        <div
                            class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <span class="text-2xl font-bold">02</span>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 mb-4">การวิเคราะห์ยอดขาย</h3>
                        <p class="text-slate-600 leading-relaxed">
                            รับข้อมูลเชิงลึกเกี่ยวกับประสิทธิภาพการขายของคุณด้วยรายงานที่สวยงามและอ่านง่าย
                        </p>
                    </div>
                    <div
                        class="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
                        <div
                            class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <span class="text-2xl font-bold">03</span>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 mb-4">การซิงค์ข้อมูลบนคลาวด์</h3>
                        <p class="text-slate-600 leading-relaxed">
                            เข้าถึงข้อมูลธุรกิจของคุณได้จากทุกที่ ทุกอุปกรณ์ ข้อมูลของคุณปลอดภัยเสมอ
                        </p>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
</script>