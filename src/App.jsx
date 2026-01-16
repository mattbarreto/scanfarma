import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChange, logout, getSession, getUserProfile } from './lib/authService'
import UserMenu from './components/UserMenu'
import LoadProduct from './pages/LoadProduct'
import Alerts from './pages/Alerts'
import Inventory from './pages/Inventory'
import Intelligence from './pages/Intelligence'
import Sales from './pages/Sales'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import './index.css'

// Protected route wrapper
function ProtectedRoute({ children, session }) {
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    getSession().then(sess => {
      setSession(sess)
      if (sess?.user) {
        loadProfile(sess.user.id)
      }
      setIsLoading(false)
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = onAuthStateChange((event, sess) => {
      console.log('Auth event:', event)
      setSession(sess)

      if (sess?.user) {
        loadProfile(sess.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await getUserProfile(userId)
    setProfile(data)
  }

  const handleLogout = async () => {
    await logout()
    setSession(null)
    setProfile(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="spinner"></div>
      </div>
    )
  }

  // Not logged in - show login/register routes only
  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // Logged in - show app
  return (
    <BrowserRouter>
      {/* User Menu - Top Right */}
      <UserMenu
        userName={profile?.pharmacy_name || session.user.email}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={<ProtectedRoute session={session}><LoadProduct /></ProtectedRoute>} />
        <Route path="/alertas" element={<ProtectedRoute session={session}><Alerts /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute session={session}><Inventory /></ProtectedRoute>} />
        <Route path="/inteligencia" element={<ProtectedRoute session={session}><Intelligence /></ProtectedRoute>} />
        <Route path="/ventas" element={<ProtectedRoute session={session}><Sales /></ProtectedRoute>} />
        <Route path="/acerca" element={<About />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📦</span>
          <span className="nav-label">Cargar</span>
        </NavLink>
        <NavLink to="/alertas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🔔</span>
          <span className="nav-label">Alertas</span>
        </NavLink>
        <NavLink to="/inteligencia" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🧠</span>
          <span className="nav-label">Inteligencia</span>
        </NavLink>
        <NavLink to="/inventario" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📋</span>
          <span className="nav-label">Inventario</span>
        </NavLink>
      </nav>
    </BrowserRouter>
  )
}

export default App
