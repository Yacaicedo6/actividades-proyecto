const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

export async function register(username, password){
  const res = await fetch(`${API_BASE}/register`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username, password})
  })
  if(!res.ok) throw new Error('Register failed')
  return await res.json()
}

export async function login(username, password){
  const params = new URLSearchParams()
  params.append('username', username)
  params.append('password', password)
  const res = await fetch(`${API_BASE}/token`, {
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body: params
  })
  if(!res.ok) throw new Error('Login failed')
  const data = await res.json()
  return data.access_token
}

export async function getCurrentUser(token){
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) throw new Error('Failed to get current user')
  return await res.json()
}

export async function fetchActivities(token, status = null, assignedTo = null, page = 1, perPage = 10){
  const params = new URLSearchParams()
  if(status) params.append('status', status)
  if(assignedTo) params.append('assigned_to', assignedTo)
  params.append('page', page)
  params.append('per_page', perPage)
  const res = await fetch(`${API_BASE}/activities?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) return {total: 0, page: 1, per_page: 10, items: []}
  return await res.json()
}

export async function createActivity(token, payload){
  const res = await fetch(`${API_BASE}/activities`, {
    method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  if(!res.ok) throw new Error('Create failed')
  return await res.json()
}

export async function updateActivity(token, activityId, payload){
  try {
    const res = await fetch(`${API_BASE}/activities/${activityId}`, {
      method:'PATCH', 
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    if(!res.ok) {
      const errorText = await res.text()
      throw new Error(`Update failed: ${res.status}`)
    }
    return await res.json()
  } catch(error) {
    console.error('updateActivity error:', error)
    throw error
  }
}

export async function deleteActivity(token, activityId){
  const res = await fetch(`${API_BASE}/activities/${activityId}`, {
    method:'DELETE', headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) throw new Error('Delete failed')
  return await res.json()
}

export async function getActivityHistory(token, activityId){
  const res = await fetch(`${API_BASE}/activities/${activityId}/history`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) return []
  return await res.json()
}

export async function exportActivityCSV(token, status = null){
  const params = new URLSearchParams()
  if(status) params.append('status', status)
  const url = `${API_BASE}/activities/export/csv?${params}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = 'actividades.csv'
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(a)
}

export async function createWebhook(token, url, event = '*'){
  const res = await fetch(`${API_BASE}/webhooks`, {
    method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({url, event})
  })
  if(!res.ok) throw new Error('Webhook creation failed')
  return await res.json()
}

export async function listWebhooks(token){
  const res = await fetch(`${API_BASE}/webhooks`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) return []
  return await res.json()
}

export async function deleteWebhook(token, webhookId){
  const res = await fetch(`${API_BASE}/webhooks/${webhookId}`, {
    method:'DELETE', headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) throw new Error('Delete failed')
  return await res.json()
}

export async function createActivityFile(token, activityId, file){
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/activities/${activityId}/files`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  })
  if(!res.ok) throw new Error('Upload failed')
  return await res.json()
}

export async function listActivityFiles(token, activityId){
  const res = await fetch(`${API_BASE}/activities/${activityId}/files`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) return []
  return await res.json()
}

export function downloadActivityFile(token, activityId, fileId){
  // return URL to be opened by frontend (auth via bearer header not supported in simple link)
  return `${API_BASE}/activities/${activityId}/files/${fileId}`
}

export async function deleteActivityFile(token, activityId, fileId){
  const res = await fetch(`${API_BASE}/activities/${activityId}/files/${fileId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) throw new Error('Delete failed')
  return await res.json()
}

export async function createSubtask(token, activityId, payload){
  const res = await fetch(`${API_BASE}/activities/${activityId}/subtasks`, {
    method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  if(!res.ok) throw new Error('Create subtask failed')
  return await res.json()
}

export async function listSubtasks(token, activityId){
  const res = await fetch(`${API_BASE}/activities/${activityId}/subtasks`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) return []
  return await res.json()
}

export async function updateSubtask(token, activityId, subtaskId, payload){
  const res = await fetch(`${API_BASE}/activities/${activityId}/subtasks/${subtaskId}`, {
    method:'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  if(!res.ok) throw new Error('Update subtask failed')
  return await res.json()
}

export async function deleteSubtask(token, activityId, subtaskId){
  const res = await fetch(`${API_BASE}/activities/${activityId}/subtasks/${subtaskId}`, {
    method:'DELETE', headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) throw new Error('Delete subtask failed')
  return await res.json()
}

export async function getWeeklyDashboard(token){
  const res = await fetch(`${API_BASE}/dashboard/weekly`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) return null
  return await res.json()
}

export async function sendDueReminders(token, hours = 24){
  const res = await fetch(`${API_BASE}/activities/due/send-reminders?hours=${hours}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) throw new Error('Send reminders failed')
  return await res.json()
}

export async function createInvitation(token, activityId, invitedEmail){
  const res = await fetch(`${API_BASE}/activities/${activityId}/invite`, {
    method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({invited_email: invitedEmail})
  })
  if(!res.ok) throw new Error('Invitation creation failed')
  return await res.json()
}

export async function listInvitations(token, activityId){
  const res = await fetch(`${API_BASE}/activities/${activityId}/invitations`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) return []
  return await res.json()
}

export async function acceptInvitationLogin(token, username, password){
  const res = await fetch(`${API_BASE}/invite/${token}/accept-login`, {
    method: 'POST', headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({username, password})
  })
  if(!res.ok) throw new Error('Accept invitation failed')
  return await res.json()
}

export async function listCollaborators(token){
  const res = await fetch(`${API_BASE}/collaborators`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if(!res.ok) throw new Error('Failed to load collaborators')
  return await res.json()
}

export async function assignActivityToCollaborator(token, activityId, collaboratorId){
  const res = await fetch(`${API_BASE}/activities/${activityId}/assign`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ collaborator_id: collaboratorId })
  })
  if(!res.ok) throw new Error('Failed to assign activity')
  return await res.json()
}

export async function createCoreUser(token, username, password, email, fullName){
  const res = await fetch(`${API_BASE}/admin/core-users`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ 
      username, 
      password, 
      email, 
      full_name: fullName 
    })
  })
  if(!res.ok) throw new Error('Failed to create core user')
  return await res.json()
}
