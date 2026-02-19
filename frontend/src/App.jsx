import React, {useState, useEffect} from 'react'
import { login, register, fetchActivities, createActivity, updateActivity, deleteActivity, getActivityHistory, exportActivityCSV, exportWeeklyCSV, createWebhook, listWebhooks, deleteWebhook, createSubtask, listSubtasks, updateSubtask, deleteSubtask, createActivityFile, listActivityFiles, downloadActivityFile, deleteActivityFile, getWeeklyDashboard, sendDueReminders, createInvitation, listInvitations, acceptInvitationLogin, listCollaborators, assignActivityToCollaborator, createAdminUser, getCurrentUser, updateUserRole, deleteUser } from './api'

export default function App(){
  const [token, setToken] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [currentUser, setCurrentUser] = useState(null)  // Datos completos del usuario
  const [activities, setActivities] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedActivityId, setSelectedActivityId] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const [reminderHours, setReminderHours] = useState(24)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [history, setHistory] = useState(null)
  const [showWebhookSettings, setShowWebhookSettings] = useState(false)
  const [webhooks, setWebhooks] = useState([])
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvent, setNewWebhookEvent] = useState('*')
  const [expandedActivity, setExpandedActivity] = useState(null)
  const [activitySubtasks, setActivitySubtasks] = useState({})
  const [subtaskInput, setSubtaskInput] = useState({})
  
  // Collaborators state
  const [collaborators, setCollaborators] = useState([])
  const [showCollaboratorAssign, setShowCollaboratorAssign] = useState(null)
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState(null)

  useEffect(()=>{
    const savedToken = localStorage.getItem('auth_token')
    const savedUsername = localStorage.getItem('auth_username')
    if(savedToken){
      setToken(savedToken)
      if(savedUsername) setUsername(savedUsername)
    }
  }, [])

  useEffect(()=>{
    if(token){
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_username', username || '')
    }else{
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_username')
    }
  }, [token, username])

  useEffect(()=>{
    // Capturar token de invitación de la URL
    const params = new URLSearchParams(window.location.search)
    const invitationToken = params.get('token')
    if(invitationToken && !token){
      // Mostrar modal automático para aceptar
      setTimeout(() => {
        const guest_user = prompt('Nombre de usuario para acceso invitado:')
        if(!guest_user) return
        const guest_pass = prompt('Contraseña para acceso invitado:')
        if(!guest_pass) return
        acceptInviteFlowWithToken(invitationToken, guest_user, guest_pass)
      }, 500)
    }
  }, [])

  useEffect(()=>{
    if(token) {
      loadActivities()
      loadCollaborators()
      loadCurrentUser()  // Cargar datos del usuario
    }
  },[token, filterStatus, currentPage])

  useEffect(()=>{
    if(!token) return
    const intervalId = setInterval(() => {
      loadActivities()
    }, 20000)
    return () => clearInterval(intervalId)
  }, [token, filterStatus, currentPage])
  
  async function loadCurrentUser(){
    try{
      const user = await getCurrentUser(token)
      setCurrentUser(user)
    }catch(err){
      console.error('Error al cargar usuario:', err.message)
    }
  }
  
  async function loadWeeklyDashboard(){
    try{
      const data = await getWeeklyDashboard(token)
      setWeeklyDashboard(data)
    }catch(err){
      console.error('Error loading dashboard:', err.message)
    }
  }

  async function doRegister(){
    try{
      await register(username, password)
      await doLogin()
    }catch(err){
      alert('Error al registrar: ' + err.message)
    }
  }
  async function doLogin(){
    try{
      const t = await login(username, password)
      setToken(t)
    }catch(err){
      alert('Error al iniciar sesión: ' + err.message)
    }
  }
  function doLogout(){
    setToken(null)
    setUsername('')
    setPassword('')
    setCurrentUser(null)
    setActivities([])
    setWeeklyDashboard(null)
  }
  async function loadActivities(){
    try{
      const resp = await fetchActivities(token, filterStatus, null, currentPage, 10)
      setActivities(resp.items || [])
      setTotalPages(Math.ceil(resp.total / 10))
      loadWeeklyDashboard()
    }catch(err){
      alert('Error al cargar actividades: ' + err.message)
    }
  }
  async function submit(){
    try{
      const payload = {title, description, injected_by: username}
      if(dueDate) payload.due_date = new Date(dueDate).toISOString()
      await createActivity(token, payload)
      setTitle('')
      setDescription('')
      setDueDate('')
      setCurrentPage(1)
      loadActivities()
    }catch(err){
      alert('Error al crear actividad: ' + err.message)
    }
  }
  async function changeStatus(id, newStatus){
    try{
      await updateActivity(token, id, {status: newStatus})
      loadActivities()
      loadWeeklyDashboard()
    }catch(err){
      alert('Error al actualizar: ' + err.message)
    }
  }
  async function removeActivity(id){
    if(!window.confirm('¿Eliminar actividad? Esta acción no se puede deshacer.')) return
    try{
      await deleteActivity(token, id)
      loadActivities()
    }catch(err){
      alert('Error al eliminar: ' + err.message)
    }
  }
  async function assign(id, assignedTo){
    try{
      const assigned = prompt('¿A quién asignar?', assignedTo || '')
      if(assigned !== null){
        await updateActivity(token, id, {assigned_to: assigned})
        loadActivities()
      }
    }catch(err){
      alert('Error al asignar: ' + err.message)
    }
  }

  // Collaborators functions
  async function loadCollaborators(){
    try{
      const colabs = await listCollaborators(token)
      setCollaborators(colabs)
    }catch(err){
      console.error('Error al cargar colaboradores:', err.message)
    }
  }

  async function assignToCollaborator(activityId){
    try{
      if(!selectedCollaboratorId){
        alert('Por favor selecciona un colaborador')
        return
      }
      await assignActivityToCollaborator(token, activityId, selectedCollaboratorId)
      alert('Actividad asignada correctamente')
      setShowCollaboratorAssign(null)
      setSelectedCollaboratorId(null)
      loadActivities()
    }catch(err){
      alert('Error al asignar: ' + err.message)
    }
  }

  async function changeDueDate(id, currentDue){
    try{
      const dueStr = prompt('Fecha de vencimiento (YYYY-MM-DD)', currentDue ? currentDue.split('T')[0] : '')
      if(dueStr !== null && dueStr !== ''){
        await updateActivity(token, id, {due_date: new Date(dueStr).toISOString()})
        loadActivities()
      }
    }catch(err){
      alert('Error al cambiar fecha: ' + err.message)
    }
  }
  function getDeadlineStatus(dueDate){
    if(!dueDate) return {color: '#888', label: 'Sin vencimiento'}
    const now = new Date()
    const due = new Date(dueDate)
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    if(daysLeft < 0) return {color: '#d32f2f', label: `Vencido hace ${Math.abs(daysLeft)} días`}
    if(daysLeft === 0) return {color: '#f57f17', label: 'Vence hoy'}
    if(daysLeft <= 3) return {color: '#fbc02d', label: `Vence en ${daysLeft} día(s)`}
    return {color: '#388e3c', label: `Vence en ${daysLeft} día(s)`}
  }
  async function viewHistory(id){
    try{
      const h = await getActivityHistory(token, id)
      setHistory({activityId: id, records: h})
    }catch(err){
      alert('Error al cargar historial: ' + err.message)
    }
  }
  async function doExport(){
    try{
      await exportActivityCSV(token, filterStatus)
    }catch(err){
      alert('Error al exportar: ' + err.message)
    }
  }

  async function doExportWeekly(){
    try{
      await exportWeeklyCSV(token, 7)
    }catch(err){
      alert('Error al exportar semana: ' + err.message)
    }
  }

  async function doSendReminders(){
    try{
      const hours = Number(reminderHours) || 24
      const res = await sendDueReminders(token, hours)
      alert(`Recordatorios enviados: ${res.count}\nDetalles: ${JSON.stringify(res.results)}`)
    }catch(err){
      alert('Error al enviar recordatorios: ' + err.message)
    }
  }
  async function loadWebhooks(){
    try{
      const w = await listWebhooks(token)
      setWebhooks(w)
    }catch(err){
      alert('Error al cargar webhooks: ' + err.message)
    }
  }
  async function addWebhook(){
    if(!newWebhookUrl){
      alert('Ingresa una URL')
      return
    }
    try{
      await createWebhook(token, newWebhookUrl, newWebhookEvent)
      setNewWebhookUrl('')
      setNewWebhookEvent('*')
      loadWebhooks()
    }catch(err){
      alert('Error al crear webhook: ' + err.message)
    }
  }
  async function removeWebhook(id){
    try{
      await deleteWebhook(token, id)
      loadWebhooks()
    }catch(err){
      alert('Error al eliminar webhook: ' + err.message)
    }
  }
  async function toggleSubtasks(activityId){
    if(expandedActivity === activityId){
      setExpandedActivity(null)
    }else{
      setExpandedActivity(activityId)
      if(!activitySubtasks[activityId]){
        try{
          const subs = await listSubtasks(token, activityId)
          setActivitySubtasks({...activitySubtasks, [activityId]: subs})
        }catch(err){
          alert('Error al cargar subtareas: ' + err.message)
        }
      }
    }
  }
  async function createNewSubtask(activityId){
    const title = (subtaskInput[activityId] || '').trim()
    if(!title){
      alert('Ingresa un título para la subtarea')
      return
    }
    try{
      await createSubtask(token, activityId, {title, description: null})
      setSubtaskInput({...subtaskInput, [activityId]: ''})
      const subs = await listSubtasks(token, activityId)
      setActivitySubtasks({...activitySubtasks, [activityId]: subs})
    }catch(err){
      alert('Error al crear subtarea: ' + err.message)
    }
  }
  async function changeSubtaskStatus(activityId, subtaskId, newStatus){
    try{
      await updateSubtask(token, activityId, subtaskId, {status: newStatus})
      const subs = await listSubtasks(token, activityId)
      setActivitySubtasks({...activitySubtasks, [activityId]: subs})
    }catch(err){
      alert('Error al actualizar Subtarea: ' + err.message)
    }
  }
  async function removeSubtask(activityId, subtaskId){
    try{
      await deleteSubtask(token, activityId, subtaskId)
      const subs = await listSubtasks(token, activityId)
      setActivitySubtasks({...activitySubtasks, [activityId]: subs})
    }catch(err){
      alert('Error al Eliminar Subtarea: ' + err.message)
    }
  }
  // Files
  const [activityFiles, setActivityFiles] = useState({})
  const [fileInput, setFileInput] = useState({})
  
  // Dashboard
  const [weeklyDashboard, setWeeklyDashboard] = useState(null)
  
  // Invitations
  const [activityInvitations, setActivityInvitations] = useState({})
  const [invitationEmail, setInvitationEmail] = useState({})


  async function loadFiles(activityId){
    try{
      const files = await listActivityFiles(token, activityId)
      setActivityFiles({...activityFiles, [activityId]: files})
    }catch(err){
      alert('Error al cargar archivos: ' + err.message)
    }
  }

  async function uploadFile(activityId){
    const f = fileInput[activityId]
    if(!f){ alert('Selecciona un archivo'); return }
    try{
      await createActivityFile(token, activityId, f)
      setFileInput({...fileInput, [activityId]: null})
      await loadFiles(activityId)
    }catch(err){
      alert('Error al subir archivo: ' + err.message)
    }
  }

  function downloadFile(activityId, fileId){
    const url = downloadActivityFile(token, activityId, fileId)
    // abrir en nueva pestaña con autorización por header no aplicable; usar fetch con blob
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
      }).catch(e => alert('Error al descargar: ' + e.message))
  }

  async function removeFile(activityId, fileId){
    try{
      await deleteActivityFile(token, activityId, fileId)
      await loadFiles(activityId)
    }catch(err){
      alert('Error al eliminar archivo: ' + err.message)
    }
  }

  // Invitations
  async function loadInvitations(activityId){
    try{
      const invs = await listInvitations(token, activityId)
      setActivityInvitations({...activityInvitations, [activityId]: invs})
    }catch(err){
      alert('Error al cargar invitaciones: ' + err.message)
    }
  }

  async function sendInvitation(activityId){
    const email = (invitationEmail[activityId] || '').trim()
    if(!email){
      alert('Ingresa un email')
      return
    }
    try{
      const inv = await createInvitation(token, activityId, email)
      alert(`Invitación creada. Token: ${inv.token}\nCompartir este token con: ${email}`)
      setInvitationEmail({...invitationEmail, [activityId]: ''})
      await loadInvitations(activityId)
    }catch(err){
      alert('Error al crear invitación: ' + err.message)
    }
  }

  async function acceptInviteFlow(){
    const token_input = prompt('Ingresa el token de invitación:')
    if(!token_input) return
    const guest_user = prompt('Nombre de usuario para acceso invitado:')
    if(!guest_user) return
    const guest_pass = prompt('Contraseña para acceso invitado:')
    if(!guest_pass) return
    try{
      const result = await acceptInvitationLogin(token_input, guest_user, guest_pass)
      alert('¡Invitación aceptada! Token guardado.')
      setToken(result.access_token)
      setUsername(guest_user)
    }catch(err){
      alert('Error al aceptar invitación: ' + err.message)
    }
  }

  async function acceptInviteFlowWithToken(invitation_token, guest_user, guest_pass){
    try{
      const result = await acceptInvitationLogin(invitation_token, guest_user, guest_pass)
      alert('¡Invitación aceptada! Bienvenido.')
      setToken(result.access_token)
      setUsername(guest_user)
      // Limpiar URL de token
      window.history.replaceState({}, document.title, window.location.pathname)
    }catch(err){
      alert('Error al aceptar invitación: ' + err.message)
    }
  }

  if(!token){
    return (
      <div style={{padding:20, maxWidth: 300}}>
        <h2>Iniciar sesión / Registrar</h2>
        <input placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
        <br/>
        <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <br/>
        <button onClick={doLogin}>Iniciar sesión</button>
        <button onClick={doRegister}>Registrar</button>
        <br/>
        <hr/>
        <button onClick={acceptInviteFlow} style={{background: '#28a745', color: 'white', width: '100%', padding: '8px', marginTop: 8}}>
          Aceptar Invitación
        </button>
      </div>
    )
  }

  return (
    <div style={{padding:20}}>
      <h2>Seguimiento de Actividades Gestión de las Artes</h2>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
        <p style={{margin: 0}}>Usuario: <strong>{username}</strong> {currentUser && <span style={{backgroundColor: currentUser.role === 'Admin' ? '#28a745' : '#17a2b8', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: '0.85em', marginLeft: 8}}>{currentUser.role === 'Admin' ? 'ADMIN' : 'COLABORADOR'}</span>}</p>
      </div>
      
      {currentUser?.role === 'Admin' && (
        <div style={{backgroundColor: '#f0f8ff', border: '2px solid #17a2b8', padding: 15, marginBottom: 15, borderRadius: '8px'}}>
          <h3 style={{margin: '0 0 10px 0'}}>Colaboradores Disponibles ({collaborators.length})</h3>
          {collaborators.length === 0 ? (
            <p style={{color: '#666', fontSize: '0.9em', margin: 0}}>Sin colaboradores registrados. Los usuarios que se registren aparecerán aquí.</p>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10}}>
              {collaborators.map(colab => (
                <div key={colab.id} style={{backgroundColor: 'white', border: '1px solid #ddd', padding: 12, borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                  <p style={{margin: '0 0 5px 0', fontWeight: 'bold', color: '#333', fontSize: '1em'}}>{colab.username}</p>
                  <p style={{margin: '0 0 5px 0', fontSize: '0.85em', color: '#666', wordBreak: 'break-all'}}>{colab.email || 'Sin email'}</p>
                  {colab.last_login ? (
                    <p style={{margin: '0 0 8px 0', fontSize: '0.8em', color: '#999'}}>
                      Último login: {new Date(colab.last_login).toLocaleString()}
                    </p>
                  ) : (
                    <p style={{margin: '0 0 8px 0', fontSize: '0.8em', color: '#999'}}>Nunca ha iniciado sesión</p>
                  )}
                  <div style={{display: 'flex', gap: 6, marginTop: 8}}>
                    <button 
                      onClick={() => {
                        if(window.confirm(`¿Hacer admin a ${colab.username}?`)) {
                          updateUserRole(token, colab.id, 'Admin')
                            .then(() => {
                              alert('Rol actualizado')
                              loadCollaborators()
                            })
                            .catch(e => alert('Error: ' + e.message))
                        }
                      }}
                      style={{flex: 1, padding: '6px 8px', fontSize: '0.8em', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
                    >
                      Hacer Admin
                    </button>
                    <button 
                      onClick={() => {
                        if(window.confirm(`¿Eliminar a ${colab.username}?`)) {
                          deleteUser(token, colab.id)
                            .then(() => {
                              alert('Usuario eliminado')
                              loadCollaborators()
                            })
                            .catch(e => alert('Error: ' + e.message))
                        }
                      }}
                      style={{flex: 1, padding: '6px 8px', fontSize: '0.8em', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {collaborators.length === 0 && currentUser?.role === 'Admin' && (
        <div style={{backgroundColor: '#fff3cd', padding: 12, marginBottom: 12, borderLeft: '4px solid #ffc107', borderRadius: 4}}>
          <strong>Sin colaboradores registrados</strong>
          <p style={{margin: '8px 0 0 0', fontSize: '0.9em'}}>Los usuarios que se registren aparecerán aquí como colaboradores. Tú eres ADMIN y puedes asignarles actividades.</p>
        </div>
      )}
      {currentUser?.role === 'collaborator' && (
        <div style={{backgroundColor: '#e3f2fd', padding: 12, marginBottom: 12, borderLeft: '4px solid #2196F3', borderRadius: 4}}>
          <strong>Rol: Colaborador</strong>
          <p style={{margin: '8px 0 0 0', fontSize: '0.9em'}}>Puedes crear y gestionar tus actividades. Solo usuarios ADMIN pueden asignarte actividades.</p>
        </div>
      )}
      <div style={{border:'1px solid #ccc', padding: 10, marginBottom: 20}}>
        <h3>Inyectar nueva actividad</h3>
        <input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
        <br/>
        <textarea placeholder="Descripción" value={description} onChange={e=>setDescription(e.target.value)} style={{width: '100%', height: 80}}/>
        <br/>
        <label style={{display: 'block', marginTop: 8, marginBottom: 4, fontWeight: 'bold'}}>Plazo de Entrega:</label>
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={{padding: '6px', fontSize: '1em'}} />
        <br/>
        <button onClick={submit}>Registrar actividad</button>
        <button onClick={doLogout}>Logout</button>
      </div>
      <hr/>
      {weeklyDashboard && (
        <div style={{border: '2px solid #17a2b8', padding: 15, marginBottom: 20, backgroundColor: '#f0f8ff', borderRadius: '8px'}}>
          <h3>Dashboard Semáforo - Últimos 7 días</h3>
          <p style={{fontSize: '0.9em', color: '#666'}}>{weeklyDashboard.period}</p>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginTop: 12}}>
            <div style={{textAlign: 'center', padding: 15, backgroundColor: '#fff3e0', borderRadius: '6px', border: '2px solid #ffb74d'}}>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#f57f17'}}>{weeklyDashboard.in_progress}</div>
              <div style={{fontSize: '0.9em', color: '#e65100'}}>En Curso</div>
              <div style={{fontSize: '0.85em', color: '#666', marginTop: 4}}>{weeklyDashboard.percentages.in_progress}%</div>
            </div>
            <div style={{textAlign: 'center', padding: 15, backgroundColor: '#e8f5e9', borderRadius: '6px', border: '2px solid #66bb6a'}}>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#388e3c'}}>{weeklyDashboard.done}</div>
              <div style={{fontSize: '0.9em', color: '#1b5e20'}}>Completadas</div>
              <div style={{fontSize: '0.85em', color: '#666', marginTop: 4}}>{weeklyDashboard.percentages.done}%</div>
            </div>
            <div style={{textAlign: 'center', padding: 15, backgroundColor: '#f3e5f5', borderRadius: '6px', border: '2px solid #ba68c8'}}>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#7b1fa2'}}>{weeklyDashboard.cancelled}</div>
              <div style={{fontSize: '0.9em', color: '#6a1b9a'}}>Canceladas</div>
              <div style={{fontSize: '0.85em', color: '#666', marginTop: 4}}>{weeklyDashboard.percentages.cancelled}%</div>
            </div>
          </div>
          <div style={{marginTop: 12, textAlign: 'center', fontSize: '0.9em', color: '#666'}}>
            Total: {weeklyDashboard.total} actividades
          </div>
        </div>
      )}
      <h3>Filtros y opciones</h3>
      <div>
        Estado:
        <select value={filterStatus || ''} onChange={e=>setFilterStatus(e.target.value || null)}>
          <option value="">Todos</option>
          <option value="En Curso">En Curso</option>
          <option value="Completada">Completada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        <button onClick={doExport}>Exportar CSV</button>
        <button onClick={doExportWeekly}>Exportar semana</button>
        <button onClick={()=>{setShowWebhookSettings(!showWebhookSettings); if(!showWebhookSettings) loadWebhooks()}}>
          {showWebhookSettings ? 'Ocultar' : 'Mostrar'} Webhooks
        </button>
        <span style={{marginLeft:12}}>Recordatorio horas:</span>
        <input type="number" value={reminderHours} onChange={e=>setReminderHours(e.target.value)} style={{width:80, marginLeft:8}} />
        <button onClick={doSendReminders} style={{marginLeft:8, background:'#007bff', color:'white'}}>Enviar recordatorios</button>
      </div>
      {showWebhookSettings && (
        <div style={{border:'2px solid orange', padding: 10, marginTop: 10}}>
          <h3>Configurar Webhooks</h3>
          <div>
            <input placeholder="URL del webhook" value={newWebhookUrl} onChange={e=>setNewWebhookUrl(e.target.value)} />
            <select value={newWebhookEvent} onChange={e=>setNewWebhookEvent(e.target.value)}>
              <option value="*">Todos los eventos</option>
              <option value="activity_updated">Actividad actualizada</option>
            </select>
            <button onClick={addWebhook}>Agregar</button>
          </div>
          <h4>Webhooks registrados ({webhooks.length})</h4>
          {webhooks.length === 0 ? (
            <p>No hay webhooks.</p>
          ) : (
            <ul>
              {webhooks.map(w => (
                <li key={w.id}>
                  {w.url} - Evento: {w.event}
                  <button onClick={() => removeWebhook(w.id)} style={{marginLeft: 10, color: 'red'}}>Eliminar</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <hr/>
      <h3>Actividades ({activities.length})</h3>
      {activities.length === 0 ? (
        <p>No hay actividades.</p>
      ) : (
        <div>
          {activities.map(a=> (
            <div key={a.id} style={{border:'1px solid #ddd', padding: 8, margin: '8px 0', backgroundColor: '#f9f9f9'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div>
                  <strong>{a.title}</strong> <br/>
                  <small>{a.description}</small>
                </div>
                <span style={{background: a.status === 'Done' ? '#28a745' : a.status === 'In Progress' ? '#ffc107' : '#6c757d', color: 'white', padding: '4px 8px', borderRadius: '4px'}}>
                  {a.status}
                </span>
              </div>
              <div style={{fontSize: '0.85em', marginTop: 8, color: '#666'}}>
                <em>Inyectado: {a.injected_by} — {new Date(a.timestamp).toLocaleString()}</em>
                <br/>
                <em>Asignado: {a.assigned_to || 'Sin asignar'}</em>
                <br/>
                <em style={{color: getDeadlineStatus(a.due_date).color, fontWeight: 'bold'}}>
                  Plazo: {getDeadlineStatus(a.due_date).label}
                </em>
              </div>
              <div style={{marginTop: 8}}>
                <button onClick={() => changeStatus(a.id, 'En Curso')} style={{background: a.status === 'En Curso' ? '#ffc107' : '#ccc', marginRight: 4}}>En Curso</button>
                <button onClick={() => changeStatus(a.id, 'Completada')} style={{background: a.status === 'Completada' ? '#28a745' : '#ccc', color: 'white', marginRight: 4}}>Completada</button>
                <button onClick={() => changeStatus(a.id, 'Cancelada')} style={{background: a.status === 'Cancelada' ? '#dc3545' : '#ccc', color: 'white', marginRight: 4}}>Cancelada</button>
                <button onClick={() => setShowCollaboratorAssign(a.id)} style={{marginRight: 4, background: '#17a2b8', color: 'white'}}>Asignar Colaborador</button>
                {currentUser?.role === 'Admin' && (
                  <button onClick={() => changeDueDate(a.id, a.due_date)} style={{marginRight: 4}}>Plazo</button>
                )}
                {currentUser?.role === 'Admin' && (
                  <button onClick={() => removeActivity(a.id)} style={{marginRight: 4, background: '#dc3545', color: 'white'}}>Eliminar</button>
                )}
                <button onClick={() => toggleSubtasks(a.id)} style={{marginRight: 4, background: expandedActivity === a.id ? '#17a2b8' : '#6c757d', color: 'white'}}>
                  {expandedActivity === a.id ? '▼ Subtareas' : '▶ Subtareas'}
                </button>
                <button onClick={() => viewHistory(a.id)}>Historial</button>
              </div>
              {expandedActivity === a.id && (
                <div style={{marginTop: 12, paddingTop: 12, borderTop: '1px solid #ccc', backgroundColor: '#fff'}}>
                  <h4>Subtareas</h4>
                  {activitySubtasks[a.id] && activitySubtasks[a.id].map(sub => (
                    <div key={sub.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', marginBottom: 6, backgroundColor: '#f0f0f0', borderRadius: '4px'}}>
                      <div style={{flex: 1}}>
                        <strong>{sub.title}</strong>
                        {sub.description && <div style={{fontSize: '0.85em', color: '#666'}}>{sub.description}</div>}
                      </div>
                      <div style={{display: 'flex', gap: 4}}>
                        <button onClick={() => changeSubtaskStatus(a.id, sub.id, 'En Curso')} style={{background: sub.status === 'En Curso' ? '#ffc107' : '#ddd', color: sub.status === 'En Curso' ? 'black' : '#666', fontSize: '0.8em', padding: '4px 8px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontWeight: sub.status === 'En Curso' ? 'bold' : 'normal'}}>
                          En Curso
                        </button>
                        <button onClick={() => changeSubtaskStatus(a.id, sub.id, 'Completada')} style={{background: sub.status === 'Completada' ? '#28a745' : '#ddd', color: sub.status === 'Completada' ? 'white' : '#666', fontSize: '0.8em', padding: '4px 8px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontWeight: sub.status === 'Completada' ? 'bold' : 'normal'}}>
                          Completada
                        </button>
                        <button onClick={() => changeSubtaskStatus(a.id, sub.id, 'Cancelada')} style={{background: sub.status === 'Cancelada' ? '#6c757d' : '#ddd', color: sub.status === 'Cancelada' ? 'white' : '#666', fontSize: '0.8em', padding: '4px 8px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontWeight: sub.status === 'Cancelada' ? 'bold' : 'normal'}}>
                          Cancelada
                        </button>
                        <button onClick={() => removeSubtask(a.id, sub.id)} style={{background: '#dc3545', color: 'white', fontSize: '0.8em', padding: '4px 8px', borderRadius: '3px', border: 'none', cursor: 'pointer'}}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                  <div style={{marginTop: 8, display: 'flex', gap: 4}}>
                    <input 
                      placeholder="Nueva subtarea..." 
                      value={subtaskInput[a.id] || ''}
                      onChange={e => setSubtaskInput({...subtaskInput, [a.id]: e.target.value})}
                      onKeyPress={e => e.key === 'Enter' && createNewSubtask(a.id)}
                      style={{flex: 1, padding: '4px 8px'}}
                    />
                    <button onClick={() => createNewSubtask(a.id)} style={{background: '#28a745', color: 'white', padding: '4px 12px'}}>
                      +
                    </button>
                  </div>
                    <div style={{marginTop: 12}}>
                      <h4>Archivos</h4>
                      <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                        <input type="file" onChange={e => setFileInput({...fileInput, [a.id]: e.target.files[0]})} />
                        <button onClick={() => uploadFile(a.id)} style={{background: '#007bff', color: 'white'}}>Subir</button>
                        <button onClick={() => loadFiles(a.id)}>Refrescar</button>
                      </div>
                      <div style={{marginTop: 8}}>
                        {activityFiles[a.id] && activityFiles[a.id].length === 0 && <div>No hay archivos.</div>}
                        {activityFiles[a.id] && activityFiles[a.id].map(f => (
                          <div key={f.id} style={{display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#f8f9fa', marginTop: 6}}>
                            <div>
                              <strong>{f.filename}</strong>
                              <div style={{fontSize: '0.85em', color: '#666'}}>{(f.file_size||0) + ' bytes'}</div>
                            </div>
                            <div style={{display: 'flex', gap: 6}}>
                              <button onClick={() => downloadFile(a.id, f.id)} style={{background: '#17a2b8', color: 'white'}}>Descargar</button>
                              <button onClick={() => removeFile(a.id, f.id)} style={{background: '#dc3545', color: 'white'}}>Eliminar</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{marginTop: 12}}>
                      <h4>Invitaciones</h4>
                      <div style={{display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8}}>
                        <input 
                          placeholder="Email para invitar..." 
                          value={invitationEmail[a.id] || ''}
                          onChange={e => setInvitationEmail({...invitationEmail, [a.id]: e.target.value})}
                          onKeyPress={e => e.key === 'Enter' && sendInvitation(a.id)}
                          style={{flex: 1, padding: '4px 8px'}}
                        />
                        <button onClick={() => sendInvitation(a.id)} style={{background: '#28a745', color: 'white', padding: '4px 12px'}}>
                          Invitar
                        </button>
                        <button onClick={() => loadInvitations(a.id)} style={{background: '#6c757d', color: 'white', padding: '4px 12px'}}>
                          Refrescar
                        </button>
                      </div>
                      <div style={{marginTop: 8}}>
                        {activityInvitations[a.id] && activityInvitations[a.id].length === 0 && <div>No hay invitaciones.</div>}
                        {activityInvitations[a.id] && activityInvitations[a.id].map(inv => (
                          <div key={inv.id} style={{padding: '8px', backgroundColor: '#f0f0f0', marginTop: 6, borderRadius: '4px', borderLeft: inv.accepted_by ? '3px solid #28a745' : '3px solid #ffc107'}}>
                            <div><strong>{inv.invited_email}</strong></div>
                            <div style={{fontSize: '0.85em', color: '#666'}}>Creada: {new Date(inv.created_at).toLocaleString()}</div>
                            {inv.accepted_by && (
                              <div style={{fontSize: '0.85em', color: '#28a745', fontWeight: 'bold'}}>Aceptada por: {inv.accepted_by}</div>
                            )}
                            {!inv.accepted_by && (
                              <div style={{fontSize: '0.85em', color: '#ffc107'}}>Pendiente (vence: {new Date(inv.expires_at).toLocaleString()})</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{marginTop: 20}}>
        Página {currentPage} de {totalPages}
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>« Anterior</button>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente »</button>
      </div>

      {showCollaboratorAssign && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{backgroundColor: 'white', padding: 24, borderRadius: 8, maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto'}}>
            <h3>Asignar Colaborador a Actividad #{showCollaboratorAssign}</h3>
            <div style={{marginBottom: 16}}>
              <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold'}}>Selecciona un colaborador:</label>
              {collaborators.length === 0 ? (
                <p style={{color: '#999'}}>No hay colaboradores disponibles.</p>
              ) : (
                <select 
                  value={selectedCollaboratorId || ''} 
                  onChange={(e) => setSelectedCollaboratorId(parseInt(e.target.value))}
                  style={{width: '100%', padding: 8, fontSize: '1em', borderRadius: 4, border: '1px solid #ccc'}}
                >
                  <option value="">-- Selecciona --</option>
                  {collaborators.map(collab => (
                    <option key={collab.id} value={collab.id}>
                      {collab.full_name || collab.username} {collab.email && `(${collab.email})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div style={{display: 'flex', gap: 8, marginTop: 16}}>
              <button 
                onClick={() => assignToCollaborator(showCollaboratorAssign)} 
                disabled={!selectedCollaboratorId}
                style={{flex: 1, padding: '10px 20px', backgroundColor: selectedCollaboratorId ? '#28a745' : '#ccc', color: 'white', border: 'none', borderRadius: 4, cursor: selectedCollaboratorId ? 'pointer' : 'not-allowed'}}
              >
                Asignar
              </button>
              <button 
                onClick={() => {setShowCollaboratorAssign(null); setSelectedCollaboratorId(null);}} 
                style={{flex: 1, padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer'}}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {history && (
        <div style={{marginTop: 20, border: '2px solid #007bff', padding: 10}}>
          <h3>Historial de actividad #{history.activityId}</h3>
          <button onClick={() => setHistory(null)}>Cerrar</button>
          {history.records.length === 0 ? (
            <p>No hay cambios registrados.</p>
          ) : (
            <ul>
              {history.records.map(h => (
                <li key={h.id}>
                  <strong>{h.changed_by}</strong> cambió <strong>{h.changed_field}</strong> de "{h.old_value}" a "{h.new_value}"
                  <br/>
                  <small>{new Date(h.timestamp).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
