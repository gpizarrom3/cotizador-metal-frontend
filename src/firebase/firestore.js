import { db } from './config'
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, setDoc, increment, deleteField,
  query, orderBy, where, writeBatch, serverTimestamp, onSnapshot,
} from 'firebase/firestore'

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

export const guardarCotizacion = async (uid, datos) => {
  const cRef = doc(db, 'usuarios', uid, 'meta', 'counter')
  const snap = await getDoc(cRef)

  let num = 1
  if (snap.exists()) {
    num = (snap.data().ultimo || 0) + 1
    await updateDoc(cRef, { ultimo: increment(1) })
  } else {
    await setDoc(cRef, { ultimo: 1 })
  }

  const numero = `COT-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`

  const ref = await addDoc(collection(db, 'usuarios', uid, 'cotizaciones'), clean({
    ...datos,
    numero,
    fecha: serverTimestamp(),
    estado: 'Pendiente',
  }))

  return { id: ref.id, numero }
}

export const obtenerCotizaciones = async (uid) => {
  const q = query(collection(db, 'usuarios', uid, 'cotizaciones'), orderBy('fecha', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(mapCotizacion)
}

export const suscribirCotizaciones = (uid, callback, onError) => {
  const q = query(collection(db, 'usuarios', uid, 'cotizaciones'), orderBy('fecha', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map(mapCotizacion)), onError || (() => {}))
}

export const actualizarEstado = async (uid, cotId, estado) => {
  await updateDoc(doc(db, 'usuarios', uid, 'cotizaciones', cotId), { estado })
}

export const actualizarCotizacion = async (uid, cotId, datos) => {
  // Exclude `fecha` so we never overwrite the original serverTimestamp with a string
  const { fecha: _fecha, ...datosRest } = datos
  await updateDoc(doc(db, 'usuarios', uid, 'cotizaciones', cotId), clean({
    ...datosRest,
    fechaActualizacion: serverTimestamp(),
  }))
}

export const eliminarCotizacion = async (uid, cotId) => {
  await deleteDoc(doc(db, 'usuarios', uid, 'cotizaciones', cotId))
}

export const actualizarFichasTecnicas = async (uid, cotId, archivos) => {
  await updateDoc(doc(db, 'usuarios', uid, 'cotizaciones', cotId), { fichasTecnicas: archivos })
}

// ── Clientes ─────────────────────────────────────────────────────────────────

export const guardarCliente = async (uid, datos) => {
  const ref = await addDoc(collection(db, 'usuarios', uid, 'clientes'), { ...datos, creadoEn: serverTimestamp() })
  return ref.id
}

export const obtenerClientes = async (uid) => {
  const q = query(collection(db, 'usuarios', uid, 'clientes'), orderBy('nombre', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const actualizarCliente = async (uid, clienteId, datos) => {
  await updateDoc(doc(db, 'usuarios', uid, 'clientes', clienteId), datos)
}

export const eliminarCliente = async (uid, clienteId) => {
  await deleteDoc(doc(db, 'usuarios', uid, 'clientes', clienteId))
}

// ── Catálogo de materiales ───────────────────────────────────────────────────

export const guardarItemCatalogo = async (uid, datos) => {
  const ref = await addDoc(collection(db, 'usuarios', uid, 'catalogo'), { ...datos, creadoEn: serverTimestamp() })
  return ref.id
}

export const obtenerCatalogo = async (uid) => {
  const q = query(collection(db, 'usuarios', uid, 'catalogo'), orderBy('nombre', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const actualizarItemCatalogo = async (uid, itemId, datos) => {
  await updateDoc(doc(db, 'usuarios', uid, 'catalogo', itemId), datos)
}

export const eliminarItemCatalogo = async (uid, itemId) => {
  await deleteDoc(doc(db, 'usuarios', uid, 'catalogo', itemId))
}

// ── Catálogo de servicios ─────────────────────────────────────────────────────

export const guardarItemCatalogoServicios = async (uid, datos) => {
  const ref = await addDoc(collection(db, 'usuarios', uid, 'catalogo_servicios'), { ...datos, creadoEn: serverTimestamp() })
  return ref.id
}

export const obtenerCatalogoServicios = async (uid) => {
  const q = query(collection(db, 'usuarios', uid, 'catalogo_servicios'), orderBy('nombre', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const actualizarItemCatalogoServicios = async (uid, itemId, datos) => {
  await updateDoc(doc(db, 'usuarios', uid, 'catalogo_servicios', itemId), datos)
}

export const eliminarItemCatalogoServicios = async (uid, itemId) => {
  await deleteDoc(doc(db, 'usuarios', uid, 'catalogo_servicios', itemId))
}

// ── Plantillas ────────────────────────────────────────────────────────────────

export const guardarPlantilla = async (uid, datos) => {
  const ref = await addDoc(collection(db, 'usuarios', uid, 'plantillas'), { ...datos, creadoEn: serverTimestamp() })
  return ref.id
}

export const obtenerPlantillas = async (uid) => {
  const q = query(collection(db, 'usuarios', uid, 'plantillas'), orderBy('creadoEn', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const eliminarPlantilla = async (uid, plantillaId) => {
  await deleteDoc(doc(db, 'usuarios', uid, 'plantillas', plantillaId))
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

export const enviarInvitacion = async (fromUid, fromEmail, fromNombre, toEmail, permiso, tipo = 'individual') => {
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
    tipo,
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
  const tipo = inv.tipo || 'individual'
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
    tipo,
    createdAt: serverTimestamp(),
  })
  batch.set(doc(db, 'usuarios', inv.fromUid, 'sharedWith', toUid), {
    permiso: inv.permiso,
    createdAt: serverTimestamp(),
  })
  await batch.commit()
  // Write sharedReaders on owner's root doc AFTER batch (aceptacion must exist for the rule)
  await setDoc(doc(db, 'usuarios', inv.fromUid), {
    sharedReaders: { [toUid]: inv.permiso },
  }, { merge: true })
  // Para mutua: también registrar acceso inverso (el lector puede ser leído por el dueño)
  if (tipo === 'mutua') {
    await setDoc(doc(db, 'usuarios', toUid), {
      sharedReaders: { [inv.fromUid]: inv.permiso },
    }, { merge: true })
  }
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

export const eliminarConexion = async (conexionId, tipo = 'individual') => {
  // conexionId = ownerUid_readerUid; Firebase UIDs are alphanumeric so first underscore is the separator
  const idx = conexionId.indexOf('_')
  const ownerUid = conexionId.slice(0, idx)
  const readerUid = conexionId.slice(idx + 1)
  const batch = writeBatch(db)
  batch.delete(doc(db, 'aceptaciones', conexionId))
  batch.delete(doc(db, 'usuarios', ownerUid, 'sharedWith', readerUid))
  await batch.commit()
  try {
    await updateDoc(doc(db, 'usuarios', ownerUid), {
      [`sharedReaders.${readerUid}`]: deleteField(),
    })
  } catch { /* root doc may not exist */ }
  // Para mutua: también limpiar el acceso inverso
  if (tipo === 'mutua') {
    try {
      await updateDoc(doc(db, 'usuarios', readerUid), {
        [`sharedReaders.${ownerUid}`]: deleteField(),
      })
    } catch { /* root doc may not exist */ }
  }
}

export const asegurarSharedWith = async (ownerUid, readerUid, permiso) => {
  await setDoc(doc(db, 'usuarios', ownerUid), {
    sharedReaders: { [readerUid]: permiso },
  }, { merge: true })
}

export const obtenerCotizacionesDeOwner = async (ownerUid) => {
  const snap = await getDocs(collection(db, 'usuarios', ownerUid, 'cotizaciones'))
  const cots = snap.docs.map(mapCotizacion)
  return cots.sort((a, b) => (b.fechaDate || 0) - (a.fechaDate || 0))
}
