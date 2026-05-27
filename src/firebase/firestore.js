import { db } from './config'
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, setDoc, increment,
  query, orderBy, serverTimestamp, onSnapshot,
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

export const suscribirCotizaciones = (uid, email, callback) => {
  const q = query(cotizacionesRef(uid, email), orderBy('fecha', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map(mapCotizacion)))
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
