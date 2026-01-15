import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import LoadProduct from './pages/LoadProduct'
import Alerts from './pages/Alerts'
import Inventory from './pages/Inventory'
import About from './pages/About'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      {/* Info Button - Top Right, Secondary Action */}
      <Link
        to="/acerca"
        className="info-btn"
        aria-label="Acerca de la aplicación"
        title="Acerca de"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </Link>

      <Routes>
        <Route path="/" element={<LoadProduct />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/acerca" element={<About />} />
      </Routes>

      {/* Bottom Navigation - Primary Actions Only */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📦</span>
          <span className="nav-label">Cargar</span>
        </NavLink>
        <NavLink to="/alertas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🔔</span>
          <span className="nav-label">Alertas</span>
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
