import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserDataProvider } from './contexts/UserDataContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Cotizador from './pages/Cotizador'
import Historial from './pages/Historial'
import Clientes from './pages/Clientes'
import Configuracion from './pages/Configuracion'
import Catalogo from './pages/Catalogo'
import CatalogoServicios from './pages/CatalogoServicios'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <BrowserRouter>
      <UserDataProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
        <Route
          path="/catalogo"
          element={<PrivateRoute><Catalogo /></PrivateRoute>}
        />
        <Route
          path="/catalogo-servicios"
          element={<PrivateRoute><CatalogoServicios /></PrivateRoute>}
        />
        <Route
          path="/configuracion"
          element={<PrivateRoute><Configuracion /></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </UserDataProvider>
    </BrowserRouter>
  )
}

export default App
