import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginWithEmail, loginWithGoogle, getGoogleRedirectResult } from '../firebase/auth'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    getGoogleRedirectResult().catch((err) => {
      if (err?.code) setError(getFirebaseError(err.code))
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(getFirebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      // Redirect to Google happens — page navigates away, no result here
    } catch (err) {
      setError(getFirebaseError(err.code))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7V3H9V7M15 7V3H17V7" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7H21V21H3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11H10V14H7ZM14 11H17V14H14Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21V17H14V21" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-100">CotizaMetal</h1>
          <p className="text-stone-400 mt-1 text-sm">Sistema de cotización metalmecánica</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-stone-100 mb-6">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                className="input-field"
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="text-right mt-2">
            <Link to="/forgot-password" className="text-stone-400 hover:text-amber-500 text-xs transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-stone-800 px-3 text-stone-400">o continúa con</span>
            </div>
          </div>

          <button onClick={handleGoogle} className="btn-google" disabled={loading}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <p className="text-center text-stone-400 text-sm mt-5">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-amber-500 hover:text-amber-400 font-medium">
              Regístrate aquí
            </Link>
          </p>

          <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-stone-700">
            <Link to="/terminos" className="text-stone-600 hover:text-stone-400 text-xs">Términos y Condiciones</Link>
            <Link to="/privacidad" className="text-stone-600 hover:text-stone-400 text-xs">Política de Privacidad</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function getFirebaseError(code) {
  const errors = {
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
  }
  return errors[code] || 'Ocurrió un error. Intenta nuevamente.'
}
