import { ref, onMounted } from 'vue'

export interface Product {
  id: number
  name: string
  category: string
  price: number
  cost: number
  stock: number
  barcode?: string
  sku?: string
  image?: string
  minStockThreshold?: number
}

export interface StockMovement {
  id: number
  productId: number
  productName: string
  type: 'In' | 'Out' | 'Sale' | 'Adjustment'
  quantity: number
  previousStock: number
  newStock: number
  timestamp: string
  note?: string
  supplier?: string
  costAtTime?: number
}

export const useProducts = () => {

  const products = ref<Product[]>([])
  const categories = ref<string[]>([])
  const stockMovements = ref<StockMovement[]>([])
  const isLoading = ref(false)

  // =========================
  // LOAD DATA
  // =========================
  const loadProducts = async () => {

    isLoading.value = true

    try {

      const [
        productsData,
        categoriesData,
        movementsData
      ] = await Promise.allSettled([

        $fetch<Product[]>('/api/products'),

        $fetch<any[]>('/api/categories'),

        $fetch<StockMovement[]>('/api/stock-movements')

      ])

      // Products
      if (productsData.status === 'fulfilled') {

        products.value = productsData.value || []

      } else {

        console.error('LOAD PRODUCTS ERROR:', productsData.reason)
      }

      // Categories
      if (categoriesData.status === 'fulfilled') {

        categories.value = categoriesData.value.map(c => c.name)

      } else {

        console.error('LOAD CATEGORIES ERROR:', categoriesData.reason)
      }

      // Movements
      if (movementsData.status === 'fulfilled') {

        stockMovements.value = movementsData.value || []

      } else {

        console.error('LOAD MOVEMENTS ERROR:', movementsData.reason)
      }

    } catch (err) {

      console.error('LOAD DATA ERROR:', err)

    } finally {

      isLoading.value = false
    }
  }

  // =========================
  // ADD PRODUCT
  // =========================
  const addProduct = async (product: Omit<Product, 'id'>) => {

    try {

      console.log('ADDING PRODUCT:', product)

      const result = await $fetch<Product>('/api/products', {

        method: 'POST',

        body: product

      })

      console.log('ADD PRODUCT SUCCESS:', result)

      await loadProducts()

      return result

    } catch (err: any) {

      console.error('ADD PRODUCT ERROR:', err)

      // แสดง error จริงจาก server
      const message =
        err?.data?.statusMessage ||
        err?.data?.message ||
        err?.message ||
        'Failed to add product'

      throw new Error(message)
    }
  }

  // =========================
  // UPDATE PRODUCT
  // =========================
  const updateProduct = async (
    id: number,
    updates: Partial<Product>
  ) => {

    try {

      const result = await $fetch<Product>('/api/products', {

        method: 'PUT',

        body: {
          id,
          ...updates
        }

      })

      await loadProducts()

      return result

    } catch (err: any) {

      console.error('UPDATE PRODUCT ERROR:', err)

      throw err
    }
  }

  // =========================
  // DELETE PRODUCT
  // =========================
  const deleteProduct = async (id: number) => {

    try {

      await $fetch('/api/products', {

        method: 'DELETE',

        query: { id }

      })

      await loadProducts()

    } catch (err) {

      console.error('DELETE PRODUCT ERROR:', err)
    }
  }

  // =========================
  // CATEGORY
  // =========================
  const addCategory = async (name: string) => {

    try {

      await $fetch('/api/categories', {

        method: 'POST',

        body: { name }

      })

      await loadProducts()

    } catch (err) {

      console.error('ADD CATEGORY ERROR:', err)
    }
  }

  const removeCategory = async (name: string) => {

    try {

      const cats = await $fetch<any[]>('/api/categories')

      const cat = cats.find(c => c.name === name)

      if (!cat) return

      await $fetch('/api/categories', {

        method: 'DELETE',

        query: {
          id: cat.id
        }

      })

      await loadProducts()

    } catch (err) {

      console.error('REMOVE CATEGORY ERROR:', err)
    }
  }

  // =========================
  // STOCK
  // =========================
  const addStock = async (
    productId: number,
    quantity: number,
    note: string = 'เติมสต็อกสินค้า',
    supplier?: string,
    newCost?: number
  ) => {

    const product = products.value.find(
      p => p.id === productId
    )

    if (!product) {

      throw new Error('ไม่พบสินค้า')
    }

    const updates: any = {

      stock: product.stock + quantity,

      note,

      supplier
    }

    if (newCost !== undefined) {

      updates.cost = newCost
    }

    await updateProduct(productId, updates)
  }

  const stockIn = async (
    productId: number,
    quantity: number,
    supplier: string,
    cost: number,
    note: string = ''
  ) => {

    await addStock(

      productId,

      quantity,

      note || `รับสินค้าจาก ${supplier}`,

      supplier,

      cost
    )
  }

  onMounted(() => {

    loadProducts()
  })

  return {

    products,

    categories,

    stockMovements,

    isLoading,

    addProduct,

    updateProduct,

    deleteProduct,

    addCategory,

    removeCategory,

    addStock,

    stockIn,

    refresh: loadProducts
  }
}