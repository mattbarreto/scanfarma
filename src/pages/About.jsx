import { Link } from 'react-router-dom'

export default function About() {
    const appVersion = '2.0.0'
    const buildDate = '2026-01-16'

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
                <h3 className="about-section-title">📋 ¿Qué es ScanFarma?</h3>
                <p className="about-text">
                    Sistema de inteligencia de rotación para farmacias. Controla vencimientos,
                    integra ventas automáticamente y genera insights para reducir pérdidas.
                </p>
            </div>

            {/* Features */}
            <div className="card">
                <h3 className="about-section-title">✨ Características</h3>
                <ul className="about-list">
                    <li>📷 Escaneo de código de barras</li>
                    <li>📅 OCR de fechas de vencimiento</li>
                    <li>📥 Integración de ventas (FIFO)</li>
                    <li>🧠 Inteligencia de rotación</li>
                    <li>📊 Métricas y sugerencias</li>
                    <li>🔔 Alertas inteligentes</li>
                </ul>
            </div>

            {/* Commercial Info */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                borderLeft: '4px solid var(--color-primary)'
            }}>
                <h3 className="about-section-title">💼 Para tu farmacia</h3>
                <p className="about-text" style={{ marginBottom: 'var(--space-md)' }}>
                    ScanFarma está disponible como servicio para farmacias.
                    Reducí pérdidas por vencimientos y optimizá tu stock.
                </p>
                <a
                    href="mailto:matiasbarreto@gmail.com?subject=Consulta%20ScanFarma"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex' }}
                >
                    📧 Solicitar información
                </a>
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
                            <strong>Código fuente</strong>
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
                            <strong>Desarrollador</strong>
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
                <p>Versión {appVersion} • {buildDate}</p>
                <p>© 2026 Matías Barreto</p>
            </div>
        </div>
    )
}
