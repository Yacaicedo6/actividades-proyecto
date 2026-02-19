-- Migración: Agregar sistema de indicadores
-- Fecha: 2026-02-19
-- Descripción: Crear tabla de indicadores y agregar relación en actividades

-- 1. Crear tabla de indicadores
CREATE TABLE IF NOT EXISTS indicators (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Insertar los indicadores iniciales
INSERT INTO indicators (name, description) VALUES
    ('Cumplimiento acciones de fortalecimiento interno de gestión de las artes', 'Indicador para el seguimiento de acciones de fortalecimiento interno'),
    ('Cumplimiento en acciones de asesoramiento a agentes o sectores', 'Indicador para acciones de asesoramiento'),
    ('Cumplimiento en ejecucion de encuentros de diálogo con agentes.', 'Indicador para encuentros de diálogo'),
    ('Cumplimiento en atención de PQR''s de agentes o sectores del ecosistema.', 'Indicador para atención de PQRs'),
    ('Cumplimiento en la contrucción de rutas proyectadas para el año.', 'Indicador para construcción de rutas'),
    ('Acciones de Gestión de las Artes.', 'Indicador para gestión de las artes')
ON CONFLICT (name) DO NOTHING;

-- 3. Agregar columna indicator_id a la tabla activities
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS indicator_id INTEGER;

-- 4. Crear relación con la tabla indicators
-- Primero, asignar un indicador por defecto a actividades existentes (el primero)
UPDATE activities 
SET indicator_id = (SELECT id FROM indicators ORDER BY id LIMIT 1)
WHERE indicator_id IS NULL;

-- 5. Hacer la columna NOT NULL después de asignar valores por defecto
ALTER TABLE activities 
ALTER COLUMN indicator_id SET NOT NULL;

-- 6. Crear la foreign key constraint
ALTER TABLE activities 
ADD CONSTRAINT fk_activities_indicator 
FOREIGN KEY (indicator_id) 
REFERENCES indicators(id)
ON DELETE RESTRICT;

-- 7. Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_activities_indicator_id ON activities(indicator_id);

-- Verificación (opcional - comentar en producción)
-- SELECT * FROM indicators;
-- SELECT id, title, indicator_id FROM activities LIMIT 5;
