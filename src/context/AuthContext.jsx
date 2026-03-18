import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authAPI.me()
      .then(res => setUser(res.data || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(username, password) {
    const res = await authAPI.login(username, password)
    // Recharger /auth/me pour avoir is_admin
    const me = await authAPI.me()
    setUser(me.data)
    return res
  }

  async function register(username, password) {
    const res = await authAPI.register(username, password)
    setUser(res.data)
    return res
  }

  async function logout() {
    await authAPI.logout()
    setUser(null)
  }

  function updateUser(data) {
    setUser(prev => ({ ...prev, ...data }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
