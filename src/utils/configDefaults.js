const KEY = 'cotizador_config_defaults'

export const DEFAULT_CONFIG_VALUES = {
  roles: [
    { nombre: 'Soldador',   precio_hora: 20000 },
    { nombre: 'Ayudante',   precio_hora: 15000 },
    { nombre: 'Fresador',   precio_hora: 25000 },
    { nombre: 'Tornero',    precio_hora: 25000 },
    { nombre: 'Ingeniero',  precio_hora: 30000 },
  ],
  servicios: {
    corte_plasma: { precio_ref: 1300,  unidad: 'kg' },
    corte_laser:  { precio_ref: 0,     unidad: 'kg' },
    oxicorte:     { precio_ref: 0,     unidad: 'kg' },
    plegado:      { precio_ref: 2000,  unidad: 'pliegue' },
    cilindrado:   { precio_ref: 1800,  unidad: 'kg' },
  },
  bases: [
    { nombre: 'Gastos Generales',   porcentaje: 20 },
    { nombre: 'Utilidades',         porcentaje: 25 },
    { nombre: 'Costos Financieros', porcentaje: 6  },
    { nombre: 'Imprevistos',        porcentaje: 2  },
  ],
}

export const getConfigDefaults = () => {
  try {
    const s = localStorage.getItem(KEY)
    if (!s) return DEFAULT_CONFIG_VALUES
    const saved = JSON.parse(s)
    return {
      roles:    saved.roles    ?? DEFAULT_CONFIG_VALUES.roles,
      servicios: { ...DEFAULT_CONFIG_VALUES.servicios, ...saved.servicios },
      bases:    saved.bases    ?? DEFAULT_CONFIG_VALUES.bases,
    }
  } catch {
    return DEFAULT_CONFIG_VALUES
  }
}

export const saveConfigDefaults = (data) => {
  localStorage.setItem(KEY, JSON.stringify(data))
}
