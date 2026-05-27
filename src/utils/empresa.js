const KEY = 'cotizador_empresa'

export const getEmpresa = () => {
  try {
    const s = localStorage.getItem(KEY)
    return s ? JSON.parse(s) : {}
  } catch {
    return {}
  }
}

export const saveEmpresa = (data) => {
  localStorage.setItem(KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('empresaActualizada'))
}
