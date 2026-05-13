import { useState, useEffect } from 'react'
import { createActivity } from '../api'

export default function NuevaActividadForm({ token, indicators, username, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [indicatorId, setIndicatorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (indicators.length > 0 && !indicatorId) {
      setIndicatorId(indicators[0].id)
    }
  }, [indicators])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('El titulo es obligatorio'); return }
    if (!indicatorId) { setError('Selecciona un indicador'); return }
    setError('')
    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        injected_by: username,
        indicator_id: parseInt(indicatorId)
      }
      if (dueDate) payload.due_date = new Date(dueDate).toISOString()
      await createActivity(token, payload)
      setTitle('')
      setDescription('')
      setDueDate('')
      setIndicatorId(indicators[0]?.id || '')
      onCreated()
    } catch (err) {
      setError('Error al crear la actividad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-24">
      <div className="card-header">
        <h3 style={{ margin: 0 }}>Registrar nueva actividad</h3>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-error mb-16">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Titulo</label>
            <input className="form-input" placeholder="Nombre de la actividad"
              value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Descripcion</label>
            <textarea className="form-input" placeholder="Descripcion opcional"
              value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Plazo de entrega</label>
              <input className="form-input" type="date"
                value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label required">Indicador clave</label>
              <select className="form-input" value={indicatorId}
                onChange={e => setIndicatorId(e.target.value)} required>
                <option value="">Selecciona un indicador</option>
                {indicators.map(ind => (
                  <option key={ind.id} value={ind.id}>{ind.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primario" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar actividad'}
          </button>
        </form>
      </div>
    </div>
  )
}