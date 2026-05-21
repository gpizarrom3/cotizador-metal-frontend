import { db } from './config'
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, setDoc, increment,
  query, orderBy, serverTimestamp, onSnapshot,
} from 'firebase/firestore'

export const SHARED_DOMAIN = 'innovattech.org'

const isShared = (email) => email?.toLowerCase().endsWith(`@${SHARED_DOMAIN}`)

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

const mapCotizacion = (d) => {
  const data = d.data()
  return {
    id: d.id,
    ...data,
    fecha: data.fecha?.toDate?.()?.toLocaleDateString('es-CL') ?? '—',
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

  const ref = await addDoc(cotizacionesRef(uid, email), {
    ...datos,
    ...extra,
    numero,
    fecha: serverTimestamp(),
    estado: 'Pendiente',
  })

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
  await updateDoc(cotizacionDocRef(uid, email, cotId), {
    ...datos,
    fechaActualizacion: serverTimestamp(),
  })
}

export const eliminarCotizacion = async (uid, cotId, email) => {
  await deleteDoc(cotizacionDocRef(uid, email, cotId))
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

  // Fix shared counter to avoid duplicate numbers
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
  const ref = await addDoc(clientesRef(uid, email), {
    ...datos,
    creadoEn: serverTimestamp(),
  })
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
