import { useState, useEffect } from 'react'
import {
  fetchActivities, getWeeklyDashboard, getIndicators
} from '../api'
import Navbar from '../components/Navbar'
import NuevaActividadForm from '../components/NuevaActividadForm'
import ActivityCard from '../components/ActivityCard'

export default function CollaboratorView({ token, currentUser, onLogout }) {
  const [activities, setActivities] = useState([])
  const [indicators, setIndicators] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadIndicators()
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

  async function loadDashboard() {
    try {
      const data = await getWeeklyDashboard(token)
      setDashboard(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleUpdateActivity(id, payload) {
    const { updateActivity } = await import('../api')
    await updateActivity(token, id, payload)
    await loadActivities()
    await loadDashboard()
  }

  return (
    <div className="app-container">
      <Navbar currentUser={currentUser} onLogout={onLogout} />
      <div className="main-content">

        {dashboard && (
          <div className="card mb-24">
            <div className="card-header">
              <h3 style={{ margin: 0 }}>Mis actividades - Ultimos 7 dias</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-claro)' }}>{dashboard.period}</span>
            </div>
            <div className="card-body">
              <div className="dashboard-grid">
                <div className="dashboard-card en-curso">
                  <div className="dashboard-card-number">{dashboard.in_progress}</div>
                  <div className="dashboard-card-label">En Curso</div>
                  <div className="dashboard-card-percent">{dashboard.percentages?.in_progress}%</div>
                </div>
                <div className="dashboard-card completada">
                  <div className="dashboard-card-number">{dashboard.done}</div>
                  <div className="dashboard-card-label">Completadas</div>
                  <div className="dashboard-card-percent">{dashboard.percentages?.done}%</div>
                </div>
                <div className="dashboard-card cancelada">
                  <div className="dashboard-card-number">{dashboard.cancelled}</div>
                  <div className="dashboard-card-label">Canceladas</div>
                  <div className="dashboard-card-percent">{dashboard.percentages?.cancelled}%</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-texto-claro)', marginTop: 8 }}>
                Total: {dashboard.total} actividades
              </div>
            </div>
          </div>
        )}

        <NuevaActividadForm
          token={token}
          indicators={indicators}
          username={currentUser.username}
          onCreated={() => { loadActivities(); loadDashboard() }}
        />

        <div className="section-header">
          <h2>Mis actividades ({activities.length})</h2>
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
        </div>

        {activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>Sin actividades</h3>
            <p>Registra tu primera actividad usando el formulario de arriba.</p>
          </div>
        ) : (
          activities.map(a => (
            <ActivityCard
              key={a.id}
              activity={a}
              indicators={indicators}
              token={token}
              onUpdate={handleUpdateActivity}
              onDelete={null}
              isAdmin={false}
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
    </div>
  )
}