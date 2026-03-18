import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, getToken, setToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Au démarrage : si un token existe, vérifier qu'il est encore valide
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    authAPI.me()
      .then(res => setUser(res.data || null))
      .catch(() => { setToken(null); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  async function login(username, password) {
    const res = await authAPI.login(username, password)
    setToken(res.data?.token)
    setUser(res.data)
    return res
  }

  async function register(username, password) {
    const res = await authAPI.register(username, password)
    setToken(res.data?.token)
    setUser(res.data)
    return res
  }

  async function logout() {
    await authAPI.logout().catch(() => {})
    setToken(null)
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
