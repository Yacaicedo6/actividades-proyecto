import { useState, useEffect } from 'react'
import { getCurrentUser } from './api'
import LoginPage from './pages/LoginPage'
import AdminView from './pages/AdminView'
import './styles.css'
import CollaboratorView from './pages/CollaboratorView'

export default function App() {
  const [token, setToken] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      setToken(savedToken)
      loadUser(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const invitationToken = params.get('token')
    if (invitationToken && !token) {
      localStorage.setItem('pending_invite_token', invitationToken)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  async function loadUser(t) {
    try {
      const user = await getCurrentUser(t)
      setCurrentUser(user)
    } catch (err) {
      localStorage.removeItem('auth_token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  function handleLoginSuccess(newToken, username) {
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_username', username)
    setToken(newToken)
    loadUser(newToken)
  }

  function handleLogout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_username')
    setToken(null)
    setCurrentUser(null)
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-texto-claro)' }}>
          <div style={{ fontSize: '1.1rem' }}>Cargando...</div>
        </div>
      </div>
    )
  }

  if (!token || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

if (currentUser.role === 'Admin') {
    return <AdminView token={token} currentUser={currentUser} onLogout={handleLogout} />
  }

  return <CollaboratorView token={token} currentUser={currentUser} onLogout={handleLogout} />}
