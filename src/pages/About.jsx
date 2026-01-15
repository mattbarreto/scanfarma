import { Link } from 'react-router-dom'

export default function About() {
    const appVersion = '1.0.0'
    const buildDate = '2025-01-15'

    return (
        <div className="app-container">
            <div className="page-header">
                <Link to="/" className="back-button">←</Link>
                <h1>ℹ️ Acerca de</h1>
            </div>

            {/* App Info Card */}
            <div className="about-hero">
                <div className="about-icon">💊</div>
                <h2 className="about-title">ScanFarma</h2>
                <p className="about-version">v{appVersion}</p>
            </div>

            {/* Purpose */}
            <div className="card">
                <h3 className="about-section-title">📋 Propósito</h3>
                <p className="about-text">
                    Sistema de control de vencimientos para farmacias. Automatiza el seguimiento
                    de medicamentos vencidos o próximos a vencer mediante escaneo de código de
                    barras y OCR de fechas.
                </p>
            </div>

            {/* Features */}
            <div className="card">
                <h3 className="about-section-title">✨ Características</h3>
                <ul className="about-list">
                    <li>📷 Escaneo de código de barras</li>
                    <li>📅 OCR de fechas de vencimiento</li>
                    <li>🔔 Alertas automáticas</li>
                    <li>📊 Gestión de inventario</li>
                    <li>📱 Diseño mobile-first</li>
                </ul>
            </div>

            {/* Links */}
            <div className="card">
                <h3 className="about-section-title">🔗 Enlaces</h3>
                <div className="about-links">
                    <a
                        href="https://github.com/mattbarreto/scanfarma"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-link"
                    >
                        <span className="about-link-icon">📦</span>
                        <span className="about-link-text">
                            <strong>Repositorio oficial</strong>
                            <small>github.com/mattbarreto/scanfarma</small>
                        </span>
                        <span className="about-link-arrow">→</span>
                    </a>
                    <a
                        href="https://matiasbarreto.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-link"
                    >
                        <span className="about-link-icon">🌐</span>
                        <span className="about-link-text">
                            <strong>Sitio web del desarrollador</strong>
                            <small>matiasbarreto.com</small>
                        </span>
                        <span className="about-link-arrow">→</span>
                    </a>
                </div>
            </div>

            {/* Creator */}
            <div className="about-creator">
                <p>Desarrollado con ❤️ por</p>
                <a
                    href="https://matiasbarreto.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-creator-name"
                >
                    Matías Barreto
                </a>
            </div>

            {/* Build Info */}
            <div className="about-footer">
                <p>Versión {appVersion} • Build {buildDate}</p>
                <p>© 2025 ScanFarma. MIT License.</p>
            </div>
        </div>
    )
}
