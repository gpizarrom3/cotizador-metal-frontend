// Agrega perimetro_mm a cada item del CATALOGO_BASE
// Vigas IPE/HEB/HEA y UPN usan valores tabulados de catálogo ArcelorMittal (EN)
// Tubos, barras, ángulos y platinas se calculan geométricamente
import { readFileSync, writeFileSync } from 'fs'

const PERIMETROS_TABULADOS = {
  // Vigas IPE (perímetro pintado mm, fuente: ArcelorMittal Orange Book)
  'Viga IPE 80': 340, 'Viga IPE 100': 400, 'Viga IPE 120': 459, 'Viga IPE 140': 521,
  'Viga IPE 160': 585, 'Viga IPE 180': 648, 'Viga IPE 200': 710, 'Viga IPE 220': 776,
  'Viga IPE 240': 841, 'Viga IPE 270': 932, 'Viga IPE 300': 1035, 'Viga IPE 330': 1133,
  'Viga IPE 360': 1234, 'Viga IPE 400': 1362, 'Viga IPE 450': 1510, 'Viga IPE 500': 1664,
  'Viga IPE 550': 1818, 'Viga IPE 600': 1975,
  // Vigas HEB
  'Viga HEB 100': 424, 'Viga HEB 120': 508, 'Viga HEB 140': 591, 'Viga HEB 160': 674,
  'Viga HEB 180': 756, 'Viga HEB 200': 839, 'Viga HEB 220': 922, 'Viga HEB 240': 1005,
  'Viga HEB 260': 1088, 'Viga HEB 280': 1172, 'Viga HEB 300': 1255, 'Viga HEB 320': 1338,
  'Viga HEB 340': 1422, 'Viga HEB 360': 1506, 'Viga HEB 400': 1648, 'Viga HEB 450': 1849,
  'Viga HEB 500': 2049, 'Viga HEB 550': 2252, 'Viga HEB 600': 2454,
  // Vigas HEA
  'Viga HEA 100': 393, 'Viga HEA 120': 476, 'Viga HEA 140': 558, 'Viga HEA 160': 640,
  'Viga HEA 180': 722, 'Viga HEA 200': 804, 'Viga HEA 220': 887, 'Viga HEA 240': 970,
  'Viga HEA 260': 1052, 'Viga HEA 280': 1134, 'Viga HEA 300': 1216, 'Viga HEA 320': 1299,
  'Viga HEA 340': 1382, 'Viga HEA 360': 1465, 'Viga HEA 400': 1612, 'Viga HEA 450': 1811,
  'Viga HEA 500': 2009, 'Viga HEA 550': 2208, 'Viga HEA 600': 2406,
  // Perfiles UPN
  'Perfil UPN 30': 123, 'Perfil UPN 40': 144, 'Perfil UPN 50': 167, 'Perfil UPN 60': 190,
  'Perfil UPN 65': 200, 'Perfil UPN 80': 226, 'Perfil UPN 100': 265, 'Perfil UPN 120': 313,
  'Perfil UPN 140': 360, 'Perfil UPN 160': 407, 'Perfil UPN 180': 456, 'Perfil UPN 200': 505,
  'Perfil UPN 220': 556, 'Perfil UPN 240': 606, 'Perfil UPN 260': 658, 'Perfil UPN 280': 709,
  'Perfil UPN 300': 761, 'Perfil UPN 320': 820, 'Perfil UPN 350': 893, 'Perfil UPN 400': 998,
}

function calcPerimetro(nombre, tipo, formato) {
  if (PERIMETROS_TABULADOS[nombre] !== undefined) return PERIMETROS_TABULADOS[nombre]
  if (tipo === 'plancha') return null

  // Tubo cuadrado A×A×tmm → 4×A
  if (nombre.startsWith('Tubo cuadrado')) {
    const m = formato.match(/^(\d+)×/)
    if (m) return 4 * Number(m[1])
  }

  // Tubo rectangular A×B×tmm → 2×(A+B)
  if (nombre.startsWith('Tubo rectangular')) {
    const m = formato.match(/^(\d+)×(\d+)×/)
    if (m) return 2 * (Number(m[1]) + Number(m[2]))
  }

  // Tubo redondo Ø D.Dmm e=tmm → π×D
  if (nombre.startsWith('Tubo redondo')) {
    const m = nombre.match(/Ø\s*([\d.]+)mm/)
    if (m) return Math.round(Math.PI * Number(m[1]))
  }

  // Barra redonda Ø Dmm → π×D
  if (nombre.startsWith('Barra redonda')) {
    const m = formato.match(/Ø\s*([\d.]+)mm/)
    if (m) return Math.round(Math.PI * Number(m[1]))
  }

  // Barra cuadrada maciza A×Amm → 4×A
  if (nombre.startsWith('Barra cuadrada')) {
    const m = formato.match(/^(\d+)×/)
    if (m) return 4 * Number(m[1])
  }

  // Ángulo L A×B×tmm → 2×(A+B)
  if (nombre.startsWith('Ángulo')) {
    const m = formato.match(/^(\d+)×(\d+)×/)
    if (m) return 2 * (Number(m[1]) + Number(m[2]))
  }

  // Platina A×tmm → 2×(A+t)
  if (nombre.startsWith('Platina')) {
    const m = formato.match(/^(\d+)×(\d+)mm$/)
    if (m) return 2 * (Number(m[1]) + Number(m[2]))
  }

  return null
}

const content = readFileSync('src/data/catalogoBase.js', 'utf-8')
const lines = content.split('\n')

let processed = 0
let skipped = 0

const newLines = lines.map(line => {
  if (!line.includes('peso_por_metro:') || !line.includes('proveedor:')) return line
  if (line.includes('perimetro_mm:')) return line // already has it

  const nombreMatch = line.match(/nombre:\s*'([^']+)'/)
  const tipoMatch = line.match(/tipo:\s*'([^']+)'/)
  const formatoMatch = line.match(/formato:\s*'([^']+)'/)
  if (!nombreMatch) return line

  const nombre = nombreMatch[1]
  const tipo = tipoMatch?.[1] || ''
  const formato = formatoMatch?.[1] || ''

  const p = calcPerimetro(nombre, tipo, formato)
  if (p === null) {
    skipped++
    return line
  }

  processed++
  return line.replace(/(proveedor:\s*'')/, `perimetro_mm: ${p},  $1`)
})

writeFileSync('src/data/catalogoBase.js', newLines.join('\n'), 'utf-8')
console.log(`Listo: ${processed} items con perimetro_mm, ${skipped} sin perimetro (planchas).`)
