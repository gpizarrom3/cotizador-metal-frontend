import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ADMIN_EMAIL = 'guillermopizarro@innovattech.org'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user || user.email !== ADMIN_EMAIL) return <Navigate to="/dashboard" replace />

  return children
}
