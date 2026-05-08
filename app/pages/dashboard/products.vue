<script setup lang="ts">
import { useProducts, type Product } from '~/composables/useProducts'
import { useSettings } from '~/composables/useSettings'
import { compressAndUpload } from '~/utils/storage'

const { products, categories, addProduct, updateProduct, deleteProduct, addStock, stockMovements, addCategory, removeCategory, isLoading, stockIn } = useProducts()
const { settings } = useSettings()

definePageMeta({
  layout: 'dashboard',
  // middleware: [ 'feature-gate' ]
})

// --- State ---
const isModalOpen = ref(false)
const isStockModalOpen = ref(false)
const isMovementModalOpen = ref(false)
const isCategoryModalOpen = ref(false)
const isStockInModalOpen = ref(false) // New Modal
const isEditing = ref(false)
const isUploadingImage = ref(false)
const searchQuery = ref('')
const selectedCategoryFilter = ref('ทั้งหมด')
const showLowStockOnly = ref(false)
const newCategoryName = ref('')

const currentProduct = ref<Omit<Product, 'id'>>({
  name: '',
  category: 'อื่นๆ',
  price: 0,
  cost: 0,
  stock: 0,
  barcode: '',
  sku: '',
  image: '',
  minStockThreshold: 5
})
const editingId = ref<number | null>(null)

const stockAdjustment = ref(0)
const stockProductId = ref<number | null>(null)
const selectedProductForMovement = ref<Product | null>(null)

// --- Stock In Form State ---
const stockInForm = ref({
  productId: null as number | null,
  supplier: '',
  quantity: 1,
  costPrice: 0,
  note: ''
})
const isSubmittingStockIn = ref(false)

const selectedProductForStockIn = computed(() => {
  return products.value.find(p => p.id === stockInForm.value.productId)
})

watch(() => stockInForm.value.productId, (newId) => {
  if (newId) {
    const product = products.value.find(p => p.id === newId)
    if (product) {
      stockInForm.value.costPrice = product.cost || 0
    }
  }
})

// --- Computed Stats ---
const totalProducts = computed(() => products.value.length)
const totalStockValue = computed(() => products.value.reduce((sum, p) => sum + (p.stock * p.price), 0))
const lowStockCount = computed(() => products.value.filter(p => p.stock > 0 && p.stock <= (p.minStockThreshold || 5)).length)
const outOfStockCount = computed(() => products.value.filter(p => p.stock === 0).length)

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.barcode?.includes(searchQuery.value) ||
      p.sku?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategoryFilter.value === 'ทั้งหมด' || p.category === selectedCategoryFilter.value
    const matchesLowStock = !showLowStockOnly.value || p.stock <= (p.minStockThreshold || 5)
    return matchesSearch && matchesCategory && matchesLowStock
  })
})

const filteredMovements = computed(() => {
  if (!stockProductId.value) return []
  return stockMovements.value.filter(m => m.productId === stockProductId.value)
})

const getStockStatus = (product: Product) => {
  if (product.stock === 0) return { label: 'สินค้าหมด', class: 'bg-rose-50 text-rose-600 border-rose-100', dot: 'bg-rose-500' }
  if (product.stock <= (product.minStockThreshold || 5)) return { label: 'สต็อกต่ำ', class: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' }
  return { label: 'ปกติ', class: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' }
}

// --- Actions ---
const handleImageUpload = async (event: any) => {
  const file = event.target.files[ 0 ]
  if (file) {
    isUploadingImage.value = true
    try {
      const publicUrl = await compressAndUpload(file, 'products')
      if (publicUrl) {
        currentProduct.value.image = publicUrl
      } else {
        alert('อัปโหลดรูปภาพไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า Supabase')
      }
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
    } finally {
      isUploadingImage.value = false
    }
  }
}

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  currentProduct.value = {
    name: '',
    category: categories.value[ 0 ] || 'อื่นๆ',
    price: 0,
    cost: 0,
    stock: 0,
    barcode: '',
    sku: '',
    image: '',
    minStockThreshold: 5
  }
  isModalOpen.value = true
}

const openEditModal = (product: Product) => {
  isEditing.value = true
  editingId.value = product.id
  currentProduct.value = {
    name: product.name,
    category: product.category,
    price: product.price,
    cost: product.cost || 0,
    stock: product.stock,
    barcode: product.barcode || '',
    sku: product.sku || '',
    image: product.image || '',
    minStockThreshold: product.minStockThreshold || 5
  }
  isModalOpen.value = true
}

const isSaving = ref(false)

const saveProduct = async () => {
  if (isSaving.value) return
  
  if (!currentProduct.value.name || currentProduct.value.price <= 0) {
    alert('กรุณากรอกชื่อสินค้าและราคาให้ถูกต้อง')
    return
  }

  isSaving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await updateProduct(editingId.value, currentProduct.value)
    } else {
      await addProduct(currentProduct.value)
    }
    isModalOpen.value = false
    // Optional: add a success toast here
  } catch (err: any) {
    console.error(err)
    alert(err.statusMessage || 'เกิดข้อผิดพลาดในการบันทึกสินค้า')
  } finally {
    isSaving.value = false
  }
}

