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
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl

  const products = ref<Product[]>([])
  const categories = ref<string[]>([])
  const stockMovements = ref<StockMovement[]>([])
  const isLoading = ref(false)

  const loadProducts = async () => {
    isLoading.value = true
    try {
      const data = await $fetch<Product[]>(`${apiBase}/products`)
      products.value = data
      
      // Extract categories from products if not provided separately
      const cats = new Set(data.map(p => p.category))
      categories.value = Array.from(cats)
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadProductById = async (id: number) => {
    try {
      return await $fetch<Product>(`${apiBase}/product/${id}`)
    } catch (err) {
      console.error(`Failed to load product ${id}:`, err)
      return null
    }
  }

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const result = await $fetch<Product>(`${apiBase}/product`, { method: 'POST', body: product })
      await loadProducts()
      return result
    } catch (err) {
      console.error('Failed to add product:', err)
      throw err
    }
  }

  const updateProduct = async (id: number, updates: Partial<Product>) => {
    try {
      // The user didn't specify a PUT endpoint, but let's assume it's /api/product/:id
      const result = await $fetch<Product>(`${apiBase}/product/${id}`, { method: 'PUT', body: updates })
      await loadProducts()
      return result
    } catch (err) {
      console.error('Failed to update product:', err)
      throw err
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      await $fetch(`${apiBase}/product/${id}`, { method: 'DELETE' })
      await loadProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
    }
  }

  const addCategory = async (name: string) => {
    try {
      await $fetch(`${apiBase}/categories`, { method: 'POST', body: { name } })
      await loadProducts()
    } catch (err) {
      console.error('Failed to add category:', err)
    }
  }

  const removeCategory = async (name: string) => {
    try {
      // Note: This assumes the external API supports categories at this endpoint
      const cats = await $fetch<any[]>(`${apiBase}/categories`)
      const cat = cats.find(c => c.name === name)
      if (cat) {
        await $fetch(`${apiBase}/categories/${cat.id}`, { method: 'DELETE' })
        await loadProducts()
      }
    } catch (err) {
      console.error('Failed to remove category:', err)
    }
  }

  const addStock = async (productId: number, quantity: number, note: string = 'เติมสต็อกสินค้า', supplier?: string, newCost?: number) => {
    // In DB mode, we update the product directly
    const product = products.value.find(p => p.id === productId)
    if (product) {
      const updates: any = { 
        stock: product.stock + quantity,
        note,
        supplier
      }
      if (newCost !== undefined) updates.cost = newCost
      
      await updateProduct(productId, updates)
    }
  }

  const stockIn = (productId: number, quantity: number, supplier: string, cost: number, note: string = '') => {
    addStock(productId, quantity, note || `รับสินค้าจาก ${supplier}`, supplier, cost)
  }

  onMounted(() => {
    loadProducts()
  })

  return {
    products,
    categories,
    stockMovements,
    isLoading,
    loadProductById,
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
