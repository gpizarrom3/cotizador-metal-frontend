export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function handleCors(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return true }
  return false
}
