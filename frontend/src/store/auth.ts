import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthToken, UserType, Student, Teacher, Admin } from '@/types'
import { apiClient } from '@/lib/api'

interface AuthState {
  user: Student | Teacher | Admin | null
  userType: UserType | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserType>
  logout: () => void
  register: (data: any) => Promise<void>
  setUser: (user: any, userType: UserType, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userType: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const authData = await apiClient.login({ email, password })
          
          // Store token in localStorage
          localStorage.setItem('access_token', authData.access_token)
          
          const userType = authData.user_type as UserType
          
          // Try to get user details, but don't fail if it doesn't work
          let userData = null
          try {
            userData = await apiClient.getCurrentUser()
          } catch (userError) {
            console.warn('Could not fetch user details, using data from login response:', userError)
            // Fall back to using data from login response
            userData = {
              user: {
                id: authData.user_id,
                name: authData.name,
                email: authData.email,
              }
            }
          }
          
          set({
            user: userData?.user || {
              id: authData.user_id,
              name: authData.name,
              email: authData.email,
            },
            userType,
            token: authData.access_token,
            isAuthenticated: true,
            isLoading: false
          })

          // Return user type for redirection
          return userType
        } catch (error: any) {
          set({ isLoading: false })
          // Provide better error message
          const errorMessage = error?.response?.data?.detail || error?.message || 'Login failed. Please check your credentials.'
          const loginError = new Error(errorMessage)
          throw loginError
        }
      },

      register: async (data: any) => {
        set({ isLoading: true })
        try {
          await apiClient.register(data)
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      setUser: (user: any, userType: UserType, token: string) => {
        localStorage.setItem('access_token', token)
        set({
          user,
          userType,
          token,
          isAuthenticated: true
        })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        set({
          user: null,
          userType: null,
          token: null,
          isAuthenticated: false
        })
      },

      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        set({
          user: null,
          userType: null,
          token: null,
          isAuthenticated: false
        })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        userType: state.userType,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)