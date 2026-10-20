# asistApp

Aplicación web para el registro de asistencia de docentes y estudiantes, desarrollada para el uso administrativo en instituciones educativas argentinas (nivel secundario, primario, inicial y terciario/universitario).

> Trabajo realizado para la facultad. Los datos incluidos son **ficticios** y solo sirven para demostración.

## Qué hace

- **Asistencia de profesores** (`index.html`): carga de novedades diarias (faltas justificadas/injustificadas, licencias, llegadas tarde, etc.), horarios semanales, resumen del día y de la jornada.
- **Asistencia de estudiantes** (`estudiantes.html`): organizada por carrera y año, con el resumen del día (presentes, ausentes, total y % de asistencia) en el encabezado.
- Gestión de usuarios con roles (directivo, administrativo, preceptor, profesor, invitado).
- Exportación de reportes (Excel / PDF).
- Respaldo y archivo de ciclos lectivos.

## Tecnologías

- HTML, CSS y JavaScript puro (sin frameworks)
- [Supabase](https://supabase.com) (PostgreSQL + autenticación + API REST) como backend
- SheetJS y jsPDF para exportar reportes

## Estructura

| Archivo | Descripción |
|---|---|
| `index.html` | Pantalla de profesores |
| `estudiantes.html` | Pantalla de estudiantes por carrera |
| `app.js` | Lógica compartida (autenticación, carga de datos, renderizado) |
| `styles.css` | Estilos |
| `seed_demo.sql` | Datos de prueba: 30 profesores y 10 estudiantes por carrera |

## Cómo ponerla en marcha

1. Crear un proyecto en [Supabase](https://supabase.com) con las tablas `docentes`, `novedades`, `grupos`, `config`, `backups`, `usuarios` y `ciclos_archivados`.
2. En `app.js`, reemplazar `SB_URL` y `SB_KEY` por la URL y la clave pública (*publishable/anon*) de tu proyecto.
3. Activar **Row Level Security** en todas las tablas y definir políticas según el rol del usuario.
4. (Opcional) Ejecutar `seed_demo.sql` en el *SQL Editor* de Supabase para cargar datos de prueba.
5. Abrir `index.html` en el navegador o publicarlo con GitHub Pages.

### Datos de prueba

El script `seed_demo.sql` marca todas las filas con `notas = '[DEMO]'`. Para eliminarlas:

```sql
DELETE FROM docentes WHERE notas = '[DEMO]';
```

## Seguridad

Solo se usa la clave pública de Supabase en el frontend. **Nunca** se debe subir la clave `service_role`. La protección de los datos depende de las políticas RLS configuradas en la base.


