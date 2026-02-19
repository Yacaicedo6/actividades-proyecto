# Migración: Sistema de Indicadores

## Descripción
Esta migración agrega soporte para indicadores clave en las actividades, permitiendo categorizar cada actividad según el indicador al que responde.

## Cambios implementados

### Backend
1. **Nuevo modelo**: `Indicator` en `models.py`
2. **Nuevo campo**: `indicator_id` en modelo `Activity`
3. **Nuevos esquemas**: `IndicatorOut` en `schemas.py`
4. **Nuevo endpoint**: `GET /indicators` para obtener lista de indicadores
5. **CRUD actualizado**: Soporte para crear/actualizar actividades con indicador

### Frontend
1. **Selector de indicador**: Campo obligatorio al crear actividades
2. **Visualización**: Mostrar indicador en lista de actividades
3. **Edición (Admin)**: Botón "Cambiar Indicador" para corregir indicadores mal asignados
4. **Vista de colaboradores**: Rediseñada con búsqueda por nombre

## Indicadores configurados
1. Cumplimiento acciones de fortalecimiento interno de gestión de las artes
2. Cumplimiento en acciones de asesoramiento a agentes o sectores
3. Cumplimiento en ejecucion de encuentros de diálogo con agentes.
4. Cumplimiento en atención de PQR's de agentes o sectores del ecosistema.
5. Cumplimiento en la contrucción de rutas proyectadas para el año.
6. Acciones de Gestión de las Artes.

## Instrucciones de migración

### Opción 1: Usando DBeaver (Recomendado si no tienes Shell en Render)

1. Abre DBeaver y conéctate a tu base de datos PostgreSQL en Render
2. Abre el archivo `migration_indicadores.sql`
3. Ejecuta TODO el script de una vez (o línea por línea si prefieres)
4. Verifica que no haya errores

### Opción 2: Usando psql (si tienes acceso)

```bash
psql postgresql://actividades_proyecto_db_user:PASSWORD@HOST:5432/actividades_proyecto_db -f migration_indicadores.sql
```

Reemplaza:
- `PASSWORD` con tu contraseña de base de datos
- `HOST` con tu host de Render (ej: dpg-d6740dumcj7s739qv2pg-a.oregon-postgres.render.com)

## Verificación

Después de ejecutar la migración:

1. **Verifica la tabla indicators**:
   ```sql
   SELECT * FROM indicators;
   ```
   Deberías ver 6 registros.

2. **Verifica las actividades**:
   ```sql
   SELECT id, title, indicator_id FROM activities LIMIT 5;
   ```
   Todas las actividades existentes deberían tener `indicator_id = 1` (el primero por defecto).

3. **Prueba en el frontend**:
   - Abre la aplicación
   - Crea una nueva actividad
   - Verifica que el selector de indicadores esté disponible
   - Selecciona un indicador y registra la actividad
   - Verifica que se muestre el indicador en la lista

## Rollback (si necesitas revertir)

```sql
-- Eliminar constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS fk_activities_indicator;

-- Eliminar columna
ALTER TABLE activities DROP COLUMN IF EXISTS indicator_id;

-- Eliminar tabla
DROP TABLE IF EXISTS indicators;
```

⚠️ **ADVERTENCIA**: El rollback eliminará los indicadores asignados a todas las actividades.

## Notas importantes

- **Campo obligatorio**: Al crear actividades, seleccionar un indicador es OBLIGATORIO
- **Permisos de Admin**: Solo ADMIN puede cambiar el indicador de una actividad existente
- **Actividades existentes**: Se les asignó automáticamente el primer indicador
- **Búsqueda mejorada**: La vista de colaboradores ahora tiene búsqueda por nombre/email
