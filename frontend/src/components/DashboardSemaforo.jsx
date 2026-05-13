export default function DashboardSemaforo({ data }) {
  if (!data) return null
  return (
    <div className="card mb-16">
      <div className="card-header">
        <h3 style={{ margin: 0 }}>Dashboard Semaforo - Ultimos 7 dias</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-claro)' }}>{data.period}</span>
      </div>
      <div className="card-body">
        <div className="dashboard-grid">
          <div className="dashboard-card en-curso">
            <div className="dashboard-card-number">{data.in_progress}</div>
            <div className="dashboard-card-label">En Curso</div>
            <div className="dashboard-card-percent">{data.percentages?.in_progress}%</div>
          </div>
          <div className="dashboard-card completada">
            <div className="dashboard-card-number">{data.done}</div>
            <div className="dashboard-card-label">Completadas</div>
            <div className="dashboard-card-percent">{data.percentages?.done}%</div>
          </div>
          <div className="dashboard-card cancelada">
            <div className="dashboard-card-number">{data.cancelled}</div>
            <div className="dashboard-card-label">Canceladas</div>
            <div className="dashboard-card-percent">{data.percentages?.cancelled}%</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-texto-claro)', marginTop: 8 }}>
          Total: {data.total} actividades
        </div>
      </div>
    </div>
  )
}