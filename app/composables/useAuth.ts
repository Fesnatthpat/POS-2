import { useState, useCookie, useRuntimeConfig, navigateTo } from '#app'
import { computed } from 'vue'

export interface User {
  id: number
  name: string
  username: string
  role: 'Admin' | 'Cashier'
}

export interface LoginResponse {
  message: string
  token?: string
  user: User
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl
  
  const user = useState<User | null>('pos-auth-user', () => null)
  const loading = useState('auth-loading', () => false)
  const error = useState<string | null>('auth-error', () => null)
  const userCookie = useCookie<User | null>('pos_user', {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
    watch: true,
    sameSite: 'lax'
  })
  const tokenCookie = useCookie<string | null>('pos_token', {
    maxAge: 60 * 60 * 24 * 30,
    path: '/'
  })

  const login = async (username: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      console.log('Attempting login for:', username)
      const data = await $fetch<LoginResponse>(`${apiBase}/login`, {
        method: 'POST',
        body: { username, password }
      })

      console.log('Login response data:', data)

      // ตรวจสอบโครงสร้างข้อมูลใหม่ (data.user)
      if (data && data.user) {
        user.value = data.user
        userCookie.value = data.user
        if (data.token) {
          tokenCookie.value = data.token
        }
        console.log('Login successful, user set:', user.value)
        return true
      } else {
        error.value = data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
        return false
      }
    } catch (e: any) {
      console.error('Login error:', e)
      error.value = e.data?.message || e.message || 'การเข้าสู่ระบบล้มเหลว'
      return false
    } finally {
      loading.value = false
    }
  }

  const register = async (name: string, email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${apiBase}/register`, {
        method: 'POST',
        body: { name, email, password }
      })
      return true
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'การสมัครสมาชิกล้มเหลว'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    userCookie.value = null
    tokenCookie.value = null
    navigateTo('/login')
  }

  const initAuth = () => {
    if (userCookie.value && !user.value) {
      user.value = userCookie.value
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    initAuth,
    isAdmin: computed(() => user.value?.role === 'Admin')
  }
}
