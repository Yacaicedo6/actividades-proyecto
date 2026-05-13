import { useState, useEffect } from 'react'
import {
  fetchActivities, updateActivity, deleteActivity,
  exportActivityCSV, exportWeeklyCSV,
  createWebhook, listWebhooks, deleteWebhook,
  listCollaborators, getWeeklyDashboard,
  sendDueReminders, updateUserRole, deleteUser, getIndicators
} from '../api'
import Navbar from '../components/Navbar'
import DashboardSemaforo from '../components/DashboardSemaforo'
import NuevaActividadForm from '../components/NuevaActividadForm'
import ActivityCard from '../components/ActivityCard'

export default function AdminView({ token, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('actividades')
  const [activities, setActivities] = useState([])
  const [indicators, setIndicators] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [collaboratorSearch, setCollaboratorSearch] = useState('')
  const [webhooks, setWebhooks] = useState([])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [reminderHours, setReminderHours] = useState(24)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadIndicators()
    loadCollaborators()
    loadDashboard()
  }, [])

  useEffect(() => {
    loadActivities()
  }, [filterStatus, currentPage])

  async function loadIndicators() {
    const data = await getIndicators(token)
    setIndicators(data)
  }

  async function loadActivities() {
    const resp = await fetchActivities(token, filterStatus || null, null, currentPage, 10)
    setActivities(resp.items || [])
    setTotalPages(Math.ceil((resp.total || 0) / 10))
  }

  async function loadCollaborators() {
    try {
      const data = await listCollaborators(token)
      setCollaborators(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadDashboard() {
    const data = await getWeeklyDashboard(token)
    setDashboard(data)
  }

  async function loadWebhooks() {
    const data = await listWebhooks(token)
    setWebhooks(data)
  }

  async function handleUpdateActivity(id, payload) {
    await updateActivity(token, id, payload)
    await loadActivities()
    await loadDashboard()
  }

  async function handleDeleteActivity(id) {
    if (!window.confirm('Eliminar esta actividad? Esta accion no se puede deshacer.')) return
    await deleteActivity(token, id)
    await loadActivities()
    await loadDashboard()
  }

  async function handlePromoteUser(userId, username) {
    if (!window.confirm(`Promover a ${username} como Admin?`)) return
    await updateUserRole(token, userId, 'Admin')
    setMsg(`${username} promovido a Admin correctamente`)
    await loadCollaborators()
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleDeleteUser(userId, username) {
    if (!window.confirm(`Eliminar a ${username}? Esta accion no se puede deshacer.`)) return
    await deleteUser(token, userId)
    setMsg(`${username} eliminado correctamente`)
    await loadCollaborators()
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleAddWebhook() {
    if (!webhookUrl.trim()) return
    await createWebhook(token, webhookUrl.trim())
    setWebhookUrl('')
    await loadWebhooks()
  }

  async function handleDeleteWebhook(id) {
    await deleteWebhook(token, id)
    await loadWebhooks()
  }

  async function handleSendReminders() {
    const res = await sendDueReminders(token, reminderHours)
    setMsg(`Recordatorios enviados: ${res.count}`)
    setTimeout(() => setMsg(''), 4000)
  }

  const tabs = [
    { id: 'actividades', label: 'Actividades' },
    { id: 'colaboradores', label: 'Colaboradores' },
    { id: 'reportes', label: 'Reportes' },
  ]

  const filteredCollaborators = collaborators.filter(c => {
    const s = collaboratorSearch.toLowerCase()
    return c.username.toLowerCase().includes(s) ||
      (c.full_name && c.full_name.toLowerCase().includes(s)) ||
      (c.email && c.email.toLowerCase().includes(s))
  })

  return (
    <div className="app-container">
      <Navbar currentUser={currentUser} onLogout={onLogout} />
      <div className="main-content">
        <DashboardSemaforo data={dashboard} />

        {msg && <div className="alert alert-exito mb-16">{msg}</div>}

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--color-borde)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primario)' : '2px solid transparent',
                marginBottom: -2,
                background: 'none',
                color: activeTab === tab.id ? 'var(--color-primario)' : 'var(--color-texto-secundario)',
                fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'var(--transicion)'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'actividades' && (
          <div>
            <NuevaActividadForm
              token={token}
              indicators={indicators}
              username={currentUser.username}
              onCreated={() => { loadActivities(); loadDashboard() }}
            />

            <div className="section-header">
              <h2>Actividades ({activities.length})</h2>
            </div>

            <div className="toolbar">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-texto-secundario)' }}>
                Filtrar:
              </label>
              <select className="form-input" value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}
                style={{ width: 'auto', margin: 0 }}>
                <option value="">Todos los estados</option>
                <option value="En Curso">En Curso</option>
                <option value="Completada">Completada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
              <button className="btn btn-secundario btn-sm"
                onClick={() => exportActivityCSV(token, filterStatus || null)}>
                Exportar CSV
              </button>
              <button className="btn btn-secundario btn-sm"
                onClick={() => exportWeeklyCSV(token, 7)}>
                Exportar semana
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>Sin actividades</h3>
                <p>Registra la primera actividad usando el formulario de arriba.</p>
              </div>
            ) : (
              activities.map(a => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  indicators={indicators}
                  token={token}
                  onUpdate={handleUpdateActivity}
                  onDelete={handleDeleteActivity}
                  isAdmin={true}
                />
              ))
            )}

            <div className="pagination">
              <button className="btn btn-secundario btn-sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}>
                Anterior
              </button>
              <span className="pagination-info">Pagina {currentPage} de {totalPages}</span>
              <button className="btn btn-secundario btn-sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}>
                Siguiente
              </button>
            </div>
          </div>
        )}

        {activeTab === 'colaboradores' && (
          <div>
            <div className="section-header mb-16">
              <h2>Colaboradores del equipo ({collaborators.length})</h2>
            </div>
            <div className="form-group">
              <input className="form-input"
                placeholder="Buscar por nombre, usuario o email..."
                value={collaboratorSearch}
                onChange={e => setCollaboratorSearch(e.target.value)} />
            </div>
            {filteredCollaborators.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>Sin colaboradores</h3>
                <p>Los usuarios que se registren apareceran aqui.</p>
              </div>
            ) : (
              <div className="collaborator-grid">
                {filteredCollaborators.map(c => (
                  <div key={c.id} className="collaborator-card">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {c.full_name || c.username}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-claro)' }}>
                        {c.email || 'Sin email'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-claro)', marginTop: 2 }}>
                        {c.last_login
                          ? `Ultimo acceso: ${new Date(c.last_login).toLocaleDateString('es-CO')}`
                          : 'Nunca ha ingresado'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button className="btn btn-sm btn-exito"
                        onClick={() => handlePromoteUser(c.id, c.username)}>
                        Admin
                      </button>
                      <button className="btn btn-sm btn-peligro"
                        onClick={() => handleDeleteUser(c.id, c.username)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reportes' && (
          <div>
            <div className="section-header mb-16">
              <h2>Reportes y configuracion</h2>
            </div>

            <div className="card mb-16">
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Recordatorios de vencimiento</h3>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)', marginBottom: 16 }}>
                  Envia recordatorios por email a los colaboradores asignados cuyas actividades vencen pronto.
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Enviar si vence en las proximas (horas):</label>
                    <input className="form-input" type="number" value={reminderHours}
                      onChange={e => setReminderHours(e.target.value)}
                      style={{ width: 120 }} />
                  </div>
                  <button className="btn btn-primario" onClick={handleSendReminders}>
                    Enviar recordatorios
                  </button>
                </div>
              </div>
            </div>

            <div className="card mb-16">
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Webhooks</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input className="form-input" placeholder="URL del webhook"
                    value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                    style={{ margin: 0 }} />
                  <button className="btn btn-primario" onClick={handleAddWebhook}>Agregar</button>
                  <button className="btn btn-secundario" onClick={loadWebhooks}>Cargar</button>
                </div>
                {webhooks.length === 0 ? (
                  <p style={{ color: 'var(--color-texto-claro)', fontSize: '0.9rem' }}>
                    Sin webhooks configurados.
                  </p>
                ) : (
                  webhooks.map(w => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', marginBottom: 6, backgroundColor: 'var(--color-fondo)', borderRadius: 4 }}>
                      <span style={{ fontSize: '0.9rem' }}>{w.url} - {w.event}</span>
                      <button className="btn btn-sm btn-peligro"
                        onClick={() => handleDeleteWebhook(w.id)}>
                        Eliminar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}