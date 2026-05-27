import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import {
  escribirPresencia, actualizarHeartbeat, eliminarPresencia, SHARED_DOMAIN,
} from '../firebase/firestore'

export function usePresencia(cotizacionId) {
  const { user } = useAuth()
  const timerRef = useRef(null)

  const isShared = user?.email?.toLowerCase().endsWith(`@${SHARED_DOMAIN}`)

  useEffect(() => {
    if (!cotizacionId || !user || !isShared) return

    escribirPresencia(user.uid, user.email, user.displayName, cotizacionId)

    timerRef.current = setInterval(() => {
      actualizarHeartbeat(user.uid)
    }, 30_000)

    const cleanup = () => eliminarPresencia(user.uid)
    window.addEventListener('beforeunload', cleanup)

    return () => {
      clearInterval(timerRef.current)
      window.removeEventListener('beforeunload', cleanup)
      eliminarPresencia(user.uid)
    }
  }, [cotizacionId, user?.uid])
}
