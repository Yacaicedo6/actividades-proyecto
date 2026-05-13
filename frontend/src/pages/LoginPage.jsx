import { useState, useEffect } from 'react'
import { login, register, acceptInvitationLogin } from '../api'

export default function LoginPage({ onLoginSuccess }) {
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [inviteUsername, setInviteUsername] = useState('')
  const [invitePassword, setInvitePassword] = useState('')

  useEffect(() => {
    const pending = localStorage.getItem('pending_invite_token')
    if (pending) {
      setInviteToken(pending)
      setTab('invite')
      localStorage.removeItem('pending_invite_token')
    }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await login(username, password)
      onLoginSuccess(token, username)
    } catch (err) {
      setError('Usuario o contrasena incorrectos')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await register(username, password, email)
      const token = await login(username, password)
      onLoginSuccess(token, username)
    } catch (err) {
      setError(err.message || 'Error al registrar usuario')
    } finally {
      setLoading(false)
    }
  }

  async function handleAcceptInvite(e) {
    e.preventDefault()
    setError('')
    if (!inviteToken || !inviteUsername || !invitePassword) {
      setError('Todos los campos son obligatorios')
      return
    }
    setLoading(true)
    try {
      const result = await acceptInvitationLogin(inviteToken, inviteUsername, invitePassword)
      onLoginSuccess(result.access_token, inviteUsername)
    } catch (err) {
      setError('Token invalido o expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Gestion de las Artes</h2>
          <p>Secretaria de Cultura de Cali</p>
        </div>
        <div className="login-body">
          <div className="login-tabs">
            <button
              className={`login-tab ${tab === 'login' ? 'activo' : ''}`}
              onClick={() => { setTab('login'); setError('') }}>
              Iniciar sesion
            </button>
            <button
              className={`login-tab ${tab === 'register' ? 'activo' : ''}`}
              onClick={() => { setTab('register'); setError('') }}>
              Registrarse
            </button>
            <button
              className={`login-tab ${tab === 'invite' ? 'activo' : ''}`}
              onClick={() => { setTab('invite'); setError('') }}>
              Invitacion
            </button>
          </div>

          {error && (
            <div className="alert alert-error mb-16">{error}</div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Usuario</label>
                <input className="form-input" type="text"
                  placeholder="Tu nombre de usuario"
                  value={username} onChange={e => setUsername(e.target.value)}
                  required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Contrasena</label>
                <input className="form-input" type="password"
                  placeholder="Tu contrasena"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required />
              </div>
              <button type="submit" className="btn btn-primario btn-block btn-lg mt-8"
                disabled={loading}>
                {loading ? 'Iniciando sesion...' : 'Iniciar sesion'}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Usuario</label>
                <input className="form-input" type="text"
                  placeholder="Elige un nombre de usuario"
                  value={username} onChange={e => setUsername(e.target.value)}
                  required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Correo electronico</label>
                <input className="form-input" type="email"
                  placeholder="tu@correo.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contrasena</label>
                <input className="form-input" type="password"
                  placeholder="Minimo 6 caracteres"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required />
              </div>
              <button type="submit" className="btn btn-primario btn-block btn-lg mt-8"
                disabled={loading}>
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>
          )}

          {tab === 'invite' && (
            <form onSubmit={handleAcceptInvite}>
              <div className="alert alert-info mb-16">
                El token de invitacion fue detectado automaticamente. Completa tus datos para acceder.
              </div>
              <div className="form-group">
                <label className="form-label required">Token de invitacion</label>
                <input className="form-input" type="text"
                  placeholder="Token del email de invitacion"
                  value={inviteToken} onChange={e => setInviteToken(e.target.value)}
                  required />
              </div>
              <div className="form-group">
                <label className="form-label required">Usuario</label>
                <input className="form-input" type="text"
                  placeholder="Elige un nombre de usuario"
                  value={inviteUsername} onChange={e => setInviteUsername(e.target.value)}
                  required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label required">Contrasena</label>
                <input className="form-input" type="password"
                  placeholder="Minimo 6 caracteres"
                  value={invitePassword} onChange={e => setInvitePassword(e.target.value)}
                  required />
              </div>
              <button type="submit" className="btn btn-exito btn-block btn-lg mt-8"
                disabled={loading}>
                {loading ? 'Procesando...' : 'Aceptar invitacion'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}