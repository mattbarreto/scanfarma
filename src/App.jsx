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

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="icon">📦</span>
          <span>Cargar</span>
        </NavLink>
        <NavLink to="/alertas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="icon">🔔</span>
          <span>Alertas</span>
        </NavLink>
        <NavLink to="/inventario" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="icon">📋</span>
          <span>Inventario</span>
        </NavLink>
      </nav>
    </BrowserRouter>
  )
}

export default App
