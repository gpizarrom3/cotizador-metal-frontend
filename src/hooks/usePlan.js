import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './useAuth'

export function usePlan() {
  const { user } = useAuth()
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setPlan('free')
      setLoading(false)
      return
    }
    const ref = doc(db, 'suscripciones', user.uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data()
        const isActive = data?.status === 'active' || data?.status === 'trialing'
        setPlan(isActive ? 'pro' : 'free')
        setLoading(false)
      },
      () => { setPlan('free'); setLoading(false) }
    )
    return unsub
  }, [user])

  return { plan, loading, isPro: plan === 'pro' }
}
