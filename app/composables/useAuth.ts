import { useState, useCookie } from '#app'

export interface User {
  id: number
  name: string
  username: string
  role: 'Admin' | 'Cashier'
}

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const loading = useState('auth-loading', () => false)
  const error = useState<string | null>('auth-error', () => null)
  const userCookie = useCookie<User | null>('pos_user', {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  })

  const login = async (username: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<User>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })

      user.value = data
      userCookie.value = data
      return true
    } catch (e: any) {
      error.value = e.data?.statusMessage || e.statusMessage || 'การเข้าสู่ระบบล้มเหลว'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    userCookie.value = null
    navigateTo('/login')
  }

  const initAuth = () => {
    if (userCookie.value) {
      user.value = userCookie.value
    }
  }

  return {
    user,
    loading,
    error,
    login,
    logout,
    initAuth,
    isAdmin: computed(() => user.value?.role === 'Admin')
  }
}
