import { db } from './config'
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, setDoc, increment,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore'

export const guardarCotizacion = async (uid, datos) => {
  const counterRef = doc(db, 'usuarios', uid, 'meta', 'counter')
  const snap = await getDoc(counterRef)

  let num = 1
  if (snap.exists()) {
    num = (snap.data().ultimo || 0) + 1
    await updateDoc(counterRef, { ultimo: increment(1) })
  } else {
    await setDoc(counterRef, { ultimo: 1 })
  }

  const numero = `COT-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`

  const ref = await addDoc(collection(db, 'usuarios', uid, 'cotizaciones'), {
    ...datos,
    numero,
    fecha: serverTimestamp(),
    estado: 'Pendiente',
  })

  return { id: ref.id, numero }
}

export const obtenerCotizaciones = async (uid) => {
  const q = query(
    collection(db, 'usuarios', uid, 'cotizaciones'),
    orderBy('fecha', 'desc')
  )
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

export const actualizarEstado = async (uid, cotId, estado) => {
  await updateDoc(doc(db, 'usuarios', uid, 'cotizaciones', cotId), { estado })
}

export const eliminarCotizacion = async (uid, cotId) => {
  await deleteDoc(doc(db, 'usuarios', uid, 'cotizaciones', cotId))
}
