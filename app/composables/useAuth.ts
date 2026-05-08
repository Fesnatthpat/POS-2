import { useState } from '#app'

export interface User {
  id: number
  name: string
  role: 'Admin' | 'Cashier'
}

export const useAuth = () => {
  // Simulate current user - in a real app, this would come from an API/Token
  const user = useState<User | null>('user', () => null)

  const login = (role: 'Admin' | 'Cashier' = 'Admin') => {
    user.value = {
      id: 1,
      name: role === 'Admin' ? 'ผู้ดูแลระบบ' : 'พนักงานขาย',
      role: role
    }
    if (process.client) {
      localStorage.setItem('pos_user_role', role)
    }
  }

  const logout = () => {
    user.value = null
    if (process.client) {
      localStorage.removeItem('pos_user_role')
    }
    navigateTo('/login')
  }

  const initAuth = () => {
    if (process.client) {
      const savedRole = localStorage.getItem('pos_user_role') as 'Admin' | 'Cashier' | null
      if (savedRole) {
        login(savedRole)
      } else {
        // Default to Admin for now as it's a dev prototype
        login('Admin')
      }
    }
  }

  return {
    user,
    login,
    logout,
    initAuth,
    isAdmin: computed(() => user.value?.role === 'Admin')
  }
}
