-- ============================================================
-- Script de importación de actividades desde CSV
-- Archivo: MAPA DE ACCIONES GDA - Hoja 1.csv
-- Fecha: 2026-02-23
-- ============================================================

-- IMPORTANTE: Antes de ejecutar, verifica:
-- 1. El owner_id (ID del usuario admin o el que corresponda)
-- 2. Los indicator_id según el tipo de actividad

-- Para ver usuarios disponibles:
-- SELECT id, username FROM users;

-- Para ver indicadores disponibles:
-- SELECT id, name FROM indicators;

-- ============================================================
-- ACTIVIDADES DE DANZA
-- ============================================================

-- 1. PLAN ESPECIAL DE SALVAGUARDA SALSA
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    due_date,
    timestamp,
    updated_at
) VALUES (
    'DANZA - PLAN ESPECIAL DE SALVAGUARDA SALSA',
    'Se debe desarrollar una estrategia que permita realizar unos procesos de sistematización de los pasos de la salsa caleña y el desarrollo de una acción para fomentar el aprovechamiento económico desde los derechos colectivos. Subtarea: Estructurar nuevamente la propuesta 2 de la iniciativa después de la reunión sostenida con despacho y la Universidad San Buenaventura',
    'Gestión de las Artes Cultura',
    'En Curso',
    1,  -- Cambiar por el owner_id correcto
    6,  -- Indicador: Acciones de Gestión de las Artes
    '2026-02-14 23:59:59',
    '2026-02-12 08:00:00',
    NOW()
);

-- 2. GASTRONOMÍA Y MODA + FESTIVALES - Hermanamiento
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    timestamp,
    updated_at
) VALUES (
    'DANZA - GASTRONOMÍA Y MODA + FESTIVALES',
    'Aportar al documento marco de hermanamiento al proceso de hermanamiento con la Universidad San Buenaventura',
    'Sistema',
    'En Curso',
    1,
    2,  -- Indicador: Cumplimiento en acciones de asesoramiento
    NOW(),
    NOW()
);

-- 3. GASTRONOMÍA Y MODA - Priorizar Festivales
INSERT INTO activities (
    title, 
    description, 
    injected_by,
    assigned_to,
    assigned_email,
    status, 
    owner_id, 
    indicator_id,
    due_date,
    timestamp,
    updated_at
) VALUES (
    'DANZA - Priorizar actividades de Festivales',
    'Priorizar las actividades que requieren los Festivales, solo conversar con las delegas.',
    'victoria.danza.gestiondelasartes@gmail.com',
    'victoria.danza',
    'victoria.danza.gestiondelasartes@gmail.com',
    'En Curso',
    1,
    1,  -- Indicador: Cumplimiento acciones de fortalecimiento interno
    '2026-02-20 23:59:59',
    NOW(),
    NOW()
);

-- 4. GASTRONOMÍA Y MODA - Integración documento hermanamiento
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    timestamp,
    updated_at
) VALUES (
    'DANZA - Integrar info en documento hermanamiento',
    'Integrar dentro del documento de hermanamiento de la Secretaría con la San Bue la información vinculada a los demás proyectos que tiene la entidad (mediar, arts, Danza, Salsa, Festivales)',
    'Sistema',
    'En Curso',
    1,
    2,  -- Indicador: Cumplimiento en acciones de asesoramiento
    NOW(),
    NOW()
);

-- ============================================================
-- ACTIVIDADES ADMINISTRATIVAS
-- ============================================================

-- 5. Revisión y aprobación de informes
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    due_date,
    timestamp,
    updated_at
) VALUES (
    'ADMINISTRATIVOS - Revisión informes de pago',
    'Revisión y aprobación de informes de pago del equipo: Fernando vida (c2), Victoria Jaramillo (c2), Andrés Correa (c1), Andrés Correa (c2), Yan Caicedo (C2)',
    'Gestión de las Artes Cultura',
    'En Curso',
    1,
    1,  -- Indicador: Cumplimiento acciones de fortalecimiento interno
    '2026-02-18 23:59:59',
    '2026-02-17 08:00:00',
    NOW()
);

-- ============================================================
-- ARTICULACIÓN Y REUNIONES
-- ============================================================

-- 6. Articulación territorios
INSERT INTO activities (
    title, 
    description, 
    injected_by,
    assigned_to,
    assigned_email,
    status, 
    owner_id, 
    indicator_id,
    due_date,
    timestamp,
    updated_at
) VALUES (
    'ARTICULACIÓN TERRITORIOS - Reunión articulación',
    'Gestionar una reunión de articulación con diferentes procesos de las entidades. Victoria Jaramillo articulará la reunión',
    'victoria.danza.gestiondelasartes@gmail.com',
    'Victoria Jaramillo',
    'victoria.danza.gestiondelasartes@gmail.com',
    'En Curso',
    1,
    3,  -- Indicador: Cumplimiento en ejecución de encuentros de diálogo
    '2026-02-19 23:59:59',
    '2026-02-17 08:00:00',
    NOW()
);

-- 7. Comité de infancia
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    timestamp,
    updated_at
) VALUES (
    'COMITÉ DE INFANCIA - Reunión lunes 23',
    'Ojo que el lunes 23 hay reunión. Revisar citaciones',
    'Sistema',
    'En Curso',
    1,
    3,  -- Indicador: Cumplimiento en ejecución de encuentros de diálogo
    NOW(),
    NOW()
);

