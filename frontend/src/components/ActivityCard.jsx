import { useState } from 'react'
import {
  createSubtask, listSubtasks, updateSubtask, deleteSubtask,
  createActivityFile, listActivityFiles, downloadActivityFile, deleteActivityFile,
  createInvitation, listInvitations, getActivityHistory
} from '../api'

function getDeadlineInfo(dueDate) {
  if (!dueDate) return { label: 'Sin vencimiento', cls: 'deadline-sin' }
  const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000)
  if (days < 0) return { label: `Vencido hace ${Math.abs(days)} dias`, cls: 'deadline-vencido' }
  if (days === 0) return { label: 'Vence hoy', cls: 'deadline-hoy' }
  if (days <= 3) return { label: `Vence en ${days} dia(s)`, cls: 'deadline-proximo' }
  return { label: `Vence en ${days} dia(s)`, cls: 'deadline-ok' }
}

export default function ActivityCard({ activity, indicators, token, onUpdate, onDelete, isAdmin }) {
  const [expanded, setExpanded] = useState(false)
  const [subtasks, setSubtasks] = useState([])
  const [files, setFiles] = useState([])
  const [invitations, setInvitations] = useState([])
  const [history, setHistory] = useState([])
  const [newSubtask, setNewSubtask] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [fileInput, setFileInput] = useState(null)
  const [activeTab, setActiveTab] = useState('subtasks')
  const [msg, setMsg] = useState('')

  async function loadSubtasks() {
    const data = await listSubtasks(token, activity.id)
    setSubtasks(data)
  }

  async function loadFiles() {
    const data = await listActivityFiles(token, activity.id)
    setFiles(data)
  }

  async function loadInvitations() {
    const data = await listInvitations(token, activity.id)
    setInvitations(data)
  }

  async function loadHistory() {
    const data = await getActivityHistory(token, activity.id)
    setHistory(data)
  }

  async function handleExpand() {
    const next = !expanded
    setExpanded(next)
    if (next) {
      await loadSubtasks()
      await loadFiles()
      await loadInvitations()
    }
  }

  async function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'history') await loadHistory()
  }

  async function handleAddSubtask() {
    if (!newSubtask.trim()) return
    await createSubtask(token, activity.id, { title: newSubtask.trim() })
    setNewSubtask('')
    await loadSubtasks()
  }

  async function handleSubtaskStatus(subtaskId, status) {
    await updateSubtask(token, activity.id, subtaskId, { status })
    await loadSubtasks()
  }

  async function handleDeleteSubtask(subtaskId) {
    await deleteSubtask(token, activity.id, subtaskId)
    await loadSubtasks()
  }

  async function handleUploadFile() {
    if (!fileInput) return
    await createActivityFile(token, activity.id, fileInput)
    setFileInput(null)
    await loadFiles()
  }

  async function handleDeleteFile(fileId) {
    await deleteActivityFile(token, activity.id, fileId)
    await loadFiles()
  }

  function handleDownloadFile(fileId) {
    const url = downloadActivityFile(token, activity.id, fileId)
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const u = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = u
        a.download = ''
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(u)
      })
  }

  async function handleSendInvite() {
    if (!inviteEmail.trim()) return
    await createInvitation(token, activity.id, inviteEmail.trim())
    setMsg('Invitacion enviada correctamente')
    setInviteEmail('')
    await loadInvitations()
    setTimeout(() => setMsg(''), 3000)
  }

  const deadline = getDeadlineInfo(activity.due_date)
  const indicatorName = activity.indicator?.name ||
    indicators.find(i => i.id === activity.indicator_id)?.name || ''

  return (
    <div className={`activity-card ${activity.status === 'En Curso' ? 'en-curso' : activity.status === 'Completada' ? 'completada' : 'cancelada'}`}>
      <div className="activity-card-header">
        <div style={{ flex: 1 }}>
          <div className="activity-card-title">{activity.title}</div>
          {activity.description && (
            <div className="activity-card-description">{activity.description}</div>
          )}
        </div>
        <span className={`badge badge-${activity.status === 'En Curso' ? 'en-curso' : activity.status === 'Completada' ? 'completada' : 'cancelada'}`}>
          {activity.status}
        </span>
      </div>

      <div className="activity-card-meta">
        <span>Registrado por: <strong>{activity.injected_by}</strong></span>
        <span>Asignado: <strong>{activity.assigned_to || 'Sin asignar'}</strong></span>
        <span style={{ color: 'var(--color-info)' }}>
          Indicador: <strong>{indicatorName}</strong>
        </span>
        <span className={deadline.cls}>Plazo: {deadline.label}</span>
        <span style={{ color: 'var(--color-texto-claro)' }}>
          {new Date(activity.timestamp).toLocaleDateString('es-CO')}
        </span>
      </div>

      <div className="activity-card-actions">
        <button
          className={`btn btn-sm ${activity.status === 'En Curso' ? 'btn-dorado' : 'btn-secundario'}`}
          onClick={() => onUpdate(activity.id, { status: 'En Curso' })}>
          En Curso
        </button>
        <button
          className={`btn btn-sm ${activity.status === 'Completada' ? 'btn-exito' : 'btn-secundario'}`}
          onClick={() => onUpdate(activity.id, { status: 'Completada' })}>
          Completada
        </button>
        <button
          className={`btn btn-sm btn-secundario`}
          onClick={() => onUpdate(activity.id, { status: 'Cancelada' })}>
          Cancelada
        </button>
        {isAdmin && (
          <button className="btn btn-sm btn-secundario"
            onClick={() => {
              const due = prompt('Fecha de vencimiento (YYYY-MM-DD):',
                activity.due_date ? activity.due_date.split('T')[0] : '')
              if (due !== null && due !== '') {
                onUpdate(activity.id, { due_date: new Date(due).toISOString() })
              }
            }}>
            Plazo
          </button>
        )}
        {isAdmin && (
          <button className="btn btn-sm btn-peligro"
            onClick={() => onDelete(activity.id)}>
            Eliminar
          </button>
        )}
        <button className="btn btn-sm btn-secundario" onClick={handleExpand}>
          {expanded ? 'Ocultar detalle' : 'Ver detalle'}
        </button>
      </div>

      {expanded && (
        <div className="expandable-section">
          {msg && <div className="alert alert-exito mb-16">{msg}</div>}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--color-borde)', paddingBottom: 8 }}>
            {['subtasks', 'files', 'invitations', 'history'].map(tab => (
              <button key={tab} onClick={() => handleTabChange(tab)}
                className={`btn btn-sm ${activeTab === tab ? 'btn-primario' : 'btn-secundario'}`}>
                {tab === 'subtasks' ? 'Subtareas' : tab === 'files' ? 'Archivos' : tab === 'invitations' ? 'Invitaciones' : 'Historial'}
              </button>
            ))}
          </div>

          {activeTab === 'subtasks' && (
            <div>
              {subtasks.length === 0 && (
                <p style={{ color: 'var(--color-texto-claro)', fontSize: '0.9rem' }}>Sin subtareas.</p>
              )}
              {subtasks.map(sub => (
                <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', marginBottom: 6, backgroundColor: 'white', borderRadius: 4, border: '1px solid var(--color-borde)' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{sub.title}</strong>
                    <span className={`badge`} style={{ marginLeft: 8, backgroundColor: sub.status === 'Completada' ? 'var(--color-completada-fondo)' : 'var(--color-en-curso-fondo)', color: sub.status === 'Completada' ? 'var(--color-completada)' : 'var(--color-en-curso)' }}>
                      {sub.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-sm btn-secundario"
                      onClick={() => handleSubtaskStatus(sub.id, 'En Curso')}>En Curso</button>
                    <button className="btn btn-sm btn-exito"
                      onClick={() => handleSubtaskStatus(sub.id, 'Completada')}>Completada</button>
                    <button className="btn btn-sm btn-peligro"
                      onClick={() => handleDeleteSubtask(sub.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="form-input" placeholder="Nueva subtarea..."
                  value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                  style={{ margin: 0 }} />
                <button className="btn btn-exito" onClick={handleAddSubtask}>Agregar</button>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div>
              {files.length === 0 && (
                <p style={{ color: 'var(--color-texto-claro)', fontSize: '0.9rem' }}>Sin archivos.</p>
              )}
              {files.map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', marginBottom: 6, backgroundColor: 'white', borderRadius: 4, border: '1px solid var(--color-borde)' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{f.filename}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-claro)' }}>{f.file_size} bytes</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-sm btn-secundario"
                      onClick={() => handleDownloadFile(f.id)}>Descargar</button>
                    <button className="btn btn-sm btn-peligro"
                      onClick={() => handleDeleteFile(f.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <input type="file" onChange={e => setFileInput(e.target.files[0])}
                  style={{ flex: 1, padding: '6px', border: '1px solid var(--color-borde)', borderRadius: 4 }} />
                <button className="btn btn-primario" onClick={handleUploadFile}>Subir</button>
              </div>
            </div>
          )}

          {activeTab === 'invitations' && (
            <div>
              {invitations.length === 0 && (
                <p style={{ color: 'var(--color-texto-claro)', fontSize: '0.9rem' }}>Sin invitaciones.</p>
              )}
              {invitations.map(inv => (
                <div key={inv.id} style={{ padding: '8px', marginBottom: 6, backgroundColor: 'white', borderRadius: 4, borderLeft: `3px solid ${inv.accepted_by ? 'var(--color-exito)' : 'var(--color-dorado)'}` }}>
                  <strong style={{ fontSize: '0.9rem' }}>{inv.invited_email}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-claro)' }}>
                    Creada: {new Date(inv.created_at).toLocaleString('es-CO')}
                  </div>
                  {inv.accepted_by
                    ? <div style={{ fontSize: '0.8rem', color: 'var(--color-exito)', fontWeight: 600 }}>Aceptada por: {inv.accepted_by}</div>
                    : <div style={{ fontSize: '0.8rem', color: 'var(--color-dorado)' }}>Pendiente (vence: {new Date(inv.expires_at).toLocaleString('es-CO')})</div>
                  }
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="form-input" type="email" placeholder="Email para invitar..."
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendInvite()}
                  style={{ margin: 0 }} />
                <button className="btn btn-exito" onClick={handleSendInvite}>Invitar</button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {history.length === 0 && (
                <p style={{ color: 'var(--color-texto-claro)', fontSize: '0.9rem' }}>Sin cambios registrados.</p>
              )}
              {history.map(h => (
                <div key={h.id} style={{ padding: '8px', marginBottom: 6, backgroundColor: 'white', borderRadius: 4, border: '1px solid var(--color-borde)', fontSize: '0.85rem' }}>
                  <strong>{h.changed_by}</strong> cambio <strong>{h.changed_field}</strong> de "{h.old_value}" a "{h.new_value}"
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-claro)' }}>
                    {new Date(h.timestamp).toLocaleString('es-CO')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}