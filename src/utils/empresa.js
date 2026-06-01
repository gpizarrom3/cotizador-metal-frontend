const LEGACY_KEY = 'cotizador_empresa'
let _uid = null

export const setEmpresaUid = (uid) => { _uid = uid }

const key = () => _uid ? `cotizador_empresa_${_uid}` : LEGACY_KEY

export const getEmpresa = () => {
  try {
    const s = localStorage.getItem(key())
    return s ? JSON.parse(s) : {}
  } catch {
    return {}
  }
}

export const saveEmpresa = (data) => {
  localStorage.setItem(key(), JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('empresaActualizada'))
}
