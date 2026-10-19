import { createContext, useContext, useEffect, useState } from 'react'
import API from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    API.get('/auth/me/')
      .then(res => {
        // /auth/me/ returns the user fields (with an id) when logged in, or { user: null } when not
        setUser(res.data.id ? res.data : null)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const res = await API.post('/auth/login/', { username, password })
    setUser(res.data)
    return res.data
  }

  const register = async (username, email, password) => {
    const res = await API.post('/auth/register/', { username, email, password })
    setUser(res.data)
    return res.data
  }

  const logout = async () => {
    try {
      await API.post('/auth/logout/')
    } catch (err) {
      console.error(err)
    } finally {
      setUser(null)
    }
  }

  // Admin = Django is_staff, sent by the backend as is_admin
  const isAdmin = user?.is_admin === true

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
