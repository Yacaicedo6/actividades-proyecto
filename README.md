# Sistema de Seguimiento de Actividades

Proyecto creado en `E:\actividades-proyecto\`

## Estructura

```
actividades-proyecto/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          (FastAPI app)
│   │   ├── models.py        (SQLAlchemy)
│   │   ├── schemas.py       (Pydantic)
│   │   ├── auth.py          (JWT + passwords)
│   │   ├── crud.py          (Database ops)
│   │   └── database.py      (SQLite connection)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   └── package.json
└── README.md
```

## Instalación y ejecución

### Terminal 1: Backend

```powershell
cd E:\actividades-proyecto\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2: Frontend

```powershell
cd E:\actividades-proyecto\frontend
npm install
npm run dev
```

Luego abre el navegador en la URL que muestre Vite (típicamente `http://127.0.0.1:5173`)

## Función

1. **Registrarse** con usuario y contraseña
2. **Iniciar sesión**
3. **Inyectar actividades** manualmente con título y descripción
4. **Ver historial** de actividades registradas con inyector y marca de tiempo

## Seguridad

- Autenticación JWT
- Contraseñas hasheadas con pbkdf2_sha256
- Base de datos SQLite (desarrollo)
- CORS configurado para localhost

## Notas

- Para producción: cambiar SECRET_KEY, usar base de datos real (Postgres), habilitar HTTPS, etc.
- Todos los paquetes están aislados en `venv` para el backend
- El frontend usa Vite + React 18
