import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import LoadProduct from './pages/LoadProduct'
import Alerts from './pages/Alerts'
import Inventory from './pages/Inventory'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoadProduct />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/inventario" element={<Inventory />} />
      </Routes>

      {/* Bottom Navigation - Premium Style */}
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

      {/* Subtle branding - Separated from navigation */}
      <div className="app-branding">
        <a href="https://matiasbarreto.com/" target="_blank" rel="noopener noreferrer">
          por Matías Barreto
        </a>
      </div>
    </BrowserRouter>
  )
}

export default App
