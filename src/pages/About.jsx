import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

export default function About() {
    const appVersion = '2.2.0'
    const buildDate = '2026-01-16'
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const shareData = {
            title: 'ScanFarma - Inteligencia para Farmacias',
            text: 'ScanFarma es una app que aprende cómo trabaja tu farmacia y te ayuda a evitar vencimientos y pérdidas. Probala acá:',
            url: 'https://scanfarma.netlify.app'
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                // Usuario canceló
            }
        } else {
            navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="app-container">
            <div className="page-header">
                <Link to="/" className="back-button" aria-label="Volver">
                    <Icon name="chevronLeft" size={24} />
                </Link>
                <h1><Icon name="info" size={32} style={{ marginRight: 'var(--space-sm)' }} /> Acerca de</h1>
            </div>

            {/* App Info Card */}
            <div className="about-hero">
                <div className="about-icon">
                    <Icon name="pill" size={48} style={{ color: 'var(--color-primary)' }} />
                </div>
                <h2 className="about-title">ScanFarma</h2>
                <p className="about-version">v{appVersion}</p>
            </div>

            {/* Purpose */}
            <div className="card">
                <h3 className="about-section-title">
                    <Icon name="clipboard" size={20} style={{ marginRight: 8 }} /> ¿Qué es ScanFarma?
                </h3>
                <p className="about-text">
                    Sistema de inteligencia de rotación para farmacias. Controla vencimientos,
                    aprende de tu operación y genera insights para reducir pérdidas.
                </p>
            </div>

            {/* Features */}
            <div className="card">
                <h3 className="about-section-title">
                    <Icon name="star" size={20} style={{ marginRight: 8 }} /> Características
                </h3>
                <ul className="about-list">
                    <li><Icon name="brain" size={16} /> Memoria Predictiva (Nuevo)</li>
                    <li><Icon name="scan" size={16} /> Escaneo de código de barras</li>
                    <li><Icon name="calendar" size={16} /> OCR de fechas de vencimiento</li>
                    <li><Icon name="download" size={16} /> Integración de ventas (FIFO)</li>
                    <li><Icon name="chart" size={16} /> Métricas y sugerencias</li>
                    <li><Icon name="bell" size={16} /> Alertas inteligentes</li>
                </ul>
            </div>

            {/* Share Card - High Priority */}
            <div className="card share-card" style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <h3 className="about-section-title" style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <Icon name="heart" size={20} style={{ marginRight: 8 }} /> ¿Te es útil ScanFarma?
                </h3>
                <p className="about-text" style={{ marginBottom: 'var(--space-md)', color: 'rgba(255,255,255,0.9)' }}>
                    Ayudá a otros colegas a modernizar su gestión.
                    Recomendá la app con un toque.
                </p>
                <button
                    className="btn"
                    onClick={handleShare}
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontWeight: 600,
                        backgroundColor: 'white',
                        color: 'var(--color-primary)',
                        border: 'none',
                        padding: '12px'
                    }}
                >
                    {copied ? (
                        <><Icon name="check" size={20} /> Enlace copiado</>
                    ) : (
                        <><Icon name="share" size={20} /> Recomendar a un colega</>
                    )}
                </button>
            </div>

            {/* Commercial Info */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                borderLeft: '4px solid var(--color-primary)'
            }}>
                <h3 className="about-section-title">
                    <Icon name="briefcase" size={20} style={{ marginRight: 8 }} /> Para tu farmacia
                </h3>
                <p className="about-text" style={{ marginBottom: 'var(--space-md)' }}>
                    ScanFarma está disponible como servicio para farmacias.
                    Reducí pérdidas por vencimientos y optimizá tu stock.
                </p>
                <a
                    href="mailto:matiasbarreto@gmail.com?subject=Consulta%20ScanFarma"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <Icon name="mail" size={20} /> Solicitar información
                </a>
            </div>

            {/* Links */}
            <div className="card">
                <h3 className="about-section-title">
                    <Icon name="link" size={20} style={{ marginRight: 8 }} /> Enlaces
                </h3>
                <div className="about-links">
                    <a
                        href="https://github.com/mattbarreto/scanfarma"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-link"
                    >
                        <span className="about-link-icon"><Icon name="package" size={24} /></span>
                        <span className="about-link-text">
                            <strong>Código fuente</strong>
                            <small>github.com/mattbarreto/scanfarma</small>
                        </span>
                        <span className="about-link-arrow"><Icon name="chevronRight" size={20} /></span>
                    </a>
                    <a
                        href="https://matiasbarreto.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-link"
                    >
                        <span className="about-link-icon"><Icon name="globe" size={24} /></span>
                        <span className="about-link-text">
                            <strong>Desarrollador</strong>
                            <small>matiasbarreto.com</small>
                        </span>
                        <span className="about-link-arrow"><Icon name="chevronRight" size={20} /></span>
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
