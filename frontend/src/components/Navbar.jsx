export default function Navbar({ currentUser, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div>
          <h1>Gestion de las Artes</h1>
          <span>Secretaria de Cultura de Cali</span>
        </div>
      </div>
      <div className="navbar-user">
        <div className="navbar-user-info">
          <div className="username">{currentUser.username}</div>
          <div className="user-role">
            {currentUser.role === 'Admin' ? 'Administrador' : 'Colaborador'}
          </div>
        </div>
        <span className={`badge ${currentUser.role === 'Admin' ? 'badge-admin' : 'badge-colaborador'}`}>
          {currentUser.role === 'Admin' ? 'ADMIN' : 'COLABORADOR'}
        </span>
        <button
          className="btn btn-secundario btn-sm"
          onClick={onLogout}
          style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
          Salir
        </button>
      </div>
    </nav>
  )
}