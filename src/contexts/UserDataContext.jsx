import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getEmpresaFS, saveEmpresaFS, getConfigDefaultsFS, saveConfigDefaultsFS } from '../firebase/firestore'
import { DEFAULT_CONFIG_VALUES, setConfigDefaultsUid } from '../utils/configDefaults'
import { setEmpresaUid } from '../utils/empresa'

const UserDataContext = createContext(null)

const lsRead = (k, fallback) => {
  try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fallback }
  catch { return fallback }
}

const empresaKey  = (uid) => `cotizador_empresa_${uid}`
const configKey   = (uid) => `cotizador_config_${uid}`

const mergeConfig = (raw) => ({
  roles:     raw?.roles    ?? DEFAULT_CONFIG_VALUES.roles,
  servicios: { ...DEFAULT_CONFIG_VALUES.servicios, ...(raw?.servicios ?? {}) },
  bases:     raw?.bases    ?? DEFAULT_CONFIG_VALUES.bases,
})

export function UserDataProvider({ children }) {
  const { user } = useAuth()

  // Set UID synchronously during render so getEmpresa/getConfigDefaults use the right key
  // before any child component's useState initializer runs.
  setEmpresaUid(user?.uid || null)
  setConfigDefaultsUid(user?.uid || null)

  const [empresa, setEmpresaState] = useState(() =>
    lsRead('cotizador_empresa', {})
  )
  const [configDefaults, setConfigDefaultsState] = useState(() =>
    mergeConfig(lsRead('cotizador_config_defaults', null))
  )

  useEffect(() => {
    if (!user?.uid) return
    const uid = user.uid

    getEmpresaFS(uid)
      .then((data) => {
        if (data) {
          setEmpresaState(data)
          localStorage.setItem(empresaKey(uid), JSON.stringify(data))
        } else {
          // Migrate from UID-prefixed or legacy localStorage to Firestore
          const local = lsRead(empresaKey(uid), null) ?? lsRead('cotizador_empresa', null)
          if (local) {
            setEmpresaState(local)
            saveEmpresaFS(uid, local).catch(() => {})
          }
          localStorage.setItem(empresaKey(uid), JSON.stringify(local ?? {}))
        }
      })
      .catch(() => {})

    getConfigDefaultsFS(uid)
      .then((data) => {
        if (data) {
          const merged = mergeConfig(data)
          setConfigDefaultsState(merged)
          localStorage.setItem(configKey(uid), JSON.stringify(merged))
        } else {
          const local = lsRead(configKey(uid), null) ?? lsRead('cotizador_config_defaults', null)
          const merged = mergeConfig(local)
          setConfigDefaultsState(merged)
          localStorage.setItem(configKey(uid), JSON.stringify(merged))
          if (local) saveConfigDefaultsFS(uid, merged).catch(() => {})
        }
      })
      .catch(() => {})
  }, [user?.uid])

  const saveEmpresa = (data) => {
    setEmpresaState(data)
    window.dispatchEvent(new CustomEvent('empresaActualizada'))
    if (user?.uid) {
      localStorage.setItem(empresaKey(user.uid), JSON.stringify(data))
      saveEmpresaFS(user.uid, data).catch(() => {})
    } else {
      localStorage.setItem('cotizador_empresa', JSON.stringify(data))
    }
  }

  const saveConfigDefaults = (data) => {
    setConfigDefaultsState(data)
    if (user?.uid) {
      localStorage.setItem(configKey(user.uid), JSON.stringify(data))
      saveConfigDefaultsFS(user.uid, data).catch(() => {})
    } else {
      localStorage.setItem('cotizador_config_defaults', JSON.stringify(data))
    }
  }

  return (
    <UserDataContext.Provider value={{ empresa, configDefaults, saveEmpresa, saveConfigDefaults }}>
      {children}
    </UserDataContext.Provider>
  )
}

export const useUserData = () => {
  const ctx = useContext(UserDataContext)
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider')
  return ctx
}
