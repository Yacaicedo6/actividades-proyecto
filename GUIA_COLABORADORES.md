# 🤝 Guía del Sistema de Colaboradores

---

## 📌 ¿Cómo funciona?

### Roles de Usuario

El sistema tiene **2 roles**:

1. **👑 CORE (Administrador)**
   - El **primer usuario** que se registra es automáticamente CORE
   - Puede ver la lista de todos los colaboradores
   - Puede asignar actividades a colaboradores específicos
   - Puede crear más usuarios CORE
   - Tiene todos los permisos

2. **👤 COLLABORATOR (Colaborador)**
   - Todos los usuarios posteriores al primero
   - Puede crear y gestionar sus propias actividades
   - Puede recibir actividades asignadas por usuarios CORE
   - NO puede ver la lista de otros colaboradores
   - NO puede asignar actividades a otros

---

## 🔧 Solución a "No hay colaboradores disponibles"

### Opción 1: Verificar tu rol actual

Cuando inicies sesión, verás tu rol junto a tu nombre:
- 👑 CORE - Eres administrador
- 👤 COLABORADOR - Eres colaborador

### Opción 2: Convertir usuario en CORE (mediante base de datos)

Si necesitas convertir tu usuario actual en CORE:

**En PowerShell:**
```powershell
# Ir a la carpeta backend
cd E:\actividades-proyecto\backend

# Abrir SQLite
sqlite3 test.db

# Ver todos los usuarios y sus roles
SELECT id, username, role FROM users;

# Convertir usuario "yan" en CORE
UPDATE users SET role = 'core' WHERE username = 'yan';

# Verificar
SELECT id, username, role FROM users;

# Salir
.quit
```

### Opción 3: Empezar de cero

Si quieres empezar de nuevo y ser el primer usuario CORE:

```powershell
# Detener servidor (Ctrl+C en terminal uvicorn)
# Eliminar base de datos
cd E:\actividades-proyecto\backend
Remove-Item test.db

# Reiniciar servidor
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# En el navegador, registrarte de nuevo
# El PRIMER usuario será CORE automáticamente
```

---

## 🎯 Flujo de Trabajo Típico

### 1. Usuario CORE crea actividades
- Crea una actividad nueva
- Click en "Asignar Colaborador"
- Selecciona del dropdown
- El colaborador verá la actividad en su lista

### 2. Colaborador trabaja en actividad asignada
- Ve las actividades que le fueron asignadas
- Cambia estados (New → In Progress → Done)
- Agrega subtareas, archivos, etc.

### 3. Múltiples colaboradores
- Cada colaborador solo ve sus propias actividades
- El usuario CORE ve TODAS las actividades
- El CORE puede reasignar actividades

---

## 🆕 Invitar nuevos colaboradores

### Método 1: Registro normal
1. Comparte la URL de la app
2. El nuevo usuario se registra
3. Automáticamente será "collaborator"
4. Aparecerá en tu lista de colaboradores disponibles

### Método 2: Por invitación
1. Crea una actividad
2. Expande la actividad (▶ Subtareas)
3. Baja a la sección "Invitaciones"
4. Ingresa el email del colaborador
5. Se envía email con token
6. El invitado acepta y se registra
7. Obtiene acceso directo a esa actividad

---

## ❓ Preguntas Frecuentes

**P: ¿Cuántos usuarios CORE puedo tener?**
R: Ilimitados. Cualquier CORE puede crear más usuarios CORE usando el endpoint `/admin/core-users`.

**P: ¿Un colaborador puede ver actividades de otros colaboradores?**
R: No. Cada colaborador solo ve sus propias actividades y las que le fueron asignadas.

**P: ¿Cómo sé si soy CORE o COLLABORATOR?**
R: Al iniciar sesión, verás un badge junto a tu nombre con tu rol.

**P: ¿Un COLLABORATOR puede convertirse en CORE?**
R: Sí, pero solo mediante la base de datos o si otro CORE lo crea como CORE usando el endpoint admin.

**P: El dropdown de colaboradores está vacío, ¿por qué?**
R: Porque:
   1. No eres usuario CORE (solo CORE ve colaboradores), O
   2. No hay otros usuarios registrados además de ti

---

## 🚀 Comando Rápido: Verificar Rol

```powershell
cd E:\actividades-proyecto\backend
sqlite3 test.db "SELECT username, role FROM users;"
```

---

## 📝 Ejemplo Completo

```
Día 1:
- María se registra → Automáticamente CORE 👑
- María crea actividades

Día 2:
- Juan se registra → Automáticamente COLLABORATOR 👤
- Pedro se registra → Automáticamente COLLABORATOR 👤
- María ahora ve a Juan y Pedro en su lista de colaboradores

Día 3:
- María crea "Actividad X"
- María asigna "Actividad X" a Juan
- Juan ve "Actividad X" en su lista
- Juan cambia estado a "In Progress"
- Pedro NO ve "Actividad X" (no le fue asignada)

Día 4:
- María puede ver el progreso de todas las actividades
- Juan solo ve sus actividades asignadas
- Pedro solo ve sus actividades
```

---

## ✅ Resumen

| Característica | CORE 👑 | COLLABORATOR 👤 |
|---------------|---------|-----------------|
| Crear actividades | ✅ | ✅ |
| Ver sus actividades | ✅ | ✅ |
| Ver TODAS las actividades | ✅ | ❌ |
| Asignar a colaboradores | ✅ | ❌ |
| Ver lista de colaboradores | ✅ | ❌ |
| Invitar usuarios | ✅ | ✅ |
| Crear usuarios CORE | ✅ | ❌ |

