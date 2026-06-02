import { db } from './config'
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, setDoc, increment,
  query, orderBy, where, writeBatch, serverTimestamp, onSnapshot,
} from 'firebase/firestore'

export const SHARED_DOMAIN = 'innovattech.org'

const isShared = (email) => email?.toLowerCase().endsWith(`@${SHARED_DOMAIN}`)

// Strips undefined values recursively so Firestore never receives them
const clean = (obj) => {
  if (Array.isArray(obj)) return obj.map(clean)
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, clean(v)])
    )
  }
  return obj
}

// ── Collection helpers ────────────────────────────────────────────────────────

const cotizacionesRef = (uid, email) =>
  isShared(email)
    ? collection(db, 'empresas', SHARED_DOMAIN, 'cotizaciones')
    : collection(db, 'usuarios', uid, 'cotizaciones')

const cotizacionDocRef = (uid, email, cotId) =>
  isShared(email)
    ? doc(db, 'empresas', SHARED_DOMAIN, 'cotizaciones', cotId)
    : doc(db, 'usuarios', uid, 'cotizaciones', cotId)

const counterRef = (uid, email) =>
  isShared(email)
    ? doc(db, 'empresas', SHARED_DOMAIN, 'meta', 'counter')
    : doc(db, 'usuarios', uid, 'meta', 'counter')

const clientesRef = (uid, email) =>
  isShared(email)
    ? collection(db, 'empresas', SHARED_DOMAIN, 'clientes')
    : collection(db, 'usuarios', uid, 'clientes')

const clienteDocRef = (uid, email, clienteId) =>
  isShared(email)
    ? doc(db, 'empresas', SHARED_DOMAIN, 'clientes', clienteId)
    : doc(db, 'usuarios', uid, 'clientes', clienteId)

const catalogoRef = (uid, email) =>
  isShared(email)
    ? collection(db, 'empresas', SHARED_DOMAIN, 'catalogo')
    : collection(db, 'usuarios', uid, 'catalogo')

const catalogoDocRef = (uid, email, itemId) =>
  isShared(email)
    ? doc(db, 'empresas', SHARED_DOMAIN, 'catalogo', itemId)
    : doc(db, 'usuarios', uid, 'catalogo', itemId)

const plantillasRef = (uid, email) =>
  isShared(email)
    ? collection(db, 'empresas', SHARED_DOMAIN, 'plantillas')
    : collection(db, 'usuarios', uid, 'plantillas')

const plantillaDocRef = (uid, email, plantillaId) =>
  isShared(email)
    ? doc(db, 'empresas', SHARED_DOMAIN, 'plantillas', plantillaId)
    : doc(db, 'usuarios', uid, 'plantillas', plantillaId)

const mapCotizacion = (d) => {
  const data = d.data()
  let fechaDate = null
  if (data.fecha?.toDate) {
    fechaDate = data.fecha.toDate()
  } else if (typeof data.fecha === 'string' && data.fecha.length > 0) {
    // Legacy: fecha was stored as a formatted string (e.g. "26-05-2026")
    const m = data.fecha.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (m) fechaDate = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  }
  return {
    id: d.id,
    ...data,
    fecha: fechaDate
      ? fechaDate.toLocaleDateString('es-CL')
      : (typeof data.fecha === 'string' && data.fecha ? data.fecha : '—'),
    fechaDate,
  }
}

// ── Cotizaciones ─────────────────────────────────────────────────────────────

export const guardarCotizacion = async (uid, datos, email, displayName) => {
  const cRef = counterRef(uid, email)
  const snap = await getDoc(cRef)

  let num = 1
  if (snap.exists()) {
    num = (snap.data().ultimo || 0) + 1
    await updateDoc(cRef, { ultimo: increment(1) })
  } else {
    await setDoc(cRef, { ultimo: 1 })
  }

  const numero = `COT-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`
  const extra = isShared(email) ? { creadoPorUid: uid, creadoPor: displayName || email } : {}

  const ref = await addDoc(cotizacionesRef(uid, email), clean({
    ...datos,
    ...extra,
    numero,
    fecha: serverTimestamp(),
    estado: 'Pendiente',
  }))

  return { id: ref.id, numero }
}

