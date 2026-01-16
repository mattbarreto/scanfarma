import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    getDashboardStats,
    getTopWasteProducts,
    getTopRiskProducts,
    getAllSuggestions
} from '../lib/metricsService'

export default function Intelligence() {
    const [stats, setStats] = useState(null)
    const [topWaste, setTopWaste] = useState([])
    const [topRisk, setTopRisk] = useState([])
    const [suggestions, setSuggestions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        setError(null)

        try {
            // Cargar todo en paralelo
            const [statsRes, wasteRes, riskRes, suggestionsRes] = await Promise.all([
                getDashboardStats(),
                getTopWasteProducts(5),
                getTopRiskProducts(5),
                getAllSuggestions()
            ])

            if (statsRes.error || wasteRes.error || riskRes.error) {
                setError('Error al cargar datos. Verificá que las vistas SQL estén creadas.')
            }

            setStats(statsRes.data)
            setTopWaste(wasteRes.data || [])
            setTopRisk(riskRes.data || [])
            setSuggestions(suggestionsRes.data || [])

        } catch (err) {
            console.error('Error loading intelligence data:', err)
            setError('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    const getRiskClass = (score) => {
        if (score >= 60) return 'risk-high'
        if (score >= 30) return 'risk-medium'
        return 'risk-low'
    }

    const getRiskEmoji = (score) => {
        if (score >= 60) return '🔴'
        if (score >= 30) return '🟠'
        return '🟢'
    }

    if (isLoading) {
        return (
            <div className="app-container">
                <div className="page-header">
                    <h1>🧠 Inteligencia</h1>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                        Calculando métricas...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="app-container">
            <div className="page-header">
                <h1>🧠 Inteligencia</h1>
            </div>

            {/* Error message */}
            {error && (
                <div className="card" style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderLeft: '4px solid var(--color-danger)'
                }}>
                    <p style={{ margin: 0 }}>⚠️ {error}</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
                        Ejecutá las migraciones SQL en Supabase para habilitar las vistas analíticas.
                    </p>
                </div>
            )}

            {/* Stats Grid */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.avgWasteRatio}%</div>
                        <div className="stat-label">Pérdida Prom.</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: stats.highRiskCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
                            {stats.highRiskCount}
                        </div>
                        <div className="stat-label">Alto Riesgo</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: stats.unitsExpiring20d > 0 ? 'var(--color-warning)' : 'inherit' }}>
                            {stats.unitsExpiring20d}
                        </div>
                        <div className="stat-label">Uds x Vencer</div>
                    </div>
                </div>
            )}

            {/* Top Waste Products */}
            <div className="card">
                <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    🔴 Mayor Pérdida
                </h3>
                {topWaste.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        No hay datos de pérdidas aún
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {topWaste.map((product, index) => (
                            <div key={product.product_id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'var(--space-sm) 0',
                                borderBottom: index < topWaste.length - 1 ? '1px solid var(--border-color)' : 'none'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', marginRight: 'var(--space-sm)' }}>
                                        {index + 1}.
                                    </span>
                                    <span>{product.name}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>
                                        {product.total_units_wasted} uds
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginLeft: 'var(--space-xs)' }}>
                                        ({product.waste_ratio}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top Risk Products */}
            <div className="card">
                <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    🟠 Riesgo Próximo
                </h3>
                {topRisk.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        No hay productos en riesgo
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {topRisk.map((product, index) => (
                            <div key={product.product_id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'var(--space-sm) 0',
                                borderBottom: index < topRisk.length - 1 ? '1px solid var(--border-color)' : 'none'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', marginRight: 'var(--space-sm)' }}>
                                        {index + 1}.
                                    </span>
                                    <span>{product.name}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>
                                        {product.units_expiring_30d} uds
                                    </span>
                                    {product.days_to_next_expiry && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginLeft: 'var(--space-xs)' }}>
                                            en {product.days_to_next_expiry}d
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Suggestions */}
            <div className="card">
                <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    💡 Sugerencias
                </h3>
                {suggestions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        Todo en orden. No hay sugerencias por el momento.
                    </p>
                ) : (
                    <div>
                        {suggestions.map((suggestion, index) => (
                            <div key={index} className="suggestion-item">
                                <span className="suggestion-icon">{suggestion.icon}</span>
                                <div className="suggestion-content">
                                    <div className="suggestion-product">{suggestion.productName}</div>
                                    <div className={`suggestion-message priority-${suggestion.priority}`}>
                                        {suggestion.message}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ background: 'var(--bg-elevated)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>⚡ Acciones Rápidas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <Link to="/alertas" className="btn btn-secondary">
                        🔔 Ver todas las alertas
                    </Link>
                    <Link to="/ventas" className="btn btn-secondary">
                        📥 Importar ventas
                    </Link>
                </div>
            </div>
        </div>
    )
}
