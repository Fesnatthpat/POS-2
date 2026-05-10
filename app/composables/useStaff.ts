import { ref, onMounted } from 'vue'

export interface Staff {
  id: number
  name: string
  username: string
  password?: string
  role: string
  joinDate: string
  status: string
}

export const useStaff = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl

  const staffMembers = ref<Staff[]>([])
  const isLoading = ref(false)

  const loadStaff = async () => {
    isLoading.value = true
    try {
      staffMembers.value = await $fetch<Staff[]>(`${apiBase}/staff`)
    } catch (err) {
      console.error('Failed to load staff:', err)
    } finally {
      isLoading.value = false
    }
  }

  const addStaff = async (staff: any) => {
    try {
      await $fetch(`${apiBase}/staff`, { method: 'POST', body: staff })
      await loadStaff()
    } catch (err) {
      console.error('Failed to add staff:', err)
    }
  }

  const updateStaff = async (id: number, updates: Partial<Staff>) => {
    try {
      await $fetch(`${apiBase}/staff/${id}`, { method: 'PUT', body: updates })
      await loadStaff()
    } catch (err) {
      console.error('Failed to update staff:', err)
    }
  }

  const deleteStaff = async (id: number) => {
    try {
      await $fetch(`${apiBase}/staff/${id}`, { method: 'DELETE' })
      await loadStaff()
    } catch (err) {
      console.error('Failed to delete staff:', err)
    }
  }

  onMounted(() => {
    loadStaff()
  })

  return {
    staffMembers,
    isLoading,
    addStaff,
    updateStaff,
    deleteStaff,
    refresh: loadStaff
  }
}