const handleDelete = (id: number) => {
  if (confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่? (ข้อมูลสต็อกและประวัติจะถูกลบไปด้วย)')) {
    deleteProduct(id)
  }
}

const openStockModal = (product: Product) => {
  stockProductId.value = product.id
  stockAdjustment.value = 0
  isStockModalOpen.value = true
}

const handleStockAdjustment = async () => {
  if (stockProductId.value && stockAdjustment.value !== 0) {
    await addStock(stockProductId.value, stockAdjustment.value, 'ปรับปรุงสต็อก (แผงควบคุม)')
    isStockModalOpen.value = false
  }
}

const openStockInModal = (productId: number | null = null) => {
  stockInForm.value = {
    productId: productId,
    supplier: '',
    quantity: 1,
    costPrice: 0,
    note: ''
  }
  isStockInModalOpen.value = true
}

const handleStockInSubmit = async () => {
  if (!stockInForm.value.productId || !stockInForm.value.supplier || stockInForm.value.quantity <= 0) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  isSubmittingStockIn.value = true
  try {
    await stockIn(
      stockInForm.value.productId,
      stockInForm.value.quantity,
      stockInForm.value.supplier,
      stockInForm.value.costPrice,
      stockInForm.value.note
    )
    isStockInModalOpen.value = false
    // Show simple toast or alert if needed, but the UI updates automatically via useProducts
  } catch (err) {
    console.error(err)
    alert('เกิดข้อผิดพลาดในการบันทึกรับสินค้า')
  } finally {
    isSubmittingStockIn.value = false
  }
}

const openMovementModal = (product: Product) => {
  stockProductId.value = product.id
  selectedProductForMovement.value = product
  isMovementModalOpen.value = true
}

const handleAddCategory = async () => {
  if (newCategoryName.value.trim()) {
    await addCategory(newCategoryName.value.trim())
    newCategoryName.value = ''
  }
}