-- ============================================================
-- SEMILLEROS ARTÍSTICOS
-- ============================================================

-- 8. Enviar caracterización
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    due_date,
    timestamp,
    updated_at
) VALUES (
    'SEMILLEROS ARTÍSTICOS - Enviar caracterización',
    'Enviar la caracterización para revisión de Giovanna Segovia',
    'Sistema',
    'En Curso',
    1,
    1,  -- Indicador: Cumplimiento acciones de fortalecimiento interno
    '2026-02-19 23:59:59',
    '2026-02-11 08:00:00',
    NOW()
);

-- 9. Consolidar base de datos
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    due_date,
    timestamp,
    updated_at
) VALUES (
    'SEMILLEROS ARTÍSTICOS - Consolidar base de datos',
    'Consolidar la base de datos de los Semilleros Artísticos',
    'Sistema',
    'En Curso',
    1,
    1,  -- Indicador: Cumplimiento acciones de fortalecimiento interno
    '2026-02-19 23:59:59',
    '2026-02-12 08:00:00',
    NOW()
);

-- 10. Socialización virtual
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    timestamp,
    updated_at
) VALUES (
    'SEMILLEROS ARTÍSTICOS - Socialización virtual',
    'Socialización virtual de semilleros artísticos',
    'Sistema',
    'En Curso',
    1,
    1,  -- Indicador: Cumplimiento acciones de fortalecimiento interno
    NOW(),
    NOW()
);

-- 11. Bloquear espacios
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    timestamp,
    updated_at
) VALUES (
    'SEMILLEROS ARTÍSTICOS - Bloquear espacios',
    'Bloquear espacios para la ruta de semilleros - sala de ensayo - Giovanna. Viernes 27, 4 a 7 p.m. Sala de ensayos',
    'Sistema',
    'En Curso',
    1,
    1,  -- Indicador: Cumplimiento acciones de fortalecimiento interno
    NOW(),
    NOW()
);

-- ============================================================
-- RUTAS Y PROYECTOS
-- ============================================================

-- 12. Ruta de la Danza
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    due_date,
    timestamp,
    updated_at
) VALUES (
    'RUTA DE LA DANZA - Estructurar documento base',
    'Estructurar el documento base de la danza',
    'Gestión de las Artes Cultura',
    'En Curso',
    1,
    5,  -- Indicador: Cumplimiento en la construcción de rutas proyectadas
    '2026-02-20 23:59:59',
    '2026-02-19 08:00:00',
    NOW()
);

-- 13. Asesoría Festival de Ballet
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    timestamp,
    updated_at
) VALUES (
    'ASESORÍA FESTIVAL DE BALLET',
    'Articulación con los semilleros artísticos para Programación',
    'Sistema',
    'En Curso',
    1,
    2,  -- Indicador: Cumplimiento en acciones de asesoramiento
    NOW(),
    NOW()
);

-- 14. Ruta de Gestión Cultural
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    timestamp,
    updated_at
) VALUES (
    'RUTA DE GESTIÓN CULTURAL COMUNITARIA C16',
    'Cómo vamos a evaluar el proceso',
    'Sistema',
    'En Curso',
    1,
    5,  -- Indicador: Cumplimiento en la construcción de rutas proyectadas
    NOW(),
    NOW()
);

-- 15. SENA
INSERT INTO activities (
    title, 
    description, 
    injected_by, 
    status, 
    owner_id, 
    indicator_id,
    timestamp,
    updated_at
) VALUES (
    'SENA - Jurados para evaluación',
    'DANZA, CANTO Y TEATRO. 9 JURADOS QUE PUEDAN ACOMPAÑAR 4 O 5 HORAS. 30 DE ABRIL O 28 DE MAYO 2 A 7 P.M.',
    'Sistema',
    'En Curso',
    1,
    2,  -- Indicador: Cumplimiento en acciones de asesoramiento
    NOW(),
    NOW()
);

-- ============================================================
-- OTROS
-- ============================================================

-- 16. ORFEO
INSERT INTO activities (
    title, 
    description, 
    injected_by,
    assigned_email,
    status, 
    owner_id, 
    indicator_id,
    due_date,
    timestamp,
    updated_at
) VALUES (
    'ORFEO - Radicado 202641510100001454',
    'Proceso Orfeo con radicado No. 202641510100001454',
    'jesusrodriguezcali@gmail.com',
    'samirsmc2015@gmail.com',
    'En Curso',
    1,
    4,  -- Indicador: Cumplimiento en atención de PQRs
    '2026-02-19 23:59:59',
    '2026-02-19 08:00:00',
    NOW()
);

-- ============================================================
-- Verificación (ejecutar después de insertar)
-- ============================================================

-- Ver las actividades recién creadas
-- SELECT id, title, status, indicator_id, due_date FROM activities ORDER BY id DESC LIMIT 16;

-- Ver actividades con sus indicadores
-- SELECT a.id, a.title, i.name as indicador, a.status, a.due_date 
-- FROM activities a 
-- JOIN indicators i ON a.indicator_id = i.id 
-- ORDER BY a.id DESC LIMIT 16;
