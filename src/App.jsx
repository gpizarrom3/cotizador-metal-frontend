import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Cotizador from './pages/Cotizador'
import Historial from './pages/Historial'
import Clientes from './pages/Clientes'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={<PrivateRoute><Dashboard /></PrivateRoute>}
        />
        <Route
          path="/cotizador"
          element={<PrivateRoute><Cotizador /></PrivateRoute>}
        />
        <Route
          path="/historial"
          element={<PrivateRoute><Historial /></PrivateRoute>}
        />
        <Route
          path="/clientes"
          element={<PrivateRoute><Clientes /></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