export const obtenerCotizaciones = async (uid, email) => {
  const q = query(cotizacionesRef(uid, email), orderBy('fecha', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(mapCotizacion)
}

export const suscribirCotizaciones = (uid, email, callback, onError) => {
  const q = query(cotizacionesRef(uid, email), orderBy('fecha', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map(mapCotizacion)), onError || (() => {}))
}

export const actualizarEstado = async (uid, cotId, estado, email) => {
  await updateDoc(cotizacionDocRef(uid, email, cotId), { estado })
}

export const actualizarCotizacion = async (uid, cotId, datos, email) => {
  // Exclude `fecha` so we never overwrite the original serverTimestamp with a string
  const { fecha: _fecha, ...datosRest } = datos
  await updateDoc(cotizacionDocRef(uid, email, cotId), clean({
    ...datosRest,
    fechaActualizacion: serverTimestamp(),
  }))
}

export const eliminarCotizacion = async (uid, cotId, email) => {
  await deleteDoc(cotizacionDocRef(uid, email, cotId))
}

export const actualizarFichasTecnicas = async (uid, cotId, archivos, email) => {
  await updateDoc(cotizacionDocRef(uid, email, cotId), { fichasTecnicas: archivos })
}

export const migrarCotizacionesPersonales = async (uid, email) => {
  if (!isShared(email)) return 0

  const personalCol = collection(db, 'usuarios', uid, 'cotizaciones')
  const snap = await getDocs(personalCol)
  if (snap.empty) return 0

  const sharedCol = collection(db, 'empresas', SHARED_DOMAIN, 'cotizaciones')
  for (const d of snap.docs) {
    await setDoc(doc(sharedCol, d.id), { ...d.data(), creadoPorUid: uid })
    await deleteDoc(d.ref)
  }

  const maxNum = snap.docs.reduce((max, d) => {
    const match = (d.data().numero || '').match(/COT-\d{4}-(\d+)/)
    return Math.max(max, match ? parseInt(match[1]) : 0)
  }, 0)

  if (maxNum > 0) {
    const cRef = counterRef(uid, email)
    const cSnap = await getDoc(cRef)
    const current = cSnap.exists() ? (cSnap.data().ultimo || 0) : 0
    if (maxNum > current) {
      cSnap.exists()
        ? await updateDoc(cRef, { ultimo: maxNum })
        : await setDoc(cRef, { ultimo: maxNum })
    }
  }

  return snap.size
}

// ── Clientes ─────────────────────────────────────────────────────────────────

export const guardarCliente = async (uid, datos, email) => {
  const ref = await addDoc(clientesRef(uid, email), { ...datos, creadoEn: serverTimestamp() })
  return ref.id
}

export const obtenerClientes = async (uid, email) => {
  const q = query(clientesRef(uid, email), orderBy('nombre', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const actualizarCliente = async (uid, clienteId, datos, email) => {
  await updateDoc(clienteDocRef(uid, email, clienteId), datos)
}

export const eliminarCliente = async (uid, clienteId, email) => {
  await deleteDoc(clienteDocRef(uid, email, clienteId))
}

// ── Catálogo de materiales ───────────────────────────────────────────────────

export const guardarItemCatalogo = async (uid, datos, email) => {
  const ref = await addDoc(catalogoRef(uid, email), { ...datos, creadoEn: serverTimestamp() })
  return ref.id
}

export const obtenerCatalogo = async (uid, email) => {
  const q = query(catalogoRef(uid, email), orderBy('nombre', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const actualizarItemCatalogo = async (uid, itemId, datos, email) => {
  await updateDoc(catalogoDocRef(uid, email, itemId), datos)
}

export const eliminarItemCatalogo = async (uid, itemId, email) => {
  await deleteDoc(catalogoDocRef(uid, email, itemId))
}

// ── Catálogo de servicios ─────────────────────────────────────────────────────

const catalogoServiciosRef = (uid, email) =>
  isShared(email)
    ? collection(db, 'empresas', SHARED_DOMAIN, 'catalogo_servicios')
    : collection(db, 'usuarios', uid, 'catalogo_servicios')

const catalogoServiciosDocRef = (uid, email, itemId) =>
  isShared(email)
    ? doc(db, 'empresas', SHARED_DOMAIN, 'catalogo_servicios', itemId)
    : doc(db, 'usuarios', uid, 'catalogo_servicios', itemId)

export const guardarItemCatalogoServicios = async (uid, datos, email) => {
  const ref = await addDoc(catalogoServiciosRef(uid, email), { ...datos, creadoEn: serverTimestamp() })
  return ref.id
}

export const obtenerCatalogoServicios = async (uid, email) => {
  const q = query(catalogoServiciosRef(uid, email), orderBy('nombre', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const actualizarItemCatalogoServicios = async (uid, itemId, datos, email) => {
  await updateDoc(catalogoServiciosDocRef(uid, email, itemId), datos)
}

export const eliminarItemCatalogoServicios = async (uid, itemId, email) => {
  await deleteDoc(catalogoServiciosDocRef(uid, email, itemId))
}

// ── Plantillas ────────────────────────────────────────────────────────────────

export const guardarPlantilla = async (uid, datos, email) => {
  const ref = await addDoc(plantillasRef(uid, email), { ...datos, creadoEn: serverTimestamp() })
  return ref.id
}

export const obtenerPlantillas = async (uid, email) => {
  const q = query(plantillasRef(uid, email), orderBy('creadoEn', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const eliminarPlantilla = async (uid, plantillaId, email) => {
  await deleteDoc(plantillaDocRef(uid, email, plantillaId))
}

// ── Config del usuario (empresa + defaults) ──────────────────────────────────

const userConfigDoc = (uid, docId) => doc(db, 'usuarios', uid, 'config', docId)

export const getEmpresaFS = async (uid) => {
  const snap = await getDoc(userConfigDoc(uid, 'empresa'))
  return snap.exists() ? snap.data() : null
}

export const saveEmpresaFS = async (uid, data) => {
  await setDoc(userConfigDoc(uid, 'empresa'), clean(data))
}

export const getConfigDefaultsFS = async (uid) => {
  const snap = await getDoc(userConfigDoc(uid, 'defaults'))
  return snap.exists() ? snap.data() : null
}

export const saveConfigDefaultsFS = async (uid, data) => {
  await setDoc(userConfigDoc(uid, 'defaults'), clean(data))
}

// ── Conexiones / Sistema de compartir ────────────────────────────────────────

export const enviarInvitacion = async (fromUid, fromEmail, fromNombre, toEmail, permiso) => {
  const dest = toEmail.trim().toLowerCase()
  if (dest === fromEmail.toLowerCase()) throw new Error('No puedes invitarte a ti mismo.')

  const qPending = query(
    collection(db, 'invitaciones'),
    where('fromUid', '==', fromUid),
    where('toEmail', '==', dest),
    where('status', '==', 'pending')
  )
  const pendingSnap = await getDocs(qPending)
  if (!pendingSnap.empty) throw new Error('Ya tienes una invitación pendiente para ese correo.')

  const qConex = query(
    collection(db, 'aceptaciones'),
    where('ownerUid', '==', fromUid),
    where('readerEmail', '==', dest)
  )
  const conexSnap = await getDocs(qConex)
  if (!conexSnap.empty) throw new Error('Ya tienes una conexión activa con ese correo.')

  await addDoc(collection(db, 'invitaciones'), {
    fromUid,
    fromEmail: fromEmail.toLowerCase(),
    fromNombre: fromNombre || fromEmail.split('@')[0],
    toEmail: dest,
    permiso,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export const suscribirInvitacionesPendientes = (email, callback) => {
  const q = query(
    collection(db, 'invitaciones'),
    where('toEmail', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  )
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
}

export const obtenerInvitacionesEnviadas = async (fromUid) => {
  const q = query(collection(db, 'invitaciones'), where('fromUid', '==', fromUid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const aceptarInvitacion = async (inv, toUid, toEmail, toNombre) => {
  const batch = writeBatch(db)
  batch.update(doc(db, 'invitaciones', inv.id), {
    status: 'accepted',
    toUid,
    acceptedAt: serverTimestamp(),
  })
  const conexionId = `${inv.fromUid}_${toUid}`
  batch.set(doc(db, 'aceptaciones', conexionId), {
    ownerUid: inv.fromUid,
    ownerEmail: inv.fromEmail,
    ownerNombre: inv.fromNombre,
    readerUid: toUid,
    readerEmail: toEmail.toLowerCase(),
    readerNombre: toNombre || toEmail.split('@')[0],
    permiso: inv.permiso,
    createdAt: serverTimestamp(),
  })
  // Security index within owner's namespace — required for Firestore collection query rules
  batch.set(doc(db, 'usuarios', inv.fromUid, 'sharedWith', toUid), {
    permiso: inv.permiso,
    createdAt: serverTimestamp(),
  })
  await batch.commit()
}

export const rechazarInvitacion = async (invId) => {
  await updateDoc(doc(db, 'invitaciones', invId), { status: 'rejected' })
}

export const cancelarInvitacion = async (invId) => {
  await deleteDoc(doc(db, 'invitaciones', invId))
}

export const obtenerConexionesComoLector = async (myUid) => {
  const q = query(collection(db, 'aceptaciones'), where('readerUid', '==', myUid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const obtenerConexionesComoOwner = async (myUid) => {
  const q = query(collection(db, 'aceptaciones'), where('ownerUid', '==', myUid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const suscribirConexionesComoLector = (myUid, callback) => {
  const q = query(collection(db, 'aceptaciones'), where('readerUid', '==', myUid))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
}

export const eliminarConexion = async (conexionId) => {
  // conexionId = ownerUid_readerUid; Firebase UIDs are alphanumeric so first underscore is the separator
  const idx = conexionId.indexOf('_')
  const ownerUid = conexionId.slice(0, idx)
  const readerUid = conexionId.slice(idx + 1)
  const batch = writeBatch(db)
  batch.delete(doc(db, 'aceptaciones', conexionId))
  batch.delete(doc(db, 'usuarios', ownerUid, 'sharedWith', readerUid))
  await batch.commit()
}

export const asegurarSharedWith = async (ownerUid, readerUid, permiso) => {
  const ref = doc(db, 'usuarios', ownerUid, 'sharedWith', readerUid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { permiso, createdAt: serverTimestamp() })
  }
}

export const obtenerCotizacionesDeOwner = async (ownerUid) => {
  const snap = await getDocs(collection(db, 'usuarios', ownerUid, 'cotizaciones'))
  const cots = snap.docs.map(mapCotizacion)
  return cots.sort((a, b) => (b.fechaDate || 0) - (a.fechaDate || 0))
}

// ── Presencia (indicador tiempo real) ────────────────────────────────────────

const presenciaDocRef = (uid) =>
  doc(db, 'empresas', SHARED_DOMAIN, 'presencia', uid)

export const escribirPresencia = (uid, email, nombre, cotizacionId) =>
  setDoc(presenciaDocRef(uid), {
    uid, email,
    nombre: nombre || email.split('@')[0],
    cotizacionId,
    heartbeat: serverTimestamp(),
  }).catch(() => {})

export const actualizarHeartbeat = (uid) =>
  updateDoc(presenciaDocRef(uid), { heartbeat: serverTimestamp() }).catch(() => {})

export const eliminarPresencia = (uid) =>
  deleteDoc(presenciaDocRef(uid)).catch(() => {})

export const suscribirPresencias = (callback) => {
  const col = collection(db, 'empresas', SHARED_DOMAIN, 'presencia')
  return onSnapshot(
    col,
    (snap) => {
      const now = Date.now()
      const map = {}
      snap.docs.forEach((d) => {
        const p = d.data()
        const ms = p.heartbeat?.toDate?.()?.getTime() || 0
        if (now - ms < 120_000 && p.cotizacionId) {
          if (!map[p.cotizacionId]) map[p.cotizacionId] = []
          map[p.cotizacionId].push(p)
        }
      })
      callback(map)
    },
    () => {} // silencia errores de permisos de Firestore sin romper la app
  )
}
