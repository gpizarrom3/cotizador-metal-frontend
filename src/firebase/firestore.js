import { db } from './config'
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, setDoc, increment,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore'

const SHARED_DOMAIN = 'innovattech.org'

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

export const guardarCotizacion = async (uid, datos, email) => {
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

  const extra = isShared(email) ? { creadoPorUid: uid, creadoPor: datos.empresa?.nombre || email } : {}

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
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      fecha: data.fecha?.toDate?.()?.toLocaleDateString('es-CL') ?? '—',
    }
  })
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
    await setDoc(doc(sharedCol, d.id), {
      ...d.data(),
      creadoPorUid: uid,
    })
    await deleteDoc(d.ref)
  }

  return snap.size
}
