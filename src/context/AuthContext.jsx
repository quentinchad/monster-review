import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, getToken, setToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    // Décoder le token localement d'abord — pas besoin de réseau
    // Format JWT : header.payload.signature (base64url)
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      // Token expiré ?
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        setToken(null)
        setLoading(false)
        return
      }
      // Token valide localement — restaurer l'utilisateur immédiatement
      // sans attendre le réseau (évite la déconnexion sur réseau lent)
      setUser({ id: payload.uid, username: payload.username })
    } catch {
      // Token malformé
      setToken(null)
      setLoading(false)
      return
    }

    // Rafraîchir les infos depuis le serveur en arrière-plan
    // (avatar, is_admin, etc.) — mais NE PAS déconnecter si ça échoue
    authAPI.me()
      .then(res => {
        if (res.data) setUser(res.data)
        // Si res.data est null → token valide mais user supprimé
        // On garde quand même la session locale
      })
      .catch(() => {
        // Erreur réseau → on garde l'utilisateur connecté avec les infos du token
        // On ne déconnecte PAS
      })
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