const handleRemoveCategory = async (cat: string) => {
  if (confirm(`ยืนยันการลบหมวดหมู่ "${cat}"? สินค้าในหมวดนี้จะยังคงอยู่แต่หมวดหมู่จะหายไป`)) {
    await removeCategory(cat)
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: settings.value.currency || 'THB' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 lg:space-y-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
      <div>
        <h1 class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">คลังสินค้า (Inventory)</h1>
        <p class="text-slate-500 font-medium text-xs lg:text-sm mt-1">จัดการรายการสินค้า สต็อก และหมวดหมู่ทั้งหมด</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="isCategoryModalOpen = true"
          class="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          📁 หมวดหมู่
        </button>
        <button @click="openStockInModal()"
          class="px-5 py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-emerald-100 transition-all flex items-center gap-2">
          📥 รับเข้าสต็อก
        </button>
        <button @click="openAddModal"
          class="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <span>+ เพิ่มสินค้าใหม่</span>
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors cursor-pointer" @click="showLowStockOnly = false; selectedCategoryFilter = 'ทั้งหมด'">
         <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">สินค้าทั้งหมด</p>
         <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-slate-900">{{ totalProducts }}</p>
            <span class="text-[10px] font-bold text-slate-400 mb-1">รายการ</span>
         </div>
      </div>
      <div class="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl flex flex-col justify-between">
         <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 opacity-50">มูลค่าคลังสินค้า (ขาย)</p>
         <div class="flex items-end justify-between">
            <p class="text-2xl font-black text-indigo-400 truncate">{{ formatCurrency(totalStockValue) }}</p>
         </div>
      </div>
      <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-rose-200 transition-colors cursor-pointer" @click="showLowStockOnly = true">
         <p class="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">สินค้าหมด</p>
         <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-rose-600">{{ outOfStockCount }}</p>
            <span class="text-[10px] font-bold text-rose-400 mb-1">รายการ</span>
         </div>
      </div>
      <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-colors cursor-pointer" @click="showLowStockOnly = true">
         <p class="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">สต็อกต่ำ</p>
         <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-amber-600">{{ lowStockCount }}</p>
            <span class="text-[10px] font-bold text-amber-400 mb-1">รายการ</span>
         </div>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
      <div class="flex-1 relative">
        <span class="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input type="text" v-model="searchQuery" placeholder="ค้นหาชื่อสินค้า, บาร์โค้ด, SKU..."
          class="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium" />
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
        <button @click="showLowStockOnly = !showLowStockOnly"
          class="px-6 py-4 rounded-[2rem] font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 border shadow-sm"
          :class="showLowStockOnly ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'">
          ⚠️ สต็อกต่ำ
        </button>
        <select v-model="selectedCategoryFilter"
          class="px-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm focus:ring-2 focus:ring-indigo-500 appearance-none font-bold text-slate-700 outline-none cursor-pointer min-w-[160px]">
          <option value="ทั้งหมด">ทุกหมวดหมู่</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
    </div>

    <!-- Products List -->
    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left min-w-[1000px]">
          <thead>
            <tr class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th class="px-8 py-6">ข้อมูลสินค้า</th>
              <th class="px-8 py-6">หมวดหมู่</th>
              <th class="px-8 py-6">ราคา/ต้นทุน</th>
              <th class="px-8 py-6 text-center">คงเหลือ</th>
              <th class="px-8 py-6 text-center">สถานะ</th>
              <th class="px-8 py-6 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="product in filteredProducts" :key="product.id"
              class="hover:bg-slate-50/50 transition-colors group">
              <td class="px-8 py-6">
                <div class="flex items-center gap-5">
                  <div class="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-300 relative border border-slate-100">
                    <img v-if="product.image" :src="product.image" class="w-full h-full object-cover" />
                    <span v-else class="text-2xl">📦</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{{ product.name }}</p>
                    <div class="flex items-center gap-2 mt-1">
                       <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">SKU: {{ product.sku || '-' }}</span>
                       <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">BC: {{ product.barcode || '-' }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6">
                <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{{ product.category }}</span>
              </td>
              <td class="px-8 py-6">
                <p class="font-black text-slate-900 text-sm">{{ formatCurrency(product.price) }}</p>
                <p class="text-[10px] font-bold text-slate-400">ทุน: {{ formatCurrency(product.cost) }}</p>
              </td>
              <td class="px-8 py-6 text-center">
                <p class="text-xl font-black" :class="product.stock === 0 ? 'text-rose-600' : 'text-slate-900'">{{ product.stock }}</p>
                <p class="text-[10px] font-bold text-slate-400 uppercase">ชิ้น</p>
              </td>
              <td class="px-8 py-6 text-center">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase whitespace-nowrap"
                  :class="getStockStatus(product).class">
                  <div class="w-1.5 h-1.5 rounded-full" :class="getStockStatus(product).dot"></div>
                  {{ getStockStatus(product).label }}
                </div>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openMovementModal(product)"
                    class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="ประวัติสต็อก">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button @click="openStockInModal(product.id)"
                    class="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="รับสินค้าเข้า">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                    </svg>
                  </button>
                  <button @click="openStockModal(product)"
                    class="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="ปรับสต็อกด่วน">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                  <button @click="openEditModal(product)"
                    class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="แก้ไข">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.25 2.25 0 113.182 3.182L12.75 20.25 7.5 21.75l1.5-5.25L18.586 2.586z" />
                    </svg>
                  </button>
                  <button @click="handleDelete(product.id)"
                    class="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="ลบ">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0 && !isLoading">
              <td colspan="6" class="px-8 py-24 text-center text-slate-400">
                <div class="text-6xl mb-6 opacity-20">📦</div>
                <p class="font-black text-lg text-slate-300 uppercase tracking-widest">ไม่พบรายการสินค้าที่ต้องการ</p>
                <button @click="searchQuery = ''; selectedCategoryFilter = 'ทั้งหมด'; showLowStockOnly = false" class="mt-4 text-indigo-600 font-bold hover:underline">ล้างการค้นหา</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="p-24 flex flex-col items-center justify-center text-slate-400">
        <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="font-black uppercase tracking-widest text-[10px]">กำลังเข้าถึงคลังข้อมูล...</p>
      </div>
    </div>

    <!-- Product Modal (Add/Edit) -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 class="text-2xl font-black text-slate-900">{{ isEditing ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่' }}</h3>
            <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <form @submit.prevent="saveProduct" class="space-y-8">
              <div class="flex flex-col md:flex-row gap-10">
                <!-- Image Side -->
                <div class="w-full md:w-56 space-y-4">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">รูปภาพสินค้า</label>
                  <div class="relative w-full aspect-square bg-slate-50 rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group hover:bg-slate-100 hover:border-indigo-300 transition-all cursor-pointer">
                    <img v-if="currentProduct.image" :src="currentProduct.image" class="w-full h-full object-cover" />
                    <div v-else class="text-center p-6">
                      <span class="text-4xl block mb-2 opacity-50">📸</span>
                      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">เลือกรูปภาพ</span>
                    </div>
                    <div v-if="isUploadingImage" class="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                      <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">กำลังอัปโหลด...</span>
                    </div>
                    <input type="file" accept="image/*" @change="handleImageUpload" class="absolute inset-0 opacity-0 cursor-pointer" :disabled="isUploadingImage" />
                  </div>
                  <button v-if="currentProduct.image" type="button" @click="currentProduct.image = ''"
                    class="w-full py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all">ลบรูปภาพ</button>
                </div>

                <!-- Fields Side -->
                <div class="flex-1 space-y-8">
                  <div class="space-y-3">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อสินค้า</label>
                    <input type="text" v-model="currentProduct.name" required
                      class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      placeholder="เช่น ข้าวกะเพราไก่, เสื้อยืดสีขาว..." />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-3">
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">หมวดหมู่</label>
                      <select v-model="currentProduct.category"
                        class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 appearance-none outline-none cursor-pointer">
                        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                      </select>
                    </div>
                    <div class="space-y-3">
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">บาร์โค้ด / SKU</label>
                      <input type="text" v-model="currentProduct.barcode"
                        class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        placeholder="รหัสสินค้า..." />
                    </div>
                    <div class="space-y-3">
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ราคาขาย (฿)</label>
                      <input type="number" v-model="currentProduct.price" required step="0.01"
                        class="w-full px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-600 text-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div class="space-y-3">
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ต้นทุนสินค้า (฿)</label>
                      <input type="number" v-model="currentProduct.cost" required step="0.01"
                        class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div class="space-y-3">
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">จำนวนสต็อกตั้งต้น</label>
                      <input type="number" v-model="currentProduct.stock" :disabled="isEditing" required
                        class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50" />
                    </div>
                    <div class="space-y-3">
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">จุดแจ้งเตือนสต็อกต่ำ</label>
                      <input type="number" v-model="currentProduct.minStockThreshold" required
                        class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <button type="button" @click="isModalOpen = false"
                  class="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm transition-all hover:bg-slate-200">ยกเลิก</button>
                <button type="submit" :disabled="isUploadingImage || isSaving"
                  class="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  <span v-if="isSaving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {{ isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้าลงคลัง' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Stock In Modal -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="isStockInModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 class="text-2xl font-black text-slate-900">รับสินค้าเข้า (Stock In)</h3>
              <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">เพิ่มสต็อกและปรับปรุงต้นทุน</p>
            </div>
            <button @click="isStockInModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <form @submit.prevent="handleStockInSubmit" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Product Selection -->
                <div class="space-y-3">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">เลือกสินค้า</label>
                  <select v-model="stockInForm.productId" required
                    class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 appearance-none font-bold text-sm outline-none">
                    <option :value="null" disabled>— เลือกสินค้า —</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} (คงเหลือ: {{ p.stock }})</option>
                  </select>
                  
                  <div v-if="selectedProductForStockIn" class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                     <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-indigo-100">
                        <img v-if="selectedProductForStockIn.image" :src="selectedProductForStockIn.image" class="w-full h-full object-cover" />
                        <span v-else class="text-xl">📦</span>
                     </div>
                     <div class="min-w-0">
                        <p class="font-black text-indigo-900 text-xs truncate">{{ selectedProductForStockIn.name }}</p>
                        <p class="text-[9px] font-bold text-indigo-400 uppercase">ทุนเดิม: {{ formatCurrency(selectedProductForStockIn.cost) }}</p>
                     </div>
                  </div>
                </div>

                <!-- Supplier -->
                <div class="space-y-3">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ผู้จำหน่าย (Supplier)</label>
                  <input type="text" v-model="stockInForm.supplier" required placeholder="ชื่อบริษัท/ผู้ผลิต"
                    class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm outline-none" />
                </div>

                <!-- Quantity -->
                <div class="space-y-3">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">จำนวนที่รับเข้า</label>
                  <div class="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                    <button type="button" @click="stockInForm.quantity = Math.max(1, stockInForm.quantity - 1)" 
                      class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black hover:bg-slate-100 transition-all">-</button>
                    <input type="number" v-model="stockInForm.quantity" required min="1"
                      class="flex-1 bg-transparent text-center font-black text-xl outline-none" />
                    <button type="button" @click="stockInForm.quantity++" 
                      class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black hover:bg-slate-100 transition-all">+</button>
                  </div>
                </div>

                <!-- Cost Price -->
                <div class="space-y-3">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ต้นทุนใหม่/หน่วย (฿)</label>
                  <input type="number" v-model="stockInForm.costPrice" required step="0.01"
                    class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-xl outline-none" />
                </div>
              </div>

              <!-- Note -->
              <div class="space-y-3">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">หมายเหตุ</label>
                <textarea v-model="stockInForm.note" rows="2" placeholder="รายละเอียดเพิ่มเติม..."
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none"></textarea>
              </div>

              <!-- Summary -->
              <div v-if="selectedProductForStockIn" class="p-6 bg-slate-900 rounded-[2rem] text-white flex justify-between items-end shadow-xl">
                 <div>
                    <p class="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">ยอดรวมต้นทุน</p>
                    <p class="text-3xl font-black text-indigo-400">{{ formatCurrency(stockInForm.quantity * stockInForm.costPrice) }}</p>
                 </div>
                 <div class="text-right">
                    <p class="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">สต็อกใหม่จะเป็น</p>
                    <p class="text-xl font-black">{{ selectedProductForStockIn.stock + stockInForm.quantity }} ชิ้น</p>
                 </div>
              </div>

              <div class="pt-4 flex gap-4">
                <button type="button" @click="isStockInModalOpen = false"
                  class="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm">ยกเลิก</button>
                <button type="submit" :disabled="isSubmittingStockIn"
                  class="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-2">
                  <span v-if="isSubmittingStockIn" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ยืนยันบันทึกรับสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Category Management Modal -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-4" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
      <div v-if="isCategoryModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
          <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 class="text-xl font-black text-slate-900">จัดการหมวดหมู่</h3>
            <button @click="isCategoryModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-8 space-y-6">
            <div class="flex gap-2">
              <input type="text" v-model="newCategoryName" @keyup.enter="handleAddCategory"
                placeholder="ชื่อหมวดหมู่ใหม่..."
                class="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              <button @click="handleAddCategory" class="px-6 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100">เพิ่ม</button>
            </div>
            <div class="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-2">
              <div v-for="cat in categories" :key="cat"
                class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-indigo-100 transition-all">
                <span class="font-bold text-slate-700">{{ cat }}</span>
                <button @click="handleRemoveCategory(cat)" class="text-rose-300 hover:text-rose-600 transition-colors p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div class="p-8 bg-slate-50 border-t border-slate-100">
            <button @click="isCategoryModalOpen = false"
              class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm">เรียบร้อย</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Stock Adjustment Modal -->
    <div v-if="isStockModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="p-8 border-b border-slate-100 bg-slate-50/50">
          <h3 class="text-xl font-black text-slate-900">ปรับสต็อกสินค้า</h3>
          <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">QUICK ADJUSTMENT</p>
        </div>
        <div class="p-10 space-y-8">
          <div class="flex items-center justify-center gap-8">
            <button @click="stockAdjustment--"
              class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-slate-200 transition-colors">-</button>
            <input type="number" v-model="stockAdjustment"
              class="w-24 text-center text-4xl font-black bg-transparent outline-none text-indigo-600" />
            <button @click="stockAdjustment++"
              class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-slate-200 transition-colors">+</button>
          </div>
          <div class="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
             <p class="text-[10px] font-black text-amber-600 uppercase tracking-widest">คำแนะนำ</p>
             <p class="text-xs font-bold text-amber-700 mt-1">ใส่ค่าบวก (+) เพื่อรับเข้าสต็อก<br>ใส่ค่าลบ (-) เพื่อหักออก</p>
          </div>
        </div>
        <div class="p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
          <button @click="isStockModalOpen = false"
            class="py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">ยกเลิก</button>
          <button @click="handleStockAdjustment"
            class="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all">ยืนยันการปรับ</button>
        </div>
      </div>
    </div>

    <!-- Movement History Modal -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-x-10" enter-to-class="opacity-100 translate-x-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-x-0" leave-to-class="opacity-0 translate-x-10">
      <div v-if="isMovementModalOpen" class="fixed inset-0 z-50 flex items-center justify-end p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col h-full max-h-[90vh]">
          <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 class="text-xl font-black text-slate-900">ประวัติความเคลื่อนไหว</h3>
              <p class="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">{{ selectedProductForMovement?.name }}</p>
            </div>
            <button @click="isMovementModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
            <div v-for="m in filteredMovements" :key="m.id"
              class="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-all">
              <div class="flex items-center gap-5">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm"
                  :class="m.type === 'In' || m.type === 'Adjustment' && m.quantity > 0 ? 'bg-emerald-100 text-emerald-600' : m.type === 'Sale' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'">
                  {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase" 
                      :class="m.type === 'In' ? 'bg-emerald-500 text-white' : m.type === 'Sale' ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'">
                      {{ m.type === 'In' ? 'รับเข้า' : m.type === 'Sale' ? 'ขายออก' : m.type === 'Out' ? 'หักออก' : 'ปรับปรุง' }}
                    </span>
                    <p class="font-bold text-slate-900 text-sm mb-0.5">{{ m.note || 'ปรับปรุงสต็อก' }}</p>
                  </div>
                  <p class="text-[10px] text-slate-400 font-bold uppercase">{{ formatDate(m.timestamp) }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">คงเหลือ</p>
                <p class="font-black text-slate-900 text-lg">{{ m.newStock }}</p>
              </div>
            </div>
            <div v-if="filteredMovements.length === 0" class="h-full flex flex-col items-center justify-center py-20 opacity-30">
              <p class="text-5xl mb-4">📜</p>
              <p class="font-black text-sm uppercase tracking-widest">ยังไม่มีประวัติการเคลื่อนไหว</p>
            </div>
          </div>
          <div class="p-8 bg-slate-50 border-t border-slate-100">
             <button @click="isMovementModalOpen = false" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm">ปิดหน้านี้</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
