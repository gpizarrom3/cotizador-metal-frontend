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
import Conexiones from './pages/Conexiones'
import Catalogo from './pages/Catalogo'
import CatalogoServicios from './pages/CatalogoServicios'
import Planes from './pages/Planes'
import PrivateRoute from './components/PrivateRoute'
import Terminos from './pages/Terminos'
import Privacidad from './pages/Privacidad'
import Landing from './pages/Landing'

function App() {
  return (
    <BrowserRouter>
      <UserDataProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
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
          path="/conexiones"
          element={<PrivateRoute><Conexiones /></PrivateRoute>}
        />
        <Route
          path="/configuracion"
          element={<PrivateRoute><Configuracion /></PrivateRoute>}
        />
        <Route
          path="/planes"
          element={<PrivateRoute><Planes /></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </UserDataProvider>
    </BrowserRouter>
  )
}

export default App
