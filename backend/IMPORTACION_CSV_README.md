# Importación de Actividades desde CSV

## Archivo generado
`backend/import_actividades_csv.sql`

Este script contiene **16 actividades** extraídas del archivo CSV "MAPA DE ACCIONES GDA - Hoja 1.csv".

---

## ⚠️ ANTES DE EJECUTAR

### 1. Verifica el `owner_id` (usuario propietario)

Ejecuta en DBeaver:
```sql
SELECT id, username FROM users;
```

Luego **reemplaza** todos los `owner_id = 1` en el script por el ID correcto del usuario admin o el usuario que debe ser propietario de estas actividades.

### 2. Revisa los `indicator_id` asignados

Los indicadores se asignaron según el tipo de actividad:

- **Indicador 1** (Fortalecimiento interno): Actividades de SEMILLEROS, revisión de informes
- **Indicador 2** (Asesoramiento): GASTRONOMÍA, FESTIVAL DE BALLET, SENA
- **Indicador 3** (Encuentros de diálogo): ARTICULACIÓN, COMITÉ DE INFANCIA
- **Indicador 4** (Atención PQRs): ORFEO
- **Indicador 5** (Construcción de rutas): RUTA DE LA DANZA, RUTA DE GESTIÓN CULTURAL
- **Indicador 6** (Gestión de las Artes): PLAN ESPECIAL SALVAGUARDA SALSA

Si necesitas cambiarlos, edita los valores de `indicator_id` en el script.

---

## 📋 Pasos para importar

### Opción A: En DBeaver (Recomendado)

1. **Abre DBeaver** y conéctate a tu base de datos PostgreSQL en Render
2. **Abre el archivo** `import_actividades_csv.sql`
3. **Revisa y ajusta** los `owner_id` e `indicator_id` si es necesario
4. **Ejecuta TODO el script** (botón ▶ Play)
5. **Verifica** los resultados ejecutando las consultas al final del script

### Opción B: Desde línea de comandos

```bash
psql postgresql://USER:PASS@HOST:5432/DB -f backend/import_actividades_csv.sql
```

---

## ✅ Verificación

Después de ejecutar, verifica las actividades desde DBeaver:

```sql
-- Ver las últimas 16 actividades creadas
SELECT id, title, status, due_date 
FROM activities 
ORDER BY id DESC 
LIMIT 16;
```

O verlas con sus indicadores:

```sql
SELECT a.id, a.title, i.name as indicador, a.status, a.due_date 
FROM activities a 
JOIN indicators i ON a.indicator_id = i.id 
ORDER BY a.id DESC 
LIMIT 16;
```

---

## 🌐 Ver en la aplicación

Las actividades **aparecerán automáticamente** en:
- https://yacaicedo6.github.io/actividades-proyecto/

Recarga la página y deberías verlas todas listadas.

---

## 📊 Resumen de las 16 actividades importadas

1. PLAN ESPECIAL DE SALVAGUARDA SALSA
2. GASTRONOMÍA Y MODA + FESTIVALES (Hermanamiento)
3. Priorizar actividades de Festivales
4. Integrar info en documento hermanamiento
5. Revisión informes de pago
6. Articulación territorios - Reunión
7. Comité de infancia
8. SEMILLEROS - Enviar caracterización
9. SEMILLEROS - Consolidar base de datos
10. SEMILLEROS - Socialización virtual
11. SEMILLEROS - Bloquear espacios
12. RUTA DE LA DANZA - Documento base
13. Asesoría Festival de Ballet
14. Ruta de Gestión Cultural C16
15. SENA - Jurados
16. ORFEO - Radicado

---

## 🔄 Si necesitas borrar las actividades importadas

En caso de error, puedes eliminarlas así:

```sql
-- Ver las últimas 16 actividades para confirmar sus IDs
SELECT id, title FROM activities ORDER BY id DESC LIMIT 16;

-- Borrar las últimas 16 (CUIDADO: ajusta el rango de IDs)
DELETE FROM activities WHERE id >= [ID_INICIO] AND id <= [ID_FIN];
```

Reemplaza `[ID_INICIO]` y `[ID_FIN]` con los IDs correctos.

---

## 📝 Notas adicionales

- Las fechas se convirtieron del formato DD/MM/YYYY del CSV a formato SQL
- Los estados "No iniciada" y "En curso" se mapearon a "En Curso"
- Las subtareas se agregaron en la descripción de cada actividad
- Los emails se asignaron en los campos `assigned_email` cuando estaban disponibles
