import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import LoadProduct from './pages/LoadProduct'
import Alerts from './pages/Alerts'
import Inventory from './pages/Inventory'
import About from './pages/About'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoadProduct />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/acerca" element={<About />} />
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
        <NavLink to="/acerca" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">ℹ️</span>
          <span className="nav-label">Info</span>
        </NavLink>
      </nav>
    </BrowserRouter>
  )
}

export default App
