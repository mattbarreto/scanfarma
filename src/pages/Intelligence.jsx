import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell, RadialBarChart, RadialBar
} from 'recharts'
import {
    getDashboardStats,
    getTopWasteProducts,
    getTopRiskProducts,
    getAllSuggestions,
    getMonthlyTrends
} from '../lib/metricsService'
import Icon from '../components/Icon'
import Skeleton from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const COLORS = {
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
    primary: '#6366f1',
    muted: '#64748b'
}

const PERIODS = [
    { key: '7d', label: '7 días', months: 1 },
    { key: '30d', label: '30 días', months: 1 },
    { key: '90d', label: '90 días', months: 3 }
]

export default function Intelligence() {
    const [stats, setStats] = useState(null)
    const [topWaste, setTopWaste] = useState([])
    const [topRisk, setTopRisk] = useState([])
    const [suggestions, setSuggestions] = useState([])
    const [trends, setTrends] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activePeriod, setActivePeriod] = useState('30d')
    const navigate = useNavigate()

    useEffect(() => {
        loadData()
    }, [activePeriod])

    const loadData = async () => {
        setIsLoading(true)
        setError(null)

        const periodConfig = PERIODS.find(p => p.key === activePeriod)
        const months = periodConfig?.months || 1

        try {
            const [statsRes, wasteRes, riskRes, suggestionsRes, trendsRes] = await Promise.all([
                getDashboardStats(),
                getTopWasteProducts(5),
                getTopRiskProducts(5),
                getAllSuggestions(),
                getMonthlyTrends(months)
            ])

            if (statsRes.error || wasteRes.error || riskRes.error) {
                setError('Error al cargar datos. Verificá que las vistas SQL estén creadas.')
            }

            setStats(statsRes.data)
            setTopWaste(wasteRes.data || [])
            setTopRisk(riskRes.data || [])
            setSuggestions(suggestionsRes.data || [])

            // Format trends for chart
            const formattedTrends = (trendsRes.data || []).map(t => ({
                month: new Date(t.month).toLocaleDateString('es-AR', { month: 'short' }),
                perdidas: t.wasted,
                ventas: t.sold
            })).reverse()
            setTrends(formattedTrends)

        } catch (err) {
            console.error('Error loading intelligence data:', err)
            setError('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate health score (0-100)
    const calculateHealthScore = () => {
        if (!stats) return 100
        const wasteImpact = Math.min(stats.avgWasteRatio * 2, 30)
        // Productos VENCIDOS tienen mayor impacto negativo
        const expiredImpact = Math.min((stats.unitsExpired || 0) * 10, 40)
        const expiringImpact = Math.min(stats.unitsExpiring20d * 2, 30)
        return Math.max(0, Math.round(100 - wasteImpact - expiredImpact - expiringImpact))
    }

    const healthScore = calculateHealthScore()
    const healthColor = healthScore >= 70 ? COLORS.success : healthScore >= 40 ? COLORS.warning : COLORS.danger
    const healthLabel = healthScore >= 70 ? 'Excelente' : healthScore >= 40 ? 'Atención' : 'Crítico'

    const handleViewProducts = (filter) => {
        navigate(`/inventario?filter=${filter}`)
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-sm)',
                    fontSize: 'var(--font-size-sm)'
                }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ margin: '4px 0 0', color: p.color }}>
                            {p.name}: {p.value}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    if (isLoading) {
        return (
            <div className="app-container">
                <div className="page-header">
                    <h1><Icon name="brain" size={32} style={{ marginRight: 'var(--space-sm)' }} /> Inteligencia</h1>
                </div>
                <div className="stats-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="stat-card">
                            <Skeleton width="40%" height="32px" style={{ margin: '0 auto var(--space-xs)' }} />
                            <Skeleton width="60%" height="16px" style={{ margin: '0 auto' }} />
                        </div>
                    ))}
                </div>
                {[1, 2].map(i => (
                    <div key={i} className="card" style={{ marginBottom: 'var(--space-md)' }}>
                        <Skeleton width="30%" height="24px" style={{ marginBottom: 'var(--space-md)' }} />
                        <Skeleton width="100%" height="200px" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="app-container animate-slide-up">
            <div className="page-header">
                <h1><Icon name="brain" size={32} style={{ marginRight: 'var(--space-sm)' }} /> Inteligencia</h1>
            </div>

            {/* Period Filter Tabs */}
            <div className="period-tabs">
                {PERIODS.map(period => (
                    <button
                        key={period.key}
                        className={`period-tab ${activePeriod === period.key ? 'active' : ''}`}
                        onClick={() => setActivePeriod(period.key)}
                    >
                        {period.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="card" style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderLeft: `4px solid ${COLORS.danger}`
                }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="alertTriangle" size={20} /> {error}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
                        Ejecutá las migraciones SQL en Supabase para habilitar las vistas analíticas.
                    </p>
                </div>
            )}

            {/* Health Gauge + Stats */}
            <div className="health-section">
                <div className="health-gauge">
                    <div className="health-circle" style={{ '--health-color': healthColor, '--health-percent': `${healthScore}%` }}>
                        <span className="health-value">{healthScore}</span>
                        <span className="health-label">{healthLabel}</span>
                    </div>
                    <div className="health-title">Salud del Inventario</div>
                </div>

                {stats && (
                    <div className="health-metrics">
                        <div className="health-metric">
                            <span className="metric-value">{stats.avgWasteRatio}%</span>
                            <span className="metric-label">Pérdida</span>
                        </div>
                        <div className="health-metric">
                            <span className="metric-value" style={{ color: (stats.unitsExpired || 0) > 0 ? COLORS.danger : 'inherit' }}>
                                {stats.unitsExpired || 0}
                            </span>
                            <span className="metric-label">Vencidos</span>
                        </div>
                        <div className="health-metric">
                            <span className="metric-value" style={{ color: stats.unitsExpiring20d > 0 ? COLORS.warning : 'inherit' }}>
                                {stats.unitsExpiring20d}
                            </span>
                            <span className="metric-label">x Vencer</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Trends Chart */}
            {trends.length > 0 && (
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Icon name="trendingUp" size={20} style={{ color: COLORS.primary }} /> Tendencia Mensual
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPerdidas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="perdidas"
                                name="Pérdidas"
                                stroke={COLORS.danger}
                                fillOpacity={1}
                                fill="url(#colorPerdidas)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top Waste Products - Bar Chart */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', margin: 0 }}>
                        <Icon name="alertTriangle" size={20} style={{ color: COLORS.danger }} /> Mayor Pérdida
                    </h3>
                    {topWaste.length > 0 && (
                        <button
                            className="link-btn"
                            onClick={() => handleViewProducts('EXPIRED')}
                        >
                            Ver todos →
                        </button>
                    )}
                </div>
                {topWaste.length === 0 ? (
                    <EmptyState type="chart" title="Sin pérdidas" description="No hay datos de residuos registrados." />
                ) : (
                    <ResponsiveContainer width="100%" height={topWaste.length * 50 + 20}>
                        <BarChart
                            data={topWaste.map(p => ({ name: p.name.slice(0, 20), value: p.total_units_wasted, ratio: p.waste_ratio }))}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                            <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Unidades" fill={COLORS.danger} radius={[0, 4, 4, 0]}>
                                {topWaste.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.danger : `${COLORS.danger}${Math.max(40, 100 - index * 15).toString(16)}`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Top Risk Products */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', margin: 0 }}>
                        <Icon name="alertTriangle" size={20} style={{ color: COLORS.warning }} /> Riesgo Próximo
                    </h3>
                    {topRisk.length > 0 && (
                        <button
                            className="link-btn"
                            onClick={() => handleViewProducts('EXPIRING')}
                        >
                            Ver todos →
                        </button>
                    )}
                </div>
                {topRisk.length === 0 ? (
                    <EmptyState type="success" title="Sin riesgos" description="No hay productos próximos a vencer." />
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
                                    <span style={{ fontWeight: 600, color: COLORS.warning }}>
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
                    <Icon name="lightbulb" size={20} style={{ color: COLORS.primary }} /> Sugerencias
                </h3>
                {suggestions.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>
                        Todo en orden. No hay sugerencias por el momento.
                    </div>
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
                <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Icon name="zap" size={20} /> Acciones Rápidas
                </h3>
                <div className="quick-actions-grid">
                    <Link to="/alertas" className="quick-action-btn warning">
                        <div className="quick-action-icon">
                            <Icon name="bell" size={24} />
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Ver alertas</span>
                            <span className="quick-action-desc">Productos por vencer</span>
                        </div>
                        <Icon name="chevronRight" size={18} className="quick-action-arrow" />
                    </Link>
                    <Link to="/ventas" className="quick-action-btn success">
                        <div className="quick-action-icon">
                            <Icon name="download" size={24} />
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-title">Importar ventas</span>
                            <span className="quick-action-desc">Cargar CSV o manual</span>
                        </div>
                        <Icon name="chevronRight" size={18} className="quick-action-arrow" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
