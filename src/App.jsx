import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChange, logout, getSession, getUserProfile } from './lib/authService'
import UserMenu from './components/UserMenu'
import Icon from './components/Icon'
import LoadProduct from './pages/LoadProduct'
import Alerts from './pages/Alerts'
import Inventory from './pages/Inventory'
import Intelligence from './pages/Intelligence'
import Sales from './pages/Sales'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import './index.css'

import { supabase } from './lib/supabase'

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

  // Badge States
  const [expiredCount, setExpiredCount] = useState(0)
  const [expiringCount, setExpiringCount] = useState(0)

  useEffect(() => {
    // Obtener sesión inicial
    getSession().then(sess => {
      setSession(sess)
      if (sess?.user) {
        loadProfile(sess.user.id)
        fetchBadgeCounts()
      }
      setIsLoading(false)
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = onAuthStateChange((event, sess) => {
      console.log('Auth event:', event)
      setSession(sess)

      if (sess?.user) {
        loadProfile(sess.user.id)
        fetchBadgeCounts()
      } else {
        setProfile(null)
        setExpiredCount(0)
        setExpiringCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await getUserProfile(userId)
    setProfile(data)
  }

  const fetchBadgeCounts = async () => {
    try {
      // Query directa a tabla batches (respeta RLS)
      const { data, error } = await supabase
        .from('batches')
        .select('expiration_date, quantity_remaining')
        .gt('quantity_remaining', 0)

      if (error) throw error

      // Calcular status en JS (misma lógica que tenía la vista)
      const today = new Date().toISOString().split('T')[0]
      const in30Days = new Date()
      in30Days.setDate(in30Days.getDate() + 30)
      const in30DaysStr = in30Days.toISOString().split('T')[0]

      let expired = 0
      let expiring = 0

      for (const batch of data) {
        if (batch.expiration_date <= today) {
          expired++
        } else if (batch.expiration_date <= in30DaysStr) {
          expiring++
        }
      }

      setExpiredCount(expired)
      setExpiringCount(expiring)
    } catch (err) {
      console.error('Error fetching badge counts:', err)
    }
  }

  const handleLogout = async () => {
    await logout()
    setSession(null)
    setProfile(null)
    setExpiredCount(0)
    setExpiringCount(0)
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

  // Badge Logic Calculation
  let badgeContent = null
  let badgeClass = ''
  let badgeLabel = ''

  if (expiredCount > 0) {
    badgeContent = expiredCount > 99 ? '99+' : expiredCount
    badgeClass = 'error'
    badgeLabel = `${expiredCount} productos vencidos`
  } else if (expiringCount > 0) {
    badgeContent = expiringCount > 99 ? '99+' : expiringCount
    badgeClass = 'warning'
    badgeLabel = `${expiringCount} productos por vencer`
  }

  // Logged in - show app
  return (
    <BrowserRouter>
      {/* User Menu - Top Right */}
      <UserMenu
        userName={profile?.pharmacy_name || session.user.email}
        userId={session.user.id}
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
          <span className="nav-icon"><Icon name="package" size={24} /></span>
          <span className="nav-label">Cargar</span>
        </NavLink>
        <NavLink to="/alertas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">
            <Icon name="bell" size={24} />
            {badgeContent && (
              <span
                key={`${badgeClass}-${badgeContent}`} // Key forces animation reset on change
                className={`notification-badge ${badgeClass}`}
                aria-label={badgeLabel}
              >
                {badgeContent}
              </span>
            )}
          </span>
          <span className="nav-label">Alertas</span>
        </NavLink>
        <NavLink to="/inteligencia" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><Icon name="brain" size={24} /></span>
          <span className="nav-label">Inteligencia</span>
        </NavLink>
        <NavLink to="/inventario" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><Icon name="clipboard" size={24} /></span>
          <span className="nav-label">Inventario</span>
        </NavLink>
      </nav>
    </BrowserRouter>
  )
}

export default App
