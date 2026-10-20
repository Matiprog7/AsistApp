// ══════════════════════════════════════════════════════
//  NIVEL ACTIVO — inyectado por cada página HTML
//  'secundaria' | 'primaria' | 'inicial' | '' (todos)
// ══════════════════════════════════════════════════════
var NIVEL_ACTIVO = window.NIVEL_ACTIVO || '';
var NIVEL_CONFIG = {
  secundaria: { label:'Secundaria', emoji:'🏫', color:'#4F46E5', areaLabel:'Área / Departamento' },
  primaria:   { label:'Primaria',   emoji:'📚', color:'#059669', areaLabel:'Grado / Sala'        },
  inicial:    { label:'Inicial',    emoji:'🌱', color:'#DC2626', areaLabel:'Sala / Turno'         },
  '':         { label:'Todos los niveles', emoji:'🏫', color:'#4F46E5', areaLabel:'Área'         }
};

// Aplicar color de acento según nivel
(function(){
  var cfg = NIVEL_CONFIG[NIVEL_ACTIVO] || NIVEL_CONFIG[''];
  document.documentElement.style.setProperty('--nivel-color', cfg.color);
  if(NIVEL_ACTIVO){
    document.body.setAttribute('data-nivel', NIVEL_ACTIVO);
    document.title = 'Gestión '+cfg.label;
    // Actualizar h1 una vez el DOM esté listo
    document.addEventListener('DOMContentLoaded', function(){
      var h1 = document.querySelector('header h1');
      if(h1) h1.innerHTML = 'Gestión <span>'+cfg.label+'</span>';
    });
  }
})();


const SB_URL = "https://tsmutketniqcsfubbqal.supabase.co";
const SB_KEY = "sb_publishable_-bPKfS0cNcsAJughvLQhdg_dOp3GREu";

// ── supaFetch: wrapper liviano sobre la REST API de PostgREST ──
// Usado por estudiantes.html (y partes de app.js) con la convención:
//   supaFetch('GET',   tabla, 'col=eq.valor&col2=eq.valor2')        -> Promise<Array<fila>>
//   supaFetch('POST',  tabla, 'on_conflict=id', {id:.., campo:..})  -> upsert
//   supaFetch('PATCH', tabla, 'col=eq.valor', {campo:..})           -> update
function supaFetch(method, table, params, body){
  var qs = params || '';
  var url = SB_URL + '/rest/v1/' + table + (qs ? ('?'+qs) : '');
  function doFetch(token){
    var headers = { 'apikey': SB_KEY, 'Authorization': 'Bearer '+(token||SB_KEY), 'Content-Type':'application/json' };
    if(method==='POST')  headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
    if(method==='PATCH') headers['Prefer'] = 'return=representation';
    var opts = { method:method, headers:headers };
    if(body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(res){
      if(!res.ok){
        return res.text().then(function(t){ throw new Error(t || res.statusText); });
      }
      return res.text().then(function(t){
        if(!t) return [];
        try{ return JSON.parse(t); }catch(e){ return []; }
      });
    });
  }
  // Usar el token de la sesión actual (necesario para que las políticas RLS lo reconozcan)
  if(db && db.auth && db.auth.getSession){
    return db.auth.getSession().then(function(res){
      var token = res && res.data && res.data.session ? res.data.session.access_token : null;
      return doFetch(token);
    });
  }
  return doFetch(null);
}
window.supaFetch = supaFetch;

// ══════════════════════════════════════════════════════
//  CONSTANTES
// ══════════════════════════════════════════════════════
const CICLO_INICIO = new Date(2025, 2, 1);
const CICLO_FIN    = new Date(2025, 11, 19);
const DIAS_KEYS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const DIA_IDX   = { domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6 };
const DIA_ABREV = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DIA_ORDEN = [1,2,3,4,5,6,0];
const LABELS = {
  presente:'Presente', justificada:'Inasist. Justificada', injustificada:'Inasist. Injustificada',
  medica:'Carpeta Médica', medica_familiar:'C. Médica Familiar',
  cambio:'Cambio de Actividad', duelo:'Duelo / Fallec. Familiar',
  lic_embarazo:'Licencia por Embarazo', lic_gremial:'Licencia Gremial', carpeta_psiq:'Carpeta Psiquiátrica',
  formacion:'Jornada de Formación en otra institución',
  lic_capacitacion:'Licencia por Capacitación/Estudio',
  adelanto:'Adelanto de Horas',
  compensada:'Falta Compensada',
  justificada_parcial:'Falta Parcial Justificada',
  injustificada_parcial:'Falta Parcial Injustificada',
  paro:'Paro Docente',
  jubilacion:'Jubilación'
};
const LABELS_SHORT = {
  presente:'Presente', justificada:'Just.', injustificada:'Injust.',
  medica:'C. Médica', medica_familiar:'C. Méd. Fam.', cambio:'Cambio Act.', duelo:'Duelo',
  lic_embarazo:'Lic. Embarazo', lic_gremial:'Lic. Gremial', carpeta_psiq:'C. Psiquiát.',
  formacion:'Formación',
  lic_capacitacion:'Lic. Capacitación',
  adelanto:'Adelanto',
  compensada:'Compensada',
  justificada_parcial:'F.Parc.Just.',
  injustificada_parcial:'F.Parc.Injust.',
  paro:'Paro',
  jubilacion:'Jubilación'
};
const ICONOS = {
  presente:             '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  justificada:          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  injustificada:        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  medica:               '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  medica_familiar:      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  cambio:               '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  duelo:                '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  lic_embarazo:         '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="3"/><path d="M12 9c-4 0-6 2-6 5v1h4l1 5h2l1-5h4v-1c0-3-2-5-6-5z"/></svg>',
  lic_gremial:          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
  carpeta_psiq:         '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  formacion:            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  lic_capacitacion:     '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  adelanto:             '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>',
  compensada:           '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  justificada_parcial:  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>',
  injustificada_parcial:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  paro:                 '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>',
  jubilacion:           '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M9 14l-2 6m8-6l2 6"/><path d="M7 20h10"/></svg>'
};
const TIPOS = ['presente','justificada','injustificada','justificada_parcial','injustificada_parcial','medica','medica_familiar','cambio','duelo','lic_embarazo','lic_gremial','carpeta_psiq','formacion','lic_capacitacion','adelanto','compensada','paro','jubilacion'];
const TIPOS_AUSENCIA = ['justificada','injustificada'];
const TIPOS_CON_DURACION = ['lic_embarazo','lic_gremial','carpeta_psiq','medica','medica_familiar','duelo','paro'];
function esFalta(t){ return t==='justificada'||t==='injustificada'; } // solo completas para % asistencia
function esFaltaCualquiera(t){ return t==='justificada'||t==='injustificada'||t==='justificada_parcial'||t==='injustificada_parcial'; }
// Presente en el % del DÍA: sin novedad o explícitamente presente/cambio
// Registrar presente hoy para un docente nuevo (si hoy es día hábil y no es feriado)
function registrarPresenteHoy(docenteId){
  var hoy = fechaSeleccionada || hoyStr();
  if(esFeriado(hoy)) return; // no registrar en feriado
  var diaSem = new Date(hoy+'T12:00:00').getDay();
  if(diaSem===0||diaSem===6) return; // no registrar fines de semana
  // Verificar si ya tiene registro hoy
  db.from('novedades').select('id').eq('docente_id',docenteId).eq('fecha',hoy)
    .then(function(res){
      if(res.error) throw res.error;
      if(res.data && res.data.length) return; // ya tiene registro
      return db.from('novedades').insert({
        id: (crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2))),
        docente_id: docenteId,
        tipo: 'presente',
        fecha: hoy,
        mes: hoy.slice(0,7),
        anio: String(ANIO_SEL),
        created_at: new Date().toISOString()
      });
    }).catch(function(){});
}

function esPresenteDia(t){ return !t || t==='' || t==='presente' || t==='cambio' || t==='justificada_parcial' || t==='injustificada_parcial'; }
// Ausencia para el % del DÍA: cualquier novedad que no sea presente/cambio
function esAusencia(t){ return !esPresenteDia(t); }

// ══════════════════════════════════════════════════════
//  FIREBASE + AUTH  — multi-tenant, roles, licencia
// ══════════════════════════════════════════════════════
// ROLES:
//   'admin'     → crea/edita/elimina todo, registra novedades
//   'directivo' → ve todo, exporta, no modifica datos
//   'docente'   → solo ve su propio perfil
//   'invitado'  → solo ve su propio perfil (sin cuenta admin)
//
// COLECCIONES:
//   usuarios/{email}          → { rol, colegioId, nombre? }
//   colegios/{colegioId}/...  → empleados, novedades (multi-tenant)
//   licencias/{colegioId}     → { activa, vence, plan, contacto? }
//
// Single-tenant: una sola escuela, sin colegioId.
// Si no existe, se usa el legacy (para no romper la instalación actual).

var db=null, ROL=null;

// ══════════════════════════════════════════════════════
//  ROLES Y PERMISOS
// ══════════════════════════════════════════════════════
//  directivo      → todo: todos los niveles, editar, eliminar, config, reportes, usuarios
//  administrativo → asistencia de profesores, personal docente y estudiantes
//  preceptor      → asistencia de profesores y estudiantes
//  profesor       → asistencia de estudiantes
//  pendiente      → entró con Google pero aún no tiene rol asignado: sin acceso
//  invitado       → botón "ingresar sin cuenta": no ve nada
var ROL_LABELS = {
  directivo:'📋 Directivo', administrativo:'🗂️ Administrativo', preceptor:'📝 Preceptor',
  profesor:'👤 Profesor', pendiente:'⏳ Pendiente', invitado:'👁️ Invitado'
};
var ROLES_ASIGNABLES = ['pendiente','profesor','preceptor','administrativo','directivo'];
var ROL_ERROR_VERIF = false;
function normalizarRol(r){
  r = (r||'').toString().toLowerCase().trim();
  if(r==='admin') return 'directivo';          // compatibilidad: el viejo admin es directivo
  if(r==='docente') return 'profesor';         // compatibilidad: el viejo docente es profesor
  if(['directivo','administrativo','preceptor','profesor'].indexOf(r)>=0) return r;
  return 'pendiente';
}
function esFull(){ return ROL==='directivo'; }
// ¿Puede el usuario actual ver y poner asistencia a esta persona (docente / personal / estudiante)?
function puedeRegistrar(doc){
  if(!doc) return false;
  if(esFull()) return true;
  var esEst = (doc.nivel||'')==='estudiantes';
  if(ROL==='administrativo') return true;
  if(ROL==='preceptor')      return esEst || !esCargoReloj(doc.cargo);   // profesores + estudiantes (no personal no docente)
  if(ROL==='profesor')       return esEst;
  return false;
}
function nombreDeUsuario(user){
  if(!user) return '';
  var m = user.user_metadata || {};
  return m.full_name || m.name || user.displayName || user.email || '';
}
function fotoDeUsuario(user){
  if(!user) return '';
  var m = user.user_metadata || {};
  return m.avatar_url || m.picture || user.photoURL || '';
}
var TODOS_DOCENTES=[], TODOS_JUBILADOS=[], TODOS_GRUPOS=[], USUARIO_ACTUAL=null;
var CONFIG = { cicloInicio:'2026-02-18', cicloFin:'2026-12-30', feriados:[] };
var ANIO_SEL = new Date().getFullYear();

// ── Helpers de colección según tenant ──────────────
// ── Single-tenant: nombres de tabla fijos (sin colegioId) ──
function colEmpleados(anio){ return 'docentes'; }
// ── Helper: soft-delete (o restore) de uno o varios docentes, mergeando los
//    campos jsonb por-nivel (eliminado_en, fecha_eliminado_en, eliminado_por_en) ──
function softDeleteDocentes(ids, nivel, marcar){
  var quien = (USUARIO_ACTUAL && USUARIO_ACTUAL.email) ? USUARIO_ACTUAL.email : 'admin';
  var ahoraIso = new Date().toISOString();
  return db.from('docentes').select('id,eliminado_en,fecha_eliminado_en,eliminado_por_en').in('id', ids)
    .then(function(res){
      if(res.error) throw res.error;
      var rows = res.data || [];
      var updates = rows.map(function(row){
        var elimEn = Object.assign({}, row.eliminado_en||{});
        var fechaEn = Object.assign({}, row.fecha_eliminado_en||{});
        var porEn   = Object.assign({}, row.eliminado_por_en||{});
        if(marcar){
          elimEn[nivel]  = true;
          fechaEn[nivel] = ahoraIso;
          porEn[nivel]   = quien;
        } else {
          delete elimEn[nivel]; delete fechaEn[nivel]; delete porEn[nivel];
        }
        return db.from('docentes').update({
          eliminado_en: elimEn, fecha_eliminado_en: fechaEn, eliminado_por_en: porEn
        }).eq('id', row.id);
      });
      return Promise.all(updates);
    });
}
function colNovedades(anio){ return 'novedades'; }
function colAsistencia(anio){ return 'asistencia'; }

function iniciarFirebase(){
  try{
    db = supabase.createClient(SB_URL, SB_KEY);
    manejarAuth();
  }catch(err){ console.error(err); mostrarError(err.message); }
}

// Busca el rol del usuario en la tabla `usuarios`. Si no está registrado queda
// como 'pendiente' (sin acceso) y se deja una solicitud para que un directivo lo designe.
function resolverRol(user){
  ROL_ERROR_VERIF = false;
  var email = (user.email||'').toLowerCase();
  return db.from('usuarios').select('rol,nombre').ilike('email', email).limit(1)
    .then(function(res){
      if(res.error) throw res.error;
      var fila = (res.data && res.data[0]) || null;
      if(fila){
        ROL = normalizarRol(fila.rol);
      } else {
        ROL = 'pendiente';
        // Registrar la solicitud (si la política lo permite; si falla no pasa nada)
        return db.from('usuarios').insert({ email: email, nombre: nombreDeUsuario(user), rol: 'pendiente' })
          .then(function(){}, function(){});
      }
    })
    .catch(function(){ ROL = 'pendiente'; ROL_ERROR_VERIF = true; });
}
var _authResolviendo = null;
function iniciarSesionApp(user){
  USUARIO_ACTUAL = user;
  if(_authResolviendo === user.id+'|'+user.email) return;   // evita doble ejecución (onAuthStateChange + getSession)
  _authResolviendo = user.id+'|'+user.email;
  resolverRol(user).then(function(){ _authResolviendo = null; mostrarApp(user); });
}
function manejarAuth(){
  db.auth.onAuthStateChange(function(event, session){
    var user = session ? session.user : null;
    if(user){ iniciarSesionApp(user); }
    else { _authResolviendo = null; mostrarLoginScreen(); }
  });
  // Disparar estado inicial (por si ya hay sesión activa al cargar)
  db.auth.getSession().then(function(res){
    var session = res.data ? res.data.session : null;
    var user = session ? session.user : null;
    if(user){ iniciarSesionApp(user); }
    else { mostrarLoginScreen(); }
  });
}

// Pantalla para quien entró con Google pero todavía no tiene rol
function mostrarPendiente(user){
  var ls = document.getElementById('login-screen'); if(ls) ls.style.display='none';
  var h = document.body.querySelector('header'); if(h) h.style.display='none';
  var m = document.body.querySelector('main');   if(m) m.style.display='none';
  var ub = document.getElementById('user-bar'); if(ub) ub.style.display='none';
  var el = document.getElementById('pendiente-screen');
  if(el) el.remove();
  el = document.createElement('div');
  el.id = 'pendiente-screen';
  el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#f1f5f9;font-family:inherit;padding:1rem';
  var email = (user && user.email) ? user.email : '';
  var msg = ROL_ERROR_VERIF
    ? 'No pudimos verificar tu cuenta en este momento. Probá de nuevo en unos segundos.'
    : 'Tu cuenta se registró correctamente, pero todavía no tiene un rol asignado. Un directivo debe designarte como <strong>profesor, preceptor, administrativo o directivo</strong> para que puedas ingresar.';
  el.innerHTML =
    '<div style="background:#fff;max-width:420px;width:100%;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.12);padding:2rem;text-align:center">'+
      '<div style="font-size:2.4rem">'+(ROL_ERROR_VERIF?'⚠️':'⏳')+'</div>'+
      '<h2 style="margin:.6rem 0 .4rem;font-size:1.15rem;color:#0f172a">'+(ROL_ERROR_VERIF?'No se pudo verificar':'Cuenta pendiente de aprobación')+'</h2>'+
      '<p style="color:#475569;font-size:.88rem;line-height:1.5;margin:.3rem 0 1rem">'+msg+'</p>'+
      (email?'<p style="font-size:.8rem;color:#64748b;background:#f8fafc;border-radius:8px;padding:.5rem;margin:0 0 1.2rem;word-break:break-all">'+email.replace(/</g,'&lt;')+'</p>':'')+
      '<div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">'+
        '<button id="pend-reintentar" style="padding:.55rem 1rem;border-radius:8px;border:none;background:#2563eb;color:#fff;font-weight:600;cursor:pointer">Ya me asignaron, reintentar</button>'+
        '<button id="pend-salir" style="padding:.55rem 1rem;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#334155;cursor:pointer">Cerrar sesión</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(el);
  document.getElementById('pend-reintentar').addEventListener('click', function(){
    el.remove(); _authResolviendo = null;
    resolverRol(user).then(function(){ mostrarApp(user); });
  });
  document.getElementById('pend-salir').addEventListener('click', function(){
    el.remove(); ROL = null; db.auth.signOut().then(mostrarLoginScreen);
  });
}

var ANIO_INICIO_APP = 2026;
var ANIO_FIN_APP    = 2050;

function inicializarSelectorAnio(){
  var selAnio = document.getElementById('selector-anio');
  if(!selAnio||selAnio._listenerAdded) return;
  selAnio.innerHTML = '';
  var anioActual = new Date().getFullYear();
  for(var a = ANIO_FIN_APP; a >= ANIO_INICIO_APP; a--){
    var opt = document.createElement('option');
    if(a === anioActual)      opt.textContent = a+' (actual)';
    else                      opt.textContent = a;
    opt.value = a;
    if(a === ANIO_SEL) opt.selected = true;
    selAnio.appendChild(opt);
  }
  selAnio.addEventListener('change', function(){
    ANIO_SEL = parseInt(this.value);
    cargarYRender();
  });
  selAnio._listenerAdded = true;
}

function mostrarLoginScreen(){
  document.getElementById('login-screen').style.display='flex';
  var h = document.body.querySelector('header'); if(h) h.style.display='none';
  var m = document.body.querySelector('main');   if(m) m.style.display='none';
  document.getElementById('user-bar').style.display='none';
  var ls = document.getElementById('licencia-screen'); if(ls) ls.style.display='none';
}

function mostrarApp(user){
  var _pend = document.getElementById('pendiente-screen'); if(_pend) _pend.remove();
  if(user && ROL==='pendiente'){ mostrarPendiente(user); return; }
  document.getElementById('login-screen').style.display='none';
  document.getElementById('licencia-screen') && (document.getElementById('licencia-screen').style.display='none');
  document.body.querySelector('header').style.display='';
  document.body.querySelector('main').style.display='';
  inicializarSelectorAnio();

  var bar = document.getElementById('user-bar');
  var rolLabels = ROL_LABELS;
  if(user){
    bar.style.display='flex';
    var av = document.getElementById('user-avatar');
    var _foto = fotoDeUsuario(user);
    av.src=_foto; av.style.display=_foto?'':'none';
    document.getElementById('user-name').textContent=nombreDeUsuario(user);
    document.getElementById('user-role').textContent=rolLabels[ROL]||ROL||'Invitado';
    document.getElementById('user-role').className='role-badge '+(ROL||'invitado');
  } else {
    bar.style.display='flex';
    document.getElementById('user-avatar').style.display='none';
    document.getElementById('user-name').textContent='Invitado';
    document.getElementById('user-role').textContent='👁️ Solo lectura';
    document.getElementById('user-role').className='role-badge invitado';
  }

  var esAdmin      = esFull();
  var esDirectivo  = esFull();
  var puedeExportar = esAdmin || esDirectivo;
  var puedeVerTodo  = esAdmin || esDirectivo;

  function show(id, visible){
    var el = document.getElementById(id);
    if(!el) return;
    if(!visible){ el.style.display = 'none'; return; }
    // hdr-dd-items deben ser flex para alinearse correctamente
    el.style.display = el.classList.contains('hdr-dd-item') ? 'flex' : '';
  }

  // Solo admin puede modificar datos
  show('btn-nuevo',           esAdmin);
  show('btn-masivo',          esAdmin);
  show('btn-grupos',          esAdmin);
  show('btn-config',          esAdmin);
  show('btn-importar-excel',  esAdmin);
  show('btn-eliminar-masivo', esAdmin);
  show('btn-matriculas',      esAdmin || esDirectivo);
  show('btn-papelera',         esAdmin || esDirectivo);

  // Admin y directivo pueden ver reportes y exportar
  show('btn-export-dia',    puedeExportar);
  show('btn-ranking',       puedeVerTodo);
  show('btn-tendencias',    puedeVerTodo);
  show('btn-reporte-grupo', puedeVerTodo);
  show('btn-jubilados',     puedeVerTodo);

  // Badges del header: solo admin y directivo pueden filtrar clickeando
  if(!puedeVerTodo){
    document.querySelectorAll('.si-btn').forEach(function(b){
      b.style.pointerEvents='none'; b.style.cursor='default';
    });
  }

  prepararBotonUsuarios();
  cargarYRender();
}
(function(){ var b=document.getElementById('btn-login-google'); if(b) b.addEventListener('click',function(){
  db.auth.signInWithOAuth({ provider: 'google' }).then(function(res){
    if(res.error) toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> '+res.error.message,5000);
  });
}); })();
(function(){ var b=document.getElementById('btn-invitado'); if(b) b.addEventListener('click',function(){ ROL='invitado'; mostrarApp(null); }); })();
(function(){ var b=document.getElementById('btn-logout'); if(b) b.addEventListener('click',function(){ ROL=null; db.auth.signOut().then(mostrarLoginScreen); }); })();
function mostrarError(msg){
  document.getElementById('grid').innerHTML=
    '<div class="empty-state"><div style="font-size:2rem">⚠️</div><p>Error al conectar.<br><small>'+msg+'</small></p></div>';
}

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
function hoyStr(){
  var d=new Date();
  // Ajustar a zona horaria de Buenos Aires (UTC-3)
  var ba=new Date(d.toLocaleString('en-US',{timeZone:'America/Argentina/Buenos_Aires'}));
  var y=ba.getFullYear(), m=String(ba.getMonth()+1).padStart(2,'0'), day=String(ba.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}
function hoyDate(){
  var d=new Date();
  return new Date(d.toLocaleString('en-US',{timeZone:'America/Argentina/Buenos_Aires'}));
}
// Helper: devuelve solo el nombre, sin repetir el apellido si ya está contenido
function soloNombre(nombreCompleto, apellido){
  if(!apellido || !apellido.trim()) return nombreCompleto || '';
  var norm = function(s){ return (s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); };
  var ap = norm(apellido);
  var n  = (nombreCompleto||'').trim();
  var nN = norm(n);
  // Quitar apellido del inicio
  if(nN.startsWith(ap+' ')) return n.slice(apellido.trim().length).trim();
  // Quitar apellido del final
  if(nN.endsWith(' '+ap)) return n.slice(0, n.length - apellido.trim().length).trim();
  return n;
}

function mesStr(){ return hoyStr().slice(0,7); }
function toast(msg,dur){
  dur=dur||3000;
  var c=document.getElementById('toast-c'), el=document.createElement('div');
  el.className='toast'; el.innerHTML=msg; c.appendChild(el);
  setTimeout(function(){ el.classList.add('out'); el.addEventListener('animationend',function(){ el.remove(); }); },dur);
}
function minDia(h){
  // Devuelve minutos de reloj de una franja o array de franjas
  if(!h) return 0;
  if(Array.isArray(h)) return h.reduce(function(s,f){ return s+minDia(f); },0);
  if(!h.entrada||!h.salida) return 0;
  var ep=h.entrada.split(':').map(Number), sp=h.salida.split(':').map(Number);
  return Math.max(0, sp[0]*60+sp[1] - ep[0]*60-ep[1]);
}
function hsDia(h){
  // Horas de reloj (para compatibilidad interna)
  return minDia(h)/60;
}
function hsCatedraDia(h){
  // Horas cátedra: 1 hc = 40 min de reloj
  return minDia(h)/40;
}
function hsSemanales(horario){
  if(!horario) return 0;
  return Object.values(horario).reduce(function(s,h){ return s+hsDia(h); },0);
}
function hsCatedraSemanales(horario){
  if(!horario) return 0;
  return Object.values(horario).reduce(function(s,h){ return s+hsCatedraDia(h); },0);
}
function fmtHC(hc){
  return hc%1===0 ? hc+' hc' : hc.toFixed(1)+' hc';
}

// Cargos que usan horas RELOJ (no cátedra)
var CARGOS_RELOJ = ['preceptor','biblioteca','bibliotecario','secretari','director',
  'coordinador','coordinadora','ayudante','administrativ','vicedirector','autoridad'];

function esCargoReloj(cargo){
  if(!cargo) return false;
  var c = cargo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  return CARGOS_RELOJ.some(function(k){ return c.indexOf(k)>=0; });
}

function getTipoHs(doc){
  // Prioridad: campo guardado > detección por cargo
  if(doc && doc.tipoHs) return doc.tipoHs;
  if(doc && doc.cargo && esCargoReloj(doc.cargo)) return 'reloj';
  return 'catedra';
}

function calcHsDisplay(horario, tipoHs){
  // Devuelve { valor, unidad } según tipo de horas
  if(tipoHs === 'reloj'){
    var hs = Math.floor(hsSemanales(horario));
    return { valor: hs, unidad:'hs reloj' };
  } else {
    var hc = Math.floor(hsCatedraSemanales(horario));
    return { valor: hc, unidad:'hc' };
  }
}
function diasConHorario(horario){
  if(!horario) return [];
  return Object.keys(horario).filter(function(d){ return hsDia(horario[d])>0; });
}
function contarDias(horario,desde,hasta){
  var dias=diasConHorario(horario); if(!dias.length) return 0;
  var idxs=dias.map(function(d){ return DIA_IDX[d.toLowerCase()]; }).filter(function(i){ return i!==undefined; });
  var n=0, cur=new Date(desde); cur.setHours(0,0,0,0);
  var fin=new Date(hasta); fin.setHours(23,59,59,999);
  while(cur<=fin){
    var fs=cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
    if(idxs.indexOf(cur.getDay())>=0 && !esFeriado(fs)) n++;
    cur.setDate(cur.getDate()+1);
  }
  return n;
}
function calcDias(horario){
  var h=hoyDate();
  // Usar ANIO_SEL para calcular el ciclo del año seleccionado
  var cicloInicioStr = CONFIG.cicloInicio.replace(/^\d{4}/,String(ANIO_SEL));
  var cicloFinStr    = CONFIG.cicloFin.replace(/^\d{4}/,String(ANIO_SEL));
  var cicloIni=new Date(cicloInicioStr+'T12:00:00'), cicloFin2=new Date(cicloFinStr+'T12:00:00');
  return {
    diasMes: contarDias(horario,new Date(h.getFullYear(),h.getMonth(),1),new Date(h.getFullYear(),h.getMonth()+1,0)),
    diasAnio: contarDias(horario,cicloIni,cicloFin2)
  };
}
function calcPcts(diasMes,diasAnio,fm,fa){
  function s(t,f){ return t>0?Math.max(0,Math.min(100,((t-f)/t)*100)):100; }
  return { pctMes:s(diasMes,fm), pctAnio:s(diasAnio,fa) };
}
function pctColor(p){ return p>=90?'#16A34A':p>=75?'#CA8A04':'#DC2626'; }
function badge(pct,lbl){
  var r=21,sz=50,c=25,circ=2*Math.PI*r,off=circ-(pct/100)*circ,col=pctColor(pct);
  return '<div class="pct-badge" title="'+lbl+': '+Math.round(pct)+'%">'+
    '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 '+sz+' '+sz+'">'+
    '<circle cx="'+c+'" cy="'+c+'" r="'+r+'" fill="none" stroke="#E5E7EB" stroke-width="3"/>'+
    '<circle cx="'+c+'" cy="'+c+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="3.2" stroke-linecap="round"'+
    ' stroke-dasharray="'+circ.toFixed(2)+'" stroke-dashoffset="'+off.toFixed(2)+'"/>'+
    '</svg><span class="pv">'+Math.round(pct)+'</span><span class="ps">%</span><span class="pl">'+lbl+'</span></div>';
}

// ══════════════════════════════════════════════════════
//  BUILD CARD
// ══════════════════════════════════════════════════════
function buildCard(doc){
  var horario=doc.horario||{};
  var d=calcDias(horario);
  var fm=doc.faltasMesCalc!==undefined?doc.faltasMesCalc:(doc.faltasMes||0);
  var fa=doc.faltasAnioCalc!==undefined?doc.faltasAnioCalc:(doc.faltasAnio||0);
  var p=calcPcts(d.diasMes,d.diasAnio,fm,fa);
  var est=doc.estadoHoy||'', hoyIdx=hoyDate().getDay(), totalHs=hsSemanales(horario);
  var chipsHTML=DIA_ORDEN.map(function(idx){
    var key=DIAS_KEYS[idx], val=horario[key];
    if(!val||hsDia(val)===0) return '';
    var franjas=Array.isArray(val)?val:[val];
    franjas=franjas.filter(function(f){ return f&&f.entrada&&f.salida; }).sort(function(a,b){ return a.entrada<b.entrada?-1:a.entrada>b.entrada?1:0; });
    var hrsHTML=franjas.map(function(f){ return '<span class="hc-hrs">'+f.entrada.slice(0,5)+'–'+f.salida.slice(0,5)+'</span>'; }).join('');
    return '<div class="horario-chip'+(idx===hoyIdx?' hoy-chip':'')+'"><span class="hc-dia">'+DIA_ABREV[idx]+'</span>'+hrsHTML+'</div>';
  }).join('');
  var tieneHorarioHoy=diasConHorario(doc.horario||{}).some(function(x){ return DIA_IDX[x.toLowerCase()]===hoyDate().getDay(); });
  var esFeriadoHoy = esFeriado(fechaSeleccionada);
  var chipHTML = esFeriadoHoy
    ? '<span class="estado-chip feriado-chip">Feriado</span>'
    : est
      ? '<span class="estado-chip '+est+'">'+(LABELS_SHORT[est]||est)+'</span>'
      : (tieneHorarioHoy ? '<span class="estado-chip presente">Presente</span>' : '<span class="estado-chip">Sin registro</span>');
  var gruposDoc = doc.grupos || [];
  var gruposBadges = gruposDoc.map(function(gid){
    var g = TODOS_GRUPOS.find(function(x){ return x.id===gid; });
    if(!g) return '';
    return '<span class="grupo-badge" style="background:'+g.color+'22;color:'+g.color+';border:1px solid '+g.color+'44">'+g.nombre+'</span>';
  }).join('');
  var areaBadge = doc.area ? '<span class="area-badge">'+doc.area+'</span>' : '';
  var gruposHTML = (gruposBadges||areaBadge) ? '<div class="card-grupos">'+areaBadge+gruposBadges+'</div>' : '';
  var card=document.createElement('div');
  card.className='card'+(doc.jubilado?' card-jubilado':''); card.dataset.id=doc.id;
  card.dataset.jubilado = doc.jubilado ? '1' : '';
  card.dataset.nivel = doc.nivel || 'secundaria';
  card.dataset.area  = doc.area  || '';
  var diaIdxSel=new Date(fechaSeleccionada+'T12:00:00').getDay();
  var tieneHoyHorario=diasConHorario(doc.horario||{}).some(function(x){ return DIA_IDX[x.toLowerCase()]===diaIdxSel; });
  card.dataset.estado = esFeriadoHoy ? 'feriado' : (est || (tieneHoyHorario ? 'presente' : ''));
  // Para filtro: si tiene novedad que no es falta, mostrar ese estado real
  card.dataset.nombre=((doc.apellido?doc.apellido+' ':'')+doc.nombre).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  card.dataset.grupos=(doc.grupos||[]).join(',');
  // guardar dias que trabaja para filtro
  card.dataset.diasSemana=diasConHorario(horario).map(function(d){ return DIA_IDX[d.toLowerCase()]; }).join(',');
  // guardar turno del docente para HOY
  (function(){
    var diaKey = DIAS_KEYS[diaIdxSel];
    var val = horario[diaKey];
    if(val){
      var franjas = Array.isArray(val) ? val : [val];
      var tieneM=false, tieneT=false;
      franjas.forEach(function(f){
        if(!f||!f.entrada) return;
        var min = parseInt(f.entrada.split(':')[0])*60 + parseInt(f.entrada.split(':')[1]||0);
        if(min >= 7*60 && min <= 12*60+59) tieneM=true;
        if(min >= 13*60) tieneT=true;
      });
      if(tieneM && tieneT) card.dataset.turno='ambos';
      else if(tieneM)      card.dataset.turno='maniana';
      else if(tieneT)      card.dataset.turno='tarde';
      else                 card.dataset.turno='';
    } else { card.dataset.turno=''; }
  })();
  var _tipoHsDoc = getTipoHs(doc);
  var _hsDisplay = calcHsDisplay(horario, _tipoHsDoc);
  var hsTxt = _hsDisplay.valor+' '+_hsDisplay.unidad;
  var horarioSection=chipsHTML
    ?'<div class="horario-grid">'+chipsHTML+'</div><div class="hs-total">Carga semanal: <strong>'+hsTxt+' hs</strong></div>'
    :'<span style="font-size:.64rem;color:#9CA3AF">Sin horario — usá ✏️ Editar para configurar</span>';
  card.innerHTML=
    '<div class="card-header-top">'+
      '<div class="card-name">'+(doc.apellido&&doc.apellido.trim() ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido) : doc.nombre)+(doc.jubilado?' <span class="badge-jubilado">🏅 Jubilado/a</span>':'')+'</div>'+
      '<div class="card-cargo">'+(doc.cargo||'—')+(doc.materias?'<span class="card-materias"> · '+doc.materias+'</span>':'')+'</div>'+
      '<div class="badges-row" style="margin-top:.5rem">'+badge(p.pctMes,'MES')+badge(p.pctAnio,'AÑO')+'</div>'+
    '</div>'+
    '<div class="card-top">'+
      '<div class="card-actions">'+
        '<button class="btn-card btn-card-hist" data-action="historial"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Perfil</button>'+
        (puedeRegistrar(doc)?
          '<button class="btn-card btn-card-nov"  data-action="novedad"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Registrar</button>':'')+
        (esFull()?
          '<button class="btn-card btn-card-edit" data-action="editar">✏️ Editar</button>'+
          '<button class="btn-card btn-card-del"  data-action="eliminar"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>'
        :'')+
      '</div>'+
    '</div>'+
    '<div>'+horarioSection+'</div>'+
    gruposHTML+
    '<div style="display:flex;align-items:center;justify-content:space-between">'+
      chipHTML+
      '<span style="font-size:.61rem;color:#9CA3AF">'+fa+' falta'+(fa!==1?'s':'')+' anuales</span>'+
    '</div>';
  card.querySelector('[data-action="historial"]').addEventListener('click',function(e){ e.stopPropagation(); abrirPerfil(doc); });
  if(puedeRegistrar(doc)){
    var btnNov = card.querySelector('[data-action="novedad"]');
    var btnEdi = card.querySelector('[data-action="editar"]');
    var btnDel = card.querySelector('[data-action="eliminar"]');
    if(btnNov) btnNov.addEventListener('click', function(e){ e.stopPropagation(); abrirNovedad(doc); });
    if(btnEdi) btnEdi.addEventListener('click', function(e){ e.stopPropagation(); abrirDocente(doc); });
    if(btnDel) btnDel.addEventListener('click', function(e){ e.stopPropagation(); abrirConfirm(doc); });
  }
  return card;
}

// ══════════════════════════════════════════════════════
//  FILTROS Y BÚSQUEDA
// ══════════════════════════════════════════════════════
var filtroTexto='', filtroEstado='', filtroDia='', filtroGrupo='', filtroBadge='', filtroNivel='', filtroArea='';

function aplicarFiltros(){
  var cards=document.querySelectorAll('#grid .card');
  var hoyIdx=new Date(fechaSeleccionada+'T12:00:00').getDay();
  var visibles=0;
  cards.forEach(function(card){
    var nombre=card.dataset.nombre||'';
    var estado=card.dataset.estado||'';
    var diasSem=(card.dataset.diasSemana||'').split(',').map(Number).filter(function(n){ return !isNaN(n); });
    var nombreNorm = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    var filtroNorm = filtroTexto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    var okTexto = !filtroTexto || nombreNorm.includes(filtroNorm);
    var okEstado=!filtroEstado || (filtroEstado==='sin-registro'?(!estado||estado===''):estado===filtroEstado);
    // Filtro por badge del header
    var tieneHorarioHoy = diasSem.indexOf(hoyIdx) >= 0;
    var okBadge = true;
    if(filtroBadge){
      // Siempre debe tener horario ese día para aparecer en cualquier filtro de badge
      if(!tieneHorarioHoy){ okBadge = false; }
      else if(filtroBadge==='turno-maniana'){
        // incluye los que tienen mañana (solos o con ambos)
        okBadge = card.dataset.turno==='maniana' || card.dataset.turno==='ambos';
      } else if(filtroBadge==='turno-tarde'){
        // incluye los que tienen tarde (solos o con ambos)
        okBadge = card.dataset.turno==='tarde' || card.dataset.turno==='ambos';
      } else if(filtroBadge==='presente'){
        // Presentes PUROS: tiene horario hoy y sin ninguna novedad
        okBadge = !estado || estado==='' || estado==='presente';
      } else if(filtroBadge==='parcial'){
        okBadge = estado==='justificada_parcial'||estado==='injustificada_parcial';
      } else {
        okBadge = estado===filtroBadge;
      }
    }
    var okDia   =!filtroDia   || (filtroDia==='hoy'?diasSem.indexOf(hoyIdx)>=0:diasSem.indexOf(parseInt(filtroDia))>=0);
    var okGrupo =!filtroGrupo || (card.dataset.grupos||'').split(',').indexOf(filtroGrupo)>=0;
    var okNivel =!filtroNivel || (card.dataset.nivel||'secundaria')===filtroNivel;
    var okArea  =!filtroArea  || (card.dataset.area||'')===filtroArea;
    var mostrar=okTexto&&okEstado&&okBadge&&okDia&&okGrupo&&okNivel&&okArea;
    card.style.display=mostrar?'':'none';
    if(mostrar) visibles++;
  });
  var total=TODOS_DOCENTES.length;
  document.getElementById('filtro-count').textContent=visibles===total
    ?total+' docentes':visibles+' de '+total+' docentes';
}

document.getElementById('buscador').addEventListener('input',function(){ filtroTexto=this.value.trim(); aplicarFiltros(); });
document.getElementById('filtro-estado').addEventListener('change',function(){ filtroEstado=this.value; aplicarFiltros(); });

// ── Tabs de nivel ──────────────────────────────────────
var AREA_LABELS = { secundaria:'Área / Departamento', primaria:'Grado / Sala', inicial:'Sala / Turno' };

function actualizarTabsNivel(lista){
  // En páginas de nivel específico, ocultar las tabs y pre-fijar el nivel
  if(NIVEL_ACTIVO){
    var tabsEl = document.getElementById('nivel-tabs');
    if(tabsEl) tabsEl.style.display = 'none';
    filtroNivel = NIVEL_ACTIVO;
    return;
  }
  var contadores = { '':0, secundaria:0, primaria:0, inicial:0 };
  lista.forEach(function(d){
    var n = d.nivel || 'secundaria';
    contadores['']++;
    if(contadores[n] !== undefined) contadores[n]++;
  });
  var el;
  el = document.getElementById('ntab-count-todos');     if(el) el.textContent = contadores[''];
  el = document.getElementById('ntab-count-secundaria');if(el) el.textContent = contadores['secundaria'];
  el = document.getElementById('ntab-count-primaria');  if(el) el.textContent = contadores['primaria'];
  el = document.getElementById('ntab-count-inicial');   if(el) el.textContent = contadores['inicial'];
}

function actualizarFiltroArea(){
  var sel = document.getElementById('filtro-area');
  if(!sel) return;
  var nivelActual = filtroNivel || '';
  // recopilar áreas únicas del nivel activo
  var areas = [];
  TODOS_DOCENTES.forEach(function(d){
    var nDoc = d.nivel || 'secundaria';
    if(!nivelActual || nDoc === nivelActual){
      if(d.area && areas.indexOf(d.area) < 0) areas.push(d.area);
    }
  });
  areas.sort(function(a,b){ return a.localeCompare(b,'es'); });
  var lbl = nivelActual ? (AREA_LABELS[nivelActual]||'Área') : 'Área';
  sel.innerHTML = '<option value="">Todas las '+lbl.toLowerCase()+'s</option>';
  areas.forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a; opt.textContent = a;
    if(a === filtroArea) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.style.display = areas.length ? '' : 'none';
}

document.querySelectorAll('.nivel-tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    filtroNivel = this.dataset.nivel;
    filtroArea = '';
    document.querySelectorAll('.nivel-tab').forEach(function(t){ t.classList.remove('activo'); });
    this.classList.add('activo');
    actualizarFiltroArea();
    aplicarFiltros();
  });
});

document.getElementById('filtro-area') && document.getElementById('filtro-area').addEventListener('change', function(){
  filtroArea = this.value;
  aplicarFiltros();
});


document.getElementById('filtro-dia').addEventListener('change',function(){ filtroDia=this.value; aplicarFiltros(); });
document.getElementById('filtro-grupo').addEventListener('change',function(){ filtroGrupo=this.value; aplicarFiltros(); });

document.getElementById('filtro-reset').addEventListener('click',function(){
  filtroTexto=''; filtroEstado=''; filtroDia=''; filtroBadge=''; filtroArea='';
  document.querySelectorAll('.si-btn.activo-badge').forEach(function(b){ b.classList.remove('activo-badge'); });
  document.getElementById('buscador').value='';
  document.getElementById('filtro-estado').value='';
  document.getElementById('filtro-dia').value='';
  var sa = document.getElementById('filtro-area'); if(sa) sa.value='';
  aplicarFiltros();
});

// ══════════════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════════════
function renderDocentes(lista){
  // Cada rol ve solo a quienes puede registrar: directivo todo; administrativo todos;
  // preceptor profesores + estudiantes; profesor estudiantes; invitado/pendiente nada.
  if(!esFull()){
    lista = (ROL==='invitado' || !ROL) ? [] : lista.filter(puedeRegistrar);
  }
  // Directivo y admin ven todo
  TODOS_DOCENTES=lista;
  var grid=document.getElementById('grid');
  grid.innerHTML='';
  if(!lista.length){
    grid.innerHTML='<div class="empty-state"><div style="font-size:2.5rem">📋</div>'+
      (ROL==='profesor' && NIVEL_ACTIVO!=='estudiantes'
        ? '<p>Tu rol (Profesor) permite registrar asistencia de <strong>estudiantes</strong>. Ingresá desde la sección Estudiantes.</p></div>'
        : (esFull() ? '<p>No hay docentes. Usá <strong>"＋ Nuevo docente"</strong> para agregar.</p></div>'
                    : '<p>No hay personas para mostrar con tu rol.</p></div>'));
    document.getElementById('filtro-count').textContent='0 docentes';
    return;
  }
  lista.forEach(function(d){ grid.appendChild(buildCard(d)); });

  // Banner de feriado encima de la grilla
  var feriadoHoy = esFeriado(fechaSeleccionada);
  var bannerExistente = document.getElementById('banner-feriado');
  if(bannerExistente) bannerExistente.remove();
  if(feriadoHoy){
    var feriadoData = CONFIG.feriados.find(function(f){ return f.fecha===fechaSeleccionada; });
    var nomFeriado = feriadoData ? feriadoData.nombre : 'Feriado';
    var banner = document.createElement('div');
    banner.id = 'banner-feriado';
    banner.className = 'feriado-banner';
    banner.innerHTML = '<span class="feriado-banner-icon">🎌</span>'+
      '<span><strong>'+nomFeriado+'</strong> — No hay clases hoy. Los registros de asistencia no aplican.</span>';
    grid.insertBefore(banner, grid.firstChild);
  }

  actualizarResumen(lista);
  actualizarTabsNivel(lista);
  actualizarFiltroArea();
  aplicarFiltros();
}
function actualizarResumen(lista){
  var hoyIdx=new Date(fechaSeleccionada+'T12:00:00').getDay();

  // Si la fecha seleccionada es feriado, no mostrar ningún porcentaje ni contadores
  if(esFeriado(fechaSeleccionada)){
    document.getElementById('pct-hoy').textContent = '—';
    document.getElementById('pct-hoy').style.color = '';
    document.getElementById('pct-maniana') && (document.getElementById('pct-maniana').textContent='—');
    document.getElementById('pct-tarde')   && (document.getElementById('pct-tarde').textContent='—');
    ['cnt-p','cnt-j','cnt-i','cnt-m','cnt-mf','cnt-c','cnt-d','cnt-le','cnt-lg','cnt-cp','cnt-fo','cnt-fp','cnt-par'].forEach(function(id){
      var el=document.getElementById(id); if(el){ el.textContent='0'; el.style.color=''; }
    });
    document.getElementById('cnt-tot').textContent = '🎌 Feriado';
    return;
  }

  // Clasifica los turnos de un docente para un día específico
  // Devuelve array: puede ser ['maniana'], ['tarde'], o ['maniana','tarde']
  function getTurnosDia(doc, dowIdx){
    var horario = doc.horario || {};
    var diaKey = DIAS_KEYS[dowIdx];
    var val = horario[diaKey];
    if(!val) return [];
    var franjas = Array.isArray(val) ? val : [val];
    franjas = franjas.filter(function(f){ return f && f.entrada; });
    if(!franjas.length) return [];
    var tieneM = false, tieneT = false;
    franjas.forEach(function(f){
      var partes = f.entrada.split(':');
      var min = parseInt(partes[0])*60 + parseInt(partes[1]||0);
      if(min >= 7*60 && min <= 12*60+59) tieneM = true;
      if(min >= 13*60)                   tieneT = true;
    });
    var res = [];
    if(tieneM) res.push('maniana');
    if(tieneT) res.push('tarde');
    return res;
  }

  // Solo docentes NO jubilados
  var debVenir = lista.filter(function(d){
    return !d.jubilado &&
      diasConHorario(d.horario||{}).some(function(x){ return DIA_IDX[x.toLowerCase()]===hoyIdx; });
  });

  // Clasificar por turno (un doc con ambos turnos aparece en los dos grupos)
  var docsManiana = debVenir.filter(function(d){ return getTurnosDia(d,hoyIdx).indexOf('maniana')>=0; });
  var docsTarde   = debVenir.filter(function(d){ return getTurnosDia(d,hoyIdx).indexOf('tarde')>=0; });

  function pctPresentes(docs){
    if(!docs.length) return null;
    var pres = docs.filter(function(d){ return esPresenteDia(d.estadoHoy); }).length;
    return Math.round((pres/docs.length)*100);
  }
  function colorPct(p){ return p>=90?'#6EE7B7':p>=75?'#FDE047':'#FCA5A5'; }
  function renderPct(elId, pct){
    var el = document.getElementById(elId); if(!el) return;
    if(pct===null){ el.textContent='—'; el.style.color=''; return; }
    el.textContent = pct+'%';
    el.style.color = colorPct(pct);
  }

  // % general: cada persona cuenta UNA sola vez (sin duplicar los de ambos turnos)
  var presHoy  = debVenir.filter(function(d){ return esPresenteDia(d.estadoHoy); });
  var ausentes = debVenir.filter(function(d){ return esAusencia(d.estadoHoy); });
  var pct = debVenir.length>0 ? Math.round((presHoy.length/debVenir.length)*100) : 0;

  document.getElementById('pct-hoy').textContent = pct+'%';
  document.getElementById('pct-hoy').style.color = colorPct(pct);
  renderPct('pct-maniana', pctPresentes(docsManiana));
  renderPct('pct-tarde',   pctPresentes(docsTarde));

  function cnt(t){ return lista.filter(function(d){ return !d.jubilado && d.estadoHoy===t; }).length; }
  var presentesPuros = debVenir.filter(function(d){ return !d.estadoHoy || d.estadoHoy==='' || d.estadoHoy==='presente'; });
  document.getElementById('cnt-p').textContent  = presentesPuros.length;
  document.getElementById('cnt-j').textContent  = cnt('justificada');
  document.getElementById('cnt-i').textContent  = cnt('injustificada');
  document.getElementById('cnt-m').textContent  = cnt('medica');
  document.getElementById('cnt-mf').textContent = cnt('medica_familiar');
  document.getElementById('cnt-c').textContent  = cnt('cambio');
  document.getElementById('cnt-d').textContent  = cnt('duelo');
  document.getElementById('cnt-le').textContent = cnt('lic_embarazo');
  document.getElementById('cnt-lg').textContent = cnt('lic_gremial');
  document.getElementById('cnt-cp').textContent = cnt('carpeta_psiq');
  document.getElementById('cnt-fo').textContent = cnt('formacion');
  document.getElementById('cnt-fp').textContent = cnt('justificada_parcial')+cnt('injustificada_parcial');
  document.getElementById('cnt-par').textContent= cnt('paro');
  document.getElementById('cnt-tot').textContent= debVenir.length?(ausentes.length+'/'+debVenir.length):lista.length;
}

// ══════════════════════════════════════════════════════
//  CARGAR DATOS
// ══════════════════════════════════════════════════════
function cargarYRender(){
  document.getElementById('grid').innerHTML=
    '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';

  db.from('grupos').select('*').order('nombre').then(function(res){
    TODOS_GRUPOS = (res.data||[]).map(function(d){ return d; });
    actualizarFiltroGrupos();
  }).catch(function(){});

  // Config primero — los feriados deben estar listos antes de buildCard
  cargarConfig(function(){
    db.from('docentes').select('*').eq('anio', ANIO_SEL)
      .then(function(resE){
        if(resE.error) throw resE.error;
        var rows = resE.data || [];
        if(rows.length===0 && ANIO_SEL > ANIO_INICIO_APP){
          mostrarDialogoAnioNuevo(ANIO_SEL);
          document.getElementById('grid').innerHTML='<div class="anio-nuevo-placeholder"><p>📅 No hay docentes para <strong>'+ANIO_SEL+'</strong>.</p></div>';
          return;
        }
        var docs = rows.filter(function(dd){
          if(dd.esplaceholder) return false;
          // Excluir docentes con soft-delete en el nivel activo
          if(dd.eliminado_en){
            if(NIVEL_ACTIVO && dd.eliminado_en[NIVEL_ACTIVO] === true) return false;
            if(!NIVEL_ACTIVO){
              var nivelDoc = dd.nivel || 'secundaria';
              if(dd.eliminado_en[nivelDoc] === true) return false;
            }
          }
          return true;
        }).map(function(data){
          return { id:data.id, nombre:data.nombre||'', apellido:data.apellido||'', cargo:data.cargo||'',
                   horario:data.horario||{}, faltasMes:data.faltasMes||0,
                   faltasAnio:data.faltasAnio||0, estadoHoy:'', grupos:data.grupos||[],
                   materias:data.materias||'', notas:data.notas||'', tipoHs:data.tipo_hs||'',
                   jubilado:data.jubilado||false, nivel:data.nivel||'secundaria', area:data.area||'',
                   fechaIngreso:data.fechaingreso||'' };
        });
        if(NIVEL_ACTIVO){
          docs = docs.filter(function(d){ return (d.nivel||'secundaria') === NIVEL_ACTIVO; });
        }
        TODOS_JUBILADOS = docs.filter(function(d){ return d.jubilado; });
        function keyOrden(doc){
          // Si tiene apellido guardado, lo usa directo
          if(doc.apellido && doc.apellido.trim()){
            return (doc.apellido||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
                 + ' ' + (doc.nombre||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
          }
          // Fallback: última palabra como apellido
          var n = (doc.nombre||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
          var partes = n.split(/\s+/);
          return partes.length > 1 ? partes[partes.length-1]+' '+partes.slice(0,-1).join(' ') : n;
        }
        TODOS_JUBILADOS.sort(function(a,b){ return keyOrden(a).localeCompare(keyOrden(b),'es'); });
        docs.sort(function(a,b){ return keyOrden(a).localeCompare(keyOrden(b),'es'); });

        var hoy = fechaSeleccionada, mesActual = hoy.slice(0,7), anioActual = hoy.slice(0,4);

        db.from('novedades').select('*').eq('anio', String(ANIO_SEL)).eq('fecha', hoy)
          .then(function(resN){
            var mapa = {};
            (resN.data||[]).forEach(function(x){ mapa[x.docente_id]=x.tipo; });
            docs.forEach(function(d){ d.estadoHoy = mapa[d.id]||''; });

            return db.from('novedades').select('*')
              .eq('anio', String(ANIO_SEL))
              .gte('mes', anioActual+'-01')
              .lte('mes', anioActual+'-12')
              .then(function(resF){
                var contMes={}, contAnio={};
                (resF.data||[]).forEach(function(x){
                  if(!esFalta(x.tipo)) return;
                  if(x.mes===mesActual){ contMes[x.docente_id]=(contMes[x.docente_id]||0)+1; }
                  contAnio[x.docente_id]=(contAnio[x.docente_id]||0)+1;
                });
                docs.forEach(function(d){
                  d.faltasMesCalc  = contMes[d.id]||0;
                  d.faltasAnioCalc = contAnio[d.id]||0;
                });
                renderDocentes(docs);
              });
          })
          .catch(function(){ renderDocentes(docs); });
      })
      .catch(function(err){
        toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Error: '+err.message, 6000);
        mostrarError(err.message);
      });
  });
}

// ══════════════════════════════════════════════════════
//  MODAL PERFIL / HISTORIAL
// ══════════════════════════════════════════════════════
var mPerf=document.getElementById('modal-perfil'), docPerfil=null;
document.getElementById('xperf').addEventListener('click',function(){ mPerf.close(); });
mPerf.addEventListener('click',function(e){ if(e.target===mPerf) mPerf.close(); });

function abrirPerfil(doc){
  docPerfil=doc;
  var esAdmin=esFull();
  var puedeExportarPerfil = esFull();
  document.getElementById('perf-export-excel').style.display=puedeExportarPerfil?'':'none';
  document.getElementById('perf-export-pdf').style.display=puedeExportarPerfil?'':'none';
  var btnRegPerfil=document.getElementById('perf-btn-registrar');
  if(btnRegPerfil) btnRegPerfil.style.display=puedeRegistrar(doc)?'':'none';
  // Botón editar en perfil
  var btnEditarPerfil=document.getElementById('perf-btn-editar');
  if(btnEditarPerfil){
    btnEditarPerfil.style.display=esAdmin?'':'none';
    btnEditarPerfil.onclick=function(){ mPerf.close(); abrirDocente(doc); };
  }
  var perfNombreMostrar = (doc.apellido&&doc.apellido.trim()) ? doc.apellido.toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido) : doc.nombre;
  document.getElementById('perf-nom').textContent=perfNombreMostrar;
  document.getElementById('perf-cargo').textContent=doc.cargo||'—';
  var anioActual=new Date().getFullYear();
  document.getElementById('perf-tipo-periodo').value='anio';
  var selAnio=document.getElementById('perf-anio');
  selAnio.value=anioActual; selAnio.max=anioActual+1; selAnio.min=2020;
  // Inicializar selector de mes con mes actual
  document.getElementById('perf-mes').value=hoyStr().slice(0,7);
  mostrarControlPeriodo('anio');
  cargarHistorial();
  mPerf.showModal();
}
document.getElementById('perf-tipo-periodo').addEventListener('change',function(){ mostrarControlPeriodo(this.value); cargarHistorial(); });
document.getElementById('perf-anio').addEventListener('change',cargarHistorial);
document.getElementById('perf-mes').addEventListener('change',cargarHistorial);
document.getElementById('perf-desde').addEventListener('change',cargarHistorial);
document.getElementById('perf-hasta').addEventListener('change',cargarHistorial);

function mostrarControlPeriodo(tipo){
  document.getElementById('ctrl-anio').style.display =tipo==='anio' ?'':'none';
  document.getElementById('ctrl-mes').style.display  =tipo==='mes'  ?'':'none';
  document.getElementById('ctrl-rango').style.display=tipo==='rango'?'':'none';
}

function cargarHistorial(){
  if(!docPerfil) return;
  var tipo=document.getElementById('perf-tipo-periodo').value;
  var desde,hasta,anioActual=new Date().getFullYear();
  if(tipo==='anio'){
    var anio=parseInt(document.getElementById('perf-anio').value)||anioActual;
    desde=anio+'-01-01'; hasta=anio+'-12-31';
  } else if(tipo==='mes'){
    var mes=document.getElementById('perf-mes').value||hoyStr().slice(0,7);
    var pm=mes.split('-'); var anioMp=parseInt(pm[0]),mesMp=parseInt(pm[1])-1;
    desde=mes+'-01';
    var ultP=new Date(anioMp,mesMp+1,0);
    hasta=ultP.getFullYear()+'-'+String(ultP.getMonth()+1).padStart(2,'0')+'-'+String(ultP.getDate()).padStart(2,'0');
  } else {
    desde=document.getElementById('perf-desde').value;
    hasta=document.getElementById('perf-hasta').value;
    if(!desde||!hasta){ renderHistorial([],desde,hasta); return; }
  }
  document.getElementById('perf-historial').innerHTML='<div class="perf-loading">Cargando historial…</div>';
  db.from('novedades').select('*').eq('docente_id',docPerfil.id)
    .then(function(res){
      if(res.error) throw res.error;
      var items = (res.data||[]).map(function(x){ x._id=x.id; return x; })
        .filter(function(item){ return item.fecha >= desde && item.fecha <= hasta; });
      items.sort(function(a,b){ return b.fecha.localeCompare(a.fecha); });
      renderHistorial(items,desde,hasta);
    })
    .catch(function(err){
      document.getElementById('perf-historial').innerHTML='<p style="color:#DC2626;padding:1rem;font-size:.85rem">⚠️ Error al cargar: '+err.message+'</p>';
    });
}

function renderHistorial(items,desde,hasta){
  // Ignorar registros "presente" explícitos — los presentes se calculan como días sin novedad
  items = items.filter(function(i){ return i.tipo !== 'presente'; });

  // ── Detectar jubilación en el período ───────────────
  var itemJubilacion = items.find(function(i){ return i.tipo === 'jubilacion'; });
  var fechaJubilacion = itemJubilacion ? itemJubilacion.fecha : null;
  // Si hay jubilación, la asistencia solo se calcula hasta esa fecha inclusive
  var hastaEfectivo = fechaJubilacion && fechaJubilacion < hasta ? fechaJubilacion : hasta;

  var novedadesPorFecha={};
  items.forEach(function(i){ novedadesPorFecha[i.fecha]=i; });

  var horarioDocente=docPerfil?docPerfil.horario||{}:{};
  var diasPresentes=0;
  var cur=new Date(desde+'T12:00:00'), fin=new Date(hastaEfectivo+'T12:00:00');
  while(cur<=fin){
    var dia=cur.getDay();
    if(dia!==0&&dia!==6){
      var f=cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
      var tieneHorario=diasConHorario(horarioDocente).some(function(d){ return DIA_IDX[d.toLowerCase()]===dia; });
      if(tieneHorario&&!esFeriado(f)){
        var novF=novedadesPorFecha[f];
        // La jubilación no cuenta como presente ni como ausencia laboral normal
        if(novF && novF.tipo === 'jubilacion') { /* no contar */ }
        else if(!novF || esPresenteDia(novF.tipo)) diasPresentes++;
      }
    }
    cur.setDate(cur.getDate()+1);
  }

  var contadores={};
  TIPOS.forEach(function(t){ contadores[t]=0; });
  contadores['presente']=diasPresentes;
  // Solo contar novedades que NO son "presente" (los presentes ya están en diasPresentes)
  items.filter(function(i){ return i.tipo!=='presente'; }).forEach(function(i){
    if(contadores[i.tipo]!==undefined) contadores[i.tipo]++;
  });
  // Faltas completas + fracción de parciales
  var totalFaltas=(contadores.justificada||0)+(contadores.injustificada||0);
  var faltasParciales=items.filter(function(i){ return i.tipo==='justificada_parcial'||i.tipo==='injustificada_parcial'; });
  var pesoFaltasParciales=faltasParciales.reduce(function(s,i){ return s+(1/(i.franjasTotal||1)); },0);
  var totalFaltasConParciales=totalFaltas+pesoFaltasParciales;

  // Banner de jubilación
  var jubBanner = '';
  if(fechaJubilacion){
    var fJubObj = new Date(fechaJubilacion+'T12:00:00');
    var fJubFmt = fJubObj.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    fJubFmt = fJubFmt.charAt(0).toUpperCase()+fJubFmt.slice(1);
    jubBanner = '<div class="jub-historial-banner">'+
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M9 14l-2 6"/><path d="M15 14l2 6"/><path d="M7 20h10"/></svg>'+
      '<div>'+
        '<strong>Jubilado/a el '+fJubFmt+'</strong>'+
        '<span>La asistencia queda registrada hasta esa fecha. No se cuentan días posteriores.</span>'+
      '</div>'+
    '</div>';
  }

  // Stats: primero presente, luego el resto sin presente
  var totalDiasHabiles = diasPresentes + items.filter(function(i){ return i.tipo!=='presente'&&i.tipo!==undefined; }).length;
  var statsHTML=jubBanner+'<div class="perf-stats">'+
    '<div class="perf-stat-item presente">'+
      '<span class="perf-stat-icon">✅</span>'+
      '<span class="perf-stat-num">'+(contadores['presente']||0)+'/'+totalDiasHabiles+'</span>'+
      '<span class="perf-stat-lbl">Presente</span>'+
    '</div>'+
    TIPOS.filter(function(t){ return t!=='presente'; }).map(function(t){
      var n=contadores[t]||0; if(!n) return '';
      return '<div class="perf-stat-item '+t+'">'+
        '<span class="perf-stat-icon">'+ICONOS[t]+'</span>'+
        '<span class="perf-stat-num">'+n+'</span>'+
        '<span class="perf-stat-lbl">'+LABELS_SHORT[t]+'</span>'+
        '</div>';
    }).join('')+
    '</div>';

  // Para el % de asistencia: solo presentes + faltas reales (justificadas/injustificadas)
  // Los otros registros (carpeta médica, gremial, paro, etc.) no afectan el porcentaje
  var totalFaltasReales = (contadores.justificada||0) + (contadores.injustificada||0);
  var diasParaPct = diasPresentes + totalFaltasReales;
  var pctAsist = diasParaPct > 0 ? Math.round((diasPresentes / diasParaPct) * 100) : 100;
  var resumenHTML='<div class="perf-resumen-general">'+
    '<span>Dias habiles: <strong>'+totalDiasHabiles+'</strong></span>'+
    '<span>Presentes: <strong>'+(contadores.presente||0)+'</strong></span>'+
    '<span>Faltas: <strong>'+totalFaltas+(pesoFaltasParciales>0?' + '+pesoFaltasParciales.toFixed(2)+' parciales':'')+'</strong></span>'+
    '<span class="perf-pct-asist">Asistencia: <strong>'+pctAsist+'%</strong></span>'+
    '</div>';

  var esAdmin = esFull();
  var listaHTML='';
  var itemsFiltrados=items.filter(function(i){ return i.tipo!=='presente'; });
  if(!itemsFiltrados.length){
    listaHTML='<div class="perf-empty">Sin novedades en el período — todos los días hábiles están presentes</div>';
  } else {
    var porMes={};
    itemsFiltrados.forEach(function(item){ var mes=item.fecha.slice(0,7); if(!porMes[mes]) porMes[mes]=[]; porMes[mes].push(item); });
    listaHTML=Object.keys(porMes).sort().reverse().map(function(mes){
      var fObj=new Date(mes+'-01T12:00:00');
      var mesTit=fObj.toLocaleDateString('es-AR',{month:'long',year:'numeric'});
      mesTit=mesTit.charAt(0).toUpperCase()+mesTit.slice(1);
      var rows=porMes[mes].filter(function(i){ return i.tipo!=='presente'; }).map(function(item){
        var fO=new Date(item.fecha+'T12:00:00');
        var diaS=DIA_ABREV[fO.getDay()], numD=fO.getDate();
        var legajoBadge = (item.referencia||item.adjuntoURL)
          ? '<span class="hist-leg-badge" title="Tiene legajo adjunto"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></span>'
          : '';
        var btnLeg = (esAdmin&&item._id)
          ? '<button class="hist-btn-leg" data-novid="'+item._id+'" data-nom="'+encodeURIComponent(docPerfil?docPerfil.nombre:'')+'" data-tipo="'+item.tipo+'" data-fecha="'+item.fecha+'" title="Legajo / adjunto">'+
              '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>'+
            '</button>'
          : '';
        var necesitaDoc = TIPOS_CON_DOCS.indexOf(item.tipo) >= 0;
        var docCheck = (necesitaDoc && item._id)
          ? '<button class="hist-btn-docs'+(item.docsEntregados?' docs-ok':'')+'" data-novid="'+item._id+'" data-checked="'+(item.docsEntregados?'1':'0')+'" title="'+(item.docsEntregados?'Documentación entregada — click para desmarcar':'Marcar como documentación entregada')+'">'+
              (item.docsEntregados
                ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>')+
            '</button>'
          : '';
        return '<div class="hist-row '+item.tipo+'">'+
          '<span class="hist-fecha"><strong>'+diaS+' '+numD+'</strong></span>'+
          '<span class="hist-icon">'+ICONOS[item.tipo]+'</span>'+
          '<span class="hist-label">'+LABELS[item.tipo]+
            (item.modulos&&item.modulos.length?' <span class="hist-modulo">('+item.modulos.join(', ')+')</span>':
             item.modulo?' <span class="hist-modulo">('+item.modulo+')</span>':'')+
            ((item.obs||item.comentario)?'<span class="hist-comentario"> — '+(item.obs||item.comentario)+'</span>':'')+
            legajoBadge+
            (item.medicoNombre||item.matriculaMedico
              ?'<span class="hist-medico-info">'+
                  (item.medicoNombre?'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> '+item.medicoNombre:'')+(item.medicoNombre&&item.matriculaMedico?' &nbsp;·&nbsp; ':'')+
                  (item.matriculaMedico?'Mat. '+item.matriculaMedico:'')+
                '</span>'
              :'')+
          '</span>'+
          docCheck+
          btnLeg+
          '</div>';
      }).join('');
      return '<div class="hist-mes-grupo"><div class="hist-mes-titulo">'+mesTit+'</div>'+rows+'</div>';
    }).join('');
  }
  document.getElementById('perf-historial').innerHTML=statsHTML+resumenHTML+listaHTML;
  // Delegación: botones de legajo en historial
  document.querySelectorAll('.hist-btn-leg').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var novId  = this.dataset.novid;
      var nom    = decodeURIComponent(this.dataset.nom||'');
      var tipo   = this.dataset.tipo;
      var fecha  = this.dataset.fecha;
      abrirLegajo(novId, nom, tipo, fecha);
    });
  });
  // Delegación: botón de documentación entregada en historial
  document.querySelectorAll('.hist-btn-docs').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var novId   = this.dataset.novid;
      var checked = this.dataset.checked !== '1';  // toggle
      db.from('novedades').update({ docsEntregados: checked }).eq('id', novId)
        .then(function(){
          toast(checked ? '✅ Documentación marcada como entregada' : '↩️ Documentación desmarcada', 2500);
          cargarHistorial();  // recargar para actualizar el ícono
        })
        .catch(function(e){ toast('Error: '+e.message, 3000); });
    });
  });
}

// ══════════════════════════════════════════════════════
//  MODAL NOVEDAD
// ══════════════════════════════════════════════════════
var mNov=document.getElementById('modal-novedad'), docActivo=null, fechaNov='';
document.getElementById('xnov').addEventListener('click',function(){ mNov.close(); });
mNov.addEventListener('click',function(e){ if(e.target===mNov) mNov.close(); });
document.getElementById('nov-btn-hoy').addEventListener('click',function(){
  fechaNov=hoyStr(); document.getElementById('nov-fecha-input').value=fechaNov;
  renderHorarioDia(docActivo, fechaNov);
  cargarEstadoFecha();
});
document.getElementById('nov-fecha-input').addEventListener('change',function(){
  fechaNov=this.value||hoyStr();
  renderHorarioDia(docActivo, fechaNov);
  cargarEstadoFecha();
});

function renderHorarioDia(doc, fecha){
  var div = document.getElementById('nov-horario-dia');
  if(!doc || !fecha){ div.innerHTML=''; return; }
  var fObj   = new Date(fecha+'T12:00:00');
  var diaIdx = fObj.getDay();
  var diaKey = DIAS_KEYS[diaIdx];
  var horario = doc.horario || {};
  var val     = horario[diaKey];
  var franjas = val ? (Array.isArray(val)?val:[val]).filter(function(f){ return f.entrada&&f.salida; }) : [];
  var diasN   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var diaNom  = diasN[diaIdx];

  if(!franjas.length){
    div.innerHTML =
      '<div class="nov-horario-bar nov-no-trabaja">'+
        '📅 <strong>'+diaNom+'</strong>: no tiene horario este día'+
      '</div>';
  } else {
    var franjasHTML = franjas.map(function(f){
      return '<span class="nov-franja-chip">🕐 '+f.entrada.slice(0,5)+'–'+f.salida.slice(0,5)+'</span>';
    }).join('');
    var totalHs = hsDia(franjas);
    var hcNov = Math.round(hsCatedraDia(franjas));
    var hsTxt = hcNov+' hc';
    div.innerHTML =
      '<div class="nov-horario-bar nov-trabaja">'+
        '📅 <strong>'+diaNom+'</strong>: '+franjasHTML+
        '<span class="nov-hs-total">'+hsTxt+'</span>'+
      '</div>';
  }
}

function abrirNovedad(doc){
  if(!puedeRegistrar(doc)){ toast('⛔ Tu rol no te permite registrar asistencia de esta persona',3500); return; }
  docActivo=doc; fechaNov=hoyStr();
  var nombreDisplay = (doc.apellido&&doc.apellido.trim())
    ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido)
    : doc.nombre;
  document.getElementById('mn-nom').textContent=nombreDisplay;
  document.getElementById('mn-car').textContent=doc.cargo||'';
  document.getElementById('nov-fecha-input').value=fechaNov;
  document.getElementById('nov-estado-bar').innerHTML='';
  renderHorarioDia(doc, fechaNov);
  renderBotonesNovedad(''); cargarEstadoFecha(); mNov.showModal();
}
function renderBotonesNovedad(estadoActual){
  var grid=document.getElementById('nov-grid'); grid.innerHTML='';
  TIPOS.forEach(function(tipo){
    var btn=document.createElement('button');
    btn.className='nov-btn '+tipo+(estadoActual===tipo?' activo-actual':'');
    btn.dataset.tipo=tipo;
    // todos los botones son cuadrados
    btn.innerHTML='<span class="nov-icon">'+ICONOS[tipo]+'</span>'+LABELS[tipo]+
      (estadoActual===tipo?'<span class="nov-marca">✓ Actual</span>':'');
    grid.appendChild(btn);
  });
}

// Tipos que pueden registrarse como rango de días
var TIPOS_RANGO = ['medica','medica_familiar','carpeta_psiq','lic_embarazo','lic_gremial','duelo','paro','formacion','lic_capacitacion','jubilacion'];

function _limpiarBarrasNov(){
  document.getElementById('nov-duracion-bar').style.display='none';
  document.getElementById('nov-adelanto-bar').style.display='none';
  document.getElementById('nov-parcial-bar').style.display='none';
}

function borrarRegistroNovedad(docId){
  if(!puedeRegistrar(docActivo)){ toast('⛔ Tu rol no te permite modificar este registro',3500); return; }
  // Leer el registro para conocer su tipo, fecha y docenteId
  db.from('novedades').select('*').eq('id', docId).maybeSingle().then(function(res){
    if(res.error) throw res.error;
    var data = res.data;
    if(!data){ toast('Registro no encontrado', 3000); return; }
    var tipo = data.tipo;
    var docenteId = data.docente_id;
    var fechaDelDia = data.fecha; // la fecha del día que el usuario quiere borrar

    // Si NO es tipo rango, borrar solo este doc directamente
    if(TIPOS_RANGO.indexOf(tipo) < 0){
      if(!confirm('¿Borrar este registro?')) return;
      db.from('novedades').delete().eq('id', docId).then(function(){
        toast('🗑️ Registro eliminado');
        _limpiarBarrasNov(); cargarEstadoFecha(); cargarYRender();
      }).catch(function(err){ toast('Error: '+err.message, 4000); });
      return;
    }

    // Es tipo rango: traer TODOS los registros del mismo docenteId+tipo
    // para detectar el bloque contiguo al que pertenece este día
    db.from('novedades').select('*')
      .eq('docente_id', docenteId)
      .eq('tipo', tipo)
      .then(function(resT){
        if(resT.error) throw resT.error;
        var todos = resT.data || [];

        // Ordenar todas las fechas de este tipo para este docente
        var todasFechas = todos
          .map(function(d){ return { id: d.id, fecha: d.fecha }; })
          .sort(function(a,b){ return a.fecha < b.fecha ? -1 : 1; });

        // Agrupar en bloques contiguos (hasta 4 días de diferencia para cubrir fines de semana/feriados)
        var bloques = [];
        var bloqueActual = [];
        todasFechas.forEach(function(item){
          if(!bloqueActual.length){
            bloqueActual.push(item);
          } else {
            var ultimaFecha = new Date(bloqueActual[bloqueActual.length-1].fecha + 'T12:00:00');
            var estaFecha   = new Date(item.fecha + 'T12:00:00');
            var diffDias    = Math.round((estaFecha - ultimaFecha) / 86400000);
            // Si la diferencia es <= 4 días (cubre fines de semana + feriados) → mismo bloque
            if(diffDias <= 4){
              bloqueActual.push(item);
            } else {
              bloques.push(bloqueActual);
              bloqueActual = [item];
            }
          }
        });
        if(bloqueActual.length) bloques.push(bloqueActual);

        // Encontrar el bloque que contiene el día que se quiere borrar
        var bloqueDelDia = null;
        for(var i = 0; i < bloques.length; i++){
          var enc = bloques[i].some(function(item){ return item.fecha === fechaDelDia; });
          if(enc){ bloqueDelDia = bloques[i]; break; }
        }

        if(!bloqueDelDia || bloqueDelDia.length === 0){
          // No encontró (raro), borrar solo este
          if(!confirm('¿Borrar este registro?')) return;
          db.from('novedades').delete().eq('id', docId).then(function(){
            toast('🗑️ Registro eliminado');
            _limpiarBarrasNov(); cargarEstadoFecha(); cargarYRender();
          }).catch(function(err){ toast('Error: '+err.message, 4000); });
          return;
        }

        if(bloqueDelDia.length === 1){
          // Solo un día en este bloque
          if(!confirm('¿Borrar este registro?')) return;
          db.from('novedades').delete().eq('id', docId).then(function(){
            toast('🗑️ Registro eliminado');
            _limpiarBarrasNov(); cargarEstadoFecha(); cargarYRender();
          }).catch(function(err){ toast('Error: '+err.message, 4000); });
          return;
        }

        // Bloque con múltiples días: preguntar si borrar todo el bloque o solo este día
        var fechasBloque = bloqueDelDia.map(function(item){ return item.fecha; });
        var rango = fechasBloque[0]+' → '+fechasBloque[fechasBloque.length-1];
        var msg = 'Este registro ("'+(LABELS[tipo]||tipo)+'") abarca '+bloqueDelDia.length+' días ('+rango+').\n\n'
                + 'Aceptar → borrar TODOS los días de este registro\n'
                + 'Cancelar → borrar solo el día '+fechaDelDia;

        if(window.confirm(msg)){
          // Borrar todo el bloque
          var idsBloque = bloqueDelDia.map(function(item){ return item.id; });
          db.from('novedades').delete().in('id', idsBloque).then(function(){
            crearBackupAutomatico('Eliminar registro bloque — '+rango);
            toast('🗑️ Registro completo eliminado ('+bloqueDelDia.length+' días: '+rango+')');
            _limpiarBarrasNov(); cargarEstadoFecha(); cargarYRender();
          }).catch(function(err){ toast('Error: '+err.message, 4000); });
        } else {
          // Borrar solo este día
          db.from('novedades').delete().eq('id', docId).then(function(){
            crearBackupAutomatico('Eliminar registro día: '+fechaDelDia);
            toast('🗑️ Día '+fechaDelDia+' eliminado del registro');
            _limpiarBarrasNov(); cargarEstadoFecha(); cargarYRender();
          }).catch(function(err){ toast('Error: '+err.message, 4000); });
        }

      }).catch(function(err){ toast('Error: '+err.message, 4000); });
  }).catch(function(err){ toast('Error: '+err.message, 4000); });
}

// Tipos que requieren documentación
var TIPOS_CON_DOCS = ['justificada','injustificada','justificada_parcial','injustificada_parcial',
  'medica','medica_familiar','carpeta_psiq','duelo','lic_embarazo','lic_gremial','lic_capacitacion','formacion'];

function _labelDocs(tipo){
  if(tipo==='medica'||tipo==='medica_familiar'||tipo==='carpeta_psiq') return '📋 Cert. médico';
  if(tipo==='justificada'||tipo==='justificada_parcial') return '📋 Justificación';
  if(tipo==='injustificada'||tipo==='injustificada_parcial') return '📋 Nota/aviso';
  if(tipo==='duelo') return '📋 Documentación duelo';
  if(tipo==='lic_embarazo') return '📋 Cert. embarazo';
  if(tipo==='lic_gremial') return '📋 Nota gremial';
  if(tipo==='lic_capacitacion'||tipo==='formacion') return '📋 Cert. asistencia';
  return '📋 Documentación';
}

function toggleDocsEntregados(docId, checked){
  db.from('novedades').update({ docsEntregados: checked }).eq('id', docId)
    .then(function(res){ if(res.error) throw res.error; toast(checked ? '✅ Documentación marcada como entregada' : '↩️ Documentación desmarcada', 2500); })
    .catch(function(e){ toast('Error: '+e.message, 3000); });
}

function cargarEstadoFecha(){
  var bar=document.getElementById('nov-estado-bar');
  bar.innerHTML='<span style="color:#9CA3AF;font-size:.75rem;padding:.5rem 1.5rem;display:block">Cargando…</span>';
  db.from('novedades').select('*').eq('docente_id',docActivo.id).eq('fecha',fechaNov)
    .then(function(res){
      if(res.error) throw res.error;
      var docs=(res.data||[]).map(function(d){ return Object.assign({_id:d.id},d); });
      var completa=docs.find(function(d){ return d.tipo!=='justificada_parcial'&&d.tipo!=='injustificada_parcial'; });
      var estado=completa?completa.tipo:(docs.length?docs[docs.length-1].tipo:'');
      var docId=completa?completa._id:(docs.length?docs[docs.length-1]._id:null);
      var docsEntregados=completa?!!completa.docsEntregados:(docs.length?!!docs[docs.length-1].docsEntregados:false);
      var esHoy=fechaNov===hoyStr();
      var fObj=new Date(fechaNov+'T12:00:00');
      var diasN=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
      var etiq=esHoy?'hoy ('+diasN[fObj.getDay()]+')':diasN[fObj.getDay()]+' '+fObj.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});
      var necesitaDocs = estado && TIPOS_CON_DOCS.indexOf(estado) >= 0;
      bar.innerHTML=estado
        ?'<div class="nov-estado-actual">'+ICONOS[estado]+' <strong>'+etiq+':</strong> '+LABELS[estado]+
          (necesitaDocs&&docId
            ?'<label class="docs-check-label'+(docsEntregados?' docs-entregado':'')+'">'+
              '<input type="checkbox" class="docs-cb"'+(docsEntregados?' checked':'')+
              ' onchange="toggleDocsEntregados(\''+docId+'\',this.checked)"> '+_labelDocs(estado)+'</label>'
            :'')+
          (docId?' <button class="btn-borrar-registro" onclick="borrarRegistroNovedad(\''+docId+'\')">🗑️ Borrar</button>':'')+
          '</div>'
        :'<div class="nov-estado-vacio">Sin registro para <strong>'+etiq+'</strong></div>';
      renderBotonesNovedad(estado);    }).catch(function(){ bar.innerHTML=''; renderBotonesNovedad(''); });
}
// Variable para recordar qué tipo está pendiente de confirmar
var tipoPendiente = null;

document.getElementById('nov-grid').addEventListener('click',function(e){
  var btn=e.target.closest('.nov-btn'); if(!btn||!docActivo) return;
  var tipo=btn.dataset.tipo;
  tipoPendiente = tipo;

  var durBar    = document.getElementById('nov-duracion-bar');
  var adelBar   = document.getElementById('nov-adelanto-bar');
  var parcialBar= document.getElementById('nov-parcial-bar');

  // Resaltar botón seleccionado
  document.querySelectorAll('.nov-btn').forEach(function(b){ b.classList.remove('activo-actual'); });
  btn.classList.add('activo-actual');

  // Resetear barras
  adelBar.style.display='none';
  parcialBar.style.display='none';
  durBar.style.display='none';
  var comBar = document.getElementById('nov-comentario-bar');
  if(comBar) comBar.style.display='none';
  var comInput = document.getElementById('nov-comentario');
  if(comInput) comInput.value='';

  if(tipo==='adelanto'){
    // Adelanto: solo muestra la barra de compensación + confirmar
    adelBar.style.display='flex';
    document.getElementById('nov-adelanto-compensa').value='';
    return;
  }

  // === TODOS los tipos muestran la barra de duración ===
  // Nombre del tipo en la barra
  var nombreTipoEl = document.getElementById('nov-dur-tipo-nombre');
  if(nombreTipoEl) nombreTipoEl.textContent = LABELS[tipo]||tipo;

  // Reset opciones de duración
  document.querySelector('input[name="nov-dur-tipo"][value="dia"]').checked=true;
  document.getElementById('nov-dur-rango').style.display='none';
  document.getElementById('nov-dur-cant').style.display='none';
  document.getElementById('nov-dur-hasta').value='';
  document.getElementById('nov-dur-dias').value='1';

  // Mostrar opción parcial solo para faltas justificadas/injustificadas
  // Mostrar comentario para justificada e injustificada
  var comBar = document.getElementById('nov-comentario-bar');
  var comInput = document.getElementById('nov-comentario');
  var esFaltaConComentario = tipo==='justificada'||tipo==='injustificada'||
                              tipo==='justificada_parcial'||tipo==='injustificada_parcial';
  if(comBar){
    comBar.style.display = esFaltaConComentario ? 'flex' : 'none';
    if(comInput && !esFaltaConComentario) comInput.value = '';
  }

  var esFaltaTipo = tipo==='justificada'||tipo==='injustificada'||
                    tipo==='justificada_parcial'||tipo==='injustificada_parcial';

  // Mostrar comentario para faltas justificadas/injustificadas
  var comBar = document.getElementById('nov-comentario-bar');
  var comEl  = document.getElementById('nov-comentario');
  if(comBar){
    comBar.style.display = esFaltaTipo ? 'block' : 'none';
    if(comEl) comEl.value = '';
  }

  if(esFaltaTipo){
    parcialBar.style.display='flex';
    if(tipo==='justificada_parcial'||tipo==='injustificada_parcial'){
      document.querySelector('input[name="nov-parcial"][value="parcial"]').checked=true;
      document.getElementById('nov-parcial-modulos').style.display='block';
    } else {
      document.querySelector('input[name="nov-parcial"][value="completa"]').checked=true;
      document.getElementById('nov-parcial-modulos').style.display='none';
    }
    // Cargar módulos del día
    var franjasDia=[];
    if(docActivo){
      var diaKey=DIAS_KEYS[new Date(fechaNov+'T12:00:00').getDay()];
      var val=docActivo.horario&&docActivo.horario[diaKey];
      if(val) franjasDia=(Array.isArray(val)?val:[val]).filter(function(f){ return f&&f.entrada&&f.salida; });
      franjasDia.sort(function(a,b){ return a.entrada<b.entrada?-1:1; });
    }
    var modulosLista=document.getElementById('nov-modulos-lista');
    modulosLista.innerHTML=franjasDia.length
      ? franjasDia.map(function(f,i){
          return '<label class="modulo-chip"><input type="checkbox" name="nov-modulo" value="'+i+'"> '+
            f.entrada.slice(0,5)+'–'+f.salida.slice(0,5)+(f.materia?' ('+f.materia+')':'')+'</label>';
        }).join('')
      : '<span style="font-size:.72rem;color:#9CA3AF">No hay franjas cargadas para este día</span>';
  }

  durBar.style.display='flex';

  // Mostrar campo comentario solo para faltas justificadas e injustificadas
  var esJustOInjust = tipo==='justificada'||tipo==='injustificada'||
                      tipo==='justificada_parcial'||tipo==='injustificada_parcial';
  var comBar2 = document.getElementById('nov-comentario-bar');
  if(comBar2) comBar2.style.display = esJustOInjust ? 'flex' : 'none';

  // Mostrar campo médico solo para carpetas médicas y psiquiátrica
  var esTipoMedico = tipo==='medica'||tipo==='medica_familiar'||tipo==='carpeta_psiq';
  var medicoBar = document.getElementById('nov-medico-bar');
  if(medicoBar){
    medicoBar.style.display = esTipoMedico ? 'block' : 'none';
    document.getElementById('nov-medico-nombre').value = '';
    document.getElementById('nov-medico-matricula').value = '';
  }
});

// Botón Confirmar de duración
document.getElementById('nov-dur-confirmar').addEventListener('click', function(){
  if(!tipoPendiente || !docActivo) return;
  var tipo = tipoPendiente;
  var fecha = fechaNov;

  // Calcular fechasARegistrar
  var fechasARegistrar = [fecha];
  var durTipo = document.querySelector('input[name="nov-dur-tipo"]:checked').value;
  if(durTipo==='rango'){
    var hastaVal = document.getElementById('nov-dur-hasta').value;
    if(hastaVal && hastaVal >= fecha){
      fechasARegistrar = [];
      var cur = new Date(fecha+'T12:00:00');
      var fin = new Date(hastaVal+'T12:00:00');
      while(cur<=fin){
        var dia=cur.getDay();
        if(dia!==0&&dia!==6) fechasARegistrar.push(cur.toISOString().slice(0,10));
        cur.setDate(cur.getDate()+1);
      }
      if(!fechasARegistrar.length){ toast('El rango no tiene días hábiles',3000); return; }
    }
  } else if(durTipo==='dias'){
    var cantDias = parseInt(document.getElementById('nov-dur-dias').value)||1;
    fechasARegistrar = [];
    var cur2 = new Date(fecha+'T12:00:00'), agregados=0;
    while(agregados<cantDias){
      var dia2=cur2.getDay();
      if(dia2!==0&&dia2!==6){ fechasARegistrar.push(cur2.toISOString().slice(0,10)); agregados++; }
      cur2.setDate(cur2.getDate()+1);
    }
  }

  // Verificar falta parcial
  var tipofinal = tipo;
  var modulosFaltados = []; // ahora puede ser múltiple
  if(document.getElementById('nov-parcial-bar').style.display!=='none'){
    var esParcial = document.querySelector('input[name="nov-parcial"]:checked').value==='parcial';
    if(esParcial){
      tipofinal = (tipo==='justificada'||tipo==='justificada_parcial')?'justificada_parcial':'injustificada_parcial';
      var modSels = document.querySelectorAll('input[name="nov-modulo"]:checked');
      if(modSels.length){
        var diaKey2=DIAS_KEYS[new Date(fechaNov+'T12:00:00').getDay()];
        var val2=docActivo.horario&&docActivo.horario[diaKey2];
        var franjas2=val2?(Array.isArray(val2)?val2:[val2]).filter(function(f){ return f&&f.entrada&&f.salida; }):[];
        modSels.forEach(function(modSel){
          var idx=parseInt(modSel.value);
          if(franjas2[idx]){
            modulosFaltados.push(franjas2[idx].entrada.slice(0,5)+'-'+franjas2[idx].salida.slice(0,5)+(franjas2[idx].materia?' '+franjas2[idx].materia:''));
          }
        });
      }
      if(!modulosFaltados.length){ toast('Seleccioná al menos un módulo',2500); return; }
    }
  }
  var moduloFaltado = modulosFaltados.length ? modulosFaltados[0] : null; // compatibilidad

  document.getElementById('nov-duracion-bar').style.display='none';
  document.getElementById('nov-parcial-bar').style.display='none';
  var comBarConf = document.getElementById('nov-comentario-bar');
  if(comBarConf) comBarConf.style.display='none';
  ejecutarGuardadoNovedad(tipofinal, moduloFaltado, fechasARegistrar);
});

// Botón Cancelar de duración
document.getElementById('nov-dur-cancelar').addEventListener('click', function(){
  tipoPendiente = null;
  document.getElementById('nov-duracion-bar').style.display='none';
  document.getElementById('nov-parcial-bar').style.display='none';
  document.getElementById('nov-comentario-bar').style.display='none';
  document.getElementById('nov-comentario').value='';
  document.querySelectorAll('.nov-btn').forEach(function(b){ b.classList.remove('activo-actual'); });
  cargarEstadoFecha();
});

// Botón Confirmar de adelanto
document.getElementById('nov-ade-confirmar').addEventListener('click', function(){
  if(!tipoPendiente || !docActivo) return;
  document.getElementById('nov-adelanto-bar').style.display='none';
  ejecutarGuardadoNovedad('adelanto', null, [fechaNov]);
});

// Botón Cancelar de adelanto
document.getElementById('nov-ade-cancelar').addEventListener('click', function(){
  tipoPendiente = null;
  document.getElementById('nov-adelanto-bar').style.display='none';
  document.querySelectorAll('.nov-btn').forEach(function(b){ b.classList.remove('activo-actual'); });
  cargarEstadoFecha();
});

// Función central de guardado de novedad
function ejecutarGuardadoNovedad(tipofinal, moduloFaltado, fechasARegistrar){
  if(!puedeRegistrar(docActivo)){ toast('⛔ Tu rol no te permite registrar asistencia de esta persona',3500); return; }
  if(tipofinal==='jubilacion' && !esFull()){ toast('⛔ Solo un directivo puede registrar una jubilación',3500); return; }
  var fecha = fechasARegistrar[0];
  var esHoy = fecha===hoyStr();

  db.from('novedades').select('*').eq('docente_id',docActivo.id).eq('fecha',fecha)
    .then(function(res){
      if(res.error) throw res.error;
      var filas = res.data || [];
      var estadoAnterior = filas.length ? filas[0].tipo : '';
      if(estadoAnterior===tipofinal && fechasARegistrar.length===1){ toast('ℹ Ya registrado como '+LABELS[tipofinal],3000); return Promise.reject('same'); }

      var idsABorrar = [];
      var esParcialActual = tipofinal==='justificada_parcial'||tipofinal==='injustificada_parcial';
      if(esParcialActual && moduloFaltado){
        filas.forEach(function(data){
          if((data.tipo==='justificada_parcial'||data.tipo==='injustificada_parcial') && data.modulo===moduloFaltado)
            idsABorrar.push(data.id);
        });
      } else {
        filas.forEach(function(data){ idsABorrar.push(data.id); });
      }

      var nuevasFilas = [];
      fechasARegistrar.forEach(function(f){
        var comentarioVal = (document.getElementById('nov-comentario')||{value:''}).value.trim();
        var novData = { id:(crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2))),
          docente_id:docActivo.id, tipo:tipofinal, fecha:f, mes:f.slice(0,7), anio:String(ANIO_SEL), created_at:new Date().toISOString() };
        // Guardar fecha de vencimiento para alertas
        if(window._pendingDurVence && f === fechasARegistrar[fechasARegistrar.length-1]) novData.durVence = window._pendingDurVence;
        if(comentarioVal) novData.obs = comentarioVal;
        if(moduloFaltado) novData.modulo = moduloFaltado;
        if(typeof modulosFaltados !== 'undefined' && modulosFaltados.length>1) novData.modulos = modulosFaltados;
        // Guardar datos del médico para carpetas médicas
        var medicoNombreVal = (document.getElementById('nov-medico-nombre')||{value:''}).value.trim();
        var medicoMatriculaVal = (document.getElementById('nov-medico-matricula')||{value:''}).value.trim();
        if(medicoNombreVal) novData.medicoNombre = medicoNombreVal;
        if(medicoMatriculaVal) novData.matriculaMedico = medicoMatriculaVal;
        if(tipofinal==='justificada_parcial'||tipofinal==='injustificada_parcial'){
          var diaKeyN=DIAS_KEYS[new Date(f+'T12:00:00').getDay()];
          var valN=docActivo.horario&&docActivo.horario[diaKeyN];
          var franjasN=valN?(Array.isArray(valN)?valN:[valN]).filter(function(x){ return x&&x.entrada&&x.salida; }):[];
          novData.franjasTotal = franjasN.length||1;
        }
        if(tipofinal==='adelanto'){
          var compensa = document.getElementById('nov-adelanto-compensa').value;
          if(compensa) novData.compensaFecha = compensa;
        }
        nuevasFilas.push(novData);
      });
      if(tipofinal==='adelanto'){
        var compFecha = document.getElementById('nov-adelanto-compensa').value;
        if(compFecha){
          nuevasFilas.push({ id:(crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2))),
            docente_id:docActivo.id, tipo:'compensada', fecha:compFecha, mes:compFecha.slice(0,7), anio:String(ANIO_SEL),
            compensadaConAdelanto:fecha, created_at:new Date().toISOString() });
        }
      }

      var pasos = [];
      if(idsABorrar.length) pasos.push(db.from('novedades').delete().in('id', idsABorrar));
      if(nuevasFilas.length) pasos.push(db.from('novedades').insert(nuevasFilas));

      return Promise.all(pasos).then(function(resultados){
        resultados.forEach(function(r){ if(r && r.error) throw r.error; });
        // Si se registra jubilación, marcar automáticamente al docente como jubilado
        if(tipofinal === 'jubilacion'){
          crearBackupAutomatico('Jubilación: '+docActivo.nombre);
          return db.from('docentes').update({ jubilado: true }).eq('id', docActivo.id);
        }
      });
    })
    .then(function(){
      var fObj=new Date(fecha+'T12:00:00');
      var diasN=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
      var etiq=esHoy?'hoy':diasN[fObj.getDay()]+' '+fObj.toLocaleDateString('es-AR',{day:'numeric',month:'long'});
      var msg = fechasARegistrar.length>1
        ? LABELS[tipofinal]+' registrada para '+fechasARegistrar.length+' días ('+fechasARegistrar[0]+' → '+fechasARegistrar[fechasARegistrar.length-1]+')'
        : docActivo.nombre+' — '+LABELS[tipofinal]+(esHoy?' (hoy)':' ('+etiq+')');
      crearBackupAutomatico('Registrar '+tipofinal+' — '+docActivo.nombre+' '+fecha);
      toast(msg);
      tipoPendiente = null;
      var comEl = document.getElementById('nov-comentario');
      if(comEl) comEl.value = '';
      var comBarEl = document.getElementById('nov-comentario-bar');
      if(comBarEl) comBarEl.style.display = 'none';
      cargarEstadoFecha();
      if(esHoy) cargarYRender();
    })
    .catch(function(err){ if(err!=='same'){ toast('Error: '+(err.message||err),5000); } });
}


document.querySelectorAll('input[name="nov-dur-tipo"]').forEach(function(r){
  r.addEventListener('change', function(){
    document.getElementById('nov-dur-rango').style.display = this.value==='rango'?'flex':'none';
    document.getElementById('nov-dur-cant').style.display  = this.value==='dias'?'flex':'none';
  });
});

// ══════════════════════════════════════════════════════
//  EDITOR HORARIO — múltiples franjas
// ══════════════════════════════════════════════════════
function normalizarFranjas(val){
  if(!val) return [];
  if(Array.isArray(val)) return val.filter(function(f){ return f.entrada&&f.salida; });
  if(val.entrada&&val.salida) return [{entrada:val.entrada,salida:val.salida}];
  return [];
}
function crearFilaFranja(dia,franja,removible){
  var div=document.createElement('div'); div.className='franja-row';
  div.innerHTML='<input type="time" data-part="entrada" value="'+(franja.entrada||'08:00')+'"/>'+
    '<span class="franja-sep">a</span>'+
    '<input type="time" data-part="salida" value="'+(franja.salida||'13:00')+'"/>'+
    '<input type="text" data-part="materia" placeholder="Materia (opcional)" value="'+(franja.materia||'')+'" class="franja-materia"/>'+
    (removible?'<button class="btn-rm-franja" title="Quitar">−</button>':'<div style="width:22px"></div>');
  div.querySelectorAll('input[type=time]').forEach(function(inp){ inp.addEventListener('change',actualizarPreview); });
  if(removible) div.querySelector('.btn-rm-franja').addEventListener('click',function(){ div.remove(); actualizarPreview(); });
  return div;
}
function leerFranjasDia(diaKey){
  // Lee las franjas actuales de un dia del editor
  var franjas = [];
  var bloque = document.querySelector('#horario-editor .dia-bloque[data-dia="'+diaKey+'"]');
  if(!bloque) return franjas;
  var cb = bloque.querySelector('.dia-cb');
  if(!cb || !cb.checked) return franjas;
  bloque.querySelectorAll('.franja-row').forEach(function(row){
    var ent = row.querySelector('[data-part="entrada"]');
    var sal = row.querySelector('[data-part="salida"]');
    var mat = row.querySelector('[data-part="materia"]');
    if(ent && sal && ent.value && sal.value)
      franjas.push({ entrada:ent.value, salida:sal.value, materia:mat?mat.value:'' });
  });
  return franjas;
}

function mostrarCopiarHorario(diaOrigen){
  var franjas = leerFranjasDia(diaOrigen);
  if(!franjas.length){ toast('Activá y completá el horario del día primero',3000); return; }

  var diasNombres = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes', sabado:'Sábado' };
  var diasDisp = DIAS_KEYS.filter(function(d){ return d!==diaOrigen && d!=='domingo'; });

  // Usar modal nativo para evitar problemas de z-index/overflow dentro del modal docente
  var modal = document.getElementById('modal-copiar-horario');
  if(!modal){
    modal = document.createElement('dialog');
    modal.id = 'modal-copiar-horario';
    modal.style.cssText = 'border:none;border-radius:14px;padding:0;box-shadow:0 8px 32px rgba(0,0,0,.25);min-width:280px;max-width:360px;z-index:500';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target===modal) modal.close(); });
  }

  modal.innerHTML =
    '<div style="background:var(--primary);padding:.85rem 1.15rem;border-radius:14px 14px 0 0;display:flex;align-items:center;justify-content:space-between">'+
      '<div style="color:#fff;font-size:.85rem;font-weight:700;display:flex;align-items:center;gap:.4rem">'+
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'+
        ' Copiar <strong style="color:#93C5FD">'+diasNombres[diaOrigen]+'</strong> a:'+
      '</div>'+
      '<button id="btn-cerrar-copiar-modal" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:26px;height:26px;border-radius:6px;cursor:pointer;font-size:.9rem">✕</button>'+
    '</div>'+
    '<div style="padding:.85rem 1.15rem;display:flex;flex-direction:column;gap:.65rem;background:#fff">'+
      '<div style="display:flex;flex-wrap:wrap;gap:.4rem" id="copiar-dias-lista">'+
        diasDisp.map(function(d){
          return '<label class="copiar-dia-chip"><input type="checkbox" value="'+d+'"> '+diasNombres[d]+'</label>';
        }).join('')+
      '</div>'+
      '<div style="display:flex;gap:.5rem;justify-content:flex-end;padding-top:.4rem;border-top:1px solid #F3F4F6">'+
        '<button class="btn-sec btn-sm" id="copiar-modal-cancelar">Cancelar</button>'+
        '<button class="btn-p btn-sm" id="copiar-modal-ok">'+
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'+
          ' Copiar'+
        '</button>'+
      '</div>'+
    '</div>';

  modal.showModal();

  modal.querySelector('#btn-cerrar-copiar-modal').addEventListener('click', function(){
    modal.close();
  });

  modal.querySelector('#copiar-modal-cancelar').addEventListener('click', function(){
    modal.close();
  });

  modal.querySelector('#copiar-modal-ok').addEventListener('click', function(){
    var seleccionados = Array.from(modal.querySelectorAll('input[type=checkbox]:checked')).map(function(c){ return c.value; });
    if(!seleccionados.length){ toast('Seleccioná al menos un día',2000); return; }
    seleccionados.forEach(function(diaDestino){
      var bloqueDest = document.querySelector('#horario-editor .dia-bloque[data-dia="'+diaDestino+'"]');
      if(!bloqueDest) return;
      var cbDest    = bloqueDest.querySelector('.dia-cb');
      var contDest  = bloqueDest.querySelector('.franjas-cont');
      var btnAdd    = bloqueDest.querySelector('.btn-add-franja');
      var btnCop    = bloqueDest.querySelector('.btn-copiar-dia');
      if(cbDest && !cbDest.checked){
        cbDest.checked = true;
        contDest.classList.add('activo');
        if(btnAdd) btnAdd.style.display='';
        if(btnCop) btnCop.style.display='';
      }
      // Reemplazar franjas del día destino con las del día origen
      contDest.innerHTML = '';
      franjas.forEach(function(f, i){
        contDest.appendChild(crearFilaFranja(diaDestino, f, i>0));
      });
    });
    actualizarPreview();
    modal.close();
    toast('Horario copiado a '+seleccionados.length+' día'+(seleccionados.length>1?'s':''));
  });
}

function buildHorarioEditor(horario){
  var editor=document.getElementById('horario-editor'); editor.innerHTML='';
  DIA_ORDEN.forEach(function(idx){
    var key=DIAS_KEYS[idx], franjas=normalizarFranjas(horario&&horario[key]), activo=franjas.length>0;
    var bloque=document.createElement('div'); bloque.className='dia-bloque'; bloque.dataset.dia=key;
    var cab=document.createElement('div'); cab.className='dia-cab';
    cab.innerHTML='<label class="dia-toggle-lbl"><input type="checkbox" class="dia-cb"'+(activo?' checked':'')+'/>'+
      '<span>'+DIA_ABREV[idx]+'</span></label>'+
      '<button class="btn-add-franja" style="'+(activo?'':'display:none')+'">＋ franja</button>'+
      '<button class="btn-copiar-dia" title="Copiar a otros días" style="'+(activo?'':'display:none')+'">'+
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'+
        ' Copiar'+
      '</button>';
    bloque.appendChild(cab);
    var franjasCont=document.createElement('div');
    franjasCont.className='franjas-cont'+(activo?' activo':'');
    if(activo){ franjas.forEach(function(f,i){ franjasCont.appendChild(crearFilaFranja(key,f,i>0)); }); }
    else{ franjasCont.appendChild(crearFilaFranja(key,{entrada:'08:00',salida:'13:00'},false)); }
    bloque.appendChild(franjasCont);
    var cb=cab.querySelector('.dia-cb');
    var btnAdd=cab.querySelector('.btn-add-franja');
    var btnCopiar=cab.querySelector('.btn-copiar-dia');
    cb.addEventListener('change',function(){
      franjasCont.classList.toggle('activo',cb.checked);
      btnAdd.style.display=cb.checked?'':'none';
      btnCopiar.style.display=cb.checked?'':'none';
      actualizarPreview();
    });
    btnAdd.addEventListener('click',function(){
      var primera=franjasCont.querySelectorAll('.franja-row')[0];
      if(primera&&!primera.querySelector('.btn-rm-franja')){
        var spc=primera.querySelector('[style]'); if(spc) spc.remove();
        var btnRm=document.createElement('button'); btnRm.className='btn-rm-franja'; btnRm.title='Quitar'; btnRm.textContent='−';
        btnRm.addEventListener('click',function(){ primera.remove(); actualizarPreview(); });
        primera.appendChild(btnRm);
      }
      franjasCont.appendChild(crearFilaFranja(key,{entrada:'08:00',salida:'13:00'},true)); actualizarPreview();
    });
    btnCopiar.addEventListener('click',function(e){
      e.stopPropagation();
      mostrarCopiarHorario(key);
    });
    editor.appendChild(bloque);
  });
  actualizarPreview();
}
function actualizarPreview(){
  var totalMin = 0;
  document.querySelectorAll('#horario-editor .dia-bloque').forEach(function(bloque){
    var cb=bloque.querySelector('.dia-cb'); if(!cb||!cb.checked) return;
    bloque.querySelectorAll('.franja-row').forEach(function(row){
      var ent=row.querySelector('[data-part="entrada"]'), sal=row.querySelector('[data-part="salida"]');
      if(ent&&sal) totalMin+=minDia({entrada:ent.value,salida:sal.value});
    });
  });
  var _cargoActual = (document.getElementById('mde-car')||{value:''}).value;
  var _radioHs = document.querySelector('input[name="mde-tipo-hs"]:checked');
  var _tipoPreview = _radioHs ? _radioHs.value : (esCargoReloj(_cargoActual)?'reloj':'catedra');
  var totalReloj = totalMin/60;
  var rStr = totalReloj%1===0?totalReloj:totalReloj.toFixed(1);
  var previewStr;
  if(_tipoPreview==='reloj'){
    previewStr = 'Total semanal: <strong>'+Math.floor(totalMin/60)+' hs reloj</strong>';
  } else {
    var totalHC    = Math.floor(totalMin/40);
    var totalReloj2 = Math.floor(totalMin/60);
    previewStr = 'Total semanal: <strong>'+totalHC+' horas cátedra</strong> <span style="color:var(--muted);font-size:.75rem">('+totalReloj2+' hs reloj)</span>';
  }
  document.getElementById('hs-preview').innerHTML = previewStr;
}
function leerHorarioEditor(){
  var horario={};
  document.querySelectorAll('#horario-editor .dia-bloque').forEach(function(bloque){
    var cb=bloque.querySelector('.dia-cb'); if(!cb||!cb.checked) return;
    var dia=bloque.dataset.dia, franjas=[];
    bloque.querySelectorAll('.franja-row').forEach(function(row){
      var ent=row.querySelector('[data-part="entrada"]'), sal=row.querySelector('[data-part="salida"]');
      var mat=row.querySelector('[data-part="materia"]');
      if(ent&&sal&&ent.value&&sal.value) franjas.push({entrada:ent.value,salida:sal.value,materia:mat?mat.value.trim():''});
    });
    if(franjas.length) horario[dia]=franjas;
  });
  return horario;
}

// ══════════════════════════════════════════════════════
//  MODAL DOCENTE
// ══════════════════════════════════════════════════════
var mDoc=document.getElementById('modal-docente');
document.getElementById('xdoc').addEventListener('click',function(){ mDoc.close(); });
document.getElementById('canceldoc').addEventListener('click',function(){ mDoc.close(); });
// No cerrar modal docente al hacer click fuera (para no perder datos)
// mDoc.addEventListener('click',function(e){ if(e.target===mDoc) mDoc.close(); });
document.querySelectorAll('.reset-lnk').forEach(function(b){
  b.addEventListener('click',function(){ document.getElementById(b.dataset.t).value='0'; });
});
document.getElementById('btn-nuevo').addEventListener('click',function(){ abrirDocente(null); });
function abrirDocente(doc){
  var esNuevo=!doc;
  document.getElementById('mde-tit').textContent=esNuevo?'Nuevo docente':'Editar docente';
  document.getElementById('mde-sub').textContent=esNuevo?'Completá los datos':doc.nombre;
  document.getElementById('mde-id').value =doc?doc.id:'';
  document.getElementById('mde-nom').value=doc?doc.nombre:'';
  // Cargar apellido: si ya tiene, mostrar; si no, auto-sugerir (última palabra)
  var apellidoEl = document.getElementById('mde-apellido');
  if(apellidoEl){
    if(doc && doc.apellido){
      apellidoEl.value = doc.apellido;
    } else if(doc && doc.nombre){
      // Sugerir última palabra como apellido
      var partsNom = doc.nombre.trim().split(/\s+/);
      apellidoEl.value = partsNom.length > 1 ? partsNom[partsNom.length-1] : '';
    } else {
      apellidoEl.value = '';
    }
  }
  // Tipo de horas: usar campo guardado, o detectar por cargo automáticamente
  var tipoHsDoc = doc ? getTipoHs(doc) : 'catedra';
  var radioTipoHs = document.querySelector('input[name="mde-tipo-hs"][value="'+tipoHsDoc+'"]');
  if(radioTipoHs) radioTipoHs.checked = true;
  // Actualizar hint y auto-detección en cambio de cargo
  var campoCargoEl = document.getElementById('mde-car');
  if(campoCargoEl && !campoCargoEl._tipoHsInit){
    campoCargoEl._tipoHsInit = true;
    campoCargoEl.addEventListener('input', function(){
      var hint = document.getElementById('tipo-hs-hint');
      if(hint){
        if(esCargoReloj(this.value)){
          hint.textContent = 'Detectado: cargo no docente → horas reloj';
          hint.style.color = '#2563EB';
        } else if(this.value.trim()){
          hint.textContent = 'Docente → horas cátedra (40 min)';
          hint.style.color = '#16A34A';
        } else { hint.textContent = ''; }
      }
      if(!docActivo){
        var autoT = esCargoReloj(this.value)?'reloj':'catedra';
        var rA = document.querySelector('input[name="mde-tipo-hs"][value="'+autoT+'"]');
        if(rA) rA.checked = true;
        actualizarPreview();
      }
    });
  }
  // Hint inicial
  var hintEl = document.getElementById('tipo-hs-hint');
  if(hintEl){
    var cargoVal = doc ? doc.cargo||'' : '';
    if(esCargoReloj(cargoVal)){ hintEl.textContent='Cargo no docente → horas reloj'; hintEl.style.color='#2563EB'; }
    else if(cargoVal){ hintEl.textContent='Docente → horas cátedra (40 min)'; hintEl.style.color='#16A34A'; }
    else hintEl.textContent='';
  }
  // Listener en radios para actualizar preview
  document.querySelectorAll('input[name="mde-tipo-hs"]').forEach(function(r){
    if(!r._tipoHsInit){ r._tipoHsInit=true; r.addEventListener('change', actualizarPreview); }
  });
  document.getElementById('mde-car').value=doc?(doc.cargo||''):'';
  document.getElementById('mde-materias').value=doc?(doc.materias||''):'';
  var _notasEl=document.getElementById('mde-notas'); if(_notasEl) _notasEl.value=doc?(doc.notas||''):'';
  var _jubiladoEl=document.getElementById('mde-jubilado'); if(_jubiladoEl) _jubiladoEl.checked=doc?(doc.jubilado||false):false;
  var nivelDoc = doc ? (doc.nivel||'secundaria') : (NIVEL_ACTIVO||'secundaria');
  var nivelRadio = document.querySelector('input[name="mde-nivel"][value="'+nivelDoc+'"]');
  if(nivelRadio) nivelRadio.checked = true;
  // Si la página tiene nivel fijo, bloquear el selector
  var nivelFieldWrap = document.getElementById('mde-nivel-field-wrap');
  if(nivelFieldWrap){
    if(NIVEL_ACTIVO){
      nivelFieldWrap.style.display = 'none';
      // Asegurar que el radio correcto esté marcado aunque esté oculto
      var r = document.querySelector('input[name="mde-nivel"][value="'+NIVEL_ACTIVO+'"]');
      if(r) r.checked = true;
    } else {
      nivelFieldWrap.style.display = '';
    }
  }
  var areaEl = document.getElementById('mde-area'); if(areaEl) areaEl.value = doc ? (doc.area||'') : '';
  // Actualizar label del área según nivel
  function actualizarLabelArea(){
    var n = (document.querySelector('input[name="mde-nivel"]:checked')||{value:'secundaria'}).value;
    var labels = { secundaria:'Área / Departamento', primaria:'Grado / Sala', inicial:'Sala / Turno' };
    var lbl = document.getElementById('mde-area-label'); if(lbl) lbl.textContent = labels[n]||'Área';
    var ph  = document.getElementById('mde-area');
    if(ph){ ph.placeholder = n==='secundaria'?'Ej: Ciencias Exactas, Lengua…': n==='primaria'?'Ej: 1° Grado, 2° Grado…':'Ej: Sala Azul, Turno Mañana…'; }
  }
  actualizarLabelArea();
  document.querySelectorAll('input[name="mde-nivel"]').forEach(function(r){
    if(!r._areaInit){ r._areaInit=true; r.addEventListener('change', actualizarLabelArea); }
  });
  document.getElementById('mde-fm').value =doc?(doc.faltasMes||0):0;
  document.getElementById('mde-fa').value =doc?(doc.faltasAnio||0):0;
  buildGruposEditor(doc?doc.grupos||[]:[]);
  buildHorarioEditor(doc?doc.horario:{});
  var left=document.getElementById('mde-left');
  if(!esNuevo){
    left.innerHTML=
      '<div style="display:flex;gap:.4rem;flex-wrap:wrap">'+
      '<button class="btn-danger-out" id="del-inline">'+
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>'+
        ' Eliminar</button>'+
      '<button class="btn-sec" id="btn-copiar-nivel" style="font-size:.76rem;padding:.42rem .8rem;display:inline-flex;align-items:center;gap:.35rem;border-radius:11px;border:1.5px solid #C7D2FE;color:#4338CA;background:#EEF2FF">'+
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'+
        ' Copiar a otro nivel</button>'+
      '</div>';
    document.getElementById('del-inline').addEventListener('click',function(){ mDoc.close(); abrirConfirm(doc); });
    document.getElementById('btn-copiar-nivel').addEventListener('click',function(){ abrirCopiarNivel(doc); });
  } else { left.innerHTML=''; }
  document.querySelector('.dlg-scroll').scrollTop=0;
  mDoc.showModal();
}
document.getElementById('savedoc').addEventListener('click',function(){
  var id=document.getElementById('mde-id').value;
  var nombre=document.getElementById('mde-nom').value.trim();
  var apellidoGuardar=(document.getElementById('mde-apellido')||{value:''}).value.trim();
  var tipoHsSel = document.querySelector('input[name="mde-tipo-hs"]:checked');
  var tipoHs = tipoHsSel ? tipoHsSel.value : 'catedra';
  var cargo=document.getElementById('mde-car').value.trim();
  var faltasMes=0; var faltasAnio=0;
  var horario=leerHorarioEditor();
  if(!nombre){ toast('El nombre es obligatorio',3000); return; }

  var btn=document.getElementById('savedoc');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Guardando…';

  var grupos=leerGruposEditor();
  var materias=document.getElementById('mde-materias').value.trim();
  var notas=(document.getElementById('mde-notas')||{value:''}).value.trim();
  var jubilado=(document.getElementById('mde-jubilado')||{checked:false}).checked;
  var nivelSel = document.querySelector('input[name="mde-nivel"]:checked');
  var nivel = nivelSel ? nivelSel.value : 'secundaria';
  var area = (document.getElementById('mde-area')||{value:''}).value.trim();
  var data={nombre:nombre,apellido:apellidoGuardar,cargo:cargo,tipo_hs:tipoHs,faltasMes:faltasMes,faltasAnio:faltasAnio,horario:horario,grupos:grupos,materias:materias,notas:notas,jubilado:jubilado,nivel:nivel,area:area,anio:ANIO_SEL};

  function guardarDocente(){
    var nuevoId = id || (crypto.randomUUID ? crypto.randomUUID() : (Date.now()+'-'+Math.random().toString(36).slice(2)));
    var op = id
      ? db.from('docentes').update(data).eq('id', id)
      : db.from('docentes').insert(Object.assign({id:nuevoId}, data));
    op.then(function(res){
      if(res.error) throw res.error;
      if(!id) registrarPresenteHoy(nuevoId);
      crearBackupAutomatico((id?'Editar':'Nuevo')+' docente: '+apellidoGuardar+' '+nombre);
      toast('<strong>'+nombre+'</strong> '+(id?'actualizado':'agregado'));
      mDoc.close(); cargarYRender();
    })
    .catch(function(err){ toast(err.message,5000); })
    .finally(function(){ btn.disabled=false; btn.textContent='Guardar'; });
  }

  // Si es NUEVO docente, verificar que no exista uno con el mismo nombre+apellido
  if(!id){
    var nombreNorm = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    var apellidoNorm = apellidoGuardar.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    var duplicado = TODOS_DOCENTES.find(function(d){
      var dNomNorm = (d.nombre||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
      var dApNorm  = (d.apellido||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
      if(apellidoNorm && dApNorm){
        return dNomNorm === nombreNorm && dApNorm === apellidoNorm;
      }
      return dNomNorm === nombreNorm;
    });
    if(duplicado){
      btn.disabled=false; btn.textContent='Guardar';
      // Mostrar modal de duplicado
      document.getElementById('dup-nombre-existente').textContent = duplicado.nombre;
      document.getElementById('dup-cargo-existente').textContent  = duplicado.cargo || '';
      // Guardar referencia al docente duplicado para poder editarlo
      window._docDuplicado = duplicado;
      document.getElementById('modal-duplicado').showModal();
      return;
    }
  }

  guardarDocente();
});

// Handlers del modal duplicado
(function(){
  var mDup = document.getElementById('modal-duplicado');

  document.getElementById('dup-cancelar').addEventListener('click', function(){
    mDup.close();
    window._docDuplicado = null;
  });

  document.getElementById('dup-editar').addEventListener('click', function(){
    mDup.close();
    var doc = window._docDuplicado;
    window._docDuplicado = null;
    if(doc){
      document.getElementById('modal-docente').close();
      abrirDocente(doc); // abrir el existente para editar
    }
  });

  document.getElementById('dup-igual').addEventListener('click', function(){
    mDup.close();
    window._docDuplicado = null;
    // Guardar igual como nuevo (forzar)
    guardarDocente();
  });
})();

// ══════════════════════════════════════════════════════
//  MODAL CONFIRMAR
// ══════════════════════════════════════════════════════
var mConf=document.getElementById('modal-confirm'), docElim=null;
document.getElementById('xconf').addEventListener('click',function(){ mConf.close(); });
document.getElementById('conf-cancel').addEventListener('click',function(){ mConf.close(); });
mConf.addEventListener('click',function(e){ if(e.target===mConf) mConf.close(); });
function abrirConfirm(doc){ docElim=doc; document.getElementById('conf-nom').textContent=doc.nombre; mConf.showModal(); }

// ── Eliminar docentes en masa ────────────────────────
var mElimMasivo = null;
document.getElementById('btn-eliminar-masivo') && document.getElementById('btn-eliminar-masivo').addEventListener('click', function(){
  abrirEliminarMasivo();
});

function abrirEliminarMasivo(){
  var mEl = document.getElementById('modal-eliminar-masivo');
  if(!mEl) return;
  var lista = document.getElementById('elim-lista');
  lista.innerHTML = TODOS_DOCENTES.map(function(d){
    return '<label class="elim-item">'+
      '<input type="checkbox" class="elim-cb" value="'+d.id+'">'+
      '<div class="elim-info">'+
        '<span class="elim-nom">'+d.nombre+'</span>'+
        '<span class="elim-car">'+( d.cargo||'')+'</span>'+
      '</div>'+
    '</label>';
  }).join('');
  document.getElementById('elim-count').textContent = '0 seleccionados';
  document.getElementById('elim-confirmar').disabled = true;
  lista.querySelectorAll('.elim-cb').forEach(function(cb){
    cb.addEventListener('change', function(){
      var sel = lista.querySelectorAll('.elim-cb:checked').length;
      document.getElementById('elim-count').textContent = sel+' seleccionado'+(sel!==1?'s':'');
      document.getElementById('elim-confirmar').disabled = sel===0;
    });
  });
  var selTodos = document.getElementById('elim-sel-todos');
  if(selTodos){
    selTodos.checked = false;
    selTodos.addEventListener('change', function(){
      lista.querySelectorAll('.elim-cb').forEach(function(cb){ cb.checked = selTodos.checked; cb.dispatchEvent(new Event('change')); });
    });
  }
  mEl.showModal();
}

document.getElementById('elim-cancelar') && document.getElementById('elim-cancelar').addEventListener('click', function(){
  document.getElementById('modal-eliminar-masivo').close();
});
document.getElementById('modal-eliminar-masivo') && document.getElementById('modal-eliminar-masivo').addEventListener('click', function(e){
  if(e.target===this) this.close();
});

document.getElementById('elim-confirmar') && document.getElementById('elim-confirmar').addEventListener('click', function(){
  var btn = this;
  var ids = Array.from(document.querySelectorAll('#elim-lista .elim-cb:checked')).map(function(c){ return c.value; });
  if(!ids.length) return;
  if(!confirm('¿Eliminar '+ids.length+' docente'+(ids.length!==1?'s':'')+' de este nivel? Podés recuperarlos desde la Papelera.')) return;
  btn.disabled=true; btn.textContent='Eliminando…';
  // SOFT DELETE por nivel — no borrar la fila
  var nivelElim = NIVEL_ACTIVO || 'secundaria';
  softDeleteDocentes(ids, nivelElim, true).then(function(){
    crearBackupAutomatico('Eliminar masivo: '+ids.length+' docentes');
    toast(ids.length+' docente'+(ids.length!==1?'s':'')+' eliminado'+(ids.length!==1?'s':'')+' (recuperables desde Papelera)');
    document.getElementById('modal-eliminar-masivo').close();
    cargarYRender();
  }).catch(function(err){ toast('Error: '+err.message,5000); })
    .finally(function(){ btn.disabled=false; btn.textContent='Eliminar seleccionados'; });
});
document.getElementById('conf-ok').addEventListener('click',function(){
  if(!docElim) return;
  var btn=document.getElementById('conf-ok'); btn.disabled=true; btn.textContent='Eliminando…';
  // SOFT DELETE: marcar como eliminado solo en el nivel actual, no borrar la fila
  var nivelElim = NIVEL_ACTIVO || 'secundaria';
  softDeleteDocentes([docElim.id], nivelElim, true)
    .then(function(){
      crearBackupAutomatico('Eliminar docente: '+docElim.nombre);
      toast('🗑️ '+docElim.nombre+' eliminado (podés recuperarlo desde la Papelera)');
      mConf.close(); cargarYRender();
    })
    .catch(function(err){ toast('Error: '+err.message,5000); })
    .finally(function(){ btn.disabled=false; btn.textContent='Sí, eliminar'; });
});


// ══════════════════════════════════════════════════════
//  MODAL REGISTRO MASIVO
// ══════════════════════════════════════════════════════
var mMas = document.getElementById('modal-masivo');
var estadoMasivo = '';

document.getElementById('xmas').addEventListener('click', function(){ mMas.close(); });
document.getElementById('mas-cancelar').addEventListener('click', function(){ mMas.close(); });
mMas.addEventListener('click', function(e){ if(e.target===mMas) mMas.close(); });

document.getElementById('btn-masivo').addEventListener('click', function(){ abrirMasivo(); });

// ── Matrículas médicas ─────────────────────────────────────────────────────
document.getElementById('btn-matriculas') && document.getElementById('btn-matriculas').addEventListener('click', function(){ abrirMatriculas(''); });

function abrirMatriculas(matriculaInicial){
  var modal = document.getElementById('modal-matriculas');
  if(!modal) return;
  // Poblar años
  var selAnio = document.getElementById('mat-anio');
  selAnio.innerHTML = '';
  var anioActual = new Date().getFullYear();
  for(var y = anioActual; y >= anioActual-3; y--){
    var opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if(y === (ANIO_SEL||anioActual)) opt.selected = true;
    selAnio.appendChild(opt);
  }
  document.getElementById('mat-input').value = matriculaInicial || '';
  document.getElementById('mat-resultados').innerHTML = '<div style="color:#9ca3af;font-size:.85rem;padding:2rem;text-align:center">Ingresá una matrícula para buscar</div>';
  document.getElementById('mat-resumen').textContent = '';
  modal.showModal();
  if(matriculaInicial) buscarMatricula();
}

function buscarMatricula(){
  var mat = document.getElementById('mat-input').value.trim();
  var anio = document.getElementById('mat-anio').value;
  var zona = document.getElementById('mat-resultados');
  var resumen = document.getElementById('mat-resumen');
  if(!mat){ toast('Ingresá una matrícula o nombre',2500); return; }
  zona.innerHTML = '<div style="color:#9ca3af;font-size:.85rem;padding:2rem;text-align:center">🔍 Buscando…</div>';
  resumen.textContent = '';

  var q1 = db.from('novedades').select('*').eq('anio', String(anio)).ilike('matriculaMedico', mat+'%');
  var q2 = db.from('novedades').select('*').eq('anio', String(anio)).ilike('medicoNombre', mat+'%');

  Promise.all([q1, q2]).then(function(results){
    var vistos = {};
    var items = [];
    results.forEach(function(res){
      (res.data||[]).forEach(function(x){
        if(!vistos[x.id]){ vistos[x.id]=true; x._id=x.id; items.push(x); }
      });
    });
      // Agrupar por matrícula exacta (puede haber variantes de escritura)
      var porMatricula = {};
      items.forEach(function(it){
        var k = it.matriculaMedico||'';
        if(!porMatricula[k]) porMatricula[k] = [];
        porMatricula[k].push(it);
      });
      if(!items.length){
        zona.innerHTML = '<div style="color:#9ca3af;font-size:.85rem;padding:2rem;text-align:center">Sin resultados para <strong>"'+mat+'"</strong> en '+anio+'</div>';
        return;
      }
      // Ordenar por fecha desc
      items.sort(function(a,b){ return b.fecha < a.fecha ? -1 : 1; });
      // Agrupar por docente
      var porDocente = {};
      items.forEach(function(it){
        var k = it.docente_id||it.docenteId;
        if(!porDocente[k]) porDocente[k] = { nombre: it.docenteNombre||((TODOS_DOCENTES.find(function(d){ return d.id===k; })||{}).nombre)||k, registros: [] };
        porDocente[k].registros.push(it);
      });
      var html = Object.keys(porDocente).map(function(did){
        var entry = porDocente[did];
        var doc = (TODOS_DOCENTES||[]).find(function(d){ return d.id===did; });
        var nombre = doc ? ((doc.apellido?doc.apellido.toUpperCase()+', ':'')+soloNombre(doc.nombre,doc.apellido)) : (entry.nombre||did);
        var rows = entry.registros.map(function(it){
          var fObj = new Date(it.fecha+'T12:00:00');
          var fStr = fObj.toLocaleDateString('es-AR',{weekday:'short',day:'numeric',month:'long'});
          return '<div style="display:flex;gap:.6rem;align-items:center;padding:.35rem .8rem;border-bottom:1px solid #f1f5f9;font-size:.82rem">'+
            '<span style="color:#64748b;min-width:130px">'+fStr+'</span>'+
            '<span style="color:var(--primary);font-weight:600">'+(LABELS[it.tipo]||it.tipo)+'</span>'+
            (it.medicoNombre?'<span style="color:#6366f1;font-size:.75rem;margin-left:.4rem">'+it.medicoNombre+'</span>':'')+
            (it.docsEntregados?'<span style="background:#f0fdf4;border:1px solid #86efac;border-radius:5px;padding:.05rem .35rem;font-size:.7rem;color:#15803d;margin-left:auto">✓ Doc. entregada</span>':'<span style="color:#94a3b8;font-size:.72rem;margin-left:auto">Pendiente</span>')+
          '</div>';
        }).join('');
        return '<div style="border:1px solid #e2e8f0;border-radius:10px;margin:.6rem .8rem;overflow:hidden">'+
          '<div style="background:#f8fafc;padding:.5rem .8rem;font-size:.82rem;font-weight:700;color:var(--primary);display:flex;justify-content:space-between;align-items:center">'+
            '<span>'+nombre+'</span>'+
            '<span style="background:#e0e7ff;border-radius:20px;padding:.1rem .6rem;font-size:.75rem;color:#4338ca">'+entry.registros.length+' registro'+(entry.registros.length>1?'s':'')+'</span>'+
          '</div>'+
          rows+
        '</div>';
      }).join('');
      zona.innerHTML = html;
      resumen.textContent = items.length+' registro'+(items.length>1?'s':'')+' de '+Object.keys(porDocente).length+' docente'+(Object.keys(porDocente).length>1?'s':'')+' — '+anio;
    }).catch(function(e){
      zona.innerHTML = '<div style="color:#dc2626;font-size:.85rem;padding:2rem;text-align:center">Error: '+e.message+'</div>';
    });
}

(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var modal = document.getElementById('modal-matriculas');
    if(!modal) return;
    document.getElementById('xmatriculas').addEventListener('click', function(){ modal.close(); });
    document.getElementById('mat-cerrar').addEventListener('click', function(){ modal.close(); });
    document.getElementById('mat-buscar').addEventListener('click', buscarMatricula);
    document.getElementById('mat-input').addEventListener('keydown', function(e){ if(e.key==='Enter') buscarMatricula(); });
    modal.addEventListener('click', function(e){ if(e.target===modal) modal.close(); });
  });
})();


document.getElementById('mas-buscador').addEventListener('input', function(){
  var q = this.value.toLowerCase();
  document.querySelectorAll('#mas-lista .mas-item').forEach(function(item){
    item.style.display = item.dataset.nombre.includes(q) ? '' : 'none';
  });
});

document.getElementById('mas-sel-todos').addEventListener('change', function(){
  var checked = this.checked;
  document.querySelectorAll('#mas-lista .mas-item:not([style*="display: none"]) .mas-cb').forEach(function(cb){
    cb.checked = checked;
  });
  actualizarContMasivo();
});

function actualizarContMasivo(){
  var n = document.querySelectorAll('#mas-lista .mas-cb:checked').length;
  document.getElementById('mas-count').textContent = n + ' seleccionado' + (n!==1?'s':'');
  document.getElementById('mas-guardar').disabled = n === 0 || !estadoMasivo;
}

function getFechaMasivo(){
  var inp = document.getElementById('mas-fecha-input');
  return (inp && inp.value) ? inp.value : fechaSeleccionada;
}

// Listeners de fecha en masivo
document.getElementById('mas-fecha-input') && document.getElementById('mas-fecha-input').addEventListener('change', function(){
  cargarListaMasivo();
});
document.getElementById('mas-btn-hoy') && document.getElementById('mas-btn-hoy').addEventListener('click', function(){
  var inp = document.getElementById('mas-fecha-input');
  if(inp){ inp.value = hoyStr(); cargarListaMasivo(); }
});

function abrirMasivo(){
  // Inicializar fecha del masivo con la fecha seleccionada actual
  var inputFecha = document.getElementById('mas-fecha-input');
  if(inputFecha) inputFecha.value = fechaSeleccionada;

  cargarListaMasivo();
  mMas.showModal();
}

function cargarListaMasivo(){
  var fechaMasivo = getFechaMasivo();
  var diaIdxMasivo = new Date(fechaMasivo+'T12:00:00').getDay();
  var docentesHoy = TODOS_DOCENTES.filter(function(d){
    var tieneHorarioHoy=diasConHorario(d.horario||{}).some(function(x){ return DIA_IDX[x.toLowerCase()]===diaIdxMasivo; });
    var enGrupo=!filtroGrupo||(d.grupos||[]).indexOf(filtroGrupo)>=0;
    return tieneHorarioHoy && enGrupo;
  });

  var subtit = docentesHoy.length + ' docentes con horario el ' + new Date(fechaMasivo+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
  document.getElementById('mas-subtit').textContent = subtit;
  document.getElementById('mas-buscador').value = '';
  document.getElementById('mas-sel-todos').checked = false;
  estadoMasivo = '';

  // Lista de docentes
  var lista = document.getElementById('mas-lista');
  lista.innerHTML = '';
  if(!docentesHoy.length){
    lista.innerHTML = '<div class="perf-empty">No hay docentes con horario hoy</div>';
  } else {
    docentesHoy.forEach(function(doc){
      var item = document.createElement('div');
      item.className = 'mas-item';
      item.dataset.nombre = doc.nombre.toLowerCase();
      var estadoActual = doc.estadoHoy ? 
        '<span class="mas-estado-actual '+doc.estadoHoy+'">'+ICONOS[doc.estadoHoy]+' '+(LABELS_SHORT[doc.estadoHoy]||doc.estadoHoy)+'</span>' : 
        '<span class="mas-estado-actual presente">✓ Presente</span>';
      item.innerHTML = 
        '<label class="mas-item-label">'+
          '<input type="checkbox" class="mas-cb" data-id="'+doc.id+'" data-nombre="'+doc.nombre+'"/>'+
          '<div class="mas-item-info">'+
            '<span class="mas-item-nom">'+doc.nombre+'</span>'+
            '<span class="mas-item-car">'+(doc.cargo||'—')+'</span>'+
          '</div>'+
          estadoActual+
        '</label>';
      item.querySelector('.mas-cb').addEventListener('change', actualizarContMasivo);
      lista.appendChild(item);
    });
  }

  // Botones de estado
  var estadosDiv = document.getElementById('mas-estados');
  estadosDiv.innerHTML = '<span class="mas-estado-lbl">Aplicar estado:</span>';
  TIPOS.forEach(function(tipo){
    var btn = document.createElement('button');
    btn.className = 'mas-estado-btn ' + tipo;
    btn.dataset.tipo = tipo;
    btn.innerHTML = ICONOS[tipo] + ' ' + LABELS_SHORT[tipo];
    btn.addEventListener('click', function(){
      estadoMasivo = tipo;
      document.querySelectorAll('.mas-estado-btn').forEach(function(b){ b.classList.remove('activo'); });
      btn.classList.add('activo');
      actualizarContMasivo();
    });
    estadosDiv.appendChild(btn);
  });

  actualizarContMasivo();
  // showModal ya se llama en abrirMasivo
}

document.getElementById('mas-guardar').addEventListener('click', function(){
  if(!estadoMasivo) return;
  var cbs = document.querySelectorAll('#mas-lista .mas-cb:checked');
  if(!cbs.length) return;

  var btn = document.getElementById('mas-guardar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Guardando…';

  var hoy = getFechaMasivo();
  var ids = Array.from(cbs).map(function(cb){ return { id: cb.dataset.id, nombre: cb.dataset.nombre }; });

  // Para cada docente, buscar novedad existente y reemplazar
  var promesas = ids.map(function(doc){
    return db.from('novedades').select('*')
      .eq('docente_id',doc.id)
      .eq('fecha',hoy)
      .then(function(res){
        if(res.error) throw res.error;
        var filas = res.data || [];
        var estadoAnterior = filas.length ? filas[0].tipo : '';
        if(estadoAnterior === estadoMasivo) return; // ya tiene ese estado
        var idsBorrar = filas.map(function(d){ return d.id; });
        var pasos = [];
        if(idsBorrar.length) pasos.push(db.from('novedades').delete().in('id', idsBorrar));
        pasos.push(db.from('novedades').insert({
          id: (crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2))),
          docente_id: doc.id, tipo: estadoMasivo,
          fecha: hoy, mes: hoy.slice(0,7), anio: String(ANIO_SEL),
          created_at: new Date().toISOString()
        }));
        // faltasMes/faltasAnio se calculan dinámicamente
        return Promise.all(pasos);
      });
  });

  Promise.all(promesas).then(function(){
    toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> '+ids.length+' docentes registrados como '+LABELS[estadoMasivo]);
    mMas.close();
    cargarYRender();
  }).catch(function(err){
    toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Error: '+err.message, 5000);
    btn.disabled = false;
    btn.textContent = 'Guardar';
  });
});


// ══════════════════════════════════════════════════════
//  MODAL RANKING DE AUSENTISMO
// ══════════════════════════════════════════════════════
var mRank = document.getElementById('modal-ranking');
document.getElementById('xrank').addEventListener('click', function(){ mRank.close(); });
mRank.addEventListener('click', function(e){ if(e.target===mRank) mRank.close(); });
document.getElementById('btn-ranking').addEventListener('click', function(){ abrirRanking(); });

document.getElementById('rank-tipo-periodo').addEventListener('change', function(){
  mostrarControlRanking(this.value); cargarRanking();
});
document.getElementById('rank-dia').addEventListener('change', cargarRanking);
document.getElementById('rank-mes').addEventListener('change', cargarRanking);
document.getElementById('rank-anio').addEventListener('change', cargarRanking);
document.getElementById('rank-desde').addEventListener('change', function(){
  // Solo cargar si ambas fechas están completas
  if(document.getElementById('rank-desde').value && document.getElementById('rank-hasta').value) cargarRanking();
});
document.getElementById('rank-hasta').addEventListener('change', function(){
  if(document.getElementById('rank-desde').value && document.getElementById('rank-hasta').value) cargarRanking();
});

function mostrarControlRanking(tipo){
  document.getElementById('rank-ctrl-dia').style.display  = tipo==='dia'  ?'':'none';
  document.getElementById('rank-ctrl-mes').style.display  = tipo==='mes'  ?'':'none';
  document.getElementById('rank-ctrl-anio').style.display = tipo==='anio' ?'':'none';
  document.getElementById('rank-ctrl-rango').style.display= tipo==='rango'?'flex':'none';
}

function sincronizarRankMes(){
  var m = document.getElementById('rank-mes-mes');
  var a = document.getElementById('rank-mes-anio');
  if(m && a) document.getElementById('rank-mes').value = a.value+'-'+m.value;
}

function abrirRanking(){
  var anioActual = ANIO_SEL || new Date().getFullYear();
  var mesActual = new Date().getMonth()+1;
  document.getElementById('rank-tipo-periodo').value = 'dia';
  document.getElementById('rank-dia').value  = fechaSeleccionada;
  document.getElementById('rank-anio').value = anioActual;

  // Setear mes y año actual en los selects
  var selAnioMes = document.getElementById('rank-mes-anio');
  if(selAnioMes) selAnioMes.value = String(anioActual);
  var selMesMes = document.getElementById('rank-mes-mes');
  if(selMesMes) selMesMes.value = String(mesActual).padStart(2,'0');
  sincronizarRankMes();

  mostrarControlRanking('dia');
  cargarRanking();
  mRank.showModal();
}

// Listeners del selector de mes (se agregan una sola vez al cargar)
document.addEventListener('DOMContentLoaded', function(){
  // Listeners de badges del header — clickeables para filtrar
  document.querySelectorAll('.si-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var f = this.dataset.filtro;
      if(filtroBadge===f){
        filtroBadge='';
        document.querySelectorAll('.si-btn').forEach(function(b){ b.classList.remove('activo-badge'); });
      } else {
        filtroBadge = f;
        document.querySelectorAll('.si-btn').forEach(function(b){ b.classList.remove('activo-badge'); });
        if(f) this.classList.add('activo-badge');
      }
      aplicarFiltros();
    });
  });
  var sm = document.getElementById('rank-mes-mes');
  var sa = document.getElementById('rank-mes-anio');
  if(sm) sm.addEventListener('change', function(){ sincronizarRankMes(); cargarRanking(); });
  if(sa) sa.addEventListener('change', function(){ sincronizarRankMes(); cargarRanking(); });
});

function cargarRanking(){
  var tipo = document.getElementById('rank-tipo-periodo').value;
  var desde, hasta, anioActual = new Date().getFullYear();

  if(tipo==='dia'){
    var dia = document.getElementById('rank-dia').value || fechaSeleccionada;
    desde = dia; hasta = dia;
    var fObj0 = new Date(dia+'T12:00:00');
    document.getElementById('rank-subtit').textContent = fObj0.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  } else if(tipo==='mes'){
    sincronizarRankMes();
    var mesVal = document.getElementById('rank-mes').value || hoyStr().slice(0,7);
    var partes = mesVal.split('-');
    var anioM = parseInt(partes[0]), numM = parseInt(partes[1]);
    desde = String(anioM)+'-'+String(numM).padStart(2,'0')+'-01';
    hasta = String(anioM)+'-'+String(numM).padStart(2,'0')+'-'+String(new Date(anioM,numM,0).getDate()).padStart(2,'0');
    document.getElementById('rank-subtit').textContent = new Date(anioM,numM-1,1).toLocaleDateString('es-AR',{month:'long',year:'numeric'});
  } else if(tipo==='anio'){
    var anio = parseInt(document.getElementById('rank-anio').value)||anioActual;
    desde = anio+'-01-01'; hasta = anio+'-12-31';
    document.getElementById('rank-subtit').textContent = 'Año '+anio;
  } else {
    desde = document.getElementById('rank-desde').value;
    hasta = document.getElementById('rank-hasta').value;
    if(!desde||!hasta){
      document.getElementById('rank-lista').innerHTML='<div class="perf-empty" style="padding:1.5rem;text-align:center">Seleccioná las fechas de inicio y fin</div>';
      return;
    }
    document.getElementById('rank-subtit').textContent = desde+' a '+hasta;
  }

  document.getElementById('rank-lista').innerHTML='<div class="perf-loading">Calculando ranking…</div>';

  // Traer todas las novedades del año y filtrar/agrupar en cliente
  db.from('novedades').select('*').eq('anio', String(ANIO_SEL)).gte('fecha',desde).lte('fecha',hasta)
    .then(function(res){
      if(res.error) throw res.error;
      var porDocId = {};
      (res.data||[]).forEach(function(n){
        if(!porDocId[n.docente_id]) porDocId[n.docente_id]=[];
        porDocId[n.docente_id].push(n);
      });
      var resultados = TODOS_DOCENTES.map(function(doc){
        return { id:doc.id, novedades: porDocId[doc.id]||[] };
      });
      var porDocente = {};
      // Inicializar todos los docentes
      TODOS_DOCENTES.forEach(function(doc){
        porDocente[doc.id] = { contadores:{}, totalAusencias:0, diasDebVenir:0 };
        TIPOS.forEach(function(t){ porDocente[doc.id].contadores[t]=0; });
        porDocente[doc.id].contadores['presente']=0;
      });

      // Contar novedades filtradas
      resultados.forEach(function(r){
        porDocente[r.id].novedades = r.novedades.sort(function(a,b){ return a.fecha.localeCompare(b.fecha); });
        r.novedades.forEach(function(data){
          if(!porDocente[data.docente_id]) return;
          if(porDocente[data.docente_id].contadores[data.tipo]!==undefined)
            porDocente[data.docente_id].contadores[data.tipo]++;
          if(esFaltaCualquiera(data.tipo)) porDocente[data.docente_id].totalAusencias++;
        });
      });

      // Calcular presentes correctamente: iterar día a día (igual que reporte de grupo)
      // Ignorar novedades de tipo 'presente' explícito
      TODOS_DOCENTES.forEach(function(doc){
        var horario = doc.horario || {};
        var novedadesPorFecha = {};
        (porDocente[doc.id].novedades||[]).forEach(function(n){
          if(n.tipo !== 'presente') novedadesPorFecha[n.fecha] = n;
        });
        var diasHab = 0, diasPresentes = 0;
        var cur = new Date(desde+'T12:00:00'), fin = new Date(hasta+'T12:00:00');
        while(cur <= fin){
          var dia = cur.getDay();
          if(dia !== 0 && dia !== 6){
            var f = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
            if(!esFeriado(f)){
              var tieneHorario = Object.keys(horario).length > 0
                ? diasConHorario(horario).some(function(dk){ return DIA_IDX[dk.toLowerCase()]===dia; })
                : false;
              // Para períodos cortos (1 día): incluir si tiene novedad aunque no tenga horario ese día
              var tieneNovedad = !!novedadesPorFecha[f];
              if(tieneHorario || (desde===hasta && tieneNovedad)){
                var nov = novedadesPorFecha[f];
                // Los días con Paro u otras novedades que NO bajan presentismo
                // NO cuentan como días que el docente "debía venir" — se excluyen del denominador
                var esNovedadSinDescuento = nov && !esFaltaCualquiera(nov.tipo);
                if(!esNovedadSinDescuento){
                  // Solo cuenta en diasHab si es día normal o falta real
                  diasHab++;
                  if(!nov) diasPresentes++; // presente puro
                }
              }
            }
          }
          cur.setDate(cur.getDate()+1);
        }
        porDocente[doc.id].diasDebVenir = diasHab;
        porDocente[doc.id].presentesAuto = diasPresentes;
      });

      var ranking = TODOS_DOCENTES.map(function(doc){
        var _nd = (doc.apellido&&doc.apellido.trim())
          ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido)
          : doc.nombre;
        return {
          id: doc.id,
          nombre: _nd,
          cargo: doc.cargo||'—',
          contadores: porDocente[doc.id].contadores,
          totalAusencias: porDocente[doc.id].totalAusencias,
          diasDebVenir: porDocente[doc.id].diasDebVenir,
          presentesAuto: porDocente[doc.id].presentesAuto,
          novedades: porDocente[doc.id].novedades||[]
        };
      });

      renderRanking(ranking, desde, hasta);
    })
    .catch(function(err){
      document.getElementById('rank-lista').innerHTML='<p style="color:#DC2626;padding:1rem">Error: '+err.message+'</p>';
    });
}

var rankTab = 'ausentismo';
function renderRanking(ranking, desde, hasta){ ultimoRanking = ranking;
  var lista = document.getElementById('rank-lista');
  if(!ranking.length){
    lista.innerHTML='<div class="perf-empty">Sin datos en el período</div>';
    return;
  }

  // Calcular % de asistencia por docente
  // Solo bajan el % las FALTAS reales (justificada/injustificada y sus parciales)
  // Licencias, paro, carpeta médica, etc. NO bajan el %
  function calcPctDoc(item){
    var diasHab = item.diasDebVenir || 0;
    if(diasHab === 0) return -1; // sin datos
    // SOLO faltas reales bajan el %
    var faltas = item.totalAusencias || 0;
    return Math.round(((diasHab - faltas) / diasHab) * 100);
  }

  function pctColor(p){ return p>=90?'#16A34A':p>=75?'#CA8A04':'#DC2626'; }

  // Tabs
  var tabsHTML = '<div class="rank-tabs">'+
    '<button class="rank-tab'+(rankTab==='ausentismo'?' activo':'')+'" data-tab="ausentismo">'+
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'+
      ' Ausentismo</button>'+
    '<button class="rank-tab'+(rankTab==='presentismo'?' activo':'')+'" data-tab="presentismo">'+
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>'+
      ' Presentismo</button>'+
    '<button class="rank-tab'+(rankTab==='licencias'?' activo':'')+'" data-tab="licencias">'+
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'+
      ' Por tipo</button>'+
  '</div>';

  var itemsHTML = '';

  if(rankTab === 'ausentismo'){
    // Todos los docentes con AL MENOS una novedad (faltas + licencias + todo)
    // Ausentismo: SOLO docentes con faltas reales (just/injust)
    var sorted = ranking.slice().filter(function(r){
      return r.totalAusencias > 0;
    }).sort(function(a,b){
      if(b.totalAusencias !== a.totalAusencias) return b.totalAusencias - a.totalAusencias;
      return a.nombre.localeCompare(b.nombre,'es');
    });

    if(!sorted.length){
      itemsHTML='<div class="perf-empty" style="padding:2rem;text-align:center">'+
        '<div style="font-size:2rem;margin-bottom:.5rem">🎉</div>'+
        '<strong>Sin ausencias en el período</strong>'+
      '</div>';
    } else {
      var maxV = sorted[0].totalAusencias || 1;
      itemsHTML = sorted.map(function(item,idx){
        var pctBarra = (maxV>0 && item.totalAusencias>0)?(item.totalAusencias/maxV)*100:0;
        // % ausentismo = solo bajan faltas reales
        var _presAust = item.presentesAuto || 0;
        var _faltAust = item.totalAusencias || 0;
        var _totAust  = _presAust + _faltAust;
        var pct    = _totAust > 0 ? Math.round((_presAust/_totAust)*100) : -1;
        var colPct = pct<0 ? '#6B7280' : pctColor(pct);
        var pctStr = pct<0 ? '—' : pct+'%';

        // Detalle: TODAS las novedades (faltas + licencias + otros)
        var todosRegistros = TIPOS.filter(function(t){ return t!=='presente' && (item.contadores[t]||0)>0; });
        var detalles = todosRegistros.map(function(t){
          var esFaltaT = esFaltaCualquiera(t);
          return '<span class="rank-det '+t+'" style="'+(esFaltaT?'font-weight:800':'')+'">'
            +ICONOS[t]+' '+(item.contadores[t]||0)+' '+LABELS_SHORT[t]+'</span>';
        }).join('');

        return '<div class="rank-item">'+
          '<div class="rank-pos"><span class="rank-num">'+(idx+1)+'</span></div>'+
          '<div class="rank-info">'+
            '<div class="rank-nombre">'+item.nombre+'</div>'+
            '<div class="rank-cargo">'+item.cargo+'</div>'+
            '<div class="rank-barra-wrap"><div class="rank-barra" style="width:'+pctBarra.toFixed(1)+'%;background:#DC2626"></div></div>'+
            (detalles?'<div class="rank-detalles">'+detalles+'</div>':'')+
          '</div>'+
          '<div class="rank-total">'+
            (item.totalAusencias>0?'<span style="color:#DC2626;font-size:1.1rem;font-weight:800">'+item.totalAusencias+'</span><span class="rank-total-lbl">faltas</span><br>':'<span style="color:#16A34A;font-size:.75rem">sin faltas</span><br>')+
            '<span style="color:'+colPct+';font-weight:700;font-size:.85rem">'+pctStr+'</span>'+
          '</div>'+
        '</div>';
      }).join('');
    }

  } else if(rankTab === 'presentismo'){
    // TODOS los docentes ordenados por % de asistencia (menor primero = más problemáticos al inicio)
    var sorted2 = ranking.slice().sort(function(a,b){
      var pctA = calcPctDoc(a); var pctB = calcPctDoc(b);
      // -1 = sin datos, van al final
      if(pctA===-1 && pctB===-1) return a.nombre.localeCompare(b.nombre,'es');
      if(pctA===-1) return 1;
      if(pctB===-1) return -1;
      if(pctB !== pctA) return pctB - pctA; // mayor % primero
      return a.nombre.localeCompare(b.nombre,'es');
    });

    if(!sorted2.length){ itemsHTML='<div class="perf-empty">Sin datos en el período</div>'; }
    else {
      itemsHTML = '<div class="rank-pres-header">'+
        '<span>Docente</span><span style="margin-left:auto">% Asistencia</span>'+
      '</div>';
      itemsHTML += sorted2.map(function(item,idx){
        var pct = calcPctDoc(item);
        var col = pct<0 ? '#6B7280' : pctColor(pct);
        var pctDisp = pct<0 ? '—' : pct+'%';
        var presentes = item.presentesAuto||0;
        var totalNovedades = TIPOS.filter(function(t){ return t!=='presente'; })
          .reduce(function(s,t){ return s+(item.contadores[t]||0); },0);
        var total = presentes + totalNovedades;

        // Registros del docente
        var regs = TIPOS.filter(function(t){ return t!=='presente'&&(item.contadores[t]||0)>0; })
          .map(function(t){
            return '<span class="rank-det '+t+'" style="font-size:.62rem">'
              +ICONOS[t]+' '+item.contadores[t]+' '+LABELS_SHORT[t]+'</span>';
          }).join('');

        return '<div class="rank-item rank-item-pres">'+
          '<div class="rank-pos"><span class="rank-num">'+(idx+1)+'</span></div>'+
          '<div class="rank-info">'+
            '<div class="rank-nombre">'+item.nombre+'</div>'+
            '<div class="rank-cargo">'+item.cargo+'  <span style="color:var(--muted);font-size:.68rem">'+(total>0?presentes+' pres. / '+totalNovedades+' nov.':'sin datos')+'</span></div>'+
            '<div class="rank-barra-wrap"><div class="rank-barra" style="width:'+pct+'%;background:'+col+'"></div></div>'+
            (regs?'<div class="rank-detalles">'+regs+'</div>':'')+
          '</div>'+
          '<div class="rank-total" style="color:'+col+'">'+
            '<span style="font-size:1.15rem;font-weight:800">'+pctDisp+'</span>'+
            '<span class="rank-total-lbl">asistencia</span>'+
          '</div>'+
        '</div>';
      }).join('');
    }

  } else {
    // Por tipo — detalle de fechas de cada tipo de novedad
    var tiposExtra = TIPOS.filter(function(t){ return t!=='presente'; });
    // Por tipo: mostrar todos, ordenados por mayor cantidad de registros
    var sorted3 = ranking.slice().sort(function(a,b){
      var totA=tiposExtra.reduce(function(s,t){ return s+(a.contadores[t]||0); },0);
      var totB=tiposExtra.reduce(function(s,t){ return s+(b.contadores[t]||0); },0);
      if(totA!==totB) return totB-totA;
      return a.nombre.localeCompare(b.nombre,'es');
    });

    if(!sorted3.length){ itemsHTML='<div class="perf-empty">Sin novedades en el período</div>'; }
    else {
      itemsHTML = sorted3.map(function(item,idx){
        var totExtra=tiposExtra.reduce(function(s,t){ return s+(item.contadores[t]||0); },0);
        var gruposPorTipo = {};
        (item.novedades||[]).filter(function(n){ return n.tipo!=='presente'; }).forEach(function(n){
          if(!gruposPorTipo[n.tipo]) gruposPorTipo[n.tipo]=[];
          gruposPorTipo[n.tipo].push(n.fecha);
        });
        var detallesHTML = Object.keys(gruposPorTipo).map(function(t){
          var fechas = gruposPorTipo[t].sort();
          var fechasStr = fechas.map(function(f){
            var d=new Date(f+'T12:00:00');
            return d.toLocaleDateString('es-AR',{day:'numeric',month:'short'});
          }).join(', ');
          return '<div class="rank-tipo-row">'+
            '<span class="rank-det '+t+'">'+ICONOS[t]+' '+LABELS_SHORT[t]+' ('+fechas.length+')</span>'+
            '<span class="rank-tipo-fechas">'+fechasStr+'</span>'+
          '</div>';
        }).join('');
        var diasHabT = item.diasDebVenir||0;
        var presT    = item.presentesAuto||0;
        var pctT     = diasHabT>0 ? Math.round((presT/diasHabT)*100) : -1;
        var colT     = pctT<0 ? '#6B7280' : pctColor(pctT);
        return '<div class="rank-item rank-item-tipo">'+
          '<div class="rank-pos"><span class="rank-num">'+(idx+1)+'</span></div>'+
          '<div class="rank-info">'+
            '<div class="rank-nombre">'+item.nombre+'</div>'+
            '<div class="rank-cargo" style="display:flex;align-items:center;gap:.5rem">'+item.cargo+
              (diasHabT>0?'<span style="font-size:.68rem;color:var(--muted)">'+presT+' pres. / '+(diasHabT-presT)+' nov.</span>':'')+
            '</div>'+
            (detallesHTML?'<div class="rank-tipos-detalle">'+detallesHTML+'</div>':
              '<div style="font-size:.72rem;color:#16A34A;margin-top:2px">Sin novedades</div>')+
          '</div>'+
          '<div class="rank-total" style="color:'+colT+'">'+
            '<span style="font-size:1.05rem;font-weight:800">'+(pctT<0?'—':pctT+'%')+'</span>'+
            '<span class="rank-total-lbl">asistencia</span>'+
          '</div>'+
        '</div>';
      }).join('');
    }
  }

  lista.innerHTML = tabsHTML + itemsHTML;
  lista.querySelectorAll('.rank-tab').forEach(function(btn){
    btn.addEventListener('click', function(){
      rankTab = this.dataset.tab;
      renderRanking(ultimoRanking, desde, hasta);
    });
  });
}


// ══════════════════════════════════════════════════════
//  EXPORTACIÓN EXCEL Y PDF
// ══════════════════════════════════════════════════════

// ── Helpers de exportación ───────────────────────────
function exportarExcel(datos, columnas, nombreArchivo) {
  var wb = XLSX.utils.book_new();
  var wsData = [columnas].concat(datos);
  var ws = XLSX.utils.aoa_to_sheet(wsData);
  // Ancho de columnas automático
  ws['!cols'] = columnas.map(function(){ return { wch: 22 }; });
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, nombreArchivo + '.xlsx');
}

function exportarPDF(titulo, subtitulo, columnas, datos, nombreArchivo) {
  var doc = new window.jspdf.jsPDF({ orientation: datos.length > 20 ? 'l' : 'p' });
  doc.setFont('helvetica','bold');
  doc.setFontSize(16);
  doc.text(titulo, 14, 18);
  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitulo, 14, 26);
  doc.setTextColor(0);
  doc.autoTable({
    head: [columnas],
    body: datos,
    startY: 32,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [26,43,74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248,250,252] },
    margin: { left: 14, right: 14 }
  });
  doc.save(nombreArchivo + '.pdf');
}

function fechaLegible(str) {
  if(!str) return '';
  var f = new Date(str + 'T12:00:00');
  return f.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

// ── Exportar listado del día ─────────────────────────
var mExportDia = document.getElementById('modal-export-dia');
document.getElementById('xexport').addEventListener('click', function(){ mExportDia.close(); });
mExportDia.addEventListener('click', function(e){ if(e.target===mExportDia) mExportDia.close(); });

document.getElementById('btn-export-dia').addEventListener('click', function(){
  document.getElementById('export-fecha').value = fechaSeleccionada;
  document.getElementById('export-dia-mes').value = hoyStr().slice(0,7);
  document.getElementById('export-dia-anio').value = ANIO_SEL;
  document.getElementById('export-mes').value = hoyStr().slice(0,7);
  document.getElementById('export-anio').value = ANIO_SEL;
  // Pre-seleccionar el nivel activo
  document.getElementById('export-nivel').value = NIVEL_ACTIVO || '';
  actualizarAreaExport();
  // Mostrar/ocultar campo nivel según tipo de reporte
  var tipoActual = document.getElementById('export-tipo-reporte').value;
  var nivelFieldEl = document.getElementById('export-nivel');
  if(nivelFieldEl) nivelFieldEl.closest('.field').style.display = tipoActual==='niveles' ? 'none' : '';
  // Poblar select de docentes
  var sel = document.getElementById('export-docente-sel');
  sel.innerHTML = '<option value="">— Seleccioná un docente —</option>';
  var _docsOrd = TODOS_DOCENTES.slice().sort(function(a,b){
    var nA=((a.apellido||'')+' '+(a.nombre||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    var nB=((b.apellido||'')+' '+(b.nombre||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return nA.localeCompare(nB,'es',{sensitivity:'base'});
  });
  _docsOrd.forEach(function(d){
    var opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = (d.apellido && d.apellido.trim())
      ? d.apellido.trim().toUpperCase()+', '+soloNombre(d.nombre, d.apellido)
      : d.nombre;
    sel.appendChild(opt);
  });
  mExportDia.showModal();
});

function actualizarAreaExport(){
  var nivelSel = document.getElementById('export-nivel').value;
  var areaField = document.getElementById('export-area-field');
  var areaLbl   = document.getElementById('export-area-label');
  var areaSel   = document.getElementById('export-area');
  if(!areaField||!areaSel) return;
  var nivLabels = { secundaria:'Área / Departamento', primaria:'Grado / Sala', inicial:'Sala / Turno' };
  if(areaLbl) areaLbl.textContent = nivelSel ? (nivLabels[nivelSel]||'Área') : 'Área';
  var areas = [];
  TODOS_DOCENTES.forEach(function(d){
    var nDoc = d.nivel||'secundaria';
    if(!nivelSel || nDoc===nivelSel){
      if(d.area && areas.indexOf(d.area)<0) areas.push(d.area);
    }
  });
  areas.sort(function(a,b){ return a.localeCompare(b,'es'); });
  var lbl = nivelSel ? (nivLabels[nivelSel]||'Área') : 'Área';
  areaSel.innerHTML = '<option value="">Todas las '+lbl.toLowerCase()+'s</option>';
  areas.forEach(function(a){
    var opt = document.createElement('option'); opt.value=a; opt.textContent=a;
    areaSel.appendChild(opt);
  });
  areaField.style.display = areas.length && nivelSel ? '' : 'none';
}

function actualizarSelectDocentes(){
  var nivelSel = (document.getElementById('export-nivel')||{}).value||'';
  var areaSel  = (document.getElementById('export-area')||{}).value||'';
  var sel = document.getElementById('export-docente-sel');
  if(!sel) return;
  sel.innerHTML = '<option value="">— Seleccioná un docente —</option>';
  var _docsOrd2 = TODOS_DOCENTES.filter(function(d){
    var okNivel = !nivelSel || (d.nivel||'secundaria') === nivelSel;
    var okArea  = !areaSel  || (d.area||'') === areaSel;
    return okNivel && okArea;
  }).sort(function(a,b){
    var nA=((a.apellido||'')+' '+(a.nombre||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    var nB=((b.apellido||'')+' '+(b.nombre||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return nA.localeCompare(nB,'es',{sensitivity:'base'});
  });
  _docsOrd2.forEach(function(d){
    var opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = (d.apellido && d.apellido.trim())
      ? d.apellido.trim().toUpperCase()+', '+soloNombre(d.nombre, d.apellido)
      : d.nombre;
    sel.appendChild(opt);
  });
}

document.getElementById('export-nivel') && document.getElementById('export-nivel').addEventListener('change', function(){
  actualizarAreaExport();
  actualizarSelectDocentes();
});

document.getElementById('export-area') && document.getElementById('export-area').addEventListener('change', function(){
  actualizarSelectDocentes();
});

document.getElementById('export-tipo-reporte').addEventListener('change', function(){
  var tipo = this.value;
  document.getElementById('export-ctrl-dia').style.display      = (tipo==='dia'||tipo==='niveles')?'':'none';
  document.getElementById('export-ctrl-docente').style.display  = tipo==='docente'?'flex':'none';
  // Para "niveles", ocultar el filtro de nivel individual (incluye todos)
  var nivelField = document.getElementById('export-nivel');
  if(nivelField) nivelField.closest('.field').style.display = tipo==='niveles' ? 'none' : '';
  var areaField = document.getElementById('export-area-field');
  if(areaField && tipo==='niveles') areaField.style.display = 'none';
});

document.getElementById('export-periodo-tipo').addEventListener('change', function(){
  var t = this.value;
  document.getElementById('export-ctrl-mes').style.display   = t==='mes'  ?'':'none';
  document.getElementById('export-ctrl-anio').style.display  = t==='anio' ?'':'none';
  document.getElementById('export-ctrl-rango').style.display = t==='rango'?'flex':'none';
});

function obtenerDatosAsistenciaDia(fecha, callback) {
  db.from('novedades').select('*').eq('fecha',fecha).then(function(res){
    var mapa = {};
    (res.data||[]).forEach(function(x){ mapa[x.docente_id]=x.tipo; });
    var fechaObj = new Date(fecha+'T12:00:00');
    var diaIdxExport = fechaObj.getDay();
    // Filtrar por nivel y área si están seleccionados en el modal
    var nivelExp = (document.getElementById('export-nivel')||{value:''}).value;
    var areaExp  = (document.getElementById('export-area')||{value:''}).value;
    var docsExp = TODOS_DOCENTES.filter(function(doc){
      if(nivelExp && (doc.nivel||'secundaria') !== nivelExp) return false;
      if(areaExp  && (doc.area||'') !== areaExp)             return false;
      return true;
    });
    var filas = docsExp.map(function(doc){
      var estado = mapa[doc.id];
      var tieneHorario = diasConHorario(doc.horario||{}).some(function(x){ return DIA_IDX[x.toLowerCase()]===diaIdxExport; });
      var estadoLabel = estado ? (LABELS[estado]||estado) : (tieneHorario ? 'Presente' : '—');
      if(estadoLabel==='—') return null;
      var nomMostrar = (doc.apellido&&doc.apellido.trim()) ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido) : doc.nombre;
      return [nomMostrar, doc.cargo||'—', estadoLabel, doc.apellido||doc.nombre];
    }).filter(Boolean);
    // Ordenar por apellido
    filas.sort(function(a,b){ return (a[3]||'').localeCompare(b[3]||'','es',{sensitivity:'base'}); });
    // Quitar columna auxiliar de ordenamiento
    filas = filas.map(function(r){ return [r[0],r[1],r[2]]; });
    callback(filas, fecha);
  }).catch(function(err){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Error: '+err.message, 4000); });
}


// Listeners para exportar todos — cambio de período
document.getElementById('export-dia-periodo').addEventListener('change', function(){
  var t = this.value;
  document.getElementById('export-dia-ctrl-dia').style.display   = t==='dia'  ?'':'none';
  document.getElementById('export-dia-ctrl-mes').style.display   = t==='mes'  ?'':'none';
  document.getElementById('export-dia-ctrl-anio').style.display  = t==='anio' ?'':'none';
  document.getElementById('export-dia-ctrl-rango').style.display = t==='rango'?'flex':'none';
});

function exportarReporte(formato){
  var tipoRep = document.getElementById('export-tipo-reporte').value;
  var soloAusencias = false; // filtro eliminado

  // ── NUEVO: Reporte por niveles ─────────────────────
  if(tipoRep === 'niveles'){
    var tipoPer3 = document.getElementById('export-dia-periodo').value;
    var desde3, hasta3;
    if(tipoPer3==='dia'){
      desde3 = document.getElementById('export-fecha').value||fechaSeleccionada;
      hasta3 = desde3;
    } else if(tipoPer3==='mes'){
      var mesN = document.getElementById('export-dia-mes').value||hoyStr().slice(0,7);
      var pmN = mesN.split('-'); var anioMN=parseInt(pmN[0]),mesMN=parseInt(pmN[1])-1;
      desde3 = mesN+'-01';
      var ultN = new Date(anioMN,mesMN+1,0);
      hasta3 = ultN.getFullYear()+'-'+String(ultN.getMonth()+1).padStart(2,'0')+'-'+String(ultN.getDate()).padStart(2,'0');
    } else if(tipoPer3==='anio'){
      var anioN = parseInt(document.getElementById('export-dia-anio').value)||ANIO_SEL;
      desde3=anioN+'-01-01'; hasta3=anioN+'-12-31';
    } else {
      desde3=document.getElementById('export-dia-desde').value;
      hasta3=document.getElementById('export-dia-hasta').value;
      if(!desde3||!hasta3){ toast('Seleccioná un rango',3000); return; }
    }

    toast('⏳ Generando reporte por niveles…',6000);
    db.from('novedades').select('*')
      .gte('fecha',desde3).lte('fecha',hasta3)
      .then(function(res){
        var snap = res.data || [];
        var nivelesOrden = ['secundaria','primaria','inicial'];
        var nivelLabels  = { secundaria:'Secundaria', primaria:'Primaria', inicial:'Inicial' };
        var mapaNovedades = {};
        snap.forEach(function(n){
          var key = n.docente_id+'_'+n.fecha;
          if(!mapaNovedades[key]){ mapaNovedades[key]=n; }
          else {
            var tsN = n.created_at ? new Date(n.created_at).getTime() : 0;
            var tsV = mapaNovedades[key].created_at ? new Date(mapaNovedades[key].created_at).getTime() : 0;
            if(tsN>=tsV) mapaNovedades[key]=n;
          }
        });

        // Construir datos por nivel
        var datosNivel = {};
        var diasNom = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        nivelesOrden.forEach(function(niv){
          var docsNiv = TODOS_DOCENTES.filter(function(d){ return (d.nivel||'secundaria')===niv; });
          var filas = [];
          var cur = new Date(desde3+'T12:00:00'), fin = new Date(hasta3+'T12:00:00');
          while(cur<=fin){
            var ds = cur.getDay();
            if(ds!==0&&ds!==6){
              var f=cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
              if(!esFeriado(f)){
                docsNiv.forEach(function(doc){
                  var tieneH = diasConHorario(doc.horario||{}).some(function(x){ return DIA_IDX[x.toLowerCase()]===ds; });
                  if(!tieneH) return;
                  var nov = mapaNovedades[doc.id+'_'+f];
                  var estado = nov ? (LABELS[nov.tipo]||nov.tipo) : 'Presente';
                  var fechaFmt = f.slice(8,10)+'/'+f.slice(5,7);
                  var diaNomCorto = diasNom[ds].slice(0,3);
                  var _nomNiv = (doc.apellido&&doc.apellido.trim()) ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido) : doc.nombre;
                  if(estado!=='Presente') filas.push([fechaFmt+' '+diaNomCorto, _nomNiv, doc.cargo||'—', doc.area||'—', estado]);
                });
              }
            }
            cur.setDate(cur.getDate()+1);
          }
          filas.sort(function(a,b){ return a[0].localeCompare(b[0])||a[2].localeCompare(b[2],'es'); });
          datosNivel[niv] = { docs:docsNiv, filas:filas };
        });

        var periodoLabel = desde3===hasta3 ? desde3 : desde3+' a '+hasta3;

        if(formato==='excel'){
          // Una hoja por nivel
          var wb = XLSX.utils.book_new();
          nivelesOrden.forEach(function(niv){
            var d = datosNivel[niv];
            if(!d.filas.length && !d.docs.length) return;
            var wsData = [['Fecha','Docente','Cargo','Área','Estado']].concat(d.filas);
            var ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, nivelLabels[niv].replace(/[^\w\s]/gi,'').trim());
          });
          XLSX.writeFile(wb, 'Ausencias_por_niveles_'+desde3+'.xlsx');
          toast('Excel descargado'); mExportDia.close();
        } else {
          // PDF: una sección por nivel
          var docP = new window.jspdf.jsPDF({orientation:'l'});
          docP.setFont('helvetica','bold'); docP.setFontSize(16);
          docP.text('Reporte de ausencias por niveles', 14, 18);
          docP.setFont('helvetica','normal'); docP.setFontSize(10);
          docP.setTextColor(120);
          docP.text('Período: '+periodoLabel, 14, 26);
          docP.setTextColor(0);
          var yPos = 34;
          var colores = { secundaria:[26,43,74], primaria:[5,100,60], inicial:[146,80,10] };

          nivelesOrden.forEach(function(niv){
            var d = datosNivel[niv];
            if(!d.docs.length) return;
            // Encabezado de nivel
            if(yPos > 170){ docP.addPage(); yPos = 20; }
            docP.setFont('helvetica','bold'); docP.setFontSize(13);
            docP.setTextColor(colores[niv][0],colores[niv][1],colores[niv][2]);
            docP.text(nivelLabels[niv]+' ('+d.docs.length+' docentes, '+d.filas.length+' ausencias)', 14, yPos);
            docP.setTextColor(0);
            yPos += 5;
            if(!d.filas.length){
              docP.setFont('helvetica','normal'); docP.setFontSize(9);
              docP.setTextColor(100);
              docP.text('Sin ausencias en el período', 14, yPos+4);
              docP.setTextColor(0);
              yPos += 12;
            } else {
              docP.autoTable({
                head:[['Fecha','Docente','Cargo','Área','Estado']],
                body: d.filas,
                startY: yPos,
                styles:{font:'helvetica',fontSize:8,cellPadding:2.5},
                headStyles:{fillColor:colores[niv],textColor:255,fontStyle:'bold'},
                alternateRowStyles:{fillColor:[248,250,252]},
                columnStyles:{0:{cellWidth:22},1:{cellWidth:65},2:{cellWidth:35},3:{cellWidth:30}},
                margin:{left:14,right:14}
              });
              yPos = docP.lastAutoTable.finalY + 12;
            }
          });
          docP.save('Ausencias_por_niveles_'+desde3+'.pdf');
          toast('PDF descargado'); mExportDia.close();
        }
      }).catch(function(err){ toast('Error: '+err.message,4000); });
    return;
  }

  if(tipoRep==='dia'){
    var tipoPer2=document.getElementById('export-dia-periodo').value;
    var desde2,hasta2;
    if(tipoPer2==='dia'){
      desde2=document.getElementById('export-fecha').value||fechaSeleccionada;
      hasta2=desde2;
    } else if(tipoPer2==='mes'){
      var mesE=document.getElementById('export-dia-mes').value||hoyStr().slice(0,7);
      var pmE=mesE.split('-'); var anioME=parseInt(pmE[0]),mesME=parseInt(pmE[1])-1;
      desde2=mesE+'-01';
      var ultE=new Date(anioME,mesME+1,0);
      hasta2=ultE.getFullYear()+'-'+String(ultE.getMonth()+1).padStart(2,'0')+'-'+String(ultE.getDate()).padStart(2,'0');
    } else if(tipoPer2==='anio'){
      var anioE=parseInt(document.getElementById('export-dia-anio').value)||ANIO_SEL;
      desde2=anioE+'-01-01'; hasta2=anioE+'-12-31';
    } else {
      desde2=document.getElementById('export-dia-desde').value;
      hasta2=document.getElementById('export-dia-hasta').value;
      if(!desde2||!hasta2){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Seleccioná un rango',3000); return; }
    }

    if(desde2===hasta2){
      // Un solo día
      obtenerDatosAsistenciaDia(desde2, function(filas, f){
        var fObj=new Date(f+'T12:00:00');
        var nivelExp2 = document.getElementById('export-nivel').value;
        var areaExp2  = document.getElementById('export-area').value;
        var nivelNombres = {secundaria:'Secundaria', primaria:'Primaria', inicial:'Inicial'};
        var sufijo = nivelExp2 ? ' — '+(nivelNombres[nivelExp2]||nivelExp2)+(areaExp2?' · '+areaExp2:'') : '';
        var titulo='Asistencia'+sufijo+' — '+fObj.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
        // Aplicar filtro solo ausencias si está marcado
        var filasExport = soloAusencias ? filas.filter(function(r){ return r[2]!=='Presente'; }) : filas;
        if(formato==='excel'){
          exportarExcel(filasExport,['Docente','Cargo','Estado'],'Asistencia'+sufijo.replace(/ — /,'_').replace(/·/,'').replace(/\s+/g,'_')+'_'+f);
          toast('Exportado'); mExportDia.close();
        } else {
          // PDF con el mismo formato limpio del reporte de grupo
          var filasPresentes = filas.filter(function(r){ return r[2]==='Presente'; });
          var filasAusencias = filas.filter(function(r){ return r[2]!=='Presente'; });
          var pct = filas.length>0 ? Math.round((filasPresentes.length/filas.length)*100) : 100;
          var doc4 = new window.jspdf.jsPDF({orientation:'p'});
          doc4.setFont('helvetica','bold'); doc4.setFontSize(16);
          doc4.text(titulo, 14, 18);
          doc4.setFont('helvetica','normal'); doc4.setFontSize(10);
          doc4.setTextColor(120);
          doc4.text('Total: '+filas.length+' docentes  |  Presentes: '+filasPresentes.length+'  |  Ausencias: '+filasAusencias.length+'  |  Asistencia: '+pct+'%', 14, 26);
          doc4.setTextColor(0);
          // Tabla resumen
          var resPorTipo = {};
          filasAusencias.forEach(function(r){ resPorTipo[r[2]]=(resPorTipo[r[2]]||0)+1; });
          var filasRes4 = Object.keys(resPorTipo).map(function(t){ return [t, resPorTipo[t]]; });
          filasRes4.sort(function(a,b){ return b[1]-a[1]; });
          if(filasRes4.length){
            doc4.autoTable({
              head:[['Estado','Cantidad']],
              body:filasRes4,
              startY:32,
              styles:{font:'helvetica',fontSize:9,cellPadding:3},
              headStyles:{fillColor:[26,43,74],textColor:255,fontStyle:'bold'},
              alternateRowStyles:{fillColor:[248,250,252]},
              columnStyles:{1:{halign:'center',fontStyle:'bold'}},
              margin:{left:14,right:14}, tableWidth:90
            });
          }
          var startY4 = (filasRes4.length ? doc4.lastAutoTable.finalY : 28) + 10;

          // Tabla de presentes
          if(filasPresentes.length){
            doc4.setFont('helvetica','bold'); doc4.setFontSize(11);
            doc4.text('Presentes ('+filasPresentes.length+')', 14, startY4);
            doc4.autoTable({
              head:[['Docente','Cargo','Estado']],
              body:filasPresentes.map(function(r){ return [r[0],r[1],r[2]]; }),
              startY:startY4+4,
              styles:{font:'helvetica',fontSize:8.5,cellPadding:3},
              headStyles:{fillColor:[22,163,74],textColor:255,fontStyle:'bold'},
              alternateRowStyles:{fillColor:[240,253,244]},
              columnStyles:{0:{cellWidth:80},1:{cellWidth:55},2:{cellWidth:35}},
              margin:{left:14,right:14}
            });
            startY4 = doc4.lastAutoTable.finalY + 10;
          }

          // Detalle de ausencias y otros registros
          if(filasAusencias.length){
            doc4.setFont('helvetica','bold'); doc4.setFontSize(11);
            doc4.text('Ausencias y otros registros ('+filasAusencias.length+')', 14, startY4);
            doc4.autoTable({
              head:[['Docente','Cargo','Estado']],
              body:filasAusencias,
              startY:startY4+4,
              styles:{font:'helvetica',fontSize:8.5,cellPadding:3},
              headStyles:{fillColor:[185,28,28],textColor:255,fontStyle:'bold'},
              alternateRowStyles:{fillColor:[255,248,248]},
              columnStyles:{0:{cellWidth:80},1:{cellWidth:55},2:{cellWidth:35}},
              margin:{left:14,right:14}
            });
          }
          doc4.save('Asistencia_'+f+'.pdf');
          toast('PDF descargado'); mExportDia.close();
        }
      });
    } else {
      // Rango: generar todas las filas por día + docente con horario
      toast('⏳ Generando reporte…',5000);
      db.from('novedades').select('*').gte('fecha',desde2).lte('fecha',hasta2).then(function(res){
        var snap = res.data || [];
        var diasN=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        // Agrupar novedades por docente_id+fecha
        var mapaNovedades={};
        snap.forEach(function(n){
          var key=n.docente_id+'_'+n.fecha;
          if(!mapaNovedades[key]){
            mapaNovedades[key]=n;
          } else {
            var tsN = n.created_at ? new Date(n.created_at).getTime() : 0;
            var tsV = mapaNovedades[key].created_at ? new Date(mapaNovedades[key].created_at).getTime() : 0;
            if(tsN>=tsV) mapaNovedades[key]=n;
          }
        });
        // Generar filas para cada día hábil del período
        var filas=[];
        var cur=new Date(desde2+'T12:00:00'), fin=new Date(hasta2+'T12:00:00');
        while(cur<=fin){
          var diaSem=cur.getDay();
          if(diaSem!==0&&diaSem!==6){
            var f=cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
            if(!esFeriado(f)){
              TODOS_DOCENTES.forEach(function(doc){
                var tieneHorario=diasConHorario(doc.horario||{}).some(function(x){ return DIA_IDX[x.toLowerCase()]===diaSem; });
                if(!tieneHorario) return;
                var nov=mapaNovedades[doc.id+'_'+f];
                var estadoLabel=nov?(LABELS[nov.tipo]||nov.tipo):'Presente';
                filas.push([f,diasN[diaSem],doc.nombre,doc.cargo||'—',estadoLabel]);
              });
            }
          }
          cur.setDate(cur.getDate()+1);
        }
        // Formato compacto por docente, separado por nivel, sin días futuros ni post-jubilación
        toast('⏳ Generando reporte…',5000);
        var hastaEfec2 = hasta2 > hoyStr() ? hoyStr() : hasta2;
        // Reusar mapaNovedades ya construido arriba
        var nivOrden = ['secundaria','primaria','inicial'];
        var nivLabel = {secundaria:'[S] Secundaria', primaria:'[P] Primaria', inicial:'[I] Inicial'};

        function keyApellido(doc){
          if(doc.apellido&&doc.apellido.trim()){
            return (doc.apellido).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
          }
          var n=(doc.nombre||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
          var p=n.split(/\s+/); return p.length>1?p[p.length-1]+' '+p.slice(0,-1).join(' '):n;
        }

        if(formato==='excel'){
          var wb = XLSX.utils.book_new();
          nivOrden.forEach(function(niv){
            var docsNiv = TODOS_DOCENTES.filter(function(d){ return (d.nivel||'secundaria')===niv; });
            if(!docsNiv.length) return;
            docsNiv.sort(function(a,b){ return keyApellido(a).localeCompare(keyApellido(b),'es'); });
            var filasXls = [['Docente','Cargo','Presentes/Total','% Asistencia','Novedades']];
            docsNiv.forEach(function(doc){
              var novDoc={};
              Object.keys(mapaNovedades).forEach(function(k){ if(k.startsWith(doc.id+'_')){ var n=mapaNovedades[k]; novDoc[n.fecha]=n; } });
              var fechaJub=getFechaJubDoc(doc.id,mapaNovedades);
              var datos=construirDatosDocente(novDoc,doc.horario||{},desde2,hastaEfec2,fechaJub);
              if(!datos.totalDias) return;
              var det=Object.keys(datos.porTipo).map(function(t){ return (LABELS_SHORT[t]||t)+': '+datos.porTipo[t].join(', '); }).join(' | ');
              var _nd4 = (doc.apellido&&doc.apellido.trim()) ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido) : doc.nombre;
              filasXls.push([_nd4,doc.cargo||'',datos.presentes+'/'+datos.totalDias,datos.pct+'%',det||'Sin novedades']);
            });
            var ws=XLSX.utils.aoa_to_sheet(filasXls);
            XLSX.utils.book_append_sheet(wb,ws,(nivLabel[niv]||niv).replace(/[^\w\s]/gi,'').trim().slice(0,25));
          });
          XLSX.writeFile(wb,'Asistencia_todos_'+desde2+'_'+hastaEfec2+'.xlsx');
        } else {
          var docR2=pdfNuevo();
          var yPosR=pdfEncabezado(docR2,'Reporte de asistencia — Todos los docentes','Período: '+desde2+' a '+hastaEfec2);
          nivOrden.forEach(function(niv){
            var docsNiv=TODOS_DOCENTES.filter(function(d){ return (d.nivel||'secundaria')===niv; });
            if(!docsNiv.length) return;
            docsNiv.sort(function(a,b){ return keyApellido(a).localeCompare(keyApellido(b),'es'); });
            yPosR=pdfTituloNivel(docR2,nivLabel[niv]||niv,yPosR);
            docsNiv.forEach(function(doc){
              var novDoc={};
              Object.keys(mapaNovedades).forEach(function(k){ if(k.startsWith(doc.id+'_')){ var n=mapaNovedades[k]; novDoc[n.fecha]=n; } });
              var fechaJub=getFechaJubDoc(doc.id,mapaNovedades);
              var datos=construirDatosDocente(novDoc,doc.horario||{},desde2,hastaEfec2,fechaJub);
              if(!datos.totalDias) return;
              var _nd1 = (doc.apellido&&doc.apellido.trim()) ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido) : doc.nombre;
              yPosR=pdfFilaDocente(docR2,_nd1,doc.cargo||'',niv,datos,yPosR);
            });
          });
          docR2.save('Asistencia_todos_'+desde2+'_'+hastaEfec2+'.pdf');
        }
        toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Exportado'); mExportDia.close();
      }).catch(function(err){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Error: '+err.message,4000); });
    }
  } else {
    var docenteId = document.getElementById('export-docente-sel').value;
    if(!docenteId){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Seleccioná un docente',3000); return; }
    var doc = TODOS_DOCENTES.find(function(d){ return d.id===docenteId; });
    var tipoPer = document.getElementById('export-periodo-tipo').value;
    var desde, hasta;
    if(tipoPer==='mes'){
      var mes=document.getElementById('export-mes').value||hoyStr().slice(0,7);
      var partes=mes.split('-'); var anioM=parseInt(partes[0]),mesM=parseInt(partes[1])-1;
      desde=mes+'-01';
      var ult=new Date(anioM,mesM+1,0);
      hasta=ult.getFullYear()+'-'+String(ult.getMonth()+1).padStart(2,'0')+'-'+String(ult.getDate()).padStart(2,'0');
    } else if(tipoPer==='anio'){
      var anio=parseInt(document.getElementById('export-anio').value)||new Date().getFullYear();
      desde=anio+'-01-01'; hasta=anio+'-12-31';
    } else {
      desde=document.getElementById('export-desde').value;
      hasta=document.getElementById('export-hasta').value;
      if(!desde||!hasta){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Seleccioná un rango',3000); return; }
    }
    // Recargar el docente desde Supabase para obtener el horario actualizado
    var promHorario = db.from('docentes').select('horario').eq('id',docenteId).maybeSingle().then(function(res){
      return (res.data ? (res.data.horario||{}) : (doc ? (doc.horario||{}) : {}));
    }).catch(function(){ return doc ? (doc.horario||{}) : {}; });

    promHorario.then(function(horarioActualizado){
    db.from('novedades').select('*').eq('docente_id',docenteId).then(function(res){
      var snap = res.data || [];
      var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      var DIAS_CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
      var horarioDoc = horarioActualizado;

      // Mapear novedades por fecha
      var novedadesPorFecha = {};
      snap.forEach(function(x){
        if(x.tipo !== 'presente' && x.fecha >= desde && x.fecha <= hasta && !esFeriado(x.fecha))
          novedadesPorFecha[x.fecha] = x;
      });

      // Agrupar por mes
      var porMes = {};
      var cur = new Date(desde+'T12:00:00'), fin2 = new Date(hasta+'T12:00:00');
      while(cur <= fin2){
        var dow = cur.getDay();
        if(dow !== 0 && dow !== 6){
          var f = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
          if(!esFeriado(f)){
            var tieneH = Object.keys(horarioDoc).length > 0
              ? diasConHorario(horarioDoc).some(function(dk){ return DIA_IDX[dk.toLowerCase()]===dow; })
              : true;
            if(tieneH){
              var mesKey = f.slice(0,7);
              if(!porMes[mesKey]){
                var nm = parseInt(mesKey.slice(5))-1;
                porMes[mesKey] = { nombre: MESES[nm]+' '+mesKey.slice(0,4), presentes:[], porTipo:{} };
              }
              var nov = novedadesPorFecha[f];
              var etiq = DIAS_CORTO[dow]+' '+f.slice(8,10)+'/'+f.slice(5,7);
              if(!nov){ porMes[mesKey].presentes.push(etiq); }
              else {
                var t = nov.tipo;
                if(!porMes[mesKey].porTipo[t]) porMes[mesKey].porTipo[t] = [];
                porMes[mesKey].porTipo[t].push(etiq);
              }
            }
          }
        }
        cur.setDate(cur.getDate()+1);
      }

      // Formato compacto — respeta jubilación y no cuenta días futuros
      var hastaEfecInd = hasta > hoyStr() ? hoyStr() : hasta;
      var novDocInd = {};
      var fechaJubInd = null;
      snap.forEach(function(x){
        if(x.tipo!=='presente'&&!esFeriado(x.fecha)&&x.fecha>=desde&&x.fecha<=hasta) novDocInd[x.fecha]=x;
        if(x.tipo==='jubilacion'&&(!fechaJubInd||x.fecha<fechaJubInd)) fechaJubInd=x.fecha;
      });
      var datos=construirDatosDocente(novDocInd,horarioDoc,desde,hastaEfecInd,fechaJubInd);
      var nombre='Reporte_'+(doc?doc.nombre.replace(/ /g,'_'):docenteId)+'_'+desde;

      if(formato==='excel'){
        var _nd3 = doc ? ((doc.apellido&&doc.apellido.trim()) ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido) : doc.nombre) : docenteId;
        var filas=[[_nd3,doc?doc.cargo||'':'',datos.presentes+'/'+datos.totalDias+' ('+datos.pct+'%)' ]];
        Object.keys(datos.porTipo).forEach(function(t){
          filas.push([LABELS[t]||t,datos.porTipo[t].length,datos.porTipo[t].join(', ')]);
        });
        exportarExcel(filas,['Docente / Tipo','Cantidad','Días'],nombre);
      } else if(tipoPer==='mes'){
        var _nd2cal = doc ? ((doc.apellido&&doc.apellido.trim()) ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido) : doc.nombre) : docenteId;
        exportarCalendarioMes(doc, _nd2cal, desde, hasta, novedadesPorFecha);
      } else {
        var docPDF=pdfNuevo();
        var yPos=pdfEncabezado(docPDF,'Reporte de asistencia','Período: '+desde+' a '+hastaEfecInd);
        var _nd2 = doc ? ((doc.apellido&&doc.apellido.trim()) ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido) : doc.nombre) : docenteId;
        pdfFilaDocente(docPDF,_nd2,doc?doc.cargo||'':'',doc?(doc.nivel||'secundaria'):'',datos,yPos);
        docPDF.save(nombre+'.pdf');
      }
      toast('Exportado'); mExportDia.close();
    }).catch(function(err){ toast('Error: '+err.message,4000); });
    }); // cierre promHorario.then
  }
}
document.getElementById('export-dia-excel').addEventListener('click', function(){ exportarReporte('excel'); });
document.getElementById('export-dia-pdf').addEventListener('click',   function(){ exportarReporte('pdf'); });

// ── PDF helpers — formato compacto ──────────────────
var PDF_MARGIN = 12;
var PDF_FONT   = 'helvetica';
var MESES_CORTO_PDF = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var DIAS_CORTO_PDF  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
var NIVELES_ORDEN   = ['secundaria','primaria','inicial'];
var NIVELES_LABEL   = { secundaria:'Secundaria', primaria:'Primaria', inicial:'Inicial' };

function pdfNuevo(){
  var d = new window.jspdf.jsPDF({ orientation:'p', unit:'mm', format:'a4' });
  d.setFont(PDF_FONT, 'normal'); d.setFontSize(10);
  return d;
}
function pdfEncabezado(d, titulo, subtitulo, y){
  y = y || 14;
  d.setFont(PDF_FONT,'bold'); d.setFontSize(13);
  d.text(String(titulo||''), PDF_MARGIN, y); y += 6;
  if(subtitulo){
    d.setFont(PDF_FONT,'normal'); d.setFontSize(9);
    d.setTextColor(100,100,100); d.text(String(subtitulo), PDF_MARGIN, y); d.setTextColor(0,0,0);
    y += 5;
  }
  return y + 2;
}

// Construir datos de un docente: respeta jubilación y no cuenta días futuros
function construirDatosDocente(novedadesPorFecha, horario, desde, hasta, fechaJub){
  var hoy = hoyStr();
  var hastaEfec = hasta > hoy ? hoy : hasta;
  if(fechaJub && fechaJub < hastaEfec) hastaEfec = fechaJub;

  var presentes = 0, totalDias = 0;
  var porTipo = {};
  var tieneHorarioCargado = Object.keys(horario).length > 0 && diasConHorario(horario).length > 0;

  // Primero: volcar TODOS los registros existentes en Firestore (sin importar horario)
  Object.keys(novedadesPorFecha).forEach(function(f){
    if(f < desde || f > hastaEfec) return;
    var nov = novedadesPorFecha[f];
    if(!nov || nov.tipo === 'presente') return;
    var dow = new Date(f+'T12:00:00').getDay();
    var etiq = DIAS_CORTO_PDF[dow]+' '+f.slice(8,10)+'/'+f.slice(5,7)+(nov.docsEntregados?' ✓':'');
    var t = nov.tipo;
    if(!porTipo[t]) porTipo[t] = [];
    // Evitar duplicados
    if(porTipo[t].indexOf(etiq) === -1) porTipo[t].push(etiq);
  });

  // Luego: recorrer el calendario para contar presentes y totalDias
  var cur = new Date(desde+'T12:00:00');
  var fin = new Date(hastaEfec+'T12:00:00');
  while(cur <= fin){
    var dow = cur.getDay();
    if(dow !== 0 && dow !== 6){
      var f = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
      if(!esFeriado(f)){
        // Contar el día si tiene horario ese día, o si tiene un registro de novedad ese día
        var tieneH = tieneHorarioCargado
          ? diasConHorario(horario).some(function(dk){ return DIA_IDX[dk.toLowerCase()]===dow; })
          : false;
        var tieneNov = !!novedadesPorFecha[f];
        if(tieneH || tieneNov){
          totalDias++;
          var nov = novedadesPorFecha[f];
          if(!nov || nov.tipo==='presente'){ presentes++; }
          // los no-presentes ya están en porTipo desde el loop anterior
        }
      }
    }
    cur.setDate(cur.getDate()+1);
  }
  // Ordenar cada tipo por fecha (están en formato "Lun 14/04" — ordenar por el índice en novedadesPorFecha)
  // Reordenar usando las fechas originales como clave
  var fechasOrdenadas = Object.keys(novedadesPorFecha).filter(function(f){ return f>=desde&&f<=hastaEfec; }).sort();
  Object.keys(porTipo).forEach(function(t){
    porTipo[t].sort(function(a, b){
      // Extraer dd/mm de la etiqueta "Xxx dd/mm" y comparar como fecha
      var pa = a.slice(-5).split('/'); var pb = b.slice(-5).split('/');
      var da = pa[1]+pa[0], db = pb[1]+pb[0]; // MMDD para comparar
      return da < db ? -1 : da > db ? 1 : 0;
    });
  });
  // % solo baja con faltas reales
  var soloFaltas = Object.keys(porTipo).filter(function(t){ return esFaltaCualquiera(t); })
    .reduce(function(s,t){ return s+porTipo[t].length; },0);
  var diasParaPct = presentes + soloFaltas;
  var pct = diasParaPct > 0 ? Math.round((presentes/diasParaPct)*100) : 100;
  return { presentes:presentes, totalDias:totalDias, porTipo:porTipo, pct:pct };
}

// Escribir una fila compacta de docente en el PDF. Retorna nuevo yPos.
function pdfFilaDocente(d, nombre, cargo, nivel, datos, yPos){
  var margen = PDF_MARGIN;
  var anchoUtil = 186;
  var colPct = datos.pct>=90?[22,163,74]:datos.pct>=75?[202,138,4]:[220,38,38];

  if(yPos > 270){ d.addPage(); yPos = 14; }

  // Nombre en negrita
  var nombreStr = String(nombre||'Sin nombre');
  d.setFont(PDF_FONT,'bold'); d.setFontSize(9.5);
  d.setTextColor(26,43,74);
  d.text(nombreStr, margen, yPos);

  // % alineado a la derecha
  var pctStr = String(datos.presentes)+'/'+String(datos.totalDias)+' ('+String(datos.pct)+'%)';
  d.setTextColor(colPct[0],colPct[1],colPct[2]);
  d.text(pctStr, 210 - margen - d.getTextWidth(pctStr), yPos);
  d.setTextColor(0,0,0);
  yPos += 4;

  // Cargo en línea separada más chica
  if(cargo){
    d.setFont(PDF_FONT,'normal'); d.setFontSize(7.5);
    d.setTextColor(120,120,120);
    d.text(String(cargo), margen, yPos);
    d.setTextColor(0,0,0);
    yPos += 3.5;
  }

  // Novedades compactas
  var tiposFaltas = Object.keys(datos.porTipo).filter(function(t){ return esFaltaCualquiera(t); });
  var tiposOtros  = Object.keys(datos.porTipo).filter(function(t){ return !esFaltaCualquiera(t); });

  function escribirTipo(t, esRojo){
    if(yPos > 274){ d.addPage(); yPos = 14; }
    var label = String(LABELS_SHORT[t]||t)+': ';
    var diasArr = datos.porTipo[t]||[];
    var diasStr = diasArr.length ? diasArr.join(', ') : '—';
    d.setFont(PDF_FONT,'bold'); d.setFontSize(8);
    if(esRojo){ d.setTextColor(220,38,38); } else { d.setTextColor(160,100,0); }
    d.text(label, margen+2, yPos);
    d.setFont(PDF_FONT,'normal'); d.setFontSize(8);
    d.setTextColor(60,60,60);
    var labelW = d.getTextWidth(label);
    var maxW = Math.max(anchoUtil - labelW - 2, 20);
    var lines = d.splitTextToSize(diasStr, maxW);
    if(lines && lines.length){ d.text(lines, margen+2+labelW, yPos); }
    yPos += Math.max(lines?lines.length:1,1)*3.8;
    d.setTextColor(0,0,0);
  }

  tiposFaltas.forEach(function(t){ escribirTipo(t,true); });
  tiposOtros.forEach(function(t){ escribirTipo(t,false); });

  // Separador
  d.setDrawColor(210,210,210);
  d.line(margen, yPos+0.8, 210-margen, yPos+0.8);
  yPos += 3.5;
  return yPos;
}

// Título de nivel dentro del PDF
function pdfTituloNivel(d, label, yPos){
  if(yPos > 265){ d.addPage(); yPos = 14; }
  d.setFillColor(240,244,255);
  d.rect(PDF_MARGIN, yPos-2, 186, 7, 'F');
  d.setFont(PDF_FONT,'bold'); d.setFontSize(10);
  d.setTextColor(26,43,74);
  d.text(label, PDF_MARGIN+2, yPos+3);
  d.setTextColor(0,0,0);
  return yPos + 9;
}

// Obtener fechaJubilacion de un docente a partir de sus novedades
function getFechaJubDoc(docId, mapaNovedades){
  var keys = Object.keys(mapaNovedades);
  for(var i=0;i<keys.length;i++){
    var n = mapaNovedades[keys[i]];
    if((n.docente_id||n.docenteId)===docId && n.tipo==='jubilacion') return n.fecha;
  }
  return null;
}
function pdfTablaResumenMes(d, m, yPos){
  var totalPresentes = m.presentes.length;
  // Solo faltas justificadas e injustificadas bajan el %
  var soloFaltas = Object.keys(m.porTipo).filter(function(t){ return esFaltaCualquiera(t); })
    .reduce(function(s,t){ return s+m.porTipo[t].length; },0);
  var totalDias = totalPresentes + Object.keys(m.porTipo).reduce(function(s,t){ return s+m.porTipo[t].length; },0);
  var diasParaPct = totalPresentes + soloFaltas;
  var pct = diasParaPct > 0 ? Math.round((totalPresentes/diasParaPct)*100) : 100;
  var colPct = pct>=90?[22,163,74]:pct>=75?[202,138,4]:[220,38,38];

  if(yPos > 260){ d.addPage(); yPos = 14; }

  // Franja del mes
  d.setFillColor(235,240,255);
  d.rect(PDF_MARGIN, yPos-3, 190, 8, 'F');
  d.setFont(PDF_FONT,'bold'); d.setFontSize(11);
  d.setTextColor(26,43,74);
  d.text(m.nombre, PDF_MARGIN+2, yPos+3);
  d.setTextColor(colPct[0],colPct[1],colPct[2]);
  d.text(pct+'% asistencia', 155, yPos+3);
  d.setTextColor(0);
  yPos += 10;

  // Ordenar: Presente primero, faltas, luego otros
  var filasMes = [];
  filasMes.push({ tipo:'Presente', cantidad:totalPresentes+'/'+totalDias, dias:m.presentes.join(', ')||'—', color:[22,163,74] });
  // Faltas primero
  Object.keys(m.porTipo).filter(function(t){ return esFaltaCualquiera(t); }).forEach(function(t){
    filasMes.push({ tipo:LABELS[t]||t, cantidad:m.porTipo[t].length, dias:m.porTipo[t].join(', '), color:[220,38,38] });
  });
  // Luego otros
  Object.keys(m.porTipo).filter(function(t){ return !esFaltaCualquiera(t); }).forEach(function(t){
    filasMes.push({ tipo:LABELS[t]||t, cantidad:m.porTipo[t].length, dias:m.porTipo[t].join(', '), color:[202,138,4] });
  });

  d.autoTable({
    head:[['Tipo','Cant.','Días']],
    body: filasMes.map(function(r){ return [r.tipo, r.cantidad, r.dias]; }),
    startY: yPos,
    styles:{ font:PDF_FONT, fontSize:11, cellPadding:3, overflow:'linebreak' },
    headStyles:{ fillColor:[26,43,74], textColor:255, fontStyle:'bold', fontSize:10 },
    alternateRowStyles:{ fillColor:[248,250,252] },
    columnStyles:{ 0:{cellWidth:55}, 1:{cellWidth:22, halign:'center'}, 2:{cellWidth:113} },
    margin:{ left:PDF_MARGIN, right:PDF_MARGIN },
    didParseCell: function(data){
      if(data.section==='body'){
        var r = filasMes[data.row.index];
        if(r && data.column.index===0){ data.cell.styles.textColor=r.color; data.cell.styles.fontStyle='bold'; }
      }
    }
  });
  return d.lastAutoTable.finalY + 8;
}
function construirResumenPerfil(snap, desde, hasta){
  var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var DIAS_CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  var horario = docPerfil.horario || {};

  // Mapear novedades por fecha
  var novedadesPorFecha = {};
  var _arrSnap = Array.isArray(snap) ? snap : ((snap && snap.data) || []);
  _arrSnap.forEach(function(x){
    if(x.tipo !== 'presente') novedadesPorFecha[x.fecha] = x;
  });

  // Recorrer días hábiles y agrupar por mes
  var porMes = {}; // 'YYYY-MM' -> { nombre, presentes:[], porTipo:{tipo:[fechas]} }
  var cur = new Date(desde+'T12:00:00'), fin = new Date(hasta+'T12:00:00');
  while(cur <= fin){
    var dow = cur.getDay();
    if(dow !== 0 && dow !== 6){
      var f = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
      var mesKey = f.slice(0,7);
      if(!esFeriado(f)){
        var tieneH = Object.keys(horario).length > 0
          ? diasConHorario(horario).some(function(dk){ return DIA_IDX[dk.toLowerCase()]===dow; })
          : true;
        if(tieneH){
          if(!porMes[mesKey]){
            var nm = parseInt(mesKey.slice(5))-1;
            porMes[mesKey] = { nombre: MESES[nm]+' '+mesKey.slice(0,4), presentes:[], porTipo:{} };
          }
          var nov = novedadesPorFecha[f];
          var etiq = DIAS_CORTO[dow]+' '+parseInt(f.slice(8));
          if(!nov || nov.tipo === 'presente'){
            porMes[mesKey].presentes.push(etiq);
          } else {
            var t = nov.tipo;
            if(!porMes[mesKey].porTipo[t]) porMes[mesKey].porTipo[t] = [];
            porMes[mesKey].porTipo[t].push(etiq);
          }
        }
      }
    }
    cur.setDate(cur.getDate()+1);
  }
  return porMes;
}

document.getElementById('perf-export-excel').addEventListener('click', function(){
  if(!docPerfil) return;
  var tipo=document.getElementById('perf-tipo-periodo').value;
  var desde,hasta,anioActual=new Date().getFullYear();
  if(tipo==='anio'){ var anio=parseInt(document.getElementById('perf-anio').value)||anioActual; desde=anio+'-01-01'; hasta=anio+'-12-31'; }
  else if(tipo==='mes'){ var mes=document.getElementById('perf-mes').value||hoyStr().slice(0,7); var pm=mes.split('-'); var anioMp=parseInt(pm[0]),mesMp=parseInt(pm[1])-1; desde=mes+'-01'; var ultP=new Date(anioMp,mesMp+1,0); hasta=ultP.getFullYear()+'-'+String(ultP.getMonth()+1).padStart(2,'0')+'-'+String(ultP.getDate()).padStart(2,'0'); }
  else { desde=document.getElementById('perf-desde').value; hasta=document.getElementById('perf-hasta').value; }
  if(!desde||!hasta){ toast('Seleccioná un período',3000); return; }
  var hastaEfec=hasta>hoyStr()?hoyStr():hasta;
  db.from('novedades').select('*').eq('docente_id',docPerfil.id).gte('fecha',desde).lte('fecha',hastaEfec)
    .then(function(res){
      var novDoc={}; var fechaJub=null;
      (res.data||[]).forEach(function(x){ if(x.tipo!=='presente'&&!esFeriado(x.fecha)) novDoc[x.fecha]=x; if(x.tipo==='jubilacion'&&(!fechaJub||x.fecha<fechaJub)) fechaJub=x.fecha; });
      var datos=construirDatosDocente(novDoc,docPerfil.horario||{},desde,hastaEfec,fechaJub);
      var filas=[[docPerfil.nombre,docPerfil.cargo||'',datos.presentes+'/'+datos.totalDias+' ('+datos.pct+'%)']];
      Object.keys(datos.porTipo).forEach(function(t){ filas.push([LABELS[t]||t,datos.porTipo[t].length,datos.porTipo[t].join(', ')]); });
      exportarExcel(filas,['Docente / Tipo','Cantidad','Días'],'Historial_'+docPerfil.nombre.replace(/ /g,'_')+'_'+desde+'_'+hastaEfec);
      toast('Excel descargado');
    }).catch(function(err){ toast(err.message,4000); });
});

document.getElementById('perf-export-pdf').addEventListener('click', function(){
  if(!docPerfil) return;
  var tipo=document.getElementById('perf-tipo-periodo').value;
  var desde,hasta,anioActual=new Date().getFullYear();
  if(tipo==='anio'){ var anio=parseInt(document.getElementById('perf-anio').value)||anioActual; desde=anio+'-01-01'; hasta=anio+'-12-31'; }
  else if(tipo==='mes'){ var mes=document.getElementById('perf-mes').value||hoyStr().slice(0,7); var pm=mes.split('-'); var anioMp=parseInt(pm[0]),mesMp=parseInt(pm[1])-1; desde=mes+'-01'; var ultP=new Date(anioMp,mesMp+1,0); hasta=ultP.getFullYear()+'-'+String(ultP.getMonth()+1).padStart(2,'0')+'-'+String(ultP.getDate()).padStart(2,'0'); }
  else { desde=document.getElementById('perf-desde').value; hasta=document.getElementById('perf-hasta').value; }
  if(!desde||!hasta){ toast('Seleccioná un período',3000); return; }
  var hastaEfec=hasta>hoyStr()?hoyStr():hasta;
  db.from('novedades').select('*').eq('docente_id',docPerfil.id).gte('fecha',desde).lte('fecha',hastaEfec)
    .then(function(res){
      var novDoc={}; var fechaJub=null;
      (res.data||[]).forEach(function(x){ if(x.tipo!=='presente'&&!esFeriado(x.fecha)) novDoc[x.fecha]=x; if(x.tipo==='jubilacion'&&(!fechaJub||x.fecha<fechaJub)) fechaJub=x.fecha; });
      var datos=construirDatosDocente(novDoc,docPerfil.horario||{},desde,hastaEfec,fechaJub);
      var d3=pdfNuevo();
      var yPos=pdfEncabezado(d3,'Reporte de asistencia','Período: '+desde+' a '+hastaEfec);
      pdfFilaDocente(d3,docPerfil.nombre,docPerfil.cargo||'',docPerfil.nivel||'secundaria',datos,yPos);
      d3.save('Historial_'+docPerfil.nombre.replace(/ /g,'_')+'_'+desde+'.pdf');
      toast('PDF descargado');
    }).catch(function(err){ toast(err.message,4000); });
});

// ── Exportar ranking ─────────────────────────────────
document.getElementById('rank-export-excel').addEventListener('click', function(){
  var items = obtenerItemsRanking();
  if(!items){ toast('Cargá el ranking primero',3000); return; }
  var subtit = document.getElementById('rank-subtit').textContent;
  // Ordenar: menor % primero, luego más faltas
  var sorted = items.slice().sort(function(a,b){
    if(b.totalAusencias!==a.totalAusencias) return b.totalAusencias-a.totalAusencias;
    return a.nombre.localeCompare(b.nombre,'es');
  });
  function calcPctPDFx(item){
    var diasHab=item.diasDebVenir||0;
    if(diasHab===0) return 100;
    var faltas=item.totalAusencias||0;
    return Math.round(((diasHab-faltas)/diasHab)*100);
  }
  function tieneNovedadX(item){ return TIPOS.filter(function(t){ return t!=='presente'; }).some(function(t){ return (item.contadores[t]||0)>0; }); }
  function sortRankingX(a,b){
    var aN=tieneNovedadX(a),bN=tieneNovedadX(b);
    if(!aN&&bN) return 1; if(aN&&!bN) return -1;
    if(!aN&&!bN) return a.nombre.localeCompare(b.nombre,'es');
    var pA=calcPctPDFx(a),pB=calcPctPDFx(b);
    if(pA!==pB) return pA-pB;
    return a.nombre.localeCompare(b.nombre,'es');
  }
  var filas = items.slice().sort(sortRankingX).map(function(r,idx){
    var pct = calcPctPDFx(r);
    var just = (r.contadores.justificada||0)+(r.contadores.justificada_parcial||0);
    var injust = (r.contadores.injustificada||0)+(r.contadores.injustificada_parcial||0);
    var otrosStr = TIPOS.filter(function(t){ return t!=='presente'&&!esFaltaCualquiera(t)&&(r.contadores[t]||0)>0; })
      .map(function(t){ return LABELS_SHORT[t]+': '+r.contadores[t]; }).join(' | ');
    return [idx+1, r.nombre, r.cargo, r.presentesAuto||0, just, injust, just+injust, pct+'%', otrosStr||'—'];
  });
  exportarExcel(filas,
    ['Pos.','Docente','Cargo','Presentes','F.Justificadas','F.Injustificadas','Total faltas','% Asist.','Otros registros'],
    'Ranking_'+subtit.replace(/ /g,'_')
  );
  toast('Excel descargado');
});

document.getElementById('rank-export-pdf').addEventListener('click', function(){
  var items = obtenerItemsRanking();
  if(!items){ toast('Cargá el ranking primero',3000); return; }
  var subtit = document.getElementById('rank-subtit').textContent;

  var docRank = new window.jspdf.jsPDF({orientation:'p'});
  docRank.setFont('helvetica','bold'); docRank.setFontSize(16);
  docRank.text('Ranking de Ausentismo', 14, 18);
  docRank.setFont('helvetica','normal'); docRank.setFontSize(10);
  docRank.setTextColor(120);
  docRank.text(subtit, 14, 26);
  docRank.setTextColor(0);


  // % SOLO baja con faltas reales: justificada/injustificada y sus parciales
  function calcPctPDF(item){
    var diasHab = item.diasDebVenir || 0;
    if(diasHab === 0) return 100; // sin horario = sin datos = 100%
    var faltas = item.totalAusencias || 0; // totalAusencias ya usa esFaltaCualquiera
    return Math.round(((diasHab - faltas) / diasHab) * 100);
  }
  function tieneNovedad(item){
    return TIPOS.filter(function(t){ return t!=='presente'; })
      .some(function(t){ return (item.contadores[t]||0)>0; });
  }
  function sortRanking(a, b){
    var aNov = tieneNovedad(a), bNov = tieneNovedad(b);
    if(!aNov && bNov) return 1;
    if(aNov && !bNov) return -1;
    if(!aNov && !bNov) return a.nombre.localeCompare(b.nombre,'es');
    var pA = calcPctPDF(a), pB = calcPctPDF(b);
    if(pA !== pB) return pA - pB;
    return a.nombre.localeCompare(b.nombre,'es');
  }

  var filasR = items.slice().sort(sortRanking).map(function(item){
    var presentes = item.presentesAuto || 0;
    var just      = (item.contadores.justificada||0) + (item.contadores.justificada_parcial||0);
    var injust    = (item.contadores.injustificada||0) + (item.contadores.injustificada_parcial||0);
    var faltas    = just + injust;
    var pct       = calcPctPDF(item);
    var otros = TIPOS.filter(function(t){
      return t!=='presente' && !esFaltaCualquiera(t) && (item.contadores[t]||0)>0;
    }).map(function(t){ return LABELS_SHORT[t]+': '+item.contadores[t]; }).join(', ');
    return [item.nombre, item.cargo, presentes, just, injust, faltas, pct+'%', otros||'—'];
  });

  docRank.autoTable({
    head:[['Docente','Cargo','Pres.','F.Just.','F.Injust.','Total','% Asist.','Otros registros']],
    body:filasR,
    startY:32,
    styles:{font:'helvetica',fontSize:8,cellPadding:2.5},
    headStyles:{fillColor:[26,43,74],textColor:255,fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,250,252]},
    columnStyles:{
      2:{halign:'center'}, 3:{halign:'center'},
      4:{halign:'center'}, 5:{halign:'center'},
      6:{halign:'center',fontStyle:'bold'}
    },
    margin:{left:14,right:14}
  });

  // Detalle de ausencias (solo los que tienen)
  var detalleAus = [];
  items.filter(function(r){ return r.totalAusencias>0 || (r.novedades||[]).some(function(n){ return n.tipo!=='presente'; }); })
    .sort(function(a,b){ return b.totalAusencias-a.totalAusencias||a.nombre.localeCompare(b.nombre,'es'); })
    .forEach(function(item){
      (item.novedades||[]).filter(function(n){ return n.tipo!=='presente'&&!esFeriado(n.fecha); })
        .sort(function(a,b){ return a.fecha.localeCompare(b.fecha); })
        .forEach(function(n){
          var f=new Date(n.fecha+'T12:00:00');
          var dias=['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
          detalleAus.push([item.nombre, dias[f.getDay()]+' '+n.fecha, LABELS_SHORT[n.tipo]||n.tipo]);
        });
    });

  if(detalleAus.length){
    var fy = docRank.lastAutoTable.finalY + 10;
    docRank.setFont('helvetica','bold'); docRank.setFontSize(11);
    docRank.text('Detalle de ausencias y registros', 14, fy);
    docRank.autoTable({
      head:[['Docente','Fecha','Tipo']],
      body:detalleAus,
      startY:fy+4,
      styles:{font:'helvetica',fontSize:8,cellPadding:2.5},
      headStyles:{fillColor:[185,28,28],textColor:255,fontStyle:'bold'},
      alternateRowStyles:{fillColor:[255,248,248]},
      columnStyles:{0:{cellWidth:55}},
      margin:{left:14,right:14}
    });
  }

  docRank.save('Ranking_'+subtit.replace(/ /g,'_')+'.pdf');
  toast('PDF descargado');
});

// Cache del último ranking calculado
var ultimoRanking = null;
function obtenerItemsRanking(){ return ultimoRanking; }


// ══════════════════════════════════════════════════════
//  GRUPOS
// ══════════════════════════════════════════════════════
var mGrupos = document.getElementById('modal-grupos');
document.getElementById('xgrupos').addEventListener('click', function(){ mGrupos.close(); });
mGrupos.addEventListener('click', function(e){ if(e.target===mGrupos) mGrupos.close(); });
document.getElementById('btn-grupos').addEventListener('click', function(){ abrirGrupos(); });

function actualizarFiltroGrupos(){
  var sel = document.getElementById('filtro-grupo');
  var val = sel.value;
  sel.innerHTML = '<option value="">Todos los grupos</option>';
  TODOS_GRUPOS.forEach(function(g){
    var opt = document.createElement('option');
    opt.value = g.id; opt.textContent = g.nombre;
    if(g.id===val) opt.selected=true;
    sel.appendChild(opt);
  });
}

function abrirGrupos(){
  renderListaGrupos();
  mGrupos.showModal();
}

function renderListaGrupos(){
  var lista = document.getElementById('grupos-lista');
  lista.innerHTML='';
  if(!TODOS_GRUPOS.length){
    lista.innerHTML='<div class="perf-empty">No hay grupos. Creá uno arriba.</div>';
    return;
  }
  TODOS_GRUPOS.forEach(function(g){
    var item=document.createElement('div');
    item.className='grupo-item';
    item.innerHTML=
      '<span class="grupo-color-dot" style="background:'+g.color+'"></span>'+
      '<span class="grupo-item-nom">'+g.nombre+'</span>'+
      '<button class="grupo-btn-edit" data-id="'+g.id+'" data-nom="'+g.nombre+'" data-col="'+g.color+'">✏️</button>'+
      '<button class="grupo-btn-del"  data-id="'+g.id+'" data-nom="'+g.nombre+'">🗑️</button>';
    item.querySelector('.grupo-btn-edit').addEventListener('click', function(e){
      var id=e.target.dataset.id, nom=e.target.dataset.nom, col=e.target.dataset.col;
      var nuevoNom=prompt('Nuevo nombre del grupo:', nom);
      if(!nuevoNom||nuevoNom===nom) return;
      db.from('grupos').update({nombre:nuevoNom.trim()}).eq('id', id).then(function(){
        toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Grupo actualizado');
        db.from('grupos').select('*').order('nombre').then(function(res){
          TODOS_GRUPOS=(res.data||[]).map(function(d){ return d; });
          actualizarFiltroGrupos(); renderListaGrupos();
        });
      });
    });
    item.querySelector('.grupo-btn-del').addEventListener('click', function(e){
      var id=e.target.dataset.id, nom=e.target.dataset.nom;
      if(!confirm('¿Eliminar el grupo "'+nom+'"? Los docentes no serán eliminados.')) return;
      db.from('grupos').delete().eq('id', id).then(function(){
        toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Grupo eliminado');
        TODOS_GRUPOS=TODOS_GRUPOS.filter(function(g){ return g.id!==id; });
        actualizarFiltroGrupos(); renderListaGrupos();
      });
    });
    lista.appendChild(item);
  });
}

document.getElementById('grupo-nuevo-btn').addEventListener('click', function(){
  var nom=document.getElementById('grupo-nuevo-nombre').value.trim();
  var col=document.getElementById('grupo-nuevo-color').value;
  if(!nom){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Ingresá un nombre',3000); return; }
  var nuevoId = (crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2)));
  db.from('grupos').insert({id:nuevoId, nombre:nom, color:col}).then(function(){
    toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Grupo "'+nom+'" creado');
    TODOS_GRUPOS.push({id:nuevoId, nombre:nom, color:col});
    TODOS_GRUPOS.sort(function(a,b){ return a.nombre.localeCompare(b.nombre,'es'); });
    actualizarFiltroGrupos(); renderListaGrupos();
    document.getElementById('grupo-nuevo-nombre').value='';
  });
});

// ── Editor de grupos en modal docente ────────────────
function buildGruposEditor(gruposAsignados){
  var wrap=document.getElementById('mde-grupos-sel');
  wrap.innerHTML='';
  if(!TODOS_GRUPOS.length){
    wrap.innerHTML='<span style="font-size:.72rem;color:#9CA3AF">No hay grupos creados. Creá uno desde 🏷️ Grupos.</span>';
    return;
  }
  TODOS_GRUPOS.forEach(function(g){
    var sel=gruposAsignados.indexOf(g.id)>=0;
    var lbl=document.createElement('label');
    lbl.className='grupo-chk-lbl'+(sel?' activo':'');
    lbl.style.borderColor=sel?g.color:'#E5E7EB';
    lbl.style.background=sel?g.color+'18':'';
    lbl.innerHTML=
      '<input type="checkbox" class="grupo-chk" value="'+g.id+'"'+(sel?' checked':'')+' style="display:none"/>'+
      '<span class="grupo-chk-dot" style="background:'+g.color+'"></span>'+
      g.nombre;
    lbl.addEventListener('click', function(){
      var cb=lbl.querySelector('.grupo-chk');
      cb.checked=!cb.checked;
      lbl.classList.toggle('activo', cb.checked);
      lbl.style.borderColor=cb.checked?g.color:'#E5E7EB';
      lbl.style.background=cb.checked?g.color+'18':'';
    });
    wrap.appendChild(lbl);
  });
}

function leerGruposEditor(){
  return Array.from(document.querySelectorAll('#mde-grupos-sel .grupo-chk:checked')).map(function(cb){ return cb.value; });
}

// Registrar masivo también filtra por grupo
var filtroGrupoMasivo = '';
// (ya está integrado en abrirMasivo — se filtra por hoy y grupo si se selecciona)


// ══════════════════════════════════════════════════════
//  MODO OSCURO
// ══════════════════════════════════════════════════════
(function(){
  // Aplicar preferencia guardada inmediatamente
  if(localStorage.getItem('dark')==='1'){
    document.body.classList.add('dark');
  }
})();

document.getElementById('btn-dark').addEventListener('click', function(){
  var esDark = document.body.classList.toggle('dark');
  localStorage.setItem('dark', esDark ? '1' : '0');
  this.textContent = esDark ? '☀️' : '🌙';
  this.title = esDark ? 'Modo claro' : 'Modo oscuro';
});

// Sincronizar ícono al cargar
(function(){
  var btn = document.getElementById('btn-dark');
  if(document.body.classList.contains('dark')){
    btn.textContent = '☀️'; btn.title = 'Modo claro';
  }
})();


// ══════════════════════════════════════════════════════
//  REPORTE POR GRUPO
// ══════════════════════════════════════════════════════
var mRG = document.getElementById('modal-reporte-grupo');
var ultimoReporteGrupo = null;

document.getElementById('xrg').addEventListener('click', function(){ mRG.close(); });
mRG.addEventListener('click', function(e){ if(e.target===mRG) mRG.close(); });
document.getElementById('btn-reporte-grupo').addEventListener('click', function(){ abrirReporteGrupo(); });

// Listeners de los selects de mes/año (compatibilidad cross-browser)
document.getElementById('rg-mes-mes') && document.getElementById('rg-mes-mes').addEventListener('change', function(){ sincronizarRgMes(); generarReporteGrupo(); });
document.getElementById('rg-mes-anio') && document.getElementById('rg-mes-anio').addEventListener('change', function(){ sincronizarRgMes(); generarReporteGrupo(); });

document.getElementById('rg-tipo-periodo').addEventListener('change', function(){
  mostrarControlRG(this.value); generarReporteGrupo();
});
document.getElementById('rg-grupo').addEventListener('change', generarReporteGrupo);
document.getElementById('rg-mes').addEventListener('change', generarReporteGrupo);
document.getElementById('rg-anio').addEventListener('change', generarReporteGrupo);
document.getElementById('rg-desde').addEventListener('change', generarReporteGrupo);
document.getElementById('rg-hasta').addEventListener('change', generarReporteGrupo);

function mostrarControlRG(tipo){
  document.getElementById('rg-ctrl-mes').style.display  = tipo==='mes'  ?'':'none';
  document.getElementById('rg-ctrl-anio').style.display = tipo==='anio' ?'':'none';
  document.getElementById('rg-ctrl-rango').style.display= tipo==='rango'?'':'none';
}

function abrirReporteGrupo(){
  var anioActual = ANIO_SEL || new Date().getFullYear();
  var mesActual  = new Date().getMonth() + 1; // 1-12

  // Poblar selector de grupos
  var sel = document.getElementById('rg-grupo');
  sel.innerHTML = '<option value="">— Seleccioná un grupo —</option>';
  TODOS_GRUPOS.forEach(function(g){
    var opt = document.createElement('option');
    opt.value = g.id; opt.textContent = g.nombre;
    sel.appendChild(opt);
  });

  // Poblar selector de años del mes
  var selAnioMes = document.getElementById('rg-mes-anio');
  if(selAnioMes){
    selAnioMes.innerHTML = '';
    for(var a = ANIO_FIN_APP; a >= ANIO_INICIO_APP; a--){
      var opt2 = document.createElement('option');
      opt2.value = a; opt2.textContent = a;
      if(a === anioActual) opt2.selected = true;
      selAnioMes.appendChild(opt2);
    }
    document.getElementById('rg-mes-mes').value = String(mesActual).padStart(2,'0');
    sincronizarRgMes();
  }

  document.getElementById('rg-tipo-periodo').value = 'mes';
  document.getElementById('rg-anio').value = anioActual;
  mostrarControlRG('mes');
  document.getElementById('rg-contenido').innerHTML = '<div class="perf-empty">Seleccioná un grupo para ver el reporte</div>';
  ultimoReporteGrupo = null;
  mRG.showModal();
}

function sincronizarRgMes(){
  var m = document.getElementById('rg-mes-mes');
  var a = document.getElementById('rg-mes-anio');
  if(m && a){
    document.getElementById('rg-mes').value = a.value + '-' + m.value;
  }
}

function generarReporteGrupo(){
  var grupoId = document.getElementById('rg-grupo').value;
  if(!grupoId){ document.getElementById('rg-contenido').innerHTML='<div class="perf-empty">Seleccioná un grupo para ver el reporte</div>'; return; }

  var tipo = document.getElementById('rg-tipo-periodo').value;
  var desde, hasta;
  var anioActual = ANIO_SEL || new Date().getFullYear();

  if(tipo==='mes'){
    var mesVal = document.getElementById('rg-mes').value;
    // Asegurarse de que el valor tiene formato YYYY-MM
    if(!mesVal || mesVal.length < 7){
      mesVal = String(anioActual) + '-' + String(new Date().getMonth()+1).padStart(2,'0');
    }
    var partesMes = mesVal.split('-');
    var anioMes = parseInt(partesMes[0]);
    var numMes  = parseInt(partesMes[1]);
    desde = String(anioMes) + '-' + String(numMes).padStart(2,'0') + '-01';
    var ultimoDia = new Date(anioMes, numMes, 0).getDate();
    hasta = String(anioMes) + '-' + String(numMes).padStart(2,'0') + '-' + String(ultimoDia).padStart(2,'0');
  } else if(tipo==='anio'){
    var anio = parseInt(document.getElementById('rg-anio').value) || anioActual;
    desde = String(anio)+'-01-01';
    hasta = String(anio)+'-12-31';
  } else {
    desde = document.getElementById('rg-desde').value;
    hasta = document.getElementById('rg-hasta').value;
    if(!desde||!hasta){ document.getElementById('rg-contenido').innerHTML='<div class="perf-empty">Seleccioná un rango de fechas</div>'; return; }
  }

  var grupo = TODOS_GRUPOS.find(function(g){ return g.id===grupoId; });
  var docentesGrupo = TODOS_DOCENTES.filter(function(d){ return (d.grupos||[]).indexOf(grupoId)>=0; });

  if(!docentesGrupo.length){
    document.getElementById('rg-contenido').innerHTML='<div class="perf-empty">No hay docentes asignados a este grupo</div>';
    return;
  }

  var mesesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var subtitFecha = '';
  if(tipo==='mes'){
    var partesSub = desde.split('-');
    subtitFecha = mesesNombres[parseInt(partesSub[1])-1] + ' ' + partesSub[0];
  } else {
    subtitFecha = desde + ' → ' + hasta;
  }
  document.getElementById('rg-subtit').textContent = (grupo?grupo.nombre:'') + ' · ' + subtitFecha;
  document.getElementById('rg-contenido').innerHTML='<div class="perf-loading">Cargando reporte…</div>';

  // Traer novedades de todos los docentes del grupo en una sola consulta
  var idsGrupo = docentesGrupo.map(function(d){ return d.id; });
  var promesaUnica = db.from('novedades').select('*').in('docente_id', idsGrupo).then(function(res){
    if(res.error) throw res.error;
    var porDocId = {};
    (res.data||[]).forEach(function(n){
      if(!porDocId[n.docente_id]) porDocId[n.docente_id]=[];
      porDocId[n.docente_id].push(n);
    });
    return porDocId;
  });
  var promesas = docentesGrupo.map(function(doc){
    return promesaUnica.then(function(porDocId){
        var items = (porDocId[doc.id]||[]).map(function(x){ x._id=x.id; return x; })
          .filter(function(item){ return item.fecha >= desde && item.fecha <= hasta; });

        // Calcular presentes reales: días con horario sin novedad y sin ser feriado
        // Ignorar registros de tipo "presente" — los presentes se calculan como días sin novedad
        // Solo mapear novedades reales (ausencias, licencias, etc.)
        var novedadesPorFecha = {};
        items.forEach(function(i){
          if(i.tipo === 'presente') return; // ignorar presentes guardados explícitamente
          if(!novedadesPorFecha[i.fecha] || esFaltaCualquiera(i.tipo)){
            novedadesPorFecha[i.fecha] = i;
          }
        });
        // También excluir los "presentes" explícitos de items para no contarlos como ausencias
        items = items.filter(function(i){ return i.tipo !== 'presente'; });
        var horarioDoc = doc.horario || {};
        var diasPresentes = 0;
        var totalDiasHabiles = 0;
        var cur = new Date(desde+'T12:00:00'), fin = new Date(hasta+'T12:00:00');
        while(cur <= fin){
          var dia = cur.getDay();
          if(dia !== 0 && dia !== 6){
            var f = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
            if(esFeriado(f)){ cur.setDate(cur.getDate()+1); continue; }
            var tieneHorario = diasConHorario(horarioDoc).some(function(dk){ return DIA_IDX[dk.toLowerCase()]===dia; });
            if(!tieneHorario){ cur.setDate(cur.getDate()+1); continue; }
            var novF4 = novedadesPorFecha[f];
            if(!novF4 || esFaltaCualquiera(novF4.tipo)){
              totalDiasHabiles++;
              if(!novF4) diasPresentes++;
            }
          }
          cur.setDate(cur.getDate()+1);
        }
        // Filtrar novedades en feriados
        items = items.filter(function(i){ return !esFeriado(i.fecha); });

        var contadores = {};
        TIPOS.forEach(function(t){ contadores[t]=0; });
        contadores['presente'] = diasPresentes;
        items.filter(function(i){ return i.tipo!=='presente'; })
             .forEach(function(item){ if(contadores[item.tipo]!==undefined) contadores[item.tipo]++; });
        // Solo son ausentismo: justificada, injustificada y sus parciales
        var totalAusencias = items.filter(function(i){ return esFaltaCualquiera(i.tipo); }).length;
        // Otros registros: carpeta médica, licencias, cambio, duelo, etc. (no son faltas)
        var totalOtros = items.filter(function(i){ return i.tipo!=='presente' && !esFaltaCualquiera(i.tipo); }).length;
        // Calcular total de días hábiles esperados para este docente en el período
        return { id:doc.id, nombre:doc.nombre, cargo:doc.cargo||'—', contadores:contadores, totalAusencias:totalAusencias, totalOtros:totalOtros, diasPresentes:diasPresentes, diasHabiles:totalDiasHabiles, items:items };
      });
  });

  Promise.all(promesas).then(function(resultados){
    ultimoReporteGrupo = { resultados:resultados, desde:desde, hasta:hasta, grupo:grupo };
    renderReporteGrupo(resultados, desde, hasta, grupo);
  }).catch(function(err){
    document.getElementById('rg-contenido').innerHTML='<p style="color:#DC2626;padding:1rem">Error: '+err.message+'</p>';
  });
}

function renderReporteGrupo(resultados, desde, hasta, grupo){
  var totalesGrupo = {};
  TIPOS.forEach(function(t){ totalesGrupo[t]=0; });
  resultados.forEach(function(r){ TIPOS.forEach(function(t){ totalesGrupo[t]+=(r.contadores[t]||0); }); });

  var totalPresentes = resultados.reduce(function(s,r){ return s+(r.contadores['presente']||0); },0);
  var totalAusencias = resultados.reduce(function(s,r){ return s+r.totalAusencias; },0);

  // Separar en 3 grupos:
  // 1. Perfectos: sin faltas Y sin otros registros
  var perfectos = resultados.filter(function(r){
    return r.totalAusencias === 0 && (r.totalOtros||0) === 0;
  });
  // 2. Con registros especiales pero sin faltas reales (carpeta médica, licencias, etc.)
  var conOtros = resultados.filter(function(r){
    return r.totalAusencias === 0 && (r.totalOtros||0) > 0;
  }).sort(function(a,b){ return b.totalOtros - a.totalOtros; });
  // 3. Con ausentismo real (faltas justificadas o injustificadas)
  var conAusencias = resultados.filter(function(r){ return r.totalAusencias > 0; })
    .sort(function(a,b){ return b.totalAusencias - a.totalAusencias; });

  // Calcular % de asistencia por docente
  function pctAsist(r){
    var total = (r.contadores['presente']||0) + r.totalAusencias;
    return total > 0 ? Math.round(((r.contadores['presente']||0)/total)*100) : 100;
  }
  function pctColor(p){ return p>=90?'#16A34A':p>=75?'#CA8A04':'#DC2626'; }

  // Formatear fecha legible
  function fechaLeg(str){
    var f = new Date(str+'T12:00:00');
    return DIA_ABREV[f.getDay()]+' '+f.getDate()+'/'+String(f.getMonth()+1).padStart(2,'0');
  }

  // ── KPIs globales ──────────────────────────────────
  var pctGlobal = (totalPresentes + totalAusencias) > 0
    ? Math.round((totalPresentes / (totalPresentes + totalAusencias)) * 100) : 100;

  var kpisHTML =
    '<div class="rg-kpis">'+
      '<div class="rg-kpi"><span class="rg-kpi-n" style="color:'+pctColor(pctGlobal)+'">'+pctGlobal+'%</span><span class="rg-kpi-l">Asistencia grupo</span></div>'+
      '<div class="rg-kpi"><span class="rg-kpi-n" style="color:#16A34A">'+perfectos.length+'</span><span class="rg-kpi-l">Sin novedad</span></div>'+
      '<div class="rg-kpi"><span class="rg-kpi-n" style="color:#CA8A04">'+conOtros.length+'</span><span class="rg-kpi-l">Con licencias</span></div>'+
      '<div class="rg-kpi"><span class="rg-kpi-n" style="color:#DC2626">'+conAusencias.length+'</span><span class="rg-kpi-l">Con faltas</span></div>'+
    '</div>';

  // ── Docentes sin ninguna novedad ──────────────────
  var perfectosHTML = '';
  if(perfectos.length){
    perfectosHTML =
      '<div class="rg-seccion-titulo rg-titulo-ok">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'+
        ' '+perfectos.length+' docente'+(perfectos.length>1?'s':'')+' sin novedades'+
      '</div>'+
      '<div class="rg-perfectos-grid">'+
      perfectos.map(function(r){
        var dias = (r.contadores['presente']||0);
        return '<div class="rg-perf-chip">'+
          '<span class="rg-perf-nom">'+r.nombre+'</span>'+
          '<span class="rg-perf-dias">'+dias+' día'+(dias!==1?'s':'')+'</span>'+
        '</div>';
      }).join('')+
      '</div>';
  }

  // ── Docentes con registros especiales (sin faltas) ─
  var otrosHTML = '';
  if(conOtros.length){
    otrosHTML =
      '<div class="rg-seccion-titulo rg-titulo-otros">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'+
        ' '+conOtros.length+' docente'+(conOtros.length>1?'s con registros especiales':' con registros especiales')+' (sin ausentismo)'+
      '</div>'+
      conOtros.map(function(r){
        var dias = (r.contadores['presente']||0);
        var tiposOtrosR = TIPOS.filter(function(t){
          return t!=='presente' && !esFaltaCualquiera(t) && (r.contadores[t]||0)>0;
        });
        var novedadesDetalle = r.items.filter(function(i){ return !esFaltaCualquiera(i.tipo) && i.tipo!=='presente'; })
          .sort(function(a,b){ return a.fecha<b.fecha?-1:1; })
          .map(function(item){
            return '<div class="rg-nov-row">'+
              '<span class="rg-nov-fecha">'+fechaLeg(item.fecha)+'</span>'+
              '<span class="rg-nov-tipo '+item.tipo+'">'+LABELS_SHORT[item.tipo]+'</span>'+
            '</div>';
          }).join('');
        var tagsHTML = tiposOtrosR.map(function(t){
          return '<span class="rg-aus-tag '+t+'">'+LABELS_SHORT[t]+': '+r.contadores[t]+'</span>';
        }).join('');
        return '<div class="rg-docente-card rg-card-otros">'+
          '<div class="rg-dc-header">'+
            '<div class="rg-dc-info">'+
              '<div class="rg-dc-nom">'+r.nombre+'</div>'+
              '<div class="rg-dc-cargo">'+r.cargo+'</div>'+
            '</div>'+
            '<div class="rg-dc-pct" style="color:#16A34A">'+
              '<span class="rg-dc-pct-n">100%</span>'+
              '<span class="rg-dc-pct-l">asistencia</span>'+
            '</div>'+
          '</div>'+
          '<div class="rg-dc-stats">'+
            '<span class="rg-dc-stat-ok">'+dias+' presente'+(dias!==1?'s':'')+'</span>'+
            '<span style="color:#CA8A04;font-weight:600;font-size:.75rem">'+r.totalOtros+' registro'+(r.totalOtros!==1?'s':'')+'</span>'+
          '</div>'+
          (tagsHTML?'<div class="rg-aus-tags">'+tagsHTML+'</div>':'')+
          '<div class="rg-novedades-lista">'+novedadesDetalle+'</div>'+
        '</div>';
      }).join('');
  }

  // ── Docentes con ausencias (detalle completo) ──────
  var ausenciasHTML = '';
  if(conAusencias.length){
    ausenciasHTML =
      '<div class="rg-seccion-titulo rg-titulo-warn">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'+
        ' '+conAusencias.length+' docente'+(conAusencias.length>1?'s con ausencias':' con ausencias')+
      '</div>'+
      conAusencias.map(function(r){
        var pct = pctAsist(r);
        var col = pctColor(pct);
        var diasP = r.contadores['presente']||0;
        var tiposAus = TIPOS.filter(function(t){ return t!=='presente'&&(r.contadores[t]||0)>0; });

        // Detalle de cada novedad
        var novedadesDetalle = r.items.filter(function(i){ return i.tipo!=='presente'; })
          .sort(function(a,b){ return a.fecha < b.fecha ? -1 : 1; })
          .map(function(item){
            return '<div class="rg-nov-row">'+
              '<span class="rg-nov-fecha">'+fechaLeg(item.fecha)+'</span>'+
              '<span class="rg-nov-tipo '+item.tipo+'">'+LABELS_SHORT[item.tipo]+'</span>'+
            '</div>';
          }).join('');

        // Resumen de tipos
        var tiposResHTML = tiposAus.map(function(t){
          return '<span class="rg-aus-tag '+t+'">'+LABELS_SHORT[t]+': '+r.contadores[t]+'</span>';
        }).join('');

        return '<div class="rg-docente-card">'+
          '<div class="rg-dc-header">'+
            '<div class="rg-dc-info">'+
              '<div class="rg-dc-nom">'+r.nombre+'</div>'+
              '<div class="rg-dc-cargo">'+r.cargo+'</div>'+
            '</div>'+
            '<div class="rg-dc-pct" style="color:'+col+'">'+
              '<span class="rg-dc-pct-n">'+pct+'%</span>'+
              '<span class="rg-dc-pct-l">asistencia</span>'+
            '</div>'+
          '</div>'+
          '<div class="rg-dc-barra-wrap"><div class="rg-dc-barra" style="width:'+pct+'%;background:'+col+'"></div></div>'+
          '<div class="rg-dc-stats">'+
            '<span class="rg-dc-stat-ok">'+diasP+' presente'+(diasP!==1?'s':'')+'</span>'+
            '<span class="rg-dc-stat-mal">'+r.totalAusencias+' ausencia'+(r.totalAusencias!==1?'s':'')+'</span>'+
          '</div>'+
          (tiposResHTML ? '<div class="rg-aus-tags">'+tiposResHTML+'</div>' : '')+
          '<div class="rg-novedades-lista">'+novedadesDetalle+'</div>'+
        '</div>';
      }).join('');
  }

  // ── Tabla completa (para exportar y referencia) ────
  var tablaHTML = '<div class="rg-seccion-titulo" style="margin-top:.5rem">Tabla completa</div>'+
    '<div class="rg-tabla-wrap"><table class="rg-tabla">'+
    '<thead><tr>'+
      '<th>Docente</th><th>Cargo</th>'+
      '<th title="Días hábiles del período según horario del docente">D.Hab.</th>'+
      '<th style="color:#16A34A">Pres.</th>'+
      '<th style="color:#DC2626">Faltas</th>'+
      '<th style="color:#CA8A04">Otros reg.</th>'+
      '<th>% Asist.</th>'+
    '</tr></thead><tbody>'+
    resultados.slice().sort(function(a,b){
      var pA=pctAsist(a), pB=pctAsist(b);
      if(pA!==pB) return pA-pB; // menor % primero
      return a.nombre.localeCompare(b.nombre,'es');
    }).map(function(r){
      var pct = pctAsist(r);
      var otrosStr = TIPOS.filter(function(t){
        return t!=='presente' && !esFaltaCualquiera(t) && (r.contadores[t]||0)>0;
      }).map(function(t){ return LABELS_SHORT[t]+': '+r.contadores[t]; }).join(', ');
      var colorFila = r.totalAusencias > 0 ? 'rgba(220,38,38,.04)' : (r.totalOtros > 0 ? 'rgba(202,138,4,.04)' : '');
      return '<tr style="background:'+colorFila+'">'+
        '<td class="rg-td-nom">'+r.nombre+'</td>'+
        '<td class="rg-td-cargo">'+r.cargo+'</td>'+
        '<td class="rg-td-num" style="color:var(--muted)">'+(r.diasHabiles||0)+'</td>'+
        '<td class="rg-td-num" style="color:#16A34A">'+(r.contadores['presente']||0)+'</td>'+
        '<td class="rg-td-num rg-td-total">'+r.totalAusencias+'</td>'+
        '<td class="rg-td-otros">'+(otrosStr||'\u2014')+'</td>'+
        '<td class="rg-td-num" style="color:'+pctColor(pct)+';font-weight:800">'+pct+'%</td>'+
      '</tr>';
    }).join('')+
    '</tbody></table></div>';

  var resumenHTML =
    '<div class="rg-resumen-global">'+
      '<div class="rg-resumen-titulo">Resumen del grupo</div>'+
      kpisHTML+
    '</div>'+
    perfectosHTML+
    otrosHTML+
    ausenciasHTML+
    tablaHTML;

  // Ranking dentro del grupo
  var ranking = resultados.filter(function(r){ return r.totalAusencias>0; })
    .sort(function(a,b){ return b.totalAusencias-a.totalAusencias; });

  var rankingHTML = '';
  if(ranking.length){
    var maxTotal = ranking[0].totalAusencias;
    rankingHTML = '<div class="rg-seccion-titulo">📊 Ranking de ausentismo</div>'+
      ranking.map(function(item,idx){
        var pct = maxTotal>0?(item.totalAusencias/maxTotal)*100:0;
        var detalles = TIPOS.filter(function(t){ return t!=='presente'&&item.contadores[t]>0; })
          .map(function(t){ return '<span class="rank-det '+t+'">'+ICONOS[t]+' '+item.contadores[t]+'</span>'; }).join('');
        return '<div class="rank-item">'+
          '<div class="rank-pos"><span class="rank-num">'+(idx+1)+'</span></div>'+
          '<div class="rank-info">'+
            '<div class="rank-nombre">'+item.nombre+'</div>'+
            '<div class="rank-cargo">'+item.cargo+'</div>'+
            '<div class="rank-barra-wrap"><div class="rank-barra" style="width:'+pct.toFixed(1)+'%"></div></div>'+
            '<div class="rank-detalles">'+detalles+'</div>'+
          '</div>'+
          '<div class="rank-total">'+item.totalAusencias+'<span class="rank-total-lbl">ausencias</span></div>'+
        '</div>';
      }).join('');
  } else {
    rankingHTML = '<div class="rg-seccion-titulo">📊 Ranking de ausentismo</div><div class="perf-empty">Sin ausencias en el período</div>';
  }

  document.getElementById('rg-contenido').innerHTML = resumenHTML + rankingHTML;
}

// Exportar reporte grupo
document.getElementById('rg-export-excel').addEventListener('click', function(){
  if(!ultimoReporteGrupo){ toast('Cargá el reporte primero',3000); return; }
  var d = ultimoReporteGrupo;
  var nombreGrupo = d.grupo ? d.grupo.nombre : 'Grupo';

  // Hoja 1: Resumen por docente con % asistencia
  var filasResumen = [];
  d.resultados.slice().sort(function(a,b){
    var pa = (a.contadores['presente']||0)+a.totalAusencias+(a.totalOtros||0);
    var pb = (b.contadores['presente']||0)+b.totalAusencias+(b.totalOtros||0);
    var pctA = pa>0?Math.round(((a.contadores['presente']||0)/pa)*100):100;
    var pctB = pb>0?Math.round(((b.contadores['presente']||0)/pb)*100):100;
    if(pctA !== pctB) return pctA - pctB; // menor % primero
    return a.nombre.localeCompare(b.nombre,'es');
  }).forEach(function(r){
    var total = (r.contadores['presente']||0) + r.totalAusencias;
    var pct = total>0 ? Math.round(((r.contadores['presente']||0)/total)*100) : 100;
    var otros = TIPOS.filter(function(t){
      return t!=='presente'&&t!=='justificada'&&t!=='injustificada'&&t!=='medica'&&t!=='medica_familiar'&&t!=='cambio'&&t!=='duelo'&&(r.contadores[t]||0)>0;
    }).map(function(t){ return LABELS_SHORT[t]+': '+r.contadores[t]; }).join(' | ');
    filasResumen.push([
      r.nombre, r.cargo,
      r.contadores.presente||0,
      r.contadores.justificada||0,
      r.contadores.injustificada||0,
      r.contadores.medica||0,
      r.contadores.medica_familiar||0,
      r.contadores.cambio||0,
      r.contadores.duelo||0,
      r.totalAusencias,
      pct+'%',
      otros||'—'
    ]);
  });

  // Hoja 2: Detalle de ausencias por fecha
  var filasDetalle = [];
  d.resultados.forEach(function(r){
    var ausencias = r.items.filter(function(i){ return i.tipo!=='presente'; })
      .sort(function(a,b){ return a.fecha < b.fecha ? -1 : 1; });
    ausencias.forEach(function(item){
      var f = new Date(item.fecha+'T12:00:00');
      var diasSem = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      filasDetalle.push([
        r.nombre, r.cargo,
        item.fecha,
        diasSem[f.getDay()],
        LABELS[item.tipo]||item.tipo
      ]);
    });
  });

  // Generar Excel con dos hojas
  var wb = XLSX.utils.book_new();
  var ws1 = XLSX.utils.aoa_to_sheet([
    ['Reporte de grupo: '+nombreGrupo],
    ['Período: '+d.desde+' a '+d.hasta],
    [],
    ['Docente','Cargo','Presentes','Just.','Injust.','C.Médica','C.M.Fam.','Cambio','Duelo','Total aus.','% Asistencia','Otros']
  ].concat(filasResumen));
  var ws2 = XLSX.utils.aoa_to_sheet([
    ['Detalle de ausencias: '+nombreGrupo],
    ['Período: '+d.desde+' a '+d.hasta],
    [],
    ['Docente','Cargo','Fecha','Día','Tipo de ausencia']
  ].concat(filasDetalle.length ? filasDetalle : [['Sin ausencias en el período']]));
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle ausencias');
  XLSX.writeFile(wb, 'Reporte_'+nombreGrupo.replace(/ /g,'_')+'_'+d.desde+'_'+d.hasta+'.xlsx');
  toast('Excel descargado');
});

document.getElementById('rg-export-pdf').addEventListener('click', function(){
  if(!ultimoReporteGrupo){ toast('Cargá el reporte primero',3000); return; }
  var d = ultimoReporteGrupo;
  var nombreGrupo = d.grupo ? d.grupo.nombre : 'Grupo';
  var diasSem = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
  var doc2 = new window.jspdf.jsPDF({ orientation: 'p' });

  // Título
  doc2.setFont('helvetica','bold'); doc2.setFontSize(16);
  doc2.text('Reporte — '+nombreGrupo, 14, 18);
  doc2.setFont('helvetica','normal'); doc2.setFontSize(10);
  doc2.setTextColor(120);
  doc2.text('Periodo: '+d.desde+' a '+d.hasta, 14, 26);
  doc2.setTextColor(0);

  // Tabla resumen ordenada por nombre
  var filasRes = d.resultados.slice()
    .map(function(r){
      var total = (r.contadores['presente']||0) + r.totalAusencias + (r.totalOtros||0);
      var pct = total>0 ? Math.round(((r.contadores['presente']||0)/total)*100) : 100;
      return [r.nombre, r.cargo, r.contadores.presente||0, r.totalAusencias, pct+'%'];
    })
    .sort(function(a,b){
      var pctA = parseInt(a[4])||0;
      var pctB = parseInt(b[4])||0;
      if(pctA !== pctB) return pctA - pctB;
      return a[0].localeCompare(b[0],'es');
    });

  doc2.autoTable({
    head: [['Docente','Cargo','Presentes','Ausencias','% Asist.']],
    body: filasRes,
    startY: 32,
    styles: { font:'helvetica', fontSize:9, cellPadding:3 },
    headStyles: { fillColor:[26,43,74], textColor:255, fontStyle:'bold' },
    alternateRowStyles: { fillColor:[248,250,252] },
    columnStyles: {
      0: { cellWidth: 55 },
      2: { halign:'center' },
      3: { halign:'center' },
      4: { halign:'center', fontStyle:'bold' }
    },
    margin: { left:14, right:14 }
  });

  // Detalle de ausencias y registros especiales
  var detalle = [];
  d.resultados.forEach(function(r){
    r.items
      .filter(function(i){ return i.tipo!=='presente' && !esFeriado(i.fecha); })
      .sort(function(a,b){ return a.fecha<b.fecha?-1:1; })
      .forEach(function(item){
        var f = new Date(item.fecha+'T12:00:00');
        var tipo = LABELS_SHORT[item.tipo]||item.tipo;
        var extra = item.modulo ? ' ('+item.modulo+')' : ((item.obs||item.comentario) ? ' — '+(item.obs||item.comentario) : '');
        detalle.push([r.nombre, diasSem[f.getDay()]+' '+item.fecha, tipo+extra]);
      });
  });

  if(detalle.length){
    var finalY = doc2.lastAutoTable.finalY + 10;
    doc2.setFont('helvetica','bold'); doc2.setFontSize(11);
    doc2.text('Detalle de ausencias', 14, finalY);
    doc2.autoTable({
      head: [['Docente','Fecha','Tipo']],
      body: detalle,
      startY: finalY + 4,
      styles: { font:'helvetica', fontSize:8.5, cellPadding:3 },
      headStyles: { fillColor:[185,28,28], textColor:255, fontStyle:'bold' },
      alternateRowStyles: { fillColor:[255,248,248] },
      columnStyles: { 0: { cellWidth:55 } },
      margin: { left:14, right:14 }
    });
  }

  doc2.save('Reporte_'+nombreGrupo.replace(/ /g,'_')+'_'+d.desde+'.pdf');
  toast('PDF descargado');
});


// ══════════════════════════════════════════════════════
//  FECHA SELECCIONADA (navegación de días)
// ══════════════════════════════════════════════════════
var fechaSeleccionada = hoyStr();

function fechaSelDate(){ return new Date(fechaSeleccionada+'T12:00:00'); }
function esFechaHoy(){ return fechaSeleccionada === hoyStr(); }

function setFechaSeleccionada(f){
  fechaSeleccionada = f;
  document.getElementById('input-fecha-hdr').value = f;
  var d = new Date(f+'T12:00:00');
  document.getElementById('fecha-hoy').textContent =
    d.toLocaleDateString('es-AR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  cargarYRender();
}

document.getElementById('input-fecha-hdr').addEventListener('change', function(){
  if(this.value) setFechaSeleccionada(this.value);
});
document.getElementById('btn-fecha-ant').addEventListener('click', function(){
  var d = new Date(fechaSeleccionada+'T12:00:00');
  d.setDate(d.getDate()-1);
  setFechaSeleccionada(d.toISOString().slice(0,10));
});
document.getElementById('btn-fecha-sig').addEventListener('click', function(){
  var d = new Date(fechaSeleccionada+'T12:00:00');
  d.setDate(d.getDate()+1);
  setFechaSeleccionada(d.toISOString().slice(0,10));
});
document.getElementById('btn-fecha-hoy-hdr').addEventListener('click', function(){
  setFechaSeleccionada(hoyStr());
});


// ══════════════════════════════════════════════════════
//  CONFIGURACIÓN (ciclo lectivo y feriados)
// ══════════════════════════════════════════════════════
var mConfig = document.getElementById('modal-config');
document.getElementById('xconfig').addEventListener('click', function(){ mConfig.close(); });
document.getElementById('cfg-cancelar').addEventListener('click', function(){ mConfig.close(); });
mConfig.addEventListener('click', function(e){ if(e.target===mConfig) mConfig.close(); });
document.getElementById('btn-config').addEventListener('click', function(){ abrirConfig(); });

function cargarConfig(callback){
  // Cargar config del año seleccionado, fallback a 'general'
  var docId = 'anio_'+ANIO_SEL;
  if(!db){ if(callback) callback(); return; }
  db.from('config').select('*').eq('id',docId).maybeSingle().then(function(res){
    var row = res.data;
    if(row && row.data){
      var d = row.data;
      CONFIG.cicloInicio = d.cicloInicio||CONFIG.cicloInicio;
      CONFIG.cicloFin    = d.cicloFin   ||CONFIG.cicloFin;
      CONFIG.feriados    = d.feriados   ||[];
      if(callback) callback();
    } else {
      // Fallback a 'general'
      return db.from('config').select('*').eq('id','general').maybeSingle().then(function(res2){
        var row2 = res2.data;
        if(row2 && row2.data){
          var d=row2.data;
          CONFIG.cicloInicio = d.cicloInicio||CONFIG.cicloInicio;
          CONFIG.cicloFin    = d.cicloFin   ||CONFIG.cicloFin;
          CONFIG.feriados    = d.feriados   ||[];
        }
        if(callback) callback();
      });
    }
  }).catch(function(){ if(callback) callback(); });
}

function abrirConfig(){
  var lbl = document.getElementById('cfg-anio-lbl');
  if(lbl) lbl.textContent = ANIO_SEL;
  // Recargar config del año seleccionado antes de mostrar
  cargarConfig(function(){
    document.getElementById('cfg-ciclo-inicio').value = CONFIG.cicloInicio.replace(/^\d{4}/,String(ANIO_SEL));
    document.getElementById('cfg-ciclo-fin').value    = CONFIG.cicloFin.replace(/^\d{4}/,String(ANIO_SEL));
    renderFeriadosLista();
    inicializarCierreCiclo();
    inicializarBackupAnios();
    inicializarPanelBackups();
    mConfig.showModal();
  });
}

function renderFeriadosLista(){
  var lista = document.getElementById('cfg-feriados-lista');
  if(!CONFIG.feriados.length){ lista.innerHTML='<div style="font-size:.75rem;color:#9CA3AF">Sin feriados cargados</div>'; return; }
  // Agrupar por nombre en rangos consecutivos
  var sorted = CONFIG.feriados.slice().sort(function(a,b){ return a.fecha.localeCompare(b.fecha); });
  var grupos=[];
  sorted.forEach(function(f){
    var ultimo=grupos[grupos.length-1];
    if(ultimo&&ultimo.nombre===f.nombre){
      // Verificar si es consecutivo
      var ultFin=new Date(ultimo.hasta+'T12:00:00');
      ultFin.setDate(ultFin.getDate()+1);
      var cur=new Date(f.fecha+'T12:00:00');
      if(cur<=new Date(new Date(ultimo.hasta+'T12:00:00').getTime()+2*86400000)){
        ultimo.hasta=f.fecha;
        ultimo.fechas.push(f.fecha);
        return;
      }
    }
    grupos.push({nombre:f.nombre,desde:f.fecha,hasta:f.fecha,fechas:[f.fecha]});
  });
  lista.innerHTML = grupos.map(function(g,i){
    var desdeStr=new Date(g.desde+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'});
    var hastaStr=g.desde!==g.hasta?new Date(g.hasta+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'}):'';
    var rangoStr=hastaStr?desdeStr+' → '+hastaStr:desdeStr;
    var cant=g.fechas.length;
    return '<div class="feriado-item">'+
      '<span class="feriado-fecha">'+rangoStr+'</span>'+
      '<span class="feriado-nombre">'+g.nombre+(cant>1?' ('+cant+' días)':'')+'</span>'+
      '<button class="grupo-btn-del" data-fechas="'+g.fechas.join(',')+'">🗑️</button>'+
    '</div>';
  }).join('');
  lista.querySelectorAll('.grupo-btn-del').forEach(function(btn){
    btn.addEventListener('click', function(){
      var fechas=this.dataset.fechas.split(',');
      CONFIG.feriados=CONFIG.feriados.filter(function(f){ return fechas.indexOf(f.fecha)<0; });
      renderFeriadosLista();
      // Guardar automáticamente
      var configData = {cicloInicio:CONFIG.cicloInicio, cicloFin:CONFIG.cicloFin, feriados:CONFIG.feriados};
      Promise.all([
        db.from('config').upsert({id:'anio_'+ANIO_SEL, data:configData}),
        db.from('config').upsert({id:'general', data:CONFIG})
      ]).then(function(){
        toast('Feriado eliminado');
        cargarYRender();
      }).catch(function(err){ toast('Error: '+err.message,4000); });
    });
  });
}

document.getElementById('cfg-feriado-add').addEventListener('click', function(){
  var desde=document.getElementById('cfg-feriado-fecha').value;
  var hasta=document.getElementById('cfg-feriado-hasta').value||desde;
  var nombre=document.getElementById('cfg-feriado-nombre').value.trim();
  if(!desde){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Seleccioná al menos la fecha de inicio',3000); return; }
  if(!nombre) nombre='Feriado';
  if(hasta<desde) hasta=desde;
  var cur=new Date(desde+'T12:00:00'), fin=new Date(hasta+'T12:00:00');
  var agregados=0;
  while(cur<=fin){
    var f=cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
    if(!CONFIG.feriados.some(function(x){ return x.fecha===f; })){
      CONFIG.feriados.push({fecha:f, nombre:nombre});
      agregados++;
    }
    cur.setDate(cur.getDate()+1);
  }
  document.getElementById('cfg-feriado-fecha').value='';
  document.getElementById('cfg-feriado-hasta').value='';
  document.getElementById('cfg-feriado-nombre').value='';
  renderFeriadosLista();

  // Guardar automáticamente para que esFeriado() funcione de inmediato
  var configData = {cicloInicio:CONFIG.cicloInicio, cicloFin:CONFIG.cicloFin, feriados:CONFIG.feriados};
  var guardado = Promise.all([
    db.from('config').upsert({id:'anio_'+ANIO_SEL, data:configData}),
    db.from('config').upsert({id:'general', data:configData})
  ]);
  guardado.then(function(){
    toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> '+agregados+' día'+(agregados!==1?'s':'')+' agregado'+(agregados!==1?'s':'')+' y guardado');
    cargarYRender(); // recargar grilla para que los feriados se apliquen
  }).catch(function(err){ toast('Error guardando: '+err.message,4000); });
});

document.getElementById('cfg-guardar').addEventListener('click', function(){
  var inicio=document.getElementById('cfg-ciclo-inicio').value;
  var fin=document.getElementById('cfg-ciclo-fin').value;
  if(!inicio||!fin){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Completá las fechas del ciclo',3000); return; }
  CONFIG.cicloInicio=inicio; CONFIG.cicloFin=fin;
  // Guardar también en clave por año para que cada año tenga su propio ciclo
  // Guardar en ambos: 'general' (compatibilidad) y 'anio_YYYY' (por año)
  var configData = {cicloInicio:CONFIG.cicloInicio, cicloFin:CONFIG.cicloFin, feriados:CONFIG.feriados};
  var configData2 = {cicloInicio:CONFIG.cicloInicio, cicloFin:CONFIG.cicloFin, feriados:CONFIG.feriados};
  var p1 = db.from('config').upsert({id:'anio_'+ANIO_SEL, data:configData2});
  var p2 = db.from('config').upsert({id:'general', data:configData2});
  Promise.all([p1,p2]).then(function(){
    toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Configuración guardada');
    mConfig.close();
    cargarYRender();
  }).catch(function(err){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> '+err.message,4000); });
});

// Función para verificar si una fecha es feriado
function esFeriado(fechaStr){
  return CONFIG.feriados.some(function(f){ return f.fecha===fechaStr; });
}


// ══════════════════════════════════════════════════════
//  CIERRE DE CICLO LECTIVO
// ══════════════════════════════════════════════════════

// ── Backup de ciclo ──────────────────────────────────
function inicializarBackupAnios(){
  var sel=document.getElementById('cfg-backup-anio');
  sel.innerHTML='';
  var anioActual=new Date().getFullYear();
  for(var a=anioActual;a>=ANIO_INICIO_APP;a--){
    var opt=document.createElement('option');
    opt.value=a; opt.textContent='Ciclo '+a;
    sel.appendChild(opt);
  }
}

function obtenerNovedadesAnio(anio, callback){
  var desde=anio+'-01-01', hasta=anio+'-12-31';
  // Primero buscar en activos
  db.from('novedades').select('*').gte('fecha',desde).lte('fecha',hasta)
    .then(function(res){
      if(res.error) throw res.error;
      var novedades=(res.data||[]).map(function(d){ d.docenteId = d.docente_id; return d; });
      // También buscar en archivados
      db.from('ciclos_archivados').select('*').eq('id', String(anio)).maybeSingle().then(function(resA){
        if(resA.data && resA.data.data){
          var archivadas=(resA.data.data.novedades||[]);
          // Combinar sin duplicados por fecha+docenteId
          archivadas.forEach(function(n){
            var nDocId = n.docenteId || n.docente_id;
            var existe=novedades.some(function(x){ return x.fecha===n.fecha&&x.docenteId===nDocId; });
            if(!existe){ n.docenteId = nDocId; novedades.push(n); }
          });
        }
        callback(novedades);
      }).catch(function(){ callback(novedades); });
    }).catch(function(err){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Error: '+err.message,4000); });
}

document.getElementById('cfg-backup-excel').addEventListener('click', function(){
  var anio=parseInt(document.getElementById('cfg-backup-anio').value);
  toast('⏳ Generando backup Excel '+anio+'…',5000);
  obtenerNovedadesAnio(anio, function(novedades){
    var diasN=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    var filas=novedades.sort(function(a,b){ return a.fecha.localeCompare(b.fecha)||a.docenteId.localeCompare(b.docenteId); }).map(function(n){
      var doc=TODOS_DOCENTES.find(function(d){ return d.id===n.docenteId; });
      var fObj=new Date(n.fecha+'T12:00:00');
      return [
        n.fecha,
        diasN[fObj.getDay()],
        doc?doc.nombre:'(eliminado)',
        doc?doc.cargo||'':'',
        LABELS[n.tipo]||n.tipo,
        n.modulo||''
      ];
    });
    exportarExcel(filas,['Fecha','Día','Docente','Cargo','Estado','Módulo'],'Backup_'+anio);
    toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Backup Excel '+anio+' descargado');
  });
});

document.getElementById('cfg-backup-pdf').addEventListener('click', function(){
  var anio=parseInt(document.getElementById('cfg-backup-anio').value);
  toast('⏳ Generando backup PDF '+anio+'…',5000);
  obtenerNovedadesAnio(anio, function(novedades){
    var diasN=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    var filas=novedades.sort(function(a,b){ return a.fecha.localeCompare(b.fecha)||a.docenteId.localeCompare(b.docenteId); }).map(function(n){
      var doc=TODOS_DOCENTES.find(function(d){ return d.id===n.docenteId; });
      var fObj=new Date(n.fecha+'T12:00:00');
      return [
        n.fecha,
        diasN[fObj.getDay()],
        doc?doc.nombre:'(eliminado)',
        LABELS[n.tipo]||n.tipo,
        n.modulo||''
      ];
    });
    exportarPDF(
      'Backup Ciclo Lectivo '+anio,
      'Generado el '+new Date().toLocaleDateString('es-AR'),
      ['Fecha','Día','Docente','Estado','Módulo'],
      filas,
      'Backup_'+anio
    );
    toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Backup PDF '+anio+' descargado');
  });
});


// ══════════════════════════════════════════════════════
//  SISTEMA DE BACKUPS AUTOMÁTICOS
//  Guarda snapshots en colegios/{id}/backups
//  Máx 20 backups por colegio (elimina el más viejo)
// ══════════════════════════════════════════════════════

var _backupEnCurso = false;
var _backupTimeout = null;
var MAX_BACKUPS = 20;

/**
 * Genera un snapshot completo de empleados + novedades del año actual
 * y lo guarda en Firestore. Se llama tras cada operación de escritura relevante.
 * @param {string} motivo  Descripción breve de qué cambió (ej: "Editar docente: Pérez Juan")
 */
function crearBackupAutomatico(motivo){
  if(!db) return;
  if(_backupTimeout) clearTimeout(_backupTimeout);
  _backupTimeout = setTimeout(function(){ _ejecutarBackup(motivo); }, 3000);
}

function _ejecutarBackup(motivo){
  if(_backupEnCurso) return;
  _backupEnCurso = true;
  var ts = new Date();
  var quien = (USUARIO_ACTUAL && USUARIO_ACTUAL.email) ? USUARIO_ACTUAL.email : 'sistema';
  Promise.all([
    db.from('docentes').select('*').eq('anio', ANIO_SEL),
    db.from('novedades').select('*').eq('anio', String(ANIO_SEL))
  ]).then(function(results){
    if(results[0].error) throw results[0].error;
    if(results[1].error) throw results[1].error;
    var empleados = results[0].data || [];
    var novedades = results[1].data || [];
    var nuevoId = (crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2)));
    return db.from('backups').insert({
      id: nuevoId,
      ts: ts.toISOString(),
      motivo: motivo || 'Modificación automática',
      quien: quien,
      anio: ANIO_SEL,
      data: { empleados: empleados, novedades: novedades,
              fecha: ts.toLocaleDateString('es-AR'),
              hora: ts.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}) }
    });
  }).then(function(){
    return db.from('backups').select('id,ts').order('ts',{ascending:true});
  }).then(function(res){
    if(res.error) throw res.error;
    var rows = res.data||[];
    if(rows.length > MAX_BACKUPS){
      var sobran = rows.length - MAX_BACKUPS;
      var idsBorrar = rows.slice(0, sobran).map(function(r){ return r.id; });
      return db.from('backups').delete().in('id', idsBorrar);
    }
  }).catch(function(err){ console.warn('Backup falló:', err.message); })
  .finally(function(){ _backupEnCurso = false; });
}

// ── Panel de backups ────────────────────────────────────
var _backupCache = {}; // cache de datos completos por backupId

function inicializarPanelBackups(){
  var cont = document.getElementById('cfg-backups-lista');
  if(!cont) return;
  cont.innerHTML = '<p style="color:var(--muted);font-size:.8rem;padding:.5rem">Cargando backups…</p>';
  _backupCache = {};
  db.from('backups').select('*').order('ts',{ascending:false}).then(function(res){
    if(res.error) throw res.error;
    var rows = res.data || [];
    if(!rows.length){
      cont.innerHTML = '<p style="color:var(--muted);font-size:.8rem;padding:.5rem">Sin backups todavía. Se generan automáticamente al editar datos.</p>';
      return;
    }
    cont.innerHTML = '';
    rows.forEach(function(row){
      var b = Object.assign({ motivo: row.motivo, quien: row.quien, anio: row.anio },
                             row.data || {});
      _backupCache[row.id] = b;
      cont.appendChild(_renderBackupRow(row.id, b));
    });
  }).catch(function(err){
    cont.innerHTML = '<p style="color:#EF4444;font-size:.8rem;padding:.5rem">Error: '+err.message+'</p>';
  });
}

function _renderBackupRow(id, b){
  var wrap = document.createElement('div');
  wrap.style.cssText = 'border:1px solid var(--border);border-radius:10px;margin-bottom:.5rem;overflow:hidden;background:var(--bg)';

  // ── Cabecera del backup ──
  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;align-items:center;gap:.5rem;padding:.55rem .7rem;cursor:pointer;user-select:none;';
  hdr.innerHTML =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.91"/></svg>'
    +'<div style="flex:1;min-width:0">'
    +'<div style="font-size:.8rem;font-weight:600">'+escHTML(b.fecha)+' '+escHTML(b.hora)+'  <span style="font-weight:400;color:var(--muted)">— '+escHTML(b.motivo)+'</span></div>'
    +'<div style="font-size:.71rem;color:var(--muted)">'+escHTML(b.quien)+'  ·  '+(b.empleados||[]).length+' docentes  ·  '+(b.novedades||[]).length+' registros</div>'
    +'</div>';

  // Botones cabecera
  var btnBar = document.createElement('div');
  btnBar.style.cssText = 'display:flex;gap:.3rem;flex-shrink:0';

  var btnDl = _mkBtn('#059669','#fff','Descargar JSON',
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>');
  btnDl.title='Descargar como archivo JSON (reimportable)';
  btnDl.onclick = function(e){ e.stopPropagation(); _descargarBackupJSON(id, b); };

  var btnRest = _mkBtn('#4F46E5','#fff','Restaurar',
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.91"/></svg>');
  btnRest.onclick = function(e){ e.stopPropagation(); confirmarRestauracion(id, b); };

  var btnDel = _mkBtn('transparent','#EF4444','',
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>');
  btnDel.style.border='1px solid #EF4444';
  btnDel.title='Eliminar backup';
  btnDel.onclick = function(e){
    e.stopPropagation();
    if(!confirm('¿Eliminar este backup?')) return;
    db.from('backups').delete().eq('id', id)
      .then(function(){ wrap.remove(); });
  };

  btnBar.appendChild(btnDl); btnBar.appendChild(btnRest); btnBar.appendChild(btnDel);
  hdr.appendChild(btnBar);

  // ── Detalle expandible ──
  var detalle = document.createElement('div');
  detalle.style.cssText = 'display:none;border-top:1px solid var(--border);padding:.6rem .7rem;max-height:400px;overflow-y:auto';

  var expandido = false;
  hdr.addEventListener('click', function(){
    expandido = !expandido;
    detalle.style.display = expandido ? 'block' : 'none';
    if(expandido && !detalle._cargado){
      detalle._cargado = true;
      _renderDetalleBackup(detalle, b);
    }
  });

  wrap.appendChild(hdr);
  wrap.appendChild(detalle);
  return wrap;
}

function _mkBtn(bg, color, label, iconSVG){
  var btn = document.createElement('button');
  btn.style.cssText = 'background:'+bg+';color:'+color+';border:none;font-size:.71rem;padding:.28rem .5rem;cursor:pointer;border-radius:6px;display:flex;align-items:center;gap:.25rem;white-space:nowrap;font-family:inherit';
  btn.innerHTML = iconSVG + (label ? ' '+label : '');
  return btn;
}

function _renderDetalleBackup(cont, b){
  var empleados = (b.empleados||[]).filter(function(e){
    var el = e.eliminado_en;
    if(el && typeof el==='object') return !(e.nivel ? el[e.nivel]===true : Object.keys(el).some(function(k){ return el[k]===true; }));
    return !el;
  });
  var novedades = b.novedades||[];
  // Agrupar novedades por docenteId
  var novPorDoc = {};
  novedades.forEach(function(n){
    var _did = n.docente_id||n.docenteId;
    if(!novPorDoc[_did]) novPorDoc[_did] = [];
    novPorDoc[_did].push(n);
  });

  if(!empleados.length){
    cont.innerHTML = '<p style="color:var(--muted);font-size:.78rem">Sin docentes en este backup.</p>';
    return;
  }

  // Ordenar por apellido
  empleados.sort(function(a,b){ 
    var na=((a.apellido||'')+' '+(a.nombre||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    var nb=((b.apellido||'')+' '+(b.nombre||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return na.localeCompare(nb,'es',{sensitivity:'base'});
  });

  empleados.forEach(function(emp){
    var novs = (novPorDoc[emp.id||emp._id]||[]).filter(function(n){ return n.tipo!=='presente'; })
      .sort(function(a,c){ return a.fecha.localeCompare(c.fecha); });

    var nombre = (emp.apellido&&emp.apellido.trim())
      ? emp.apellido.trim().toUpperCase()+', '+soloNombre(emp.nombre,emp.apellido)
      : emp.nombre;

    var row = document.createElement('div');
    row.style.cssText = 'padding:.35rem 0;border-bottom:1px solid var(--border);font-size:.77rem';

    var presentes = (novPorDoc[emp.id||emp._id]||[]).filter(function(n){ return n.tipo==='presente'; }).length;

    var html = '<div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap">'
      +'<strong style="font-size:.8rem">'+escHTML(nombre)+'</strong>'
      +(emp.cargo ? '<span style="color:var(--muted);font-size:.7rem">'+escHTML(emp.cargo)+'</span>' : '')
      +'<span style="margin-left:auto;color:var(--muted);font-size:.7rem">'+presentes+' presentes · '+(novPorDoc[emp.id||emp._id]||[]).length+' registros</span>'
      +'</div>';

    if(novs.length){
      // Agrupar por tipo
      var porTipo = {};
      novs.forEach(function(n){
        var t = LABELS[n.tipo]||n.tipo;
        if(!porTipo[t]) porTipo[t]=[];
        var fObj = new Date(n.fecha+'T12:00:00');
        var dias=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
        porTipo[t].push(dias[fObj.getDay()]+' '+n.fecha.slice(8,10)+'/'+n.fecha.slice(5,7));
      });
      html += '<div style="margin-top:.2rem;display:flex;flex-wrap:wrap;gap:.25rem">';
      Object.keys(porTipo).forEach(function(tipo){
        html += '<span style="background:#EEF2FF;color:#3730A3;border-radius:5px;padding:.1rem .35rem;font-size:.69rem">'
          +'<strong>'+escHTML(tipo)+':</strong> '+escHTML(porTipo[tipo].join(', '))+'</span>';
      });
      html += '</div>';
    } else {
      html += '<div style="color:var(--muted);font-size:.7rem;margin-top:.1rem">Sin novedades registradas</div>';
    }

    row.innerHTML = html;
    cont.appendChild(row);
  });
}

function _descargarBackupJSON(id, b){
  var data = JSON.stringify(b, null, 2);
  var blob = new Blob([data], {type:'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'backup_'+escHTML(b.fecha).replace(/\//g,'-')+'_'+escHTML(b.hora).replace(/:/g,'-')+'.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup JSON descargado');
}

// ── Importar JSON de backup ────────────────────────────
function importarBackupJSON(archivo){
  var reader = new FileReader();
  reader.onload = function(e){
    var b;
    try{ b = JSON.parse(e.target.result); }
    catch(err){ toast('❌ Archivo inválido: no es un JSON válido',4000); return; }
    if(!b.empleados || !b.novedades){
      toast('❌ El archivo no parece un backup del sistema',4000); return;
    }
    var msg = '⚠️ IMPORTAR BACKUP EXTERNO\n\n'
      +'Fecha del backup: '+(b.fecha||'?')+' '+(b.hora||'')+'\n'
      +'Motivo: '+(b.motivo||'?')+'\n'
      +'Docentes: '+(b.empleados.length)+'\n'
      +'Registros: '+(b.novedades.length)+'\n\n'
      +'Esto REEMPLAZARÁ todos los datos actuales.\n'
      +'Se guardará un backup del estado actual antes de importar.\n\n'
      +'¿Confirmar importación?';
    if(!confirm(msg)) return;
    toast('⏳ Importando backup…',8000);
    _ejecutarBackup('Pre-importación automática');
    setTimeout(function(){ _restaurarBackup(b); }, 4000);
  };
  reader.readAsText(archivo);
}

function confirmarRestauracion(backupId, backup){
  var msg = '⚠️ RESTAURAR BACKUP\n\n'
    +'Fecha: '+backup.fecha+' '+backup.hora+'\n'
    +'Motivo: '+backup.motivo+'\n'
    +'Docentes: '+(backup.empleados||[]).length+'\n'
    +'Registros: '+(backup.novedades||[]).length+'\n\n'
    +'Esto REEMPLAZARÁ todos los datos actuales del año '+backup.anio+'.\n'
    +'Se guardará un backup del estado actual antes de restaurar.\n\n'
    +'¿Confirmar restauración?';
  if(!confirm(msg)) return;
  toast('⏳ Restaurando backup…',8000);
  _ejecutarBackup('Pre-restauración automática');
  setTimeout(function(){ _restaurarBackup(backup); }, 4500);
}

function _restaurarBackup(backup){
  var empleados = backup.empleados||[];
  var novedades = backup.novedades||[];
  var anio = backup.anio || ANIO_SEL;
  Promise.all([
    db.from('docentes').select('id').eq('anio', anio),
    db.from('novedades').select('id').eq('anio', String(anio))
  ]).then(function(results){
    if(results[0].error) throw results[0].error;
    if(results[1].error) throw results[1].error;
    var idsDocentesViejos = (results[0].data||[]).map(function(r){ return r.id; });
    var idsNovedadesViejos = (results[1].data||[]).map(function(r){ return r.id; });

    var pasos = [];
    if(idsDocentesViejos.length) pasos.push(db.from('docentes').delete().in('id', idsDocentesViejos));
    if(idsNovedadesViejos.length) pasos.push(db.from('novedades').delete().in('id', idsNovedadesViejos));

    return Promise.all(pasos).then(function(){
      var filasEmp = empleados.map(function(emp){
        var data=Object.assign({},emp); var docId=data._id||data.id; delete data._id; data.id=docId; data.anio=anio;
        return data;
      });
      var filasNov = novedades.map(function(nov){
        var data=Object.assign({},nov); var docId=data._id||data.id; delete data._id; data.id=docId; data.anio=String(anio);
        return data;
      });
      var pasos2 = [];
      if(filasEmp.length) pasos2.push(db.from('docentes').insert(filasEmp));
      if(filasNov.length) pasos2.push(db.from('novedades').insert(filasNov));
      return Promise.all(pasos2);
    });
  }).then(function(){
    toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Backup restaurado correctamente');
    setTimeout(function(){ cargarYRender(); inicializarPanelBackups(); },1000);
  }).catch(function(err){ toast('❌ Error al restaurar: '+err.message,6000); });
}

function escHTML(str){ return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function inicializarCierreCiclo(){
  // Poblar selector de años
  var sel = document.getElementById('cfg-ciclo-anio-cerrar');
  sel.innerHTML='';
  var anioActual = new Date().getFullYear();
  for(var a=anioActual; a>=ANIO_INICIO_APP; a--){
    var opt=document.createElement('option');
    opt.value=a; opt.textContent='Ciclo '+a;
    sel.appendChild(opt);
  }
  cargarCiclosArchivados();
}

function cargarCiclosArchivados(){
  var div=document.getElementById('cfg-ciclos-archivados');
  db.from('ciclos_archivados').select('*').order('anio',{ascending:false}).then(function(res){
    if(res.error) throw res.error;
    var rows = res.data || [];
    if(!rows.length){ div.innerHTML='<div style="font-size:.75rem;color:#9CA3AF">No hay ciclos archivados aún.</div>'; return; }
    div.innerHTML='<div style="font-size:.72rem;font-weight:700;color:var(--muted);margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.05em">Ciclos archivados</div>'+
      rows.map(function(d){
        var totalNov = (d.data && d.data.totalNovedades) || 0;
        var fecha = d.created_at ? new Date(d.created_at).toLocaleDateString('es-AR') : '—';
        return '<div class="ciclo-item">'+
          '<span class="ciclo-anio">📦 Ciclo '+d.anio+'</span>'+
          '<span class="ciclo-info">'+totalNov+' registros · archivado el '+fecha+'</span>'+
          '<button class="btn-s ciclo-restaurar" data-id="'+d.id+'" data-anio="'+d.anio+'">↩️ Restaurar</button>'+
        '</div>';
      }).join('');
    div.querySelectorAll('.ciclo-restaurar').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id=this.dataset.id, anio=this.dataset.anio;
        if(!confirm('¿Restaurar el ciclo '+anio+'? Esto va a reimportar todas sus novedades. Las novedades actuales de ese año se perderán.')) return;
        restaurarCiclo(id, anio);
      });
    });
  }).catch(function(){
    div.innerHTML='<div style="font-size:.75rem;color:#9CA3AF">No hay ciclos archivados.</div>';
  });
}

document.getElementById('cfg-cerrar-ciclo').addEventListener('click', function(){
  var anio = parseInt(document.getElementById('cfg-ciclo-anio-cerrar').value);
  if(!confirm('Archivar ciclo ' + anio + '? Se guardan todas las novedades y se borran de la base activa. Los docentes y horarios no se tocan.')) return;
  cerrarCiclo(anio);
});

function cerrarCiclo(anio){
  var btn=document.getElementById('cfg-cerrar-ciclo');
  btn.disabled=true; btn.textContent='Archivando…';
  var desde=anio+'-01-01', hasta=anio+'-12-31';

  // Traer todas las novedades del año
  db.from('novedades').select('*').gte('fecha',desde).lte('fecha',hasta)
    .then(function(res){
      if(res.error) throw res.error;
      var novedades = res.data || [];
      var ids = novedades.map(function(n){ return n.id; });
      // Guardar en ciclos_archivados
      return db.from('ciclos_archivados').upsert({
        id: String(anio),
        anio: anio,
        created_at: new Date().toISOString(),
        data: { totalNovedades: novedades.length, novedades: novedades }
      }).then(function(){
        if(!ids.length) return;
        return db.from('novedades').delete().in('id', ids);
      });
    })
    .then(function(){
      toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Ciclo '+anio+' archivado correctamente');
      btn.disabled=false; btn.textContent='📦 Archivar y cerrar ciclo';
      cargarCiclosArchivados();
      cargarYRender();
    })
    .catch(function(err){
      toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Error: '+err.message, 5000);
      btn.disabled=false; btn.textContent='📦 Archivar y cerrar ciclo';
    });
}

function restaurarCiclo(docId, anio){
  db.from('ciclos_archivados').select('*').eq('id', docId).maybeSingle().then(function(res){
    if(res.error) throw res.error;
    if(!res.data){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> No se encontró el ciclo',4000); return; }
    var novedades=(res.data.data&&res.data.data.novedades)||[];
    var filas = novedades.map(function(n){
      var data=Object.assign({},n);
      if(!data.id) data.id = (crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2)));
      return data;
    });
    return (filas.length ? db.from('novedades').insert(filas) : Promise.resolve()).then(function(){
      toast('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Ciclo '+anio+' restaurado ('+filas.length+' registros)');
      cargarYRender();
    });
  }).catch(function(err){ toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Error: '+err.message,5000); });
}

// ══════════════════════════════════════════════════════
//  ARRANQUE
// ══════════════════════════════════════════════════════
document.getElementById('fecha-hoy').textContent=
  hoyDate().toLocaleDateString('es-AR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
document.getElementById('input-fecha-hdr').value = hoyStr();
document.body.querySelector('header').style.display='none';
document.body.querySelector('main').style.display='none';
// ══════════════════════════════════════════════════════
//  COPIAR DOCENTE A OTRO NIVEL
// ══════════════════════════════════════════════════════
function abrirCopiarNivel(doc){
  var nivelActual = doc.nivel || 'secundaria';
  var niveles = [
    { val:'secundaria', label:'Secundaria', icon:'\U0001f3eb', color:'#4F46E5' },
    { val:'primaria',   label:'Primaria',   icon:'\U0001f4da', color:'#059669' },
    { val:'inicial',    label:'Inicial',    icon:'\U0001f331', color:'#D97706' }
  ];
  var destinos = niveles.filter(function(n){ return n.val !== nivelActual; });

  var modal = document.getElementById('modal-copiar-nivel');
  if(!modal){
    modal = document.createElement('dialog');
    modal.id = 'modal-copiar-nivel';
    modal.style.cssText = 'border:none;border-radius:18px;padding:0;box-shadow:0 16px 48px rgba(0,0,0,.3);width:min(380px,94vw);z-index:500';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target===modal) modal.close(); });
  }

  var nombreDisplay = (doc.apellido && doc.apellido.trim())
    ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido)
    : doc.nombre;

  var nivelLabels = { secundaria:'Secundaria', primaria:'Primaria', inicial:'Inicial' };

  modal.innerHTML =
    '<div style="background:linear-gradient(135deg,#1A2B4A,#3B5EA6);padding:.9rem 1.2rem;border-radius:18px 18px 0 0;display:flex;align-items:center;justify-content:space-between">'+
      '<div>'+
        '<div style="color:#fff;font-size:.88rem;font-weight:800">Copiar a otro nivel</div>'+
        '<div style="color:#BAE6FD;font-size:.72rem;margin-top:2px">'+nombreDisplay+'</div>'+
      '</div>'+
      '<button id="xcnivel" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center">✕</button>'+
    '</div>'+
    '<div style="padding:1.1rem 1.2rem;background:#fff;display:flex;flex-direction:column;gap:.75rem">'+
      '<div style="font-size:.78rem;color:#6B7280">'+
        'Se crea una copia en el nivel elegido.<br>'+
        '<span style="color:#9CA3AF;font-size:.72rem">Las novedades/faltas no se copian (son propias de cada nivel).</span>'+
      '</div>'+
      '<div style="font-size:.72rem;font-weight:700;color:#4338CA;text-transform:uppercase;letter-spacing:.05em">Nivel origen: '+nivelLabels[nivelActual]+'</div>'+
      '<div id="cnivel-btns" style="display:flex;flex-direction:column;gap:.5rem">'+
        destinos.map(function(n){
          return '<button class="cnivel-btn" data-nivel="'+n.val+'" style="'+
            'display:flex;align-items:center;gap:.65rem;padding:.7rem 1rem;'+
            'border:2px solid '+n.color+'33;border-radius:13px;background:'+n.color+'0d;'+
            'cursor:pointer;font-family:inherit;transition:all .15s;text-align:left">'+
            '<span style="font-size:1.4rem">'+n.icon+'</span>'+
            '<div>'+
              '<div style="font-size:.88rem;font-weight:800;color:'+n.color+'">'+n.label+'</div>'+
              '<div style="font-size:.7rem;color:#9CA3AF">Crear copia en '+n.label+'</div>'+
            '</div>'+
          '</button>';
        }).join('')+
      '</div>'+
      '<button class="btn-sec" id="cnivel-cancelar" style="margin-top:.2rem">Cancelar</button>'+
    '</div>';

  modal.showModal();
  modal.querySelector('#xcnivel').addEventListener('click', function(){ modal.close(); });
  modal.querySelector('#cnivel-cancelar').addEventListener('click', function(){ modal.close(); });

  modal.querySelectorAll('.cnivel-btn').forEach(function(btn){
    btn.addEventListener('mouseenter', function(){ this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 14px rgba(0,0,0,.12)'; });
    btn.addEventListener('mouseleave', function(){ this.style.transform=''; this.style.boxShadow=''; });
    btn.addEventListener('click', function(){
      var nivelDest = this.dataset.nivel;
      var destLabel = nivelLabels[nivelDest];
      btn.innerHTML = '<span class="spinner" style="border-color:rgba(0,0,0,.2);border-top-color:#1A2B4A"></span> Copiando…';
      btn.disabled = true;

      var copia = {
        id: (crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2))),
        nombre:    doc.nombre,
        apellido:  doc.apellido  || '',
        cargo:     doc.cargo     || '',
        tipo_hs:   doc.tipoHs    || 'catedra',
        horario:   doc.horario   || {},
        grupos:    [],
        materias:  doc.materias  || '',
        notas:     doc.notas     || '',
        jubilado:  false,
        nivel:     nivelDest,
        area:      doc.area      || '',
        faltasMes: 0,
        faltasAnio:0,
        anio: ANIO_SEL
      };

      db.from('docentes').insert(copia)
        .then(function(){
          modal.close();
          document.getElementById('modal-docente').close();
          toast('\u2705 '+nombreDisplay+' copiado a <strong>'+destLabel+'</strong>');
          cargarYRender();
        })
        .catch(function(err){
          toast('Error: '+err.message, 5000);
          btn.disabled = false;
          btn.textContent = 'Reintentar';
        });
    });
  });
}

iniciarFirebase();

// Dropdown "Acciones" en el header
(function(){
  const btn = document.getElementById('btn-acciones-menu');
  const list = document.getElementById('hdr-dropdown-list');
  if(!btn || !list) return;
  btn.addEventListener('click', e => { e.stopPropagation(); list.classList.toggle('open'); });
  document.addEventListener('click', () => list.classList.remove('open'));
  list.addEventListener('click', () => list.classList.remove('open'));
})();

// ══════════════════════════════════════════════════════
//  AÑO NUEVO — Copiar docentes del año anterior
// ══════════════════════════════════════════════════════
function mostrarDialogoAnioNuevo(anioNuevo){
  var anioAnterior = anioNuevo - 1;
  var modal = document.getElementById('modal-anio-nuevo');
  document.getElementById('man-anio-nuevo').textContent = anioNuevo;
  document.getElementById('man-anio-ant').textContent   = anioAnterior;
  modal.showModal();
}

document.getElementById('man-cancelar').addEventListener('click', function(){
  document.getElementById('modal-anio-nuevo').close();
});

document.getElementById('man-copiar').addEventListener('click', function(){
  var anioNuevo    = ANIO_SEL;
  var anioAnterior = anioNuevo - 1;
  var btn = this;
  btn.disabled = true;
  btn.textContent = 'Copiando…';

  db.from('docentes').select('*').eq('anio', anioAnterior).then(function(res){
    if(res.error) throw res.error;
    var filas = res.data || [];
    if(!filas.length){
      toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> No hay docentes en '+anioAnterior, 4000);
      btn.disabled=false; btn.textContent='Sí, copiar docentes';
      return;
    }
    var nuevasFilas = filas.map(function(data){
      // Resetear faltas del mes y año; mantener nombre, cargo, horario, grupos, materias
      return {
        id: (crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2))),
        anio: anioNuevo,
        nombre:   data.nombre   || '',
        apellido: data.apellido || '',
        cargo:    data.cargo    || '',
        nivel:    data.nivel    || 'secundaria',
        area:     data.area     || '',
        horario:  data.horario  || {},
        grupos:   data.grupos   || [],
        materias: data.materias || '',
        notas:    data.notas    || '',
        tipo_hs:  data.tipo_hs  || '',
        faltasMes:  0,
        faltasAnio: 0,
        copiadoDe:  anioAnterior
      };
    });
    return db.from('docentes').insert(nuevasFilas);
  }).then(function(res){
    if(res && res.error) throw res.error;
    toast('✅ Docentes de '+anioAnterior+' copiados a '+anioNuevo);
    document.getElementById('modal-anio-nuevo').close();
    cargarYRender();
  }).catch(function(err){
    toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Error: '+err.message, 6000);
    btn.disabled=false; btn.textContent='Sí, copiar docentes';
  });
});

document.getElementById('man-vacio').addEventListener('click', function(){
  document.getElementById('modal-anio-nuevo').close();
  // Crear una fila placeholder para que el año exista aunque esté vacío
  // (evita que se vuelva a mostrar el diálogo en cada carga)
  db.from('docentes').insert({
    id:(crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2))),
    anio: ANIO_SEL,
    nombre:'__placeholder__', cargo:'', horario:{}, grupos:[], materias:'',
    faltasMes:0, faltasAnio:0, esplaceholder:true
  }).then(function(){ cargarYRender(); }).catch(function(){ cargarYRender(); });
});

// ══════════════════════════════════════════════════════
//  NOTAS EN MODAL DOCENTE
// ══════════════════════════════════════════════════════
// Leer notas al abrir docente
var _origAbrirDocente = abrirDocente;
abrirDocente = function(doc){
  _origAbrirDocente(doc);
  var el = document.getElementById('mde-notas');
  if(el) el.value = doc ? (doc.notas||'') : '';
};
// Guardar notas (parchear savedoc)
var _origSavedoc = document.getElementById('savedoc').onclick;
document.getElementById('savedoc').addEventListener('click', function(){
  // notas se inyectan en el data en la lógica existente — ver abajo
}, false);
// Monkey-patch: interceptar el data antes de guardar
var _origLeerHorario = leerHorarioEditor;
function leerDatosDocente(){
  return {
    notas: (document.getElementById('mde-notas')||{value:''}).value.trim()
  };
}

// ══════════════════════════════════════════════════════
//  IMPORTAR DOCENTES DESDE EXCEL
// ══════════════════════════════════════════════════════
(function(){
  var modal = document.getElementById('modal-importar');
  var docentesImportar = [];

  document.getElementById('btn-importar-excel').addEventListener('click', function(){
    docentesImportar = [];
    document.getElementById('imp-preview').style.display = 'none';
    document.getElementById('imp-guardar').disabled = true;
    document.getElementById('imp-drop-zone').style.display = '';
    modal.showModal();
  });
  document.getElementById('ximportar').addEventListener('click', function(){ modal.close(); });
  document.getElementById('imp-cancelar').addEventListener('click', function(){ modal.close(); });
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.close(); });

  var dropZone = document.getElementById('imp-drop-zone');
  var fileInput = document.getElementById('imp-file-input');
  dropZone.addEventListener('click', function(){ fileInput.click(); });
  dropZone.addEventListener('dragover', function(e){ e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', function(){ dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', function(e){ e.preventDefault(); dropZone.classList.remove('drag-over'); procesarArchivo(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', function(){ procesarArchivo(this.files[0]); });

  function normCol(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
  function parseHora(v){
    if(!v) return '';
    v = String(v).trim();
    if(/^\d{1,2}:\d{2}$/.test(v)) return v.padStart(5,'0');
    var n = parseFloat(v);
    if(!isNaN(n) && n < 1){
      var mins = Math.round(n*24*60);
      return String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');
    }
    return v;
  }

  // ── Parsear Excel ────────────────────────────────
  function parsearExcel(buffer){
    var wb;
    try{ wb = XLSX.read(buffer, {type:'array'}); }
    catch(e){ toast('Error al leer el Excel: '+e.message, 5000); return []; }
    var ws = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(ws, {defval:''});
    if(!rows.length){ toast('El archivo Excel está vacío o no tiene datos en la primera hoja.', 5000); return []; }

    // Mostrar en consola las columnas encontradas para debug
    var colsDetectadas = Object.keys(rows[0]);
    console.log('[Importar] Columnas detectadas:', colsDetectadas);

    var DIAS_MAP = {
      lunes:['lunes'], martes:['martes'], miercoles:['miercoles','miércoles'],
      jueves:['jueves'], viernes:['viernes']
    };

    var resultado = rows.map(function(row){
      function col(aliases){
        var keys = Object.keys(row);
        for(var i=0;i<aliases.length;i++){
          var found = keys.find(function(k){ return normCol(k)===normCol(aliases[i]); });
          if(found !== undefined) return String(row[found]||'').trim();
        }
        return '';
      }

      var apellido = col(['apellido','apellidos','last name','lastname']);
      var nombreP  = col(['nombre','nombres','primer nombre','name','first name','firstname']);
      var nombreC  = col(['nombre completo','nombre y apellido','full name','docente']);
      var nombre;
      if(nombreC)                  nombre = nombreC;
      else if(apellido && nombreP) nombre = nombreP + ' ' + apellido;
      else if(nombreP)             nombre = nombreP;
      else if(apellido)            nombre = apellido;
      else {
        // Si no hay columna reconocible, usar la primera columna no vacía como nombre
        var primeraCol = colsDetectadas.find(function(k){ return String(row[k]||'').trim().length > 1; });
        nombre = primeraCol ? String(row[primeraCol]||'').trim() : '';
      }
      var cargo    = col(['cargo','rol','cargo / rol','puesto','position']);
      var materias = col(['materias','asignaturas','materia','asignatura','materia / asignatura']);
      var grupo    = col(['grupo','grupos','division','división','division / grupo','curso']);
      var notas    = col(['notas','observaciones','nota','obs']);
      var area     = col(['area','área','departamento','department']);
      var horario  = {};
      Object.keys(DIAS_MAP).forEach(function(dia){
        var aliases = DIAS_MAP[dia];
        var entKeys = aliases.reduce(function(acc,a){ return acc.concat([a+' entrada',a+' - entrada',a+'_entrada','entrada '+a]); },[]);
        var salKeys = aliases.reduce(function(acc,a){ return acc.concat([a+' salida',a+' - salida',a+'_salida','salida '+a]); },[]);
        var ent = parseHora(col(entKeys));
        var sal = parseHora(col(salKeys));
        if(!ent||!sal){
          var single = col(aliases);
          var mm = single.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
          if(mm){ ent=mm[1]; sal=mm[2]; }
        }
        if(ent && sal) horario[dia] = [{entrada:ent, salida:sal, materia:''}];
      });
      return { nombre:nombre, apellido:apellido, cargo:cargo, materias:materias, grupo:grupo, notas:notas, horario:horario, area:area };
    }).filter(function(d){ return (d.nombre||'').trim().length > 1; });

    if(!resultado.length){
      toast('No se encontraron docentes. Columnas detectadas: '+colsDetectadas.slice(0,5).join(', ')+'. Asegurate de tener una columna "Nombre" o "Apellido".', 7000);
    }
    return resultado;
  }

  // ── Parsear Word (.docx) via mammoth ─────────────
  function parsearWord(buffer){
    // mammoth extrae el texto plano y las tablas como HTML
    return mammoth.convertToHtml({arrayBuffer: buffer}).then(function(result){
      var html = result.value;
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var docentes = [];

      // 1. Intentar leer tablas (misma estructura que Excel)
      var tables = doc.querySelectorAll('table');
      if(tables.length){
        tables.forEach(function(table){
          var rows = Array.from(table.querySelectorAll('tr'));
          if(!rows.length) return;
          // Primera fila = encabezados
          var headers = Array.from(rows[0].querySelectorAll('th,td')).map(function(td){ return normCol(td.textContent); });
          rows.slice(1).forEach(function(row){
            var cells = Array.from(row.querySelectorAll('td')).map(function(td){ return td.textContent.trim(); });
            if(!cells.length || cells.every(function(c){ return !c; })) return;
            function colIdx(aliases){
              for(var i=0;i<aliases.length;i++){
                var idx = headers.indexOf(aliases[i]);
                if(idx>=0 && cells[idx]) return cells[idx];
              }
              return '';
            }
            var apellido = colIdx(['apellido','apellidos']);
            var nombreP  = colIdx(['nombre','nombres','primer nombre']);
            var nombre;
            if(apellido && nombreP)          nombre = nombreP + ' ' + apellido;
            else if(colIdx(['nombre completo'])) nombre = colIdx(['nombre completo']);
            else                                 nombre = (nombreP+' '+apellido).trim() || cells[0];
            var cargo    = colIdx(['cargo','rol']);
            var materias = colIdx(['materias','asignaturas','materia']);
            var notas    = colIdx(['notas','observaciones']);
            if((nombre||'').length > 1)
              docentes.push({nombre:nombre, apellido:apellido, cargo:cargo, materias:materias, notas:notas, horario:{}, grupo:''});
          });
        });
        if(docentes.length) return docentes;
      }

      // 2. Parsear párrafos: cada línea no vacía es un docente
      // Formatos soportados:
      //   "Apellido, Nombre | Cargo | Materias"
      //   "Apellido Nombre - Cargo"
      //   "Nombre Apellido"
      var paras = Array.from(doc.querySelectorAll('p,li')).map(function(p){ return p.textContent.trim(); }).filter(function(t){ return t.length > 2; });
      paras.forEach(function(linea){
        // Ignorar líneas que parecen encabezados o instrucciones
        if(/^(nombre|apellido|cargo|docentes|plantel|listado)/i.test(linea)) return;
        var partes = linea.split(/\s*[|,;]\s*/);
        var nombreRaw = partes[0].trim();
        var cargo     = (partes[1]||'').trim();
        var materias  = (partes[2]||'').trim();
        var notas     = (partes[3]||'').trim();
        // Detectar si el formato es "Apellido, Nombre" (coma como separador)
        var apellido = '';
        if(linea.indexOf(',') > 0 && partes.length >= 1){
          // Ya separado arriba: partes[0]=Apellido, partes[1] puede ser Nombre
          // Pero si cargo/materias también usan |, re-split por coma para nombre
          var cIdx = linea.indexOf(',');
          var bIdx = linea.indexOf('|');
          if(cIdx > 0 && (bIdx < 0 || cIdx < bIdx)){
            apellido  = linea.slice(0, cIdx).trim();
            var resto = linea.slice(cIdx+1);
            var partes2 = resto.split('|');
            nombreRaw = partes2[0].trim();
            cargo     = (partes2[1]||'').trim();
            materias  = (partes2[2]||'').trim();
            notas     = (partes2[3]||'').trim();
          }
        }
        var nombre = nombreRaw + (apellido ? ' ' + apellido : '');
        nombre = nombre.trim();
        if(nombre.length > 1)
          docentes.push({nombre:nombre, apellido:apellido, cargo:cargo, materias:materias, notas:notas, horario:{}, grupo:''});
      });
      return docentes;
    });
  }

  // ── Parsear PDF via pdf.js ───────────────────────
  function parsearPDF(buffer){
    return new Promise(function(resolve, reject){
      if(typeof pdfjsLib === 'undefined'){
        reject(new Error('Librería pdf.js no disponible'));
        return;
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfjsLib.getDocument({data: buffer}).promise.then(function(pdf){
        var pagePromises = [];
        for(var i = 1; i <= pdf.numPages; i++){
          pagePromises.push(pdf.getPage(i).then(function(page){
            return page.getTextContent().then(function(tc){
              return tc.items.map(function(item){ return item.str; }).join(' ');
            });
          }));
        }
        return Promise.all(pagePromises);
      }).then(function(pages){
        var textoCompleto = pages.join('\n');
        // Intentar detectar tabla: líneas con múltiples campos separados por espacios/tabs
        var lineas = textoCompleto.split(/\n|\r/).map(function(l){ return l.trim(); }).filter(function(l){ return l.length > 2; });
        var docentes = [];

        // Detectar encabezado de tabla
        var headerIdx = -1;
        var headerMap = {};
        lineas.forEach(function(linea, idx){
          var lower = linea.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
          if((lower.indexOf('nombre') >= 0 || lower.indexOf('apellido') >= 0) && idx < 10){
            headerIdx = idx;
            var partes = linea.split(/\s{2,}|\t/);
            partes.forEach(function(p, i){
              var pl = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
              if(pl.indexOf('apellido')>=0)      headerMap.apellido = i;
              else if(pl.indexOf('nombre')>=0)   headerMap.nombre = i;
              else if(pl.indexOf('cargo')>=0)    headerMap.cargo = i;
              else if(pl.indexOf('materia')>=0 || pl.indexOf('asignatura')>=0) headerMap.materias = i;
              else if(pl.indexOf('nota')>=0 || pl.indexOf('obs')>=0) headerMap.notas = i;
            });
          }
        });

        if(headerIdx >= 0 && (headerMap.nombre !== undefined || headerMap.apellido !== undefined)){
          // Parsear como tabla
          lineas.slice(headerIdx+1).forEach(function(linea){
            var celdas = linea.split(/\s{2,}|\t/);
            if(celdas.length < 2) return;
            var apellido = (headerMap.apellido !== undefined ? celdas[headerMap.apellido] : '') || '';
            var nombreP  = (headerMap.nombre   !== undefined ? celdas[headerMap.nombre]   : '') || '';
            var nombre = (apellido && nombreP) ? nombreP + ' ' + apellido : (nombreP || apellido || celdas[0]);
            var cargo    = (headerMap.cargo    !== undefined ? celdas[headerMap.cargo]    : '') || '';
            var materias = (headerMap.materias !== undefined ? celdas[headerMap.materias] : '') || '';
            var notas    = (headerMap.notas    !== undefined ? celdas[headerMap.notas]    : '') || '';
            nombre = nombre.trim();
            if(nombre.length > 1)
              docentes.push({nombre:nombre, apellido:apellido.trim(), cargo:cargo.trim(), materias:materias.trim(), notas:notas.trim(), horario:{}, grupo:''});
          });
        }

        if(!docentes.length){
          // Parsear como lista de párrafos (igual que Word)
          lineas.forEach(function(linea){
            if(/^(nombre|apellido|cargo|docentes|plantel|listado|pagina|página|\d+$)/i.test(linea.trim())) return;
            var partes = linea.split(/\s*[|;]\s*/);
            var nombreRaw = partes[0].trim();
            var cargo     = (partes[1]||'').trim();
            var materias  = (partes[2]||'').trim();
            var notas     = (partes[3]||'').trim();
            var apellido  = '';
            var cIdx = linea.indexOf(',');
            var bIdx = linea.indexOf('|');
            if(cIdx > 0 && (bIdx < 0 || cIdx < bIdx)){
              apellido  = linea.slice(0, cIdx).trim();
              var resto = linea.slice(cIdx+1);
              var partes2 = resto.split('|');
              nombreRaw = partes2[0].trim();
              cargo     = (partes2[1]||'').trim();
              materias  = (partes2[2]||'').trim();
              notas     = (partes2[3]||'').trim();
            }
            var nombre = (nombreRaw + (apellido ? ' ' + apellido : '')).trim();
            // Filtrar líneas que probablemente no sean nombres (muy cortas, solo números, etc.)
            if(nombre.length > 3 && !/^\d+$/.test(nombre) && nombre.split(' ').length >= 2)
              docentes.push({nombre:nombre, apellido:apellido, cargo:cargo, materias:materias, notas:notas, horario:{}, grupo:''});
          });
        }

        resolve(docentes);
      }).catch(reject);
    });
  }

  function procesarArchivo(file){
    if(!file) return;
    var ext = file.name.split('.').pop().toLowerCase();
    var reader = new FileReader();
    reader.onload = function(e){
      if(ext === 'docx'){
        // Verificar que mammoth esté disponible
        if(typeof mammoth === 'undefined'){
          toast('Error: librería mammoth no disponible. Usá el formato Excel.',5000);
          return;
        }
        parsearWord(e.target.result).then(function(lista){
          docentesImportar = lista;
          if(!docentesImportar.length){ toast('No se encontraron docentes en el Word',4000); return; }
          mostrarPreview();
        }).catch(function(err){ toast('Error leyendo Word: '+err.message,5000); });
      } else if(ext === 'pdf'){
        parsearPDF(e.target.result).then(function(lista){
          docentesImportar = lista;
          if(!docentesImportar.length){ toast('No se encontraron docentes en el PDF. Probá con Excel o Word.',5000); return; }
          mostrarPreview();
        }).catch(function(err){ toast('Error leyendo PDF: '+err.message,5000); });
      } else {
        docentesImportar = parsearExcel(e.target.result);
        if(!docentesImportar.length) return;
        mostrarPreview();
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function mostrarPreview(){
    var tbody = document.getElementById('imp-tbody');
    document.getElementById('imp-preview-count').textContent = docentesImportar.length + ' docentes encontrados';
    tbody.innerHTML = docentesImportar.map(function(d, i){
      var diasConH = Object.keys(d.horario||{});
      var horStr = diasConH.length ? diasConH.map(function(k){ return k.slice(0,3); }).join(', ') : '—';
      var apellidoMostrar = d.apellido || (d.nombre||'').split(' ').pop() || '—';
      var nombreMostrar   = d.nombre || '—';
      return '<tr>'+
        '<td class="rg-td-num" style="color:var(--muted)">'+(i+1)+'</td>'+
        '<td class="rg-td-nom">'+apellidoMostrar+'</td>'+
        '<td class="rg-td-nom">'+nombreMostrar+'</td>'+
        '<td class="rg-td-cargo">'+(d.cargo||'—')+'</td>'+
        '<td class="rg-td-otros">'+(d.materias||'—')+'</td>'+
        '<td class="rg-td-otros">'+horStr+'</td>'+
      '</tr>';
    }).join('');
    document.getElementById('imp-preview').style.display = '';
    document.getElementById('imp-drop-zone').style.display = 'none';
    document.getElementById('imp-guardar').disabled = docentesImportar.length === 0;
  }

  document.getElementById('imp-guardar').addEventListener('click', function(){
    var btn = this;
    btn.disabled = true; btn.textContent = 'Importando…';
    var sobreescribir = document.getElementById('imp-sobreescribir').checked;
    var colEmp = colEmpleados(ANIO_SEL);
    var nivelPagina = (typeof NIVEL_ACTIVO !== 'undefined' && NIVEL_ACTIVO) ? NIVEL_ACTIVO : 'secundaria';

    db.from('docentes').select('*').eq('anio', ANIO_SEL).then(function(res){
      if(res.error) throw res.error;
      var existentes = (res.data||[]).map(function(dd){
        var eliminadoEnNivel = dd.eliminado_en && dd.eliminado_en[nivelPagina] === true;
        return {id:dd.id, nombre:(dd.nombre||'').toLowerCase(), eliminado: eliminadoEnNivel};
      });
      var importados = 0, omitidos = 0, nuevosIds = [];
      var filasNuevas = [], filasUpdate = [];

      docentesImportar.forEach(function(d){
        var nombreNorm = (d.nombre||'').toLowerCase();
        // Solo contar como existente si NO está eliminado en este nivel
        var existe = existentes.find(function(e){ return e.nombre === nombreNorm && !e.eliminado; });
        if(existe && !sobreescribir){ omitidos++; return; }

        var grupoIds = [];
        if(d.grupo){
          var g = TODOS_GRUPOS.find(function(gr){ return gr.nombre.toLowerCase() === d.grupo.toLowerCase(); });
          if(g) grupoIds = [g.id];
        }
        var data = {
          nombre:d.nombre||'', apellido:d.apellido||'', cargo:d.cargo||'',
          materias:d.materias||'', notas:d.notas||'', horario:d.horario||{},
          grupos:grupoIds, faltasMes:0, faltasAnio:0,
          nivel: nivelPagina, area: d.area||'', anio: ANIO_SEL
        };
        if(existe && sobreescribir){
          data.id = existe.id;
          filasUpdate.push(data);
        } else {
          var nuevoId = (crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2)));
          data.id = nuevoId;
          filasNuevas.push(data);
          nuevosIds.push(nuevoId);
        }
        importados++;
      });

      var pasos = [];
      filasUpdate.forEach(function(data){
        var id = data.id; var copia = Object.assign({}, data); delete copia.id;
        pasos.push(db.from('docentes').update(copia).eq('id', id));
      });
      if(filasNuevas.length) pasos.push(db.from('docentes').insert(filasNuevas));

      return Promise.all(pasos).then(function(){
        nuevosIds.forEach(function(docId){ registrarPresenteHoy(docId); });
        crearBackupAutomatico('Importar '+importados+' docentes');
        toast(importados+' docentes importados'+(omitidos?' ('+omitidos+' omitidos por duplicado)':''));
        modal.close();
        cargarYRender();
      });
    }).catch(function(err){
      toast('Error: '+err.message, 5000);
    }).finally(function(){
      btn.disabled = false; btn.textContent = 'Importar docentes';
    });
  });
})();

// ══════════════════════════════════════════════════════
//  IMPORTAR REGISTROS DESDE PDF DE ASISTENCIA
// ══════════════════════════════════════════════════════
(function(){
  var btnModoDoc    = document.getElementById('imp-modo-docentes');
  var btnModoReg    = document.getElementById('imp-modo-registros');
  var panelDoc      = document.getElementById('imp-panel-docentes');
  var panelReg      = document.getElementById('imp-panel-registros');
  var btnGuardar    = document.getElementById('imp-guardar');
  var btnGuardarReg = document.getElementById('imp-guardar-reg');
  if (!btnModoDoc) return;

  function setModo(modo) {
    var esDoc = modo === 'docentes';
    btnModoDoc.classList.toggle('imp-modo-activo', esDoc);
    btnModoReg.classList.toggle('imp-modo-activo', !esDoc);
    panelDoc.style.display  = esDoc ? '' : 'none';
    panelReg.style.display  = esDoc ? 'none' : '';
    btnGuardar.style.display    = esDoc ? '' : 'none';
    btnGuardarReg.style.display = esDoc ? 'none' : '';
    if (!esDoc) {
      document.getElementById('imp-drop-zone-reg').style.display = '';
      document.getElementById('imp-reg-preview').style.display   = 'none';
      document.getElementById('imp-reg-progreso').style.display  = 'none';
      btnGuardarReg.disabled = true;
    }
  }
  btnModoDoc.addEventListener('click', function(){ setModo('docentes'); });
  btnModoReg.addEventListener('click', function(){ setModo('registros'); });

  // ── Mapa label PDF → tipo interno ──────────────────
  var PDF_TIPO_MAP = {
    'Just.':             'justificada',
    'Injust.':           'injustificada',
    'F.Parc.Just.':      'justificada_parcial',
    'F.Parc.Injust.':    'injustificada_parcial',
    'C. Médica':         'medica',
    'C. Méd. Fam.':      'medica_familiar',
    'Paro':              'paro',
    'Lic. Gremial':      'lic_gremial',
    'Duelo':             'duelo',
    'Jubilación':        'jubilacion',
    'Lic. Embarazo':     'lic_embarazo',
    'C. Psiquiát.':      'carpeta_psiq',
    'Lic. Capacitación': 'lic_capacitacion',
    'Cambio Act.':       'cambio',
  };
  var MESES_MAP = {ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,oct:10,nov:11,dic:12};

  function parseFecha(token) {
    var t = token.trim();
    var m = t.match(/^[A-ZÁÉÍÓÚÑa-záéíóúñ]+\s+(\d{1,2})\s+([a-záéíóúñ]{3})/);
    if (!m) return null;
    var mes = MESES_MAP[m[2].toLowerCase()];
    if (!mes) return null;
    return '2026-' + String(mes).padStart(2,'0') + '-' + String(parseInt(m[1])).padStart(2,'0');
  }

  // Corrige artefacto de pdf.js: "Tipo:L un 16 mar" → "Tipo: Lun 16 mar"
  function normLinea(line) {
    return line.replace(/(:)([A-ZÁÉÍÓÚÑ])\s+([a-záéíóúñ]{1,2}\s+\d)/, '$1 $2$3');
  }

  function parsearPDFRegistros(text) {
    var docentes = [];
    var lines = text.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
    var i = 0;
    // Saltar encabezado hasta primer docente
    while (i < lines.length && !lines[i].match(/^.+\s+\d+\/\d+\s+\(\d+%\)$/)) i++;

    while (i < lines.length) {
      var line = normLinea(lines[i]);
      var mPct = line.match(/^(.+?)\s+(\d+)\/(\d+)\s+\((\d+)%\)$/);
      if (mPct) {
        var nombre    = mPct[1].trim();
        var presentes = parseInt(mPct[2]);
        var total     = parseInt(mPct[3]);
        var pct       = parseInt(mPct[4]);
        var cargo     = '';
        var novedades = [];
        i++;
        // Detectar cargo (no es tipo novedad, no es siguiente docente)
        if (i < lines.length) {
          var sig = normLinea(lines[i]);
          var esTipo    = Object.keys(PDF_TIPO_MAP).some(function(k){ return sig.indexOf(k+':') === 0; });
          var esNextDoc = !!sig.match(/^.+?\s+\d+\/\d+\s+\(\d+%\)$/);
          if (!esTipo && !esNextDoc && sig.length < 80 && !sig.match(/^\d/)) {
            cargo = sig; i++;
          }
        }
        // Leer novedades
        while (i < lines.length) {
          var nl = normLinea(lines[i]);
          if (nl.match(/^.+?\s+\d+\/\d+\s+\(\d+%\)$/)) break;
          var matched = false;
          for (var label in PDF_TIPO_MAP) {
            if (nl.indexOf(label + ':') === 0) {
              var tipo     = PDF_TIPO_MAP[label];
              var fechaStr = nl.slice(label.length + 1).trim();
              fechaStr.split(',').forEach(function(tk){
                var f = parseFecha(tk.trim());
                if (f) novedades.push({ tipo:tipo, fecha:f });
              });
              matched = true; break;
            }
          }
          i++;
        }
        docentes.push({ nombre:nombre, cargo:cargo, presentes:presentes, total:total, pct:pct, novedades:novedades });
        continue;
      }
      i++;
    }
    return docentes;
  }

  function normaliz(s) {
    return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').trim();
  }

  function matchDocente(nombre, empleados) {
    var n = normaliz(nombre);
    for (var j = 0; j < empleados.length; j++) {
      var e = empleados[j];
      var a = normaliz((e.apellido||'')+' '+(e.nombre||''));
      var b = normaliz((e.nombre||'')+' '+(e.apellido||''));
      if (a === n || b === n) return e;
    }
    var nParts = n.split(' ').filter(function(p){ return p.length > 2; });
    var best = null, bestScore = 0;
    for (var j = 0; j < empleados.length; j++) {
      var e = empleados[j];
      var eName = normaliz((e.apellido||'')+' '+(e.nombre||''));
      var hits  = nParts.filter(function(p){ return eName.indexOf(p) >= 0; }).length;
      var score = hits / Math.max(nParts.length, 1);
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return bestScore >= 0.6 ? best : null;
  }

  var regDatos = [];

  // ── Dropzone ─────────────────────────────────────
  var dropReg = document.getElementById('imp-drop-zone-reg');
  var fileReg = document.getElementById('imp-file-reg');

  dropReg.addEventListener('click', function(){ fileReg.click(); });
  dropReg.addEventListener('dragover', function(e){ e.preventDefault(); dropReg.classList.add('drag-over'); });
  dropReg.addEventListener('dragleave', function(){ dropReg.classList.remove('drag-over'); });
  dropReg.addEventListener('drop', function(e){ e.preventDefault(); dropReg.classList.remove('drag-over'); procesarPDF(e.dataTransfer.files[0]); });
  fileReg.addEventListener('change', function(){ if (this.files[0]) procesarPDF(this.files[0]); });

  function procesarPDF(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast('Solo se aceptan archivos PDF en este modo', 3000); return;
    }
    dropReg.innerHTML = '<p style="color:var(--muted);font-size:.85rem;padding:1.5rem">⏳ Leyendo PDF…</p>';
    var reader = new FileReader();
    reader.onload = function(e) {
      var typedArray = new Uint8Array(e.target.result);
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfjsLib.getDocument({ data: typedArray }).promise.then(function(pdf) {
        var pageNums = [];
        for (var p = 1; p <= pdf.numPages; p++) pageNums.push(p);
        return pageNums.reduce(function(acc, pn) {
          return acc.then(function(txt) {
            return pdf.getPage(pn).then(function(pg){ return pg.getTextContent(); }).then(function(tc) {
              // Reconstruir líneas usando posición Y
              var items  = tc.items;
              var lines2 = [], cur2 = '', lastY2 = null;
              items.forEach(function(item) {
                var y = item.transform ? Math.round(item.transform[5]) : null;
                if (lastY2 !== null && y !== null && Math.abs(y - lastY2) > 3) {
                  if (cur2.trim()) lines2.push(cur2.trim());
                  cur2 = '';
                }
                cur2 += item.str;
                lastY2 = y;
              });
              if (cur2.trim()) lines2.push(cur2.trim());
              return txt + '\n' + lines2.join('\n');
            });
          });
        }, Promise.resolve(''));
      }).then(function(texto) {
        var docentes = parsearPDFRegistros(texto);
        if (!docentes.length) {
          toast('No se encontraron registros. ¿Es un reporte exportado por esta app?', 5000);
          resetDropReg(); return;
        }
        return db.from('docentes').select('*').eq('anio', ANIO_SEL).then(function(res) {
          if(res.error) throw res.error;
          var empleados = (res.data||[]).filter(function(e){ return !e.esplaceholder; });
          docentes.forEach(function(d) { d.match = matchDocente(d.nombre, empleados); });
          regDatos = docentes;
          mostrarPreviewReg(docentes);
        });
      }).catch(function(err) {
        console.error('PDF import error:', err);
        toast('Error al procesar PDF: ' + err.message, 5000);
        resetDropReg();
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function resetDropReg() {
    dropReg.style.display = '';
    dropReg.innerHTML =
      '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>'+
      '<p>Arrastrá el PDF de reporte acá<br><span>o hacé click para seleccionar</span></p>'+
      '<input type="file" id="imp-file-reg" accept=".pdf" style="display:none"/>';
    var nf = dropReg.querySelector('#imp-file-reg');
    if (nf) nf.addEventListener('change', function(){ if(this.files[0]) procesarPDF(this.files[0]); });
  }

  function mostrarPreviewReg(datos) {
    dropReg.style.display = 'none';
    var nuevos     = datos.filter(function(d){ return !d.match; }).length;
    var existentes = datos.length - nuevos;
    var totalNov   = datos.reduce(function(s,d){ return s + d.novedades.length; }, 0);
    document.getElementById('imp-reg-resumen').innerHTML =
      '<strong>'+datos.length+' docentes</strong> en el PDF — '+
      '<span style="color:#059669;font-weight:600">'+existentes+' ya existen</span>, '+
      '<span style="color:#DC2626;font-weight:600">'+nuevos+' se van a crear</span>. '+
      'Novedades a importar: <strong>'+totalNov+'</strong>.';
    document.getElementById('imp-reg-lista').innerHTML = datos.map(function(d) {
      var badge = d.match
        ? '<span style="font-size:.65rem;padding:2px 6px;border-radius:99px;background:#DCFCE7;color:#166534;font-weight:700">✓ Existe</span>'
        : '<span style="font-size:.65rem;padding:2px 6px;border-radius:99px;background:#FEE2E2;color:#991B1B;font-weight:700">+ Nuevo</span>';
      var matchTxt = d.match ? ' <span style="font-size:.7rem;color:#9CA3AF">→ '+(d.match.apellido||d.match.nombre||'')+'</span>' : '';
      var novTxt = d.novedades.length
        ? '<span style="font-size:.7rem;color:#6B7280">'+d.novedades.length+' novedad'+(d.novedades.length!==1?'es':'')+'</span>'
        : '<span style="font-size:.7rem;color:#9CA3AF">Sin novedades</span>';
      return '<div style="display:flex;align-items:center;gap:.5rem;padding:.45rem .6rem;border-radius:7px;background:#F9FAFB;border:1px solid #F3F4F6">'+
        badge+'<div style="flex:1;min-width:0">'+
        '<span style="font-weight:600;font-size:.82rem">'+d.nombre+matchTxt+'</span>'+
        (d.cargo?'<span style="font-size:.7rem;color:#9CA3AF"> · '+d.cargo+'</span>':'')+
        '<div>'+novTxt+' · '+d.presentes+'/'+d.total+' ('+d.pct+'%)</div></div></div>';
    }).join('');
    document.getElementById('imp-reg-preview').style.display = '';
    btnGuardarReg.disabled = false;
  }

  btnGuardarReg.addEventListener('click', function() {
    if (!confirm('¿Confirmar importación? Esta acción no se puede deshacer.')) return;
    btnGuardarReg.disabled = true;
    document.getElementById('imp-reg-preview').style.display  = 'none';
    document.getElementById('imp-reg-progreso').style.display = '';
    var bar   = document.getElementById('imp-reg-prog-bar');
    var txt   = document.getElementById('imp-reg-prog-txt');
    var total = regDatos.length, done = 0, errores = 0;
    var queue = regDatos.slice();

    function next() {
      if (!queue.length) {
        bar.style.width = '100%';
        txt.textContent = '✅ Listo' + (errores ? ' ('+errores+' errores)' : '');
        setTimeout(function() {
          document.getElementById('modal-importar').close();
          cargarYRender();
          toast('✅ Importados '+total+' docentes con sus novedades');
        }, 1400);
        return;
      }
      var d = queue.shift(); done++;
      bar.style.width = Math.round(done/total*100)+'%';
      txt.textContent = 'Procesando '+d.nombre+' ('+done+'/'+total+')…';
      var empPromise;
      if (d.match) {
        empPromise = Promise.resolve(d.match.id);
      } else {
        var partes   = d.nombre.trim().split(/\s+/);
        var apellido = partes.length > 1 ? partes[0] : '';
        var nombre   = partes.length > 1 ? partes.slice(1).join(' ') : partes[0];
        var nuevoEmpId = (crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2)));
        empPromise   = db.from('docentes').insert({
          id:nuevoEmpId,
          nombre:nombre, apellido:apellido, cargo:d.cargo||'',
          nivel:NIVEL_ACTIVO||'secundaria', tipo_hs:'manana',
          faltasMes:0, faltasAnio:0, horario:[], grupos:[], materias:[], notas:'',
          jubilado:false, area:'', anio:ANIO_SEL
        }).then(function(){ return nuevoEmpId; });
      }
      empPromise.then(function(empId) {
        if (!d.novedades.length) { next(); return; }
        var filasNov = d.novedades.map(function(nov){
          return { id:(crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2))),
            docente_id:empId, tipo:nov.tipo, fecha:nov.fecha,
            mes:nov.fecha.slice(0,7), anio:String(ANIO_SEL), importadoDePDF:true,
            created_at:new Date().toISOString() };
        });
        db.from('novedades').insert(filasNov).then(next).catch(function(){ errores++; next(); });
      }).catch(function(){ errores++; next(); });
    }
    next();
  });
})();

// ══════════════════════════════════════════════════════
//  TENDENCIAS MENSUALES
// ══════════════════════════════════════════════════════
(function(){
  var modal = document.getElementById('modal-tendencias');

  // Poblar selector de años
  var selAnioTend = document.getElementById('tend-anio');
  for(var a=ANIO_FIN_APP; a>=ANIO_INICIO_APP; a--){
    var opt = document.createElement('option');
    opt.value = a; opt.textContent = a + (a===new Date().getFullYear()?' (actual)':'');
    selAnioTend.appendChild(opt);
  }
  selAnioTend.value = new Date().getFullYear();

  document.getElementById('btn-tendencias').addEventListener('click', function(){
    // Poblar grupos
    var selGrupo = document.getElementById('tend-grupo');
    selGrupo.innerHTML = '<option value="">Todos los grupos</option>';
    TODOS_GRUPOS.forEach(function(g){
      var opt = document.createElement('option');
      opt.value = g.id; opt.textContent = g.nombre;
      selGrupo.appendChild(opt);
    });
    modal.showModal();
    cargarTendencias();
  });
  document.getElementById('xtend').addEventListener('click', function(){ modal.close(); });
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.close(); });
  selAnioTend.addEventListener('change', cargarTendencias);
  document.getElementById('tend-grupo').addEventListener('change', cargarTendencias);
  document.getElementById('tend-vista').addEventListener('change', function(){
    var vista = this.value;
    document.getElementById('tend-ctrl-mes').style.display = vista==='mes' ? '' : 'none';
    cargarTendencias();
  });
  document.getElementById('tend-mes-sel').addEventListener('change', cargarTendencias);

  // Inicializar mes con el mes actual
  (function(){
    var mesActualStr = String(new Date().getMonth()+1).padStart(2,'0');
    var selMes = document.getElementById('tend-mes-sel');
    if(selMes) selMes.value = mesActualStr;
  })();

  function cargarTendencias(){
    var anio = parseInt(selAnioTend.value);
    var grupoId = document.getElementById('tend-grupo').value;
    var vista = document.getElementById('tend-vista').value;
    var cont = document.getElementById('tend-contenido');
    cont.innerHTML = '<div class="perf-loading">Cargando tendencias…</div>';

    var docsFiltrados = grupoId
      ? TODOS_DOCENTES.filter(function(d){ return (d.grupos||[]).indexOf(grupoId)>=0; })
      : TODOS_DOCENTES;

    if(!docsFiltrados.length){ cont.innerHTML='<div class="perf-empty">Sin docentes para mostrar</div>'; return; }

    // ── Helpers de turno ────────────────────────────────
    // Devuelve 'maniana', 'tarde', 'ambos' o null según el horario del docente en un día
    function getTurnoDoc(horario){
      if(!horario) return null;
      var tieneM = false, tieneT = false;
      Object.keys(horario).forEach(function(dia){
        var val = horario[dia];
        if(!val) return;
        var franjas = Array.isArray(val) ? val : [val];
        franjas.forEach(function(f){
          if(!f || !f.entrada) return;
          var h = parseInt(f.entrada.split(':')[0]);
          var m = parseInt(f.entrada.split(':')[1]||0);
          var min = h*60+m;
          if(min >= 7*60 && min <= 12*60+59) tieneM = true;
          if(min >= 13*60) tieneT = true;
        });
      });
      if(tieneM && tieneT) return 'ambos';
      if(tieneM) return 'maniana';
      if(tieneT) return 'tarde';
      return null;
    }

    // ── Vista por mes específico ─────────────────────────
    if(vista === 'mes'){
      var mesSel = document.getElementById('tend-mes-sel').value;
      var mesStr = anio + '-' + mesSel;
      var mesesNombresCompletos = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      var nomMesSeleccionado = mesesNombresCompletos[parseInt(mesSel)-1];
      var mesNumSel = parseInt(mesSel);

      db.from('novedades').select('*').eq('mes', mesStr)
        .then(function(res){
          var snap = res.data || [];
          var docMap = {};
          docsFiltrados.forEach(function(d){ docMap[d.id] = d; });
          var docIds = new Set(docsFiltrados.map(function(d){ return d.id; }));

          // ── Por día del mes ──────────────────────────────
          var primerDia = new Date(anio, mesNumSel-1, 1);
          var ultimoDia = new Date(anio, mesNumSel, 0);
          var totalDias = ultimoDia.getDate();
          var porDia = {}; // 'YYYY-MM-DD' -> {faltas,otros,presentes,diasHab}

          // Inicializar todos los días hábiles del mes
          var cur = new Date(primerDia);
          while(cur <= ultimoDia){
            var dow = cur.getDay();
            if(dow !== 0 && dow !== 6){
              var fs = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
              if(!esFeriado(fs)){
                // contar cuántos docentes tienen horario ese día
                var docsEse = docsFiltrados.filter(function(d){
                  var diasD = diasConHorario(d.horario||{});
                  return diasD.some(function(x){ return DIA_IDX[x.toLowerCase()]===dow; });
                });
                porDia[fs] = { faltas:0, otros:0, diasHab: docsEse.length };
              }
            }
            cur.setDate(cur.getDate()+1);
          }

          // Acumular novedades por día
          var contadores = {};
          var porDocente = {};
          snap.forEach(function(item){
            if(!docIds.has(item.docente_id)) return;
            if(esFeriado(item.fecha)) return;
            if(item.tipo === 'presente') return;
            contadores[item.tipo] = (contadores[item.tipo]||0)+1;
            if(esFaltaCualquiera(item.tipo)){
              porDocente[item.docente_id] = (porDocente[item.docente_id]||0)+1;
            }
            if(porDia[item.fecha]){
              if(esFaltaCualquiera(item.tipo)) porDia[item.fecha].faltas++;
              else                             porDia[item.fecha].otros++;
            }
          });

          // Calcular presentes por día
          Object.keys(porDia).forEach(function(f){
            porDia[f].presentes = Math.max(0, porDia[f].diasHab - porDia[f].faltas - porDia[f].otros);
          });

          // ── Totales del mes ──────────────────────────────
          var totalFaltas = 0, totalOtros = 0, totalPresentes = 0, totalHab = 0;
          Object.keys(porDia).forEach(function(f){
            totalFaltas    += porDia[f].faltas;
            totalOtros     += porDia[f].otros;
            totalPresentes += porDia[f].presentes;
            totalHab       += porDia[f].diasHab;
          });
          var pctAsis = totalHab>0 ? Math.round((totalPresentes/totalHab)*100) : 100;
          var colPct  = pctAsis>=90?'#16A34A':pctAsis>=75?'#CA8A04':'#DC2626';

          // ── Separación por turno ─────────────────────────
          var turnosDocs = { maniana:[], tarde:[], ambos:[] };
          docsFiltrados.forEach(function(d){
            var t = getTurnoDoc(d.horario||{});
            if(t && turnosDocs[t]) turnosDocs[t].push(d);
          });

          function pctTurno(docsT){
            if(!docsT.length) return null;
            var faltasT = 0, habT = 0;
            docsT.forEach(function(d){
              var fD = porDocente[d.id] || 0;
              faltasT += fD;
              habT    += contarDias(d.horario||{}, primerDia, ultimoDia);
            });
            var presT = Math.max(0, habT - faltasT);
            return habT > 0 ? Math.round((presT/habT)*100) : 100;
          }

          var pctM = pctTurno(turnosDocs.maniana);
          var pctT = pctTurno(turnosDocs.tarde);
          var pctA = pctTurno(turnosDocs.ambos);

          function turnoCard(label, emoji, pct, n, color){
            if(pct === null) return '';
            var col = pct>=90?'#16A34A':pct>=75?'#CA8A04':'#DC2626';
            return '<div class="tend-turno-card">'+
              '<div class="tend-turno-top">'+
                '<span class="tend-turno-emoji">'+emoji+'</span>'+
                '<span class="tend-turno-lbl">'+label+'</span>'+
                '<span class="tend-turno-n" style="color:var(--muted)">'+n+' doc.</span>'+
              '</div>'+
              '<div class="tend-turno-barra-wrap">'+
                '<div class="tend-turno-barra" style="width:'+pct+'%;background:'+col+'"></div>'+
              '</div>'+
              '<div class="tend-turno-pct" style="color:'+col+'">'+pct+'% asistencia</div>'+
            '</div>';
          }

          // ── Gráfico de barras diarias ────────────────────
          var diasOrdenados = Object.keys(porDia).sort();
          var maxTotalDia = 1;
          diasOrdenados.forEach(function(f){
            var tot = porDia[f].diasHab;
            if(tot > maxTotalDia) maxTotalDia = tot;
          });

          var hoyActual = hoyStr();
          var anioActualReal = new Date().getFullYear();
          var mesActualReal  = new Date().getMonth()+1;

          var chartHTML = '<div class="tend-chart tend-chart-mes">';
          diasOrdenados.forEach(function(f){
            var d = porDia[f];
            var fechaObj = new Date(f+'T12:00:00');
            var numDia   = fechaObj.getDate();
            var dowIdx   = fechaObj.getDay();
            var diasAbr  = ['Do','Lu','Ma','Mi','Ju','Vi','Sa'];
            var total = d.diasHab;
            var barP = maxTotalDia>0 ? Math.round((d.presentes/maxTotalDia)*100) : 0;
            var barO = maxTotalDia>0 ? Math.round((d.otros/maxTotalDia)*100) : 0;
            var barF = maxTotalDia>0 ? Math.round((d.faltas/maxTotalDia)*100) : 0;
            var esFuturo = f > hoyActual;
            var esHoy    = f === hoyActual;
            var pctPresF = total>0 ? Math.round((d.presentes/total)*100) : 0;
            var pctFaltF = total>0 ? Math.round((d.faltas/total)*100) : 0;

            chartHTML += '<div class="tend-mes tend-dia'+(esHoy?' tend-dia-hoy':'')+(esFuturo?' tend-futuro':'')+'">'+
              '<div class="tend-barras tend-barras-apil">'+
                (barP>0?'<div class="tend-seg-p" style="height:'+barP+'%" title="'+d.presentes+' presentes ('+pctPresF+'%)"></div>':'')+
                (barO>0?'<div class="tend-seg-o" style="height:'+barO+'%" title="'+d.otros+' otros registros"></div>':'')+
                (barF>0?'<div class="tend-seg-f" style="height:'+barF+'%" title="'+d.faltas+' faltas ('+pctFaltF+'%)"></div>':'')+
              '</div>'+
              '<div class="tend-valores">'+
                (d.faltas>0?'<span class="tend-val-faltas" style="color:#DC2626;font-size:.6rem">'+d.faltas+'</span>':'')+
              '</div>'+
              '<div class="tend-mes-lbl" style="font-size:.58rem;line-height:1.1">'+
                (esHoy?'<span class="tend-fut-dot" style="background:#2563EB"></span>':'')+
                (esFuturo?'<span class="tend-fut-dot"></span>':'')+
                '<span>'+numDia+'</span>'+
                '<span style="color:var(--muted)">'+diasAbr[dowIdx]+'</span>'+
              '</div>'+
            '</div>';
          });
          chartHTML += '</div>';

          // ── Armar HTML final ─────────────────────────────
          var html = '<div class="tend-info-ciclo">Datos de <strong>'+nomMesSeleccionado+' '+anio+'</strong></div>';

          // Resumen global
          html += '<div class="tend-resumen" style="margin-bottom:1rem">'+
            '<div class="tend-res-item"><span class="tend-res-n" style="color:'+colPct+'">'+pctAsis+'%</span><span class="tend-res-l">Asistencia del mes</span></div>'+
            '<div class="tend-res-item"><span class="tend-res-n" style="color:#DC2626">'+totalFaltas+'</span><span class="tend-res-l">Faltas en el mes</span></div>'+
            '<div class="tend-res-item"><span class="tend-res-n" style="color:#CA8A04">'+totalOtros+'</span><span class="tend-res-l">Otros registros</span></div>'+
            '<div class="tend-res-item"><span class="tend-res-n" style="color:#16A34A">'+totalPresentes+'</span><span class="tend-res-l">Días presentes</span></div>'+
          '</div>';

          // Gráfico diario
          html += chartHTML;
          html += '<div class="tend-leyenda">'+
            '<span class="tend-ley-item"><span class="tend-ley-dot" style="background:#16A34A"></span>Presentes</span>'+
            '<span class="tend-ley-item"><span class="tend-ley-dot" style="background:#FDE68A"></span>Otros</span>'+
            '<span class="tend-ley-item"><span class="tend-ley-dot" style="background:#DC2626"></span>Faltas</span>'+
          '</div>';

          // Turnos
          var hayTurnos = turnosDocs.maniana.length || turnosDocs.tarde.length || turnosDocs.ambos.length;
          if(hayTurnos){
            html += '<div class="tend-seccion-titulo">Asistencia por turno</div>';
            html += '<div class="tend-turnos-wrap">'+
              turnoCard('Turno mañana','Man.', pctM, turnosDocs.maniana.length, '#F59E0B')+
              turnoCard('Turno tarde','Tar.', pctT, turnosDocs.tarde.length, '#8B5CF6')+
              turnoCard('Ambos turnos','Amb.', pctA, turnosDocs.ambos.length, '#0EA5E9')+
            '</div>';
          }

          // Detalle por tipo
          var tiposOrdenados = Object.keys(contadores).filter(function(t){ return t!=='presente'; }).sort(function(a,b){ return (esFaltaCualquiera(b)?1:0)-(esFaltaCualquiera(a)?1:0); });
          if(tiposOrdenados.length){
            html += '<div class="tend-seccion-titulo">Detalle de registros</div>';
            html += '<div class="tend-mes-tipos">'+tiposOrdenados.map(function(t){
              var color = esFaltaCualquiera(t) ? '#DC2626' : '#CA8A04';
              return '<div class="tend-mes-tipo-item"><span style="color:'+color+';font-weight:700">'+contadores[t]+'</span> '+(LABELS[t]||t)+'</div>';
            }).join('')+'</div>';
          }

          // Ranking
          var rankingItems = docsFiltrados
            .filter(function(d){ return porDocente[d.id]; })
            .map(function(d){
              var nd = (d.apellido&&d.apellido.trim()) ? d.apellido.trim().toUpperCase()+', '+d.nombre : d.nombre;
              return {nombre:nd, cargo:d.cargo||'', faltas:porDocente[d.id], turno:getTurnoDoc(d.horario||{})};
            })
            .sort(function(a,b){ return b.faltas-a.faltas; });

          var turnoEmoji = { maniana:'M', tarde:'T', ambos:'A' };
          html += '<div class="tend-seccion-titulo">Ranking de ausentismo</div>';
          html += '<div class="tend-rank-lista">'+
            (rankingItems.length ? rankingItems.slice(0,10).map(function(r,i){
              return '<div class="tend-rank-item">'+
                '<span class="tend-rank-pos">'+(i+1)+'°</span>'+
                (r.turno?'<span style="font-size:.8rem" title="Turno">'+turnoEmoji[r.turno]+'</span>':'')+
                '<span class="tend-rank-nom">'+r.nombre+(r.cargo?' <small style="color:#9CA3AF">'+r.cargo+'</small>':'')+'</span>'+
                '<span class="tend-rank-faltas" style="color:#DC2626">'+r.faltas+' falta'+(r.faltas!==1?'s':'')+'</span>'+
              '</div>';
            }).join('') :
            '<p style="color:#9CA3AF;font-size:.82rem;text-align:center;padding:1rem">Sin faltas registradas en este mes</p>')+
          '</div>';

          cont.innerHTML = html;
        }).catch(function(err){ cont.innerHTML='<p style="color:#DC2626;padding:1rem">Error: '+err.message+'</p>'; });
      return;
    }

    // Determinar rango del ciclo lectivo para este año
    var cicloInicioStr = CONFIG.cicloInicio.replace(/^\d{4}/, String(anio));
    var cicloFinStr    = CONFIG.cicloFin.replace(/^\d{4}/, String(anio));
    var cicloMesInicio = parseInt(cicloInicioStr.slice(5,7)); // mes número
    var cicloMesFin    = parseInt(cicloFinStr.slice(5,7));

    db.from('novedades').select('*')
      .gte('mes', anio+'-'+String(cicloMesInicio).padStart(2,'0'))
      .lte('mes', anio+'-'+String(cicloMesFin).padStart(2,'0'))
      .then(function(res){
        var snap = res.data || [];
        var docIds = new Set(docsFiltrados.map(function(d){ return d.id; }));
        var porMes = {};
        // Solo crear entradas para los meses del ciclo lectivo
        for(var m=cicloMesInicio; m<=cicloMesFin; m++){
          var key = anio+'-'+String(m).padStart(2,'0');
          porMes[key] = { faltas:0, otros:0, numMes:m };
        }

        snap.forEach(function(item){
          if(!docIds.has(item.docente_id)) return;
          if(esFeriado(item.fecha)) return;
          if(item.tipo === 'presente') return;
          var mes = item.mes;
          if(!porMes[mes]) return;
          if(esFaltaCualquiera(item.tipo)){
            porMes[mes].faltas++;
          } else if(item.tipo!=='presente'){
            porMes[mes].otros++;
            if(!porMes[mes].otrosTipos) porMes[mes].otrosTipos={};
            porMes[mes].otrosTipos[item.tipo]=(porMes[mes].otrosTipos[item.tipo]||0)+1;
          }
        });

        var mesesNombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        var maxFaltas = 1;
        var mesActual = new Date().getMonth()+1;
        var anioActualReal = new Date().getFullYear();

        Object.keys(porMes).forEach(function(mes){
          if(porMes[mes].faltas > maxFaltas) maxFaltas = porMes[mes].faltas;
        });

        // Calcular presentes por mes (días hábiles del mes - novedades)
        var docsFiltradosIds = new Set(docsFiltrados.map(function(d){ return d.id; }));

        // Para cada mes del ciclo, contar días hábiles totales de los docentes filtrados
        Object.keys(porMes).sort().forEach(function(mes){
          var numMes = parseInt(mes.slice(5));
          var anioMes = parseInt(mes.slice(0,4));
          var primerDia = new Date(anioMes, numMes-1, 1);
          var ultimoDia = new Date(anioMes, numMes, 0);
          var diasHabMes = 0;
          docsFiltrados.forEach(function(doc){
            diasHabMes += contarDias(doc.horario||{}, primerDia, ultimoDia);
          });
          var totalNovedadesMes = porMes[mes].faltas + porMes[mes].otros;
          porMes[mes].presentes = Math.max(0, diasHabMes - totalNovedadesMes);
          porMes[mes].diasHab = diasHabMes;
        });

        var maxTotal = 1;
        Object.keys(porMes).forEach(function(mes){
          var tot = (porMes[mes].presentes||0) + porMes[mes].faltas + porMes[mes].otros;
          if(tot > maxTotal) maxTotal = tot;
        });

        var html = '<div class="tend-info-ciclo">Ciclo lectivo: <strong>'+cicloInicioStr+' → '+cicloFinStr+'</strong></div>';
        html += '<div class="tend-chart">';

        Object.keys(porMes).sort().forEach(function(mes){
          var numMes = parseInt(mes.slice(5));
          var d = porMes[mes];
          var esFuturo = anio > anioActualReal || (anio===anioActualReal && numMes > mesActual);
          var total = (d.presentes||0) + d.faltas + d.otros;
          var pctP = total>0 ? Math.round(((d.presentes||0)/total)*100) : 0;
          var pctF = total>0 ? Math.round((d.faltas/total)*100) : 0;
          var pctO = total>0 ? Math.round((d.otros/total)*100) : 0;
          // Barras apiladas en base al máximo total
          var barP = maxTotal>0 ? Math.round(((d.presentes||0)/maxTotal)*100) : 0;
          var barF = maxTotal>0 ? Math.round((d.faltas/maxTotal)*100) : 0;
          var barO = maxTotal>0 ? Math.round((d.otros/maxTotal)*100) : 0;

          // Build tooltip for yellow bar safely
          var tooltipOtros = d.otros + ' otros registros';
          if(d.otrosTipos && Object.keys(d.otrosTipos).length){
            tooltipOtros += ' (' + Object.keys(d.otrosTipos).map(function(t){
              return (LABELS_SHORT[t]||t) + ': ' + d.otrosTipos[t];
            }).join(', ') + ')';
          }

          html += '<div class="tend-mes'+(esFuturo?' tend-futuro':'')+'">'+
            '<div class="tend-barras tend-barras-apil">'+
              (barP>0?'<div class="tend-seg-p" style="height:'+barP+'%" title="'+d.presentes+' presentes ('+pctP+'%)"></div>':'')+
              (barO>0?'<div class="tend-seg-o tend-seg-o-click" style="height:'+barO+'%" title="'+tooltipOtros.replace(/"/g,'&quot;')+'"></div>':'')+
              (barF>0?'<div class="tend-seg-f" style="height:'+barF+'%" title="'+d.faltas+' faltas ('+pctF+'%)"></div>':'')+
            '</div>'+
            '<div class="tend-valores">'+
              (d.faltas>0?'<span class="tend-val-faltas" style="color:#DC2626">'+d.faltas+'</span>':'')+
              (d.otros>0?'<span class="tend-val-otros" style="color:#CA8A04">'+d.otros+'</span>':'')+
            '</div>'+
            '<div class="tend-mes-lbl">'+(esFuturo?'<span class="tend-fut-dot"></span>':'')+mesesNombres[numMes-1]+'</div>'+
          '</div>';
        });
        html += '</div>';
        // Leyenda
        html += '<div class="tend-leyenda">'+
          '<span class="tend-ley-item"><span class="tend-ley-dot" style="background:#16A34A"></span>Presentes</span>'+
          '<span class="tend-ley-item"><span class="tend-ley-dot" style="background:#FDE68A"></span>Otros registros</span>'+
          '<span class="tend-ley-item"><span class="tend-ley-dot" style="background:#DC2626"></span>Faltas</span>'+
        '</div>';

        // Resumen — solo meses ya transcurridos del ciclo
        var mesesPasados = Object.keys(porMes).sort().filter(function(m){
          var nm = parseInt(m.slice(5));
          return anio < anioActualReal || (anio===anioActualReal && nm <= mesActual);
        });
        var totalFaltas  = mesesPasados.reduce(function(s,m){ return s+porMes[m].faltas; },0);
        var totalOtros   = mesesPasados.reduce(function(s,m){ return s+porMes[m].otros;  },0);
        var totalPres    = mesesPasados.reduce(function(s,m){ return s+(porMes[m].presentes||0); },0);
        var totalDiasHab = totalPres + totalFaltas;
        var pctCiclo     = totalDiasHab>0 ? Math.round((totalPres/totalDiasHab)*100) : 100;
        var colPct       = pctCiclo>=90?'#16A34A':pctCiclo>=75?'#CA8A04':'#DC2626';

        // ── Análisis por mes ──────────────────────────────
        var mesesConFaltas = mesesPasados.filter(function(m){ return porMes[m].faltas>0; });

        // Mes con más faltas (el máximo)
        var mesPeor = mesesConFaltas.length
          ? mesesConFaltas.reduce(function(a,b){ return porMes[b].faltas > porMes[a].faltas ? b : a; })
          : null;

        // Mes con menos faltas: entre los meses con datos, el de menor cantidad, distinto al peor
        var mesMejor = null;
        if(mesesPasados.length > 1 && mesPeor) {
          // Candidatos: meses distintos al peor
          var candidatosMejor = mesesPasados.filter(function(m){ return m !== mesPeor; });
          if(candidatosMejor.length) {
            mesMejor = candidatosMejor.reduce(function(a,b){
              return porMes[a].faltas <= porMes[b].faltas ? a : b;
            });
          }
        }

        // Tendencia: comparar último mes con el anterior
        var tendenciaHTML = '';
        if(mesesPasados.length >= 2){
          var ultMes = mesesPasados[mesesPasados.length-1];
          var antMes = mesesPasados[mesesPasados.length-2];
          var diff   = porMes[ultMes].faltas - porMes[antMes].faltas;
          var nomUlt = mesesNombres[parseInt(ultMes.slice(5))-1];
          if(diff > 0)      tendenciaHTML = '<div class="tend-res-item"><span class="tend-res-n" style="color:#DC2626">▲ +'+diff+'</span><span class="tend-res-l">Tendencia en '+nomUlt+'</span></div>';
          else if(diff < 0) tendenciaHTML = '<div class="tend-res-item"><span class="tend-res-n" style="color:#16A34A">▼ '+diff+'</span><span class="tend-res-l">Tendencia en '+nomUlt+'</span></div>';
          else              tendenciaHTML = '<div class="tend-res-item"><span class="tend-res-n" style="color:#6B7280">= 0</span><span class="tend-res-l">Tendencia en '+nomUlt+'</span></div>';
        }

        // ── Armar detalle de otros registros del ciclo completo ──
        var otrosTotales = {};
        mesesPasados.forEach(function(m){
          if(porMes[m].otrosTipos){
            Object.keys(porMes[m].otrosTipos).forEach(function(t){
              otrosTotales[t] = (otrosTotales[t]||0) + porMes[m].otrosTipos[t];
            });
          }
        });
        var detOtrosCiclo = Object.keys(otrosTotales)
          .map(function(t){ return (LABELS_SHORT[t]||t)+': '+otrosTotales[t]; }).join(', ');

        html += '<div class="tend-resumen">'+
          '<div class="tend-res-item"><span class="tend-res-n" style="color:'+colPct+'">'+pctCiclo+'%</span><span class="tend-res-l">Asistencia del ciclo</span></div>'+
          '<div class="tend-res-item"><span class="tend-res-n" style="color:#DC2626">'+totalFaltas+'</span><span class="tend-res-l">Faltas en el ciclo</span></div>'+
          '<div class="tend-res-item tend-res-wide"><span class="tend-res-n" style="color:#CA8A04">'+totalOtros+'</span><span class="tend-res-l">Otros registros'+(detOtrosCiclo?' <span style="font-size:.68rem;color:#9CA3AF">('+detOtrosCiclo+')</span>':'')+'</span></div>'+
          (mesesPasados.length>1?'<div class="tend-res-item"><span class="tend-res-n" style="color:#94A3B8">'+(Math.round(totalFaltas/mesesPasados.length*10)/10)+'</span><span class="tend-res-l">Promedio por mes</span></div>':'')+
          (mesPeor ? '<div class="tend-res-item"><span class="tend-res-n" style="color:#DC2626">'+mesesNombres[parseInt(mesPeor.slice(5))-1]+'</span><span class="tend-res-l">Mes con más faltas ('+porMes[mesPeor].faltas+')</span></div>' : '')+
          (mesMejor ? '<div class="tend-res-item"><span class="tend-res-n" style="color:#16A34A">'+mesesNombres[parseInt(mesMejor.slice(5))-1]+'</span><span class="tend-res-l">Mes con menos faltas ('+porMes[mesMejor].faltas+')</span></div>' : '')+
          tendenciaHTML+
        '</div>';

        cont.innerHTML = html;
      }).catch(function(err){ cont.innerHTML='<p style="color:#DC2626;padding:1rem">Error: '+err.message+'</p>'; });
  }
})();

// ══════════════════════════════════════════════════════
//  RANKING ANUAL ACUMULADO — Opción "año completo" en ranking existente
// ══════════════════════════════════════════════════════
// El ranking ya tiene opción "Por año" — mejoramos su visualización
// para mostrar el acumulado anual con barras de tendencia por mes

// ══════════════════════════════════════════════════════
//  MODAL JUBILADOS
// ══════════════════════════════════════════════════════
(function(){
  var btn = document.getElementById('btn-jubilados');
  var modal = document.getElementById('modal-jubilados');
  if(!btn || !modal) return;

  btn.addEventListener('click', function(){
    // cerrar dropdown si está abierto
    var ddList = document.getElementById('hdr-dropdown-list');
    if(ddList) ddList.classList.remove('open');
    abrirJubilados();
  });

  document.getElementById('xjubilados').addEventListener('click', function(){ modal.close(); });
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.close(); });

  window.abrirJubilados = function(){
    var lista = document.getElementById('jubilados-lista');
    lista.innerHTML = '';

    if(!TODOS_JUBILADOS.length){
      lista.innerHTML = '<div class="perf-empty" style="padding:2rem;text-align:center;color:var(--muted)">'+
        '<div style="font-size:2rem;margin-bottom:.5rem">🏅</div>'+
        '<p>No hay docentes jubilados registrados.</p></div>';
      modal.showModal();
      return;
    }

    TODOS_JUBILADOS.forEach(function(doc){
      var div = document.createElement('div');
      div.className = 'jub-item';

      // Armar info de horario resumida
      var diasTrabaja = diasConHorario(doc.horario||{});
      var horarioRes = diasTrabaja.length
        ? diasTrabaja.map(function(d){ return d.charAt(0).toUpperCase()+d.slice(1,3); }).join(', ')
        : 'Sin horario';

      div.innerHTML =
        '<div class="jub-info">'+
          '<div class="jub-nombre">'+doc.nombre+' <span class="badge-jubilado">🏅 Jubilado/a</span></div>'+
          '<div class="jub-cargo">'+(doc.cargo||'—')+(doc.materias?' · '+doc.materias:'')+'</div>'+
          '<div class="jub-detalle">'+horarioRes+'</div>'+
        '</div>'+
        '<div class="jub-acciones">'+
          '<button class="btn-card btn-card-hist jub-btn-perfil">'+
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Perfil'+
          '</button>'+
          (esFull()?
            '<button class="btn-card btn-card-edit jub-btn-editar">✏️ Editar</button>':
          '')+
        '</div>';

      div.querySelector('.jub-btn-perfil').addEventListener('click', function(){
        modal.close();
        abrirPerfil(doc);
      });
      if(esFull()){
        div.querySelector('.jub-btn-editar').addEventListener('click', function(){
          modal.close();
          abrirDocente(doc);
        });
      }
      lista.appendChild(div);
    });

    modal.showModal();
  };
})();
// ══════════════════════════════════════════════════════
//  MIGRACIÓN MASIVA DE APELLIDOS
// ══════════════════════════════════════════════════════
(function(){
  var modal = document.getElementById('modal-migrar-apellidos');
  var btnAbrir = document.getElementById('btn-migrar-apellidos');
  if(!modal || !btnAbrir) return;

  document.getElementById('xmigrar').addEventListener('click', function(){ modal.close(); });
  document.getElementById('migrar-cancelar').addEventListener('click', function(){ modal.close(); });
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.close(); });

  btnAbrir.addEventListener('click', function(){
    var ddList = document.getElementById('hdr-dropdown-list');
    if(ddList) ddList.classList.remove('open');
    abrirMigrarApellidos();
  });

  function sugerirApellido(nombre){
    var partes = (nombre||'').trim().split(/\s+/);
    return partes.length > 1 ? partes[partes.length-1] : (partes[0]||'');
  }

  function abrirMigrarApellidos(){
    var lista = document.getElementById('migrar-lista');
    var count = document.getElementById('migrar-count');
    lista.innerHTML = '<div style="color:#9CA3AF;text-align:center;padding:2rem">Cargando…</div>';
    document.getElementById('migrar-guardar').disabled = true;
    modal.showModal();

    // Cargar todos los docentes de todos los niveles en paralelo
    // Usar TODOS_DOCENTES + TODOS_JUBILADOS que ya están en memoria
    var todos = (window.TODOS_DOCENTES||[]).concat(window.TODOS_JUBILADOS||[]);
    var sinApellido = todos.filter(function(d){ return !d.apellido || !d.apellido.trim(); });

    if(!sinApellido.length){
      lista.innerHTML = '<div style="text-align:center;padding:2rem;color:#16A34A;font-size:.9rem">✅ Todos los docentes ya tienen apellido cargado.</div>';
      count.textContent = 'Sin pendientes';
      return;
    }

    // Ordenar por nivel para claridad visual
    var nivelOrd = {secundaria:0, primaria:1, inicial:2};
    sinApellido.sort(function(a,b){
      var nA = nivelOrd[a.nivel||'secundaria']||0;
      var nB = nivelOrd[b.nivel||'secundaria']||0;
      if(nA!==nB) return nA-nB;
      return (a.nombre||'').localeCompare(b.nombre||'','es');
    });

    count.textContent = sinApellido.length + ' docente' + (sinApellido.length!==1?'s':'')+' sin apellido';
    document.getElementById('migrar-guardar').disabled = false;

    lista.innerHTML = '';
    var nivelActual = '';
    var nivelLabels = {secundaria:'Secundaria', primaria:'Primaria', inicial:'Inicial'};

    sinApellido.forEach(function(doc){
      var nivel = doc.nivel || 'secundaria';
      // Separador de nivel
      if(nivel !== nivelActual){
        nivelActual = nivel;
        var sep = document.createElement('div');
        sep.style.cssText = 'font-size:.75rem;font-weight:700;color:var(--nivel-color,#4F46E5);padding:.5rem .2rem .2rem;letter-spacing:.05em;text-transform:uppercase';
        sep.textContent = nivelLabels[nivel]||nivel;
        lista.appendChild(sep);
      }
      var sugerido = sugerirApellido(doc.nombre||'');
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:.7rem;padding:.4rem .2rem;border-bottom:1px solid var(--border)';
      row.dataset.id = doc.id;
      row.innerHTML =
        '<div style="flex:1.5;font-size:.85rem;font-weight:600;color:var(--primary)">'+
          (doc.nombre||'—')+
          '<span style="font-size:.7rem;font-weight:400;color:#9CA3AF;display:block">'+(doc.cargo||'')+'</span>'+
        '</div>'+
        '<div style="flex:1;display:flex;flex-direction:column;gap:.15rem">'+
          '<label style="font-size:.68rem;color:var(--muted)">Apellido sugerido — corregí si hace falta</label>'+
          '<input class="migrar-apellido-input" type="text" value="'+sugerido.replace(/"/g,'&quot;')+'"'+
            ' placeholder="Escribí el apellido"'+
            ' style="border:1.5px solid var(--border);border-radius:8px;padding:.32rem .6rem;font-size:.85rem;color:var(--primary);outline:none;width:100%;transition:border-color .15s"'+
            '/>'+
        '</div>';
      lista.appendChild(row);
    });
  }

  document.getElementById('migrar-guardar').addEventListener('click', function(){
    var btn = this;
    var rows = document.querySelectorAll('#migrar-lista [data-id]');
    if(!rows.length) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Guardando…';

    // Una sola tabla 'docentes' — actualizar cada fila individualmente
    var items = [];
    rows.forEach(function(row){
      var id = row.dataset.id;
      var apellidoVal = (row.querySelector('.migrar-apellido-input')||{value:''}).value.trim();
      if(!apellidoVal) return;
      items.push({id:id, apellido:apellidoVal});
    });

    var ops = items.map(function(item){
      return db.from('docentes').update({apellido:item.apellido}).eq('id', item.id);
    });

    var total = items.length;

    Promise.all(ops).then(function(){
      toast('✅ ' + total + ' apellido' + (total!==1?'s':'') + ' guardado' + (total!==1?'s':''));
      modal.close();
      cargarYRender();
    }).catch(function(err){
      toast('Error: ' + err.message, 5000);
      btn.disabled = false; btn.textContent = 'Guardar todos';
    });
  });
})();

// ╔══════════════════════════════════════════════════════╗
// ║  FEATURE 1 — LEGAJO DIGITAL                         ║
// ║  Referencia de trámite + adjunto por novedad         ║
// ╚══════════════════════════════════════════════════════╝

// Abre el modal de legajo para una novedad específica
function abrirLegajo(novedadId, docenteNombre, tipoNovedad, fechaNovedad){
  var modal = document.getElementById('modal-legajo');
  if(!modal) return;

  // Reset
  document.getElementById('leg-referencia').value = '';
  document.getElementById('leg-comentario-ext').value = '';
  document.getElementById('leg-matricula').value = '';
  document.getElementById('leg-medico-nombre').value = '';
  document.getElementById('leg-file-input').value = '';
  document.getElementById('leg-file-nombre').textContent = '';
  document.getElementById('leg-file-preview').style.display = 'none';
  document.getElementById('leg-adjunto-actual').innerHTML = '';
  document.getElementById('leg-novedadId').value = novedadId;

  // Mostrar campo matrícula solo para tipos médicos
  var TIPOS_MEDICOS = ['medica','medica_familiar','carpeta_psiq'];
  document.getElementById('leg-matricula-field').style.display =
    TIPOS_MEDICOS.indexOf(tipoNovedad) >= 0 ? '' : 'none';

  // Título
  var fObj = new Date(fechaNovedad+'T12:00:00');
  var fStr = fObj.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});
  document.getElementById('leg-tit').textContent = docenteNombre;
  document.getElementById('leg-sub').textContent = (LABELS[tipoNovedad]||tipoNovedad) + ' — ' + fStr;

  // Cargar datos existentes de Firestore
  var btnGuardar = document.getElementById('leg-guardar');
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Cargando…';

  db.from('novedades').select('*').eq('id', novedadId).maybeSingle().then(function(res){
    var data = res.data || {};
    document.getElementById('leg-referencia').value = data.referencia || '';
    document.getElementById('leg-comentario-ext').value = data.comentarioExt || '';
    document.getElementById('leg-matricula').value = data.matriculaMedico || '';
    document.getElementById('leg-medico-nombre').value = data.medicoNombre || '';
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar';

    // Mostrar adjunto existente
    var adjDiv = document.getElementById('leg-adjunto-actual');
    if(data.adjuntoURL){
      adjDiv.innerHTML =
        '<div class="leg-adjunto-existente">'+
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>'+
          '<a href="'+data.adjuntoURL+'" target="_blank" rel="noopener" class="leg-adjunto-link">'+
            (data.adjuntoNombre||'Archivo adjunto')+
          '</a>'+
          '<button class="leg-adjunto-del" data-id="'+novedadId+'" title="Quitar adjunto">'+
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'+
          '</button>'+
        '</div>';
      adjDiv.querySelector('.leg-adjunto-del').addEventListener('click', function(){
        if(!confirm('¿Quitar el adjunto?')) return;
        db.from('novedades').update({ adjuntoURL: null, adjuntoNombre: null }).eq('id', novedadId)
          .then(function(){ adjDiv.innerHTML=''; toast('Adjunto eliminado'); });
      });
    }
  }).catch(function(){
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar';
  });

  // Botón "Ver otros con esta matrícula" — solo para tipos médicos
  var TIPOS_MEDICOS_LEG = ['medica','medica_familiar','carpeta_psiq'];
  var btnVerMat = document.getElementById('leg-ver-matricula');
  if(TIPOS_MEDICOS_LEG.indexOf(tipoNovedad) >= 0){
    if(!btnVerMat){
      btnVerMat = document.createElement('button');
      btnVerMat.id = 'leg-ver-matricula';
      btnVerMat.className = 'btn-sec';
      btnVerMat.style.cssText = 'font-size:.78rem';
      btnVerMat.textContent = '🔍 Ver otros registros de este médico';
      document.querySelector('#modal-legajo .dlg-footer > div:first-child').appendChild(btnVerMat);
    }
    btnVerMat.style.display = '';
    btnVerMat.onclick = function(){
      var mat = document.getElementById('leg-matricula').value.trim();
      if(!mat){ toast('Ingresá primero la matrícula del médico',2500); return; }
      document.getElementById('modal-legajo').close();
      abrirMatriculas(mat);
    };
  } else {
    if(btnVerMat) btnVerMat.style.display = 'none';
  }

  modal.showModal();
}

// Guardar legajo
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var modal = document.getElementById('modal-legajo');
    if(!modal) return;

    document.getElementById('xleg').addEventListener('click', function(){ modal.close(); });
    document.getElementById('leg-cancelar').addEventListener('click', function(){ modal.close(); });
    modal.addEventListener('click', function(e){ if(e.target===modal) modal.close(); });

    // Preview del archivo seleccionado
    document.getElementById('leg-file-input').addEventListener('change', function(){
      var file = this.files[0];
      var preview = document.getElementById('leg-file-preview');
      var nombre = document.getElementById('leg-file-nombre');
      if(file){
        nombre.textContent = file.name + ' (' + (file.size/1024).toFixed(0) + ' KB)';
        preview.style.display = 'flex';
      } else {
        preview.style.display = 'none';
      }
    });

    document.getElementById('leg-guardar').addEventListener('click', function(){
      var btn = this;
      var novedadId = document.getElementById('leg-novedadId').value;
      if(!novedadId) return;

      var referencia = document.getElementById('leg-referencia').value.trim();
      var comentarioExt = document.getElementById('leg-comentario-ext').value.trim();
      var matriculaMedico = document.getElementById('leg-matricula').value.trim();
      var medicoNombre = document.getElementById('leg-medico-nombre').value.trim();
      var file = document.getElementById('leg-file-input').files[0];

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Guardando…';

      function guardarDatos(adjuntoURL, adjuntoNombre){
        var upd = {};
        upd.referencia       = referencia       || null;
        upd.comentarioExt    = comentarioExt    || null;
        upd.matriculaMedico  = matriculaMedico  || null;
        upd.medicoNombre     = medicoNombre     || null;
        if(adjuntoURL)       upd.adjuntoURL       = adjuntoURL;
        if(adjuntoNombre)    upd.adjuntoNombre    = adjuntoNombre;

        db.from('novedades').update(upd).eq('id', novedadId)
          .then(function(res){
            if(res.error) throw res.error;
            toast('✅ Legajo guardado');
            modal.close();
            // Refrescar historial si está abierto
            if(docPerfil) cargarHistorial();
          })
          .catch(function(err){ toast('Error: '+err.message, 5000); })
          .finally(function(){ btn.disabled=false; btn.textContent='Guardar'; });
      }

      if(file){
        var path = novedadId+'_'+Date.now()+'_'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
        btn.innerHTML = '<span class="spinner"></span> Subiendo…';
        db.storage.from('legajos').upload(path, file, {upsert:true}).then(function(res){
          if(res.error) throw res.error;
          var pub = db.storage.from('legajos').getPublicUrl(path);
          guardarDatos(pub.data.publicUrl, file.name);
        }).catch(function(err){
          // Si falla el storage (ej: bucket no creado), igual guardar los campos de texto
          toast('⚠️ No se pudo subir el archivo, se guardó solo el texto.', 4000);
          guardarDatos(null, null);
        });
      } else {
        guardarDatos(null, null);
      }
    });
  });
})();

// Agregar botón legajo al historial de perfil — parchar renderHistorial
var _origCargarHistorial = typeof cargarHistorial === 'function' ? cargarHistorial : null;
// Se parchea desde el render del historial — ver más abajo en renderHistorialConLegajo


// ╔══════════════════════════════════════════════════════╗
// ║  FEATURE 2 — ALERTAS DE VENCIMIENTO                 ║
// ╚══════════════════════════════════════════════════════╝

// Días de antelación para alertar
var ALERTA_DIAS_ANTES = 7;

// Tipos con duración que pueden tener fecha de vencimiento
var TIPOS_CON_VENCIMIENTO = ['lic_embarazo','lic_gremial','carpeta_psiq','medica','medica_familiar','duelo','paro'];

var _alertas = []; // cache de alertas activas

function calcularAlertas(docs, novedadesSnap, novLargas){
  var hoy     = new Date(hoyStr()+'T12:00:00');
  var hoyISO  = hoyStr();
  var alertas = [];
  var novedadesArray = novedadesSnap || [];

  // 1) Novedades con durVence explícito: solo las que vencen HOY o en los próximos
  //    ALERTA_DIAS_ANTES días. Si ya vencieron (< hoy) NO aparecen.
  novedadesArray.forEach(function(novData){
    if(!novData.durVence) return;
    if(TIPOS_CON_VENCIMIENTO.indexOf(novData.tipo) < 0) return;
    var vence    = new Date(novData.durVence+'T12:00:00');
    var diffDias = Math.round((vence - hoy) / 86400000);
    if(diffDias < 0) return;                   // ya caducó → fuera
    if(diffDias > ALERTA_DIAS_ANTES) return;   // todavía lejano → fuera

    var doc = docs.find(function(d){ return d.id === novData.docenteId; });
    if(!doc || doc.jubilado) return;

    var nombreDisplay = (doc.apellido&&doc.apellido.trim())
      ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido)
      : doc.nombre;

    alertas.push({
      docenteId:    novData.docenteId,
      docenteNombre: nombreDisplay,
      tipo:         novData.tipo,
      fecha:        novData.fecha,
      durVence:     novData.durVence,
      diffDias:     diffDias,
      novedadId:    novData._id,
      esVencimiento: true
    });
  });

  // 2) Tratamientos largos (10+ días corridos)
  //    Condiciones para aparecer:
  //      a) La novedad MÁS ANTIGUA del tipo para ese docente tiene 10+ días
  //      b) El docente HOY sigue con ese mismo estado (tratamiento activo)
  //      c) No tiene durVence ya cargado (para no duplicar)
  if(novLargas && novLargas.length){

    // Agrupar por (docenteId + tipo) → quedarse con la fecha MÁS ANTIGUA
    // para calcular desde cuándo arrancó el tratamiento real
    var porDocenteTipo = {};
    novLargas.forEach(function(nv){
      var key = nv.docenteId + '_' + nv.tipo;
      if(!porDocenteTipo[key] || nv.fecha < porDocenteTipo[key].fecha){
        porDocenteTipo[key] = nv;
      }
    });

    Object.keys(porDocenteTipo).forEach(function(key){
      var nv  = porDocenteTipo[key];
      var doc = docs.find(function(d){ return d.id === nv.docenteId; });
      if(!doc || doc.jubilado) return;

      // FILTRO CLAVE: el docente debe tener ESE MISMO TIPO como estado hoy.
      // Si estadoHoy está vacío o es 'presente', el tratamiento terminó → no mostrar.
      if(doc.estadoHoy !== nv.tipo) return;

      // Calcular días desde el primer registro de ese tipo
      var inicio = new Date(nv.fecha+'T12:00:00');
      var diasTranscurridos = Math.round((hoy - inicio) / 86400000);
      if(diasTranscurridos < 10) return;   // menos de 10 días → fuera

      // No duplicar con uno ya cargado por durVence
      var yaCargado = alertas.some(function(a){
        return a.docenteId === nv.docenteId && a.tipo === nv.tipo;
      });
      if(yaCargado) return;

      var nombreDisplay = (doc.apellido&&doc.apellido.trim())
        ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido)
        : doc.nombre;

      alertas.push({
        docenteId:      nv.docenteId,
        docenteNombre:  nombreDisplay,
        tipo:           nv.tipo,
        fecha:          nv.fecha,
        durVence:       null,
        diffDias:       null,
        diasTranscurridos: diasTranscurridos,
        novedadId:      nv._id,
        esLargo:        true
      });
    });
  }

  // Ordenar: vencimientos urgentes primero (por diffDias asc),
  // luego tratamientos largos (por diasTranscurridos desc = el más largo arriba)
  alertas.sort(function(a,b){
    if(a.esVencimiento && !b.esVencimiento) return -1;
    if(!a.esVencimiento && b.esVencimiento) return 1;
    if(a.esVencimiento && b.esVencimiento)  return (a.diffDias||0) - (b.diffDias||0);
    return (b.diasTranscurridos||0) - (a.diasTranscurridos||0);
  });
  return alertas;
}

function actualizarCampanita(alertas){
  _alertas = alertas;
  var btn = document.getElementById('btn-alertas');
  var badge = document.getElementById('alertas-badge');
  if(!btn || !badge) return;
  if(alertas.length > 0){
    badge.textContent = alertas.length > 9 ? '9+' : alertas.length;
    badge.style.display = 'flex';
    btn.classList.add('tiene-alertas');
  } else {
    badge.style.display = 'none';
    btn.classList.remove('tiene-alertas');
  }
}

function abrirPanelAlertas(){
  var panel = document.getElementById('panel-alertas');
  if(!panel) return;
  var lista = document.getElementById('alertas-lista');

  if(!_alertas.length){
    lista.innerHTML =
      '<div class="alertas-empty">'+
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'+
        '<span>Sin vencimientos próximos</span>'+
      '</div>';
  } else {
    lista.innerHTML = _alertas.map(function(al){
      var urgencia, diasTxt;
      if(al.esVencimiento){
        urgencia = al.diffDias <= 1 ? 'urgente' : al.diffDias <= 3 ? 'pronto' : 'normal';
        var venceStr = new Date(al.durVence+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'long'});
        diasTxt = al.diffDias === 0 ? 'Vence HOY' : al.diffDias === 1 ? 'Vence mañana' : 'Vence en '+al.diffDias+' días';
        diasTxt += ' ('+venceStr+')';
      } else {
        // Tratamiento largo
        urgencia = 'largo';
        var inicioStr = new Date(al.fecha+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'long'});
        diasTxt = 'Desde '+inicioStr+' ('+al.diasTranscurridos+' días)';
      }
      return '<div class="alerta-item '+urgencia+'">'+
        '<div class="alerta-dot"></div>'+
        '<div class="alerta-body">'+
          '<div class="alerta-nombre">'+al.docenteNombre+'</div>'+
          '<div class="alerta-tipo">'+(LABELS[al.tipo]||al.tipo)+'</div>'+
          '<div class="alerta-dias">'+diasTxt+'</div>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  panel.classList.toggle('open');
}

// Cerrar panel al clickear fuera
document.addEventListener('click', function(e){
  var panel = document.getElementById('panel-alertas');
  var btn   = document.getElementById('btn-alertas');
  if(panel && panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)){
    panel.classList.remove('open');
  }
});

// Hook en cargarYRender para cargar alertas en paralelo
var _origRenderDocentes = renderDocentes;
renderDocentes = function(lista){
  _origRenderDocentes(lista);
  if(!esFull()) return;

  var hoyISO = hoyStr();

  // Fecha de hace 10 días hábiles (aprox) para buscar inicios de tratamiento
  var fechaHace10 = (function(){
    var d = new Date(hoyISO+'T12:00:00'); d.setDate(d.getDate()-10);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  })();
  // Inicio del año actual para acotar la query
  var inicioAnio = hoyISO.slice(0,4)+'-01-01';

  Promise.all([
    // Query 1: novedades con durVence >= hoy (vencen hoy o en el futuro próximo)
    db.from('novedades').select('*').gte('durVence', hoyISO),

    // Query 2: TODAS las novedades del año de tipos con vencimiento
    // (necesitamos las más antiguas por docente para ver cuándo empezó el tratamiento)
    db.from('novedades').select('*').gte('fecha', inicioAnio).lte('fecha', hoyISO)
  ]).then(function(results){
    var novVence = (results[0].data||[]).map(function(x){ x._id=x.id; x.docenteId=x.docente_id; return x; });

    // Filtrar solo tipos con vencimiento, y solo los que empezaron hace 10+ días
    var novLargas = (results[1].data||[])
      .map(function(x){ x._id=x.id; x.docenteId=x.docente_id; return x; })
      .filter(function(x){
        return TIPOS_CON_VENCIMIENTO.indexOf(x.tipo) >= 0 && x.fecha <= fechaHace10;
      });

    var alertas = calcularAlertas(lista, novVence, novLargas);
    actualizarCampanita(alertas);
  }).catch(function(){});
};

// Guardar durVence cuando se registra una novedad con duración
var _origEjecutarGuardado = ejecutarGuardadoNovedad;
ejecutarGuardadoNovedad = function(tipofinal, moduloFaltado, fechasARegistrar){
  // Si tiene rango y tiene fecha final, guardar durVence
  var durTipo = document.querySelector('input[name="nov-dur-tipo"]:checked');
  if(durTipo && fechasARegistrar.length > 1 && TIPOS_CON_VENCIMIENTO.indexOf(tipofinal) >= 0){
    window._pendingDurVence = fechasARegistrar[fechasARegistrar.length - 1];
  } else {
    window._pendingDurVence = null;
  }
  _origEjecutarGuardado(tipofinal, moduloFaltado, fechasARegistrar);
};

// Parchar batch.set para incluir durVence
var _origBatchSet_sentinel = true; // marcador para saber que ya parchamos


// ╔══════════════════════════════════════════════════════╗
// ║  FEATURE 3 — VISTA CALENDARIO SEMANA / MES          ║
// ╚══════════════════════════════════════════════════════╝

var VISTA_ACTIVA = 'cards'; // 'cards' | 'semana' | 'mes'
var _calNovedades = {}; // cache { 'docenteId_fecha': tipo }

// Estado del navegador de calendario
var _calAnio  = new Date().getFullYear();
var _calMes   = new Date().getMonth();     // 0-11
var _calSemIdx = 0;  // índice de semana dentro del mes (0-based)

var MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Devuelve array de semanas (lun-vie) del mes dado
function semanasDelMes(anio, mes){
  var semanas = [];
  // primer lunes del mes (o antes si el 1 cae en mié/jue/vie)
  var primero = new Date(anio, mes, 1);
  var lunes = new Date(primero);
  var dow = primero.getDay() === 0 ? 6 : primero.getDay() - 1;
  lunes.setDate(primero.getDate() - dow);
  while(lunes.getMonth() <= mes || (lunes.getFullYear() < anio)){
    if(lunes > new Date(anio, mes+1, 0)) break; // superó el fin del mes
    var viernes = new Date(lunes); viernes.setDate(lunes.getDate()+4);
    // Solo incluir semanas que tengan al menos un día en el mes pedido
    var maxFin = new Date(anio, mes+1, 0);
    var minIni = new Date(anio, mes, 1);
    if(viernes >= minIni && lunes <= maxFin){
      semanas.push({ desde: new Date(lunes), hasta: new Date(viernes) });
    }
    lunes = new Date(lunes); lunes.setDate(lunes.getDate()+7);
    if(semanas.length > 6) break; // safety
  }
  return semanas;
}

function _semanaLabel(desde, hasta){
  var d1 = desde.getDate(), d2 = hasta.getDate();
  var m1 = desde.getMonth(), m2 = hasta.getMonth();
  if(m1 === m2) return d1+' al '+d2+' de '+MESES_LARGO[m1];
  return d1+' '+MESES_LARGO[m1].slice(0,3)+' – '+d2+' '+MESES_LARGO[m2].slice(0,3);
}

function renderNavCal(modo){
  var wrap = document.getElementById('cal-nav');
  if(!wrap) return;

  if(modo === 'mes'){
    wrap.innerHTML =
      '<button class="cal-nav-btn" id="cal-nav-prev" title="Mes anterior">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>'+
      '</button>'+
      '<span class="cal-nav-titulo">'+MESES_LARGO[_calMes]+' '+_calAnio+'</span>'+
      '<button class="cal-nav-btn" id="cal-nav-next" title="Mes siguiente">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'+
      '</button>';
    wrap.querySelector('#cal-nav-prev').addEventListener('click', function(){
      _calMes--; if(_calMes < 0){ _calMes = 11; _calAnio--; }
      _calSemIdx = 0;
      renderNavCal('mes'); renderCalendario('mes');
    });
    wrap.querySelector('#cal-nav-next').addEventListener('click', function(){
      _calMes++; if(_calMes > 11){ _calMes = 0; _calAnio++; }
      _calSemIdx = 0;
      renderNavCal('mes'); renderCalendario('mes');
    });

  } else { // semana
    var semanas = semanasDelMes(_calAnio, _calMes);
    if(_calSemIdx >= semanas.length) _calSemIdx = semanas.length - 1;
    if(_calSemIdx < 0) _calSemIdx = 0;
    var sem = semanas[_calSemIdx] || semanas[0];
    var semLabel = sem ? _semanaLabel(sem.desde, sem.hasta) : '';
    var totalSems = semanas.length;

    wrap.innerHTML =
      // Mes selector (prev/next mes)
      '<button class="cal-nav-btn" id="cal-nav-mes-prev" title="Mes anterior">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>'+
      '</button>'+
      '<span class="cal-nav-mes-lbl">'+MESES_LARGO[_calMes]+' '+_calAnio+'</span>'+
      '<button class="cal-nav-btn" id="cal-nav-mes-next" title="Mes siguiente">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'+
      '</button>'+
      '<div class="cal-nav-sep"></div>'+
      // Semana selector dentro del mes
      '<button class="cal-nav-btn cal-nav-sem-btn" id="cal-nav-sem-prev">'+
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>'+
      '</button>'+
      '<span class="cal-nav-sem-lbl">'+semLabel+'</span>'+
      '<button class="cal-nav-btn cal-nav-sem-btn" id="cal-nav-sem-next" '+((_calSemIdx>=totalSems-1)?'disabled':'')+'>'+
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'+
      '</button>'+
      '<span class="cal-nav-sem-count">Sem. '+(_calSemIdx+1)+'/'+totalSems+'</span>';

    wrap.querySelector('#cal-nav-mes-prev').addEventListener('click', function(){
      _calMes--; if(_calMes < 0){ _calMes = 11; _calAnio--; }
      _calSemIdx = 0;
      renderNavCal('semana'); renderCalendario('semana');
    });
    wrap.querySelector('#cal-nav-mes-next').addEventListener('click', function(){
      _calMes++; if(_calMes > 11){ _calMes = 0; _calAnio++; }
      _calSemIdx = 0;
      renderNavCal('semana'); renderCalendario('semana');
    });
    wrap.querySelector('#cal-nav-sem-prev').addEventListener('click', function(){
      if(_calSemIdx > 0){ _calSemIdx--; }
      else { _calMes--; if(_calMes<0){_calMes=11;_calAnio--;} _calSemIdx=semanasDelMes(_calAnio,_calMes).length-1; }
      renderNavCal('semana'); renderCalendario('semana');
    });
    wrap.querySelector('#cal-nav-sem-next').addEventListener('click', function(){
      if(_calSemIdx < totalSems-1){ _calSemIdx++; }
      else { _calMes++; if(_calMes>11){_calMes=0;_calAnio++;} _calSemIdx=0; }
      renderNavCal('semana'); renderCalendario('semana');
    });
  }
}

function cambiarVista(nueva){
  VISTA_ACTIVA = nueva;
  document.querySelectorAll('.vista-btn').forEach(function(b){
    b.classList.toggle('activo', b.dataset.vista === nueva);
  });
  if(nueva === 'cards'){
    renderDocentes(TODOS_DOCENTES.concat(TODOS_JUBILADOS.filter(function(d){ return d.jubilado; })));
    document.getElementById('grid').style.display = '';
    document.getElementById('cal-wrap').style.display = 'none';
  } else {
    // Inicializar mes/año desde HOY siempre
    var base = new Date(hoyStr()+'T12:00:00');
    _calAnio = base.getFullYear();
    _calMes  = base.getMonth();
    // Para semana: encontrar en qué semana cae hoy
    if(nueva === 'semana'){
      var sems = semanasDelMes(_calAnio, _calMes);
      _calSemIdx = 0;
      for(var i=0; i<sems.length; i++){
        if(base >= sems[i].desde && base <= sems[i].hasta){ _calSemIdx = i; break; }
      }
    }
    document.getElementById('grid').style.display = 'none';
    document.getElementById('cal-wrap').style.display = '';
    renderNavCal(nueva);
    renderCalendario(nueva);
  }
}

function renderCalendario(modo){
  var wrap = document.getElementById('cal-wrap');
  if(!wrap) return;
  // Preserve nav, only replace table area
  var tableWrap = document.getElementById('cal-table-zone');
  if(tableWrap) tableWrap.innerHTML = '<div class="cal-loading">Cargando…</div>';
  else wrap.innerHTML = '<div id="cal-nav" class="cal-nav"></div><div class="cal-loading" id="cal-table-zone">Cargando…</div>';

  var hoy = new Date(hoyStr()+'T12:00:00');
  var dias = [];
  var desde, hasta;

  if(modo === 'semana'){
    var sems = semanasDelMes(_calAnio, _calMes);
    var sem  = sems[_calSemIdx] || sems[0];
    if(!sem){ document.getElementById('cal-table-zone').innerHTML='<div class="cal-loading">Sin semanas disponibles.</div>'; return; }
    desde = sem.desde; hasta = sem.hasta;
  } else {
    desde = new Date(_calAnio, _calMes, 1);
    hasta = new Date(_calAnio, _calMes+1, 0);
  }

  // Generar días hábiles del rango
  var cur = new Date(desde);
  while(cur <= hasta){
    var dow2 = cur.getDay();
    if(dow2 !== 0 && dow2 !== 6){
      var fs = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
      if(!esFeriado(fs)) dias.push(fs);
    }
    cur.setDate(cur.getDate()+1);
  }

  var zone = document.getElementById('cal-table-zone');
  if(!dias.length){ zone.innerHTML='<div class="cal-loading">Sin días hábiles en este período.</div>'; return; }

  // Filtrar docentes
  var docsFiltrados = TODOS_DOCENTES.filter(function(d){
    if(filtroNivel && (d.nivel||'secundaria') !== filtroNivel) return false;
    if(filtroArea  && (d.area||'') !== filtroArea) return false;
    return !d.jubilado;
  });

  db.from('novedades').select('*')
    .gte('fecha',dias[0])
    .lte('fecha',dias[dias.length-1])
    .then(function(res){
      if(res.error) throw res.error;
      var mapa = {};
      (res.data||[]).forEach(function(x){
        mapa[x.docente_id+'_'+x.fecha] = x.tipo || 'presente';
      });
      _calNovedades = mapa;
      _renderCalHTML(zone, docsFiltrados, dias, hoy, modo);
    })
    .catch(function(err){
      zone.innerHTML = '<div class="cal-loading">Error: '+err.message+'</div>';
    });
}

function _renderCalHTML(wrap, docs, dias, hoy, modo){
  if(!docs.length){
    wrap.innerHTML = '<div class="cal-loading">No hay docentes para mostrar.</div>';
    return;
  }

  var hoyStr2 = hoy.getFullYear()+'-'+String(hoy.getMonth()+1).padStart(2,'0')+'-'+String(hoy.getDate()).padStart(2,'0');

  // Construir cabecera de fechas
  var DIAS_ABREV_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  var MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  var headerCells = dias.map(function(f){
    var fObj = new Date(f+'T12:00:00');
    var esHoy = f === hoyStr2;
    var esSel = f === fechaSeleccionada;
    return '<th class="cal-th-fecha'+(esHoy?' cal-hoy':'')+(esSel?' cal-sel':'')+'" data-fecha="'+f+'">'+
      '<span class="cal-dia-num">'+fObj.getDate()+'</span>'+
      '<span class="cal-dia-abrev">'+DIAS_ABREV_ES[fObj.getDay()]+'</span>'+
    '</th>';
  }).join('');

  // Leyenda de mes cuando cambia
  var mesHeader = '';
  if(modo === 'mes'){
    var meses = {};
    dias.forEach(function(f){
      var m = f.slice(0,7);
      if(!meses[m]) meses[m] = 0;
      meses[m]++;
    });
    mesHeader = '<tr class="cal-mes-row"><td class="cal-td-nom"></td>'+
      Object.keys(meses).map(function(m){
        var mObj = new Date(m+'-01T12:00:00');
        return '<td colspan="'+meses[m]+'" class="cal-mes-cell">'+
          MESES_CORTO[mObj.getMonth()]+' '+mObj.getFullYear()+
        '</td>';
      }).join('')+
    '</tr>';
  }

  // Filas de docentes
  var filas = docs.map(function(doc){
    var nombreDisp = (doc.apellido&&doc.apellido.trim())
      ? doc.apellido.trim().toUpperCase()+', '+soloNombre(doc.nombre,doc.apellido)
      : doc.nombre;

    var celdas = dias.map(function(f){
      var fObj = new Date(f+'T12:00:00');
      var diaKey = DIAS_KEYS[fObj.getDay()];
      var tieneHorario = doc.horario && doc.horario[diaKey] && hsDia(doc.horario[diaKey]) > 0;
      var tipo = _calNovedades[doc.id+'_'+f];
      var esHoy = f === hoyStr2;
      var esSel = f === fechaSeleccionada;

      if(!tieneHorario){
        return '<td class="cal-td cal-libre'+(esHoy?' cal-hoy':'')+(esSel?' cal-sel':'')+'" title="No trabaja"></td>';
      }

      var estado = tipo || 'presente';
      var labelTip = LABELS_SHORT[estado] || estado;
      var cls = 'cal-td cal-chip '+estado+(esHoy?' cal-hoy':'')+(esSel?' cal-sel':'');
      return '<td class="'+cls+'" title="'+nombreDisp+' — '+labelTip+'" data-docid="'+doc.id+'" data-fecha="'+f+'">'+
        '<span class="cal-chip-inner"></span>'+
      '</td>';
    }).join('');

    return '<tr class="cal-row" data-docid="'+doc.id+'">'+
      '<td class="cal-td-nom" title="'+nombreDisp+'">'+
        '<span class="cal-nom-txt">'+nombreDisp+'</span>'+
        '<span class="cal-nom-cargo">'+( doc.cargo||'' )+'</span>'+
      '</td>'+
      celdas+
    '</tr>';
  }).join('');

  // Montar tabla
  var colCount = dias.length;
  var tableWidth = Math.max(colCount * (modo==='mes'?28:44) + 180, 400);

  wrap.innerHTML =
    '<div class="cal-leyenda">'+
      ['presente','justificada','injustificada','medica','lic_gremial','lic_embarazo','carpeta_psiq','paro'].map(function(t){
        return '<span class="cal-ley-item '+t+'"><span class="cal-ley-dot"></span>'+LABELS_SHORT[t]+'</span>';
      }).join('')+
    '</div>'+
    '<div class="cal-table-wrap">'+
    '<table class="cal-table" style="min-width:'+tableWidth+'px">'+
      '<thead>'+
        mesHeader+
        '<tr><th class="cal-th-nom">Docente</th>'+headerCells+'</tr>'+
      '</thead>'+
      '<tbody>'+filas+'</tbody>'+
    '</table>'+
    '</div>';

  // Click en celda → navegar a esa fecha / abrir novedad
  wrap.querySelectorAll('.cal-td[data-docid]').forEach(function(td){
    td.addEventListener('click', function(){
      var docId  = this.dataset.docid;
      var fecha  = this.dataset.fecha;
      var doc    = TODOS_DOCENTES.find(function(d){ return d.id===docId; });
      if(!doc || !puedeRegistrar(doc)) return;
      // Navegar a la fecha y abrir novedad
      fechaSeleccionada = fecha;
      document.getElementById('input-fecha-hdr').value = fecha;
      cambiarVista('cards');
      setTimeout(function(){ abrirNovedad(doc); }, 250);
    });
    td.style.cursor = esFull() ? 'pointer' : 'default';
  });

  // Click en cabecera fecha → ir a ese día en vista cards
  wrap.querySelectorAll('.cal-th-fecha').forEach(function(th){
    th.addEventListener('click', function(){
      fechaSeleccionada = this.dataset.fecha;
      document.getElementById('input-fecha-hdr').value = fechaSeleccionada;
      cambiarVista('cards');
    });
    th.style.cursor = 'pointer';
    th.title = 'Click: ver este día en cards';
  });
}

// Re-renderizar calendario cuando cambia la fecha seleccionada
var _origFechaChange = null;
(function(){
  var inputFecha = document.getElementById('input-fecha-hdr');
  if(inputFecha){
    inputFecha.addEventListener('change', function(){
      if(VISTA_ACTIVA !== 'cards') setTimeout(function(){ renderCalendario(VISTA_ACTIVA); }, 50);
    });
  }
})();


// ══════════════════════════════════════════════════════
//  EXPORTAR CALENDARIO MENSUAL — PDF A4
//  Vista tipo planilla: semanas en filas, días en columnas
//  Marca cada día con el estado (color + abreviatura)
// ══════════════════════════════════════════════════════
function exportarCalendarioMes(docObj, nombreDisplay, desde, hasta, novedadesPorFecha){
  var d = new window.jspdf.jsPDF({ orientation:'p', unit:'mm', format:'a4' });
  var MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var DIAS_FULL  = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
  var mesObj     = new Date(desde+'T12:00:00');
  var mesNom     = MESES_FULL[mesObj.getMonth()]+' '+mesObj.getFullYear();
  var margen     = 12;

  // Encabezado
  d.setFont('helvetica','bold'); d.setFontSize(13); d.setTextColor(26,43,74);
  d.text('Asistencia mensual — '+mesNom, margen, 16);
  d.setFont('helvetica','normal'); d.setFontSize(9); d.setTextColor(80,80,80);
  d.text(nombreDisplay, margen, 22);
  if(docObj && docObj.cargo){ d.text(docObj.cargo, margen, 27); }
  d.setTextColor(0,0,0);

  // Colores por tipo (RGB)
  var COLORES = {
    presente:             [22,163,74],
    justificada:          [202,138,4],
    injustificada:        [220,38,38],
    justificada_parcial:  [161,98,7],
    injustificada_parcial:[185,28,28],
    medica:               [37,99,235],
    medica_familiar:      [8,145,178],
    carpeta_psiq:         [202,138,4],
    cambio:               [234,88,12],
    duelo:                [55,65,81],
    lic_embarazo:         [219,39,119],
    lic_gremial:          [124,58,237],
    formacion:            [146,64,14],
    lic_capacitacion:     [6,95,70],
    paro:                 [127,29,29],
    adelanto:             [15,118,110],
    compensada:           [22,101,52],
    jubilacion:           [107,114,128]
  };

  // Abreviaturas cortas para la celda
  var ABREV = {
    presente:'P', justificada:'Just', injustificada:'Injust',
    justificada_parcial:'ParcJ', injustificada_parcial:'ParcI',
    medica:'CMed', medica_familiar:'CMedF', carpeta_psiq:'CPsiq',
    cambio:'CamAct', duelo:'Duelo', lic_embarazo:'LicEmb',
    lic_gremial:'LicGr', formacion:'Form', lic_capacitacion:'LicCap',
    paro:'Paro', adelanto:'Adel', compensada:'Comp', jubilacion:'Jub'
  };

  // Construir semanas del mes — cada semana = array de {fecha, dow}
  var primerDia = new Date(desde+'T12:00:00');
  var ultimoDia = new Date(hasta+'T12:00:00');
  var semanas   = [];
  var semActual = [];
  var cur       = new Date(primerDia);

  // Empezar la primera semana desde el lunes anterior si el mes no empieza en lunes
  var primerDow = primerDia.getDay(); // 0=dom
  var lunesInicio = new Date(primerDia);
  var diasAtras = primerDow === 0 ? 6 : primerDow - 1;
  lunesInicio.setDate(primerDia.getDate() - diasAtras);
  cur = new Date(lunesInicio);

  while(cur <= ultimoDia || semActual.length > 0){
    var dow = cur.getDay();
    if(dow === 1 && semActual.length > 0){
      semanas.push(semActual);
      semActual = [];
      if(cur > ultimoDia) break;
    }
    // Solo lun-vie
    if(dow >= 1 && dow <= 5){
      var fStr = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
      var enMes = cur >= primerDia && cur <= ultimoDia;
      semActual.push({ fecha: fStr, dow: dow, dia: cur.getDate(), enMes: enMes });
    }
    cur.setDate(cur.getDate()+1);
    if(cur.getDay() === 0) cur.setDate(cur.getDate()+1); // saltar domingo
    if(semActual.length >= 5){
      semanas.push(semActual);
      semActual = [];
      if(cur > ultimoDia) break;
    }
  }
  if(semActual.length) semanas.push(semActual);

  // Dimensiones de la grilla
  var yStart  = docObj && docObj.cargo ? 34 : 30;
  var colW    = (210 - margen*2) / 5;  // 5 días
  var rowH    = Math.min(28, (270 - yStart) / (semanas.length || 1));
  var diasHdr = ['Lunes','Martes','Miercoles','Jueves','Viernes'];

  // Cabecera de días
  d.setFillColor(26,43,74);
  d.rect(margen, yStart, 210-margen*2, 7, 'F');
  d.setFont('helvetica','bold'); d.setFontSize(8.5); d.setTextColor(255,255,255);
  for(var di=0; di<5; di++){
    var cx = margen + di*colW + colW/2;
    d.text(diasHdr[di], cx, yStart+4.8, { align:'center' });
  }
  d.setTextColor(0,0,0);

  // Filas de semanas
  semanas.forEach(function(sem, si){
    var ry = yStart + 7 + si*rowH;

    // Fondo alternado de fila
    if(si%2===0){ d.setFillColor(248,250,252); d.rect(margen, ry, 210-margen*2, rowH, 'F'); }

    sem.forEach(function(celda){
      if(!celda.enMes) return;
      var colIdx = celda.dow - 1; // lun=0
      var cx = margen + colIdx*colW;

      // Borde celda
      d.setDrawColor(220,220,220);
      d.rect(cx, ry, colW, rowH, 'S');

      var nov = novedadesPorFecha[celda.fecha];
      var tipo = nov ? (nov.tipo || 'presente') : 'presente';
      if(esFeriado(celda.fecha)) tipo = '__feriado__';

      var col = COLORES[tipo] || [22,163,74];
      var abr = ABREV[tipo] || 'P';

      // Número del día
      d.setFont('helvetica','bold'); d.setFontSize(9);
      d.setTextColor(60,60,60);
      d.text(String(celda.dia), cx+2, ry+5);

      if(tipo === '__feriado__'){
        d.setFont('helvetica','italic'); d.setFontSize(7); d.setTextColor(150,150,150);
        d.text('Feriado', cx+colW/2, ry+rowH/2+2, {align:'center'});
      } else if(tipo === 'presente'){
        // Punto verde pequeño
        d.setFillColor(22,163,74);
        d.circle(cx+colW/2, ry+rowH/2+2, 3.5, 'F');
        d.setFont('helvetica','bold'); d.setFontSize(7); d.setTextColor(255,255,255);
        d.text('P', cx+colW/2, ry+rowH/2+3.8, {align:'center'});
      } else {
        // Pastilla de color con abreviatura
        var pw = Math.min(colW-4, d.getTextWidth(abr)+6);
        var px = cx + (colW-pw)/2;
        var py = ry + rowH/2 - 2;
        d.setFillColor(col[0], col[1], col[2]);
        d.roundedRect(px, py, pw, 7, 1.5, 1.5, 'F');
        d.setFont('helvetica','bold'); d.setFontSize(6.5); d.setTextColor(255,255,255);
        d.text(abr, cx+colW/2, py+4.8, {align:'center'});
      }
      d.setTextColor(0,0,0);
    });
  });

  // Leyenda al pie
  var yLey = yStart + 7 + semanas.length*rowH + 6;
  if(yLey > 275){ d.addPage(); yLey = 14; }

  d.setFont('helvetica','bold'); d.setFontSize(8); d.setTextColor(60,60,60);
  d.text('Referencias:', margen, yLey); yLey += 5;

  var tiposUsados = Object.keys(novedadesPorFecha)
    .map(function(f){ return novedadesPorFecha[f].tipo; })
    .filter(function(t,i,a){ return a.indexOf(t)===i && t !== 'presente'; });

  tiposUsados.forEach(function(tipo, i){
    var col = COLORES[tipo] || [100,100,100];
    var lx  = margen + (i%3)*62;
    var ly  = yLey + Math.floor(i/3)*5.5;
    d.setFillColor(col[0],col[1],col[2]);
    d.roundedRect(lx, ly-3.5, 8, 4, 1, 1, 'F');
    d.setFont('helvetica','normal'); d.setFontSize(7.5); d.setTextColor(40,40,40);
    d.text(ABREV[tipo]||tipo, lx+9, ly, {align:'left'});
    d.text(' = '+(LABELS_SHORT[tipo]||tipo), lx+9+d.getTextWidth(ABREV[tipo]||tipo), ly);
  });

  // Guardar
  var mesSlug = desde.slice(0,7);
  var nomSlug = (docObj ? (docObj.apellido||docObj.nombre||'doc') : 'doc').replace(/[^a-zA-Z0-9]/g,'_');
  d.save('Calendario_'+nomSlug+'_'+mesSlug+'.pdf');
  toast('Calendario exportado');
}

// ══════════════════════════════════════════════════════════════
//  PAPELERA — docentes eliminados
// ══════════════════════════════════════════════════════════════
// Papelera: listeners via onclick en HTML (ver btn-papelera onclick="abrirPapelera()")
// El botón X del modal también usa onclick en HTML

function abrirPapelera(){
  var mPap = document.getElementById('modal-papelera');
  if(!mPap){ toast('Error: modal papelera no encontrado',3000); return; }
  mPap.showModal();
  var lista = document.getElementById('pap-lista');
  lista.innerHTML = '<p style="color:#9ca3af;font-size:.85rem;">Cargando...</p>';

  var nivelPap = NIVEL_ACTIVO || '';
  var NIVEL_LABELS_PAP = { secundaria:'Secundaria', primaria:'Primaria', inicial:'Inicial' };

  db.from('docentes').select('*').eq('anio', ANIO_SEL)
    .then(function(res){
      if(res.error) throw res.error;
      var items = (res.data||[])
        .filter(function(dd){
          if(dd.esplaceholder || !dd.eliminado_en) return false;
          if(nivelPap) return dd.eliminado_en[nivelPap] === true;
          return Object.values(dd.eliminado_en).some(function(v){ return v===true; });
        })
        .map(function(dd){ return dd; });

      if(!items.length){
        lista.innerHTML = '<p style="color:#9ca3af;font-size:.85rem;text-align:center;padding:20px 0;">✅ La papelera está vacía'+(nivelPap?' para este nivel':'')+'.</p>';
        return;
      }

      items.sort(function(a,b){
        function getTs(x){
          var elim = x.fecha_eliminado_en||{};
          var fechas = Object.values(elim).filter(Boolean).map(function(t){ return new Date(t); });
          return fechas.length ? Math.max.apply(null,fechas.map(function(d){ return d.getTime(); })) : 0;
        }
        return getTs(b)-getTs(a);
      });

      lista.innerHTML = items.map(function(d){
        var nivelesElim = Object.keys(d.eliminado_en||{}).filter(function(n){ return d.eliminado_en[n]===true; });
        var nomMostrar = (d.apellido&&d.apellido.trim()) ? d.apellido.toUpperCase()+', '+d.nombre : d.nombre;
        var cargo = d.cargo ? ' <span style="font-size:.72rem;color:#9ca3af">· '+d.cargo+'</span>' : '';
        var nivelBadges = !nivelPap ? nivelesElim.map(function(n){
          return '<span style="font-size:.65rem;padding:1px 5px;border-radius:4px;background:#EEF2FF;color:#6366F1;font-weight:600">'+(NIVEL_LABELS_PAP[n]||n)+'</span>';
        }).join(' ') : '';
        var nivelMostrar = nivelPap || nivelesElim[0] || '';
        var fecha = '';
        var ts = d.fecha_eliminado_en && d.fecha_eliminado_en[nivelMostrar];
        if(ts){ var f=new Date(ts); fecha=f.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}); }
        var quien = d.eliminado_por_en&&d.eliminado_por_en[nivelMostrar] ? ' por '+d.eliminado_por_en[nivelMostrar].split('@')[0] : '';
        var nivelesRestaurar = nivelPap ? [nivelPap] : nivelesElim;
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;gap:.5rem">'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-weight:600;font-size:.88rem">'+nomMostrar+cargo+' '+nivelBadges+'</div>'+
            '<div style="font-size:.71rem;color:#9ca3af;margin-top:2px">'+(fecha?'Eliminado el '+fecha+quien:'Sin fecha registrada')+'</div>'+
          '</div>'+
          '<button class="pap-btn-restaurar" data-id="'+d.id+'" data-niveles="'+nivelesRestaurar.join(',')+'" style="padding:5px 12px;background:#ecfdf5;color:#059669;border:1.5px solid #6ee7b7;border-radius:7px;cursor:pointer;font-size:.8rem;font-weight:700;white-space:nowrap;flex-shrink:0">'+
            '↩ Restaurar'+
          '</button>'+
        '</div>';
      }).join('');
      lista.querySelectorAll('.pap-btn-restaurar').forEach(function(btn){
        btn.addEventListener('click', function(){
          var id = this.dataset.id;
          var niveles = this.dataset.niveles ? this.dataset.niveles.split(',') : [NIVEL_ACTIVO||'secundaria'];
          restaurarDocente(id, niveles);
        });
      });
    })
    .catch(function(err){
      lista.innerHTML = '<p style="color:#ef4444;font-size:.85rem;">Error: '+err.message+'</p>';
    });
}

function restaurarDocente(id, niveles){
  if(!Array.isArray(niveles)) niveles = [niveles || NIVEL_ACTIVO || 'secundaria'];
  Promise.all(niveles.map(function(n){ return softDeleteDocentes([id], n, false); }))
    .then(function(){
      toast('✅ Docente restaurado correctamente');
      abrirPapelera();
      cargarYRender();
    })
    .catch(function(err){ toast('Error al restaurar: '+err.message, 5000); });
}


// ══════════════════════════════════════════════════════
//  GESTIÓN DE USUARIOS (solo directivo): asignar rol a quien entra con Google
// ══════════════════════════════════════════════════════
function _escUsr(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function prepararBotonUsuarios(){
  var bar = document.getElementById('user-bar');
  if(!bar) return;
  var btn = document.getElementById('btn-usuarios');
  if(!esFull()){ if(btn) btn.style.display='none'; return; }
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'btn-usuarios';
    btn.type = 'button';
    btn.title = 'Usuarios y roles';
    btn.style.cssText = 'background:rgba(255,255,255,.15);color:inherit;border:1px solid rgba(128,128,128,.35);border-radius:8px;padding:.25rem .6rem;font-size:.75rem;cursor:pointer;font-family:inherit;margin-right:.4rem;position:relative';
    btn.innerHTML = '👥 Usuarios';
    btn.addEventListener('click', abrirGestionUsuarios);
    bar.insertBefore(btn, bar.firstChild);
  }
  btn.style.display = '';
  // Marcar cuántos están pendientes
  db.from('usuarios').select('email', {count:'exact', head:true}).eq('rol','pendiente').then(function(res){
    var n = res && res.count ? res.count : 0;
    var b = document.getElementById('btn-usuarios-badge');
    if(b) b.remove();
    if(n>0){
      b = document.createElement('span');
      b.id = 'btn-usuarios-badge';
      b.textContent = n;
      b.style.cssText = 'position:absolute;top:-6px;right:-6px;background:#dc2626;color:#fff;border-radius:999px;font-size:.62rem;min-width:16px;height:16px;line-height:16px;text-align:center;font-weight:700';
      btn.appendChild(b);
    }
  }, function(){});
}

function abrirGestionUsuarios(){
  if(!esFull()) return;
  var dlg = document.getElementById('modal-usuarios-roles');
  if(!dlg){
    dlg = document.createElement('dialog');
    dlg.id = 'modal-usuarios-roles';
    dlg.style.cssText = 'border:none;border-radius:14px;padding:0;width:min(720px,94vw);max-height:88vh;box-shadow:0 20px 60px rgba(0,0,0,.3);background:#fff;color:#0f172a';
    dlg.addEventListener('click', function(e){ if(e.target===dlg) dlg.close(); });
    document.body.appendChild(dlg);
  }
  dlg.innerHTML =
    '<div style="padding:1.1rem 1.3rem;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">'+
      '<strong style="font-size:1rem">👥 Usuarios y roles</strong>'+
      '<button id="usr-cerrar" style="border:none;background:none;font-size:1.2rem;cursor:pointer;color:#64748b">✕</button>'+
    '</div>'+
    '<div style="padding:.8rem 1.3rem;font-size:.76rem;color:#475569;background:#f8fafc;line-height:1.5">'+
      '<b>Directivo:</b> todo · <b>Administrativo:</b> asistencia de profesores, personal docente y estudiantes · '+
      '<b>Preceptor:</b> asistencia de profesores y estudiantes · <b>Profesor:</b> asistencia de estudiantes · '+
      '<b>Pendiente:</b> sin acceso.'+
    '</div>'+
    '<div id="usr-lista" style="padding:.6rem 1.3rem;overflow:auto;max-height:50vh"><p style="color:#64748b;font-size:.85rem">Cargando…</p></div>'+
    '<div style="padding:.9rem 1.3rem;border-top:1px solid #e2e8f0;display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">'+
      '<input id="usr-nuevo-email" type="email" placeholder="Pre-designar por email (Gmail)" style="flex:1;min-width:200px;padding:.45rem .6rem;border:1px solid #cbd5e1;border-radius:8px;font-size:.82rem">'+
      '<select id="usr-nuevo-rol" style="padding:.45rem;border:1px solid #cbd5e1;border-radius:8px;font-size:.82rem">'+
        ROLES_ASIGNABLES.filter(function(r){ return r!=='pendiente'; }).map(function(r){ return '<option value="'+r+'">'+(ROL_LABELS[r]||r)+'</option>'; }).join('')+
      '</select>'+
      '<button id="usr-nuevo-btn" style="padding:.45rem .9rem;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;font-size:.82rem;cursor:pointer">Agregar</button>'+
    '</div>';
  document.getElementById('usr-cerrar').addEventListener('click', function(){ dlg.close(); });
  document.getElementById('usr-nuevo-btn').addEventListener('click', function(){
    var email = (document.getElementById('usr-nuevo-email').value||'').trim().toLowerCase();
    var rol   = document.getElementById('usr-nuevo-rol').value;
    if(!email || email.indexOf('@')<1){ toast('Ingresá un email válido',3000); return; }
    db.from('usuarios').upsert({ email: email, rol: rol }, { onConflict:'email' }).then(function(res){
      if(res.error){ toast('Error: '+res.error.message,4500); return; }
      document.getElementById('usr-nuevo-email').value='';
      toast('✅ Usuario agregado');
      _cargarListaUsuarios();
    });
  });
  if(!dlg.open) dlg.showModal();
  _cargarListaUsuarios();
}

function _cargarListaUsuarios(){
  var cont = document.getElementById('usr-lista');
  if(!cont) return;
  var miEmail = ((USUARIO_ACTUAL&&USUARIO_ACTUAL.email)||'').toLowerCase();
  db.from('usuarios').select('*').order('email').then(function(res){
    if(res.error){ cont.innerHTML='<p style="color:#dc2626;font-size:.85rem">Error: '+_escUsr(res.error.message)+'</p>'; return; }
    var filas = (res.data||[]).slice().sort(function(a,b){
      var pa = normalizarRol(a.rol)==='pendiente' ? 0 : 1, pb = normalizarRol(b.rol)==='pendiente' ? 0 : 1;
      return pa-pb || String(a.email).localeCompare(String(b.email));
    });
    if(!filas.length){ cont.innerHTML='<p style="color:#64748b;font-size:.85rem">Todavía no hay usuarios.</p>'; return; }
    cont.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:.82rem">'+
      filas.map(function(u){
        var rolN = normalizarRol(u.rol), yo = String(u.email).toLowerCase()===miEmail;
        return '<tr data-email="'+_escUsr(u.email)+'" style="border-bottom:1px solid #f1f5f9">'+
          '<td style="padding:.5rem .3rem"><div style="font-weight:600">'+_escUsr(u.nombre||'—')+(yo?' <span style="font-weight:400;color:#64748b">(vos)</span>':'')+'</div>'+
            '<div style="color:#64748b;font-size:.74rem;word-break:break-all">'+_escUsr(u.email)+'</div></td>'+
          '<td style="padding:.5rem .3rem;white-space:nowrap">'+
            '<select class="usr-rol" '+(yo?'disabled title="No podés cambiar tu propio rol"':'')+' style="padding:.35rem;border:1px solid '+(rolN==='pendiente'?'#f59e0b':'#cbd5e1')+';border-radius:8px;font-size:.8rem">'+
              ROLES_ASIGNABLES.map(function(r){ return '<option value="'+r+'"'+(r===rolN?' selected':'')+'>'+(ROL_LABELS[r]||r)+'</option>'; }).join('')+
            '</select></td>'+
          '<td style="padding:.5rem .3rem;text-align:right;white-space:nowrap">'+
            (yo?'':'<button class="usr-guardar" style="padding:.3rem .7rem;border:none;border-radius:8px;background:#16a34a;color:#fff;font-size:.78rem;cursor:pointer">Guardar</button> '+
                  '<button class="usr-borrar" title="Quitar acceso" style="padding:.3rem .5rem;border:1px solid #fecaca;border-radius:8px;background:#fff;color:#dc2626;font-size:.78rem;cursor:pointer">🗑️</button>')+
          '</td></tr>';
      }).join('')+'</table>';
    cont.querySelectorAll('tr[data-email]').forEach(function(tr){
      var email = tr.dataset.email;
      var g = tr.querySelector('.usr-guardar'), b = tr.querySelector('.usr-borrar');
      if(g) g.addEventListener('click', function(){
        var rol = tr.querySelector('.usr-rol').value;
        db.from('usuarios').update({ rol: rol }).eq('email', email).then(function(r2){
          if(r2.error){ toast('Error: '+r2.error.message,4500); return; }
          toast('✅ Rol actualizado'); prepararBotonUsuarios(); _cargarListaUsuarios();
        });
      });
      if(b) b.addEventListener('click', function(){
        if(!confirm('¿Quitar el acceso de '+email+'?')) return;
        db.from('usuarios').delete().eq('email', email).then(function(r2){
          if(r2.error){ toast('Error: '+r2.error.message,4500); return; }
          toast('🗑️ Usuario eliminado'); prepararBotonUsuarios(); _cargarListaUsuarios();
        });
      });
    });
  });
}
