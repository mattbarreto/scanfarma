import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Inventory() {
    const [batches, setBatches] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState('ALL') // ALL, VALID, EXPIRING, EXPIRED
    const [isLoading, setIsLoading] = useState(true)
    const [toast, setToast] = useState(null)

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchBatches = async () => {
        setIsLoading(true)
        try {
            // Usamos la vista batches_with_status que calcula el estado
            let query = supabase
                .from('batches_with_status')
                .select(`
          *,
          products (
            id,
            name,
            brand,
            barcode
          )
        `)
                .order('expiration_date', { ascending: true })

            // Apply status filter
            if (filter !== 'ALL') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching batches:', error)
                showToast('Error al cargar inventario', 'error')
                return
            }

            setBatches(data || [])
        } catch (err) {
            console.error('Error:', err)
            showToast('Error de conexión', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchBatches()
    }, [filter])

    // Filter by search term
    const filteredBatches = batches.filter(batch => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return (
            batch.products?.name?.toLowerCase().includes(term) ||
            batch.products?.barcode?.includes(term) ||
            batch.lot_number?.toLowerCase().includes(term)
        )
    })

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const getStatusClass = (status) => {
        switch (status) {
            case 'EXPIRED': return 'expired'
            case 'EXPIRING': return 'expiring'
            default: return 'valid'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'EXPIRED': return '🔴'
            case 'EXPIRING': return '🟡'
            default: return '🟢'
        }
    }

    // Group by product
    const groupedByProduct = filteredBatches.reduce((acc, batch) => {
        const productId = batch.product_id
        if (!acc[productId]) {
            acc[productId] = {
                product: batch.products,
                batches: []
            }
        }
        acc[productId].batches.push(batch)
        return acc
    }, {})

    const totalProducts = Object.keys(groupedByProduct).length
    const totalBatches = filteredBatches.length
    const totalUnits = filteredBatches.reduce((sum, b) => sum + b.quantity, 0)

    return (
        <div className="app-container">
            <div className="page-header">
                <Link to="/" className="back-button">←</Link>
                <h1>📋 Inventario</h1>
            </div>

            {/* Search bar */}
            <div className="form-group">
                <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 Buscar por nombre, código o lote..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filter tabs */}
            <div className="alert-tabs">
                <button
                    className={`alert-tab ${filter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilter('ALL')}
                >
                    Todos
                </button>
                <button
                    className={`alert-tab ${filter === 'VALID' ? 'active' : ''}`}
                    onClick={() => setFilter('VALID')}
                >
                    🟢 Válidos
                </button>
                <button
                    className={`alert-tab ${filter === 'EXPIRING' ? 'active' : ''}`}
                    onClick={() => setFilter('EXPIRING')}
                >
                    🟡 Por vencer
                </button>
                <button
                    className={`alert-tab ${filter === 'EXPIRED' ? 'active' : ''}`}
                    onClick={() => setFilter('EXPIRED')}
                >
                    🔴 Vencidos
                </button>
            </div>

            {/* Stats */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>{totalProducts}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Productos</div>
                </div>
                <div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>{totalBatches}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Lotes</div>
                </div>
                <div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>{totalUnits}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Unidades</div>
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="empty-state">
                    <div className="spinner"></div>
                    <p className="loading-text">Cargando inventario...</p>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredBatches.length === 0 && (
                <div className="empty-state">
                    <span className="icon">📦</span>
                    <p>No hay productos en el inventario</p>
                    <Link to="/" className="btn btn-primary mt-md" style={{ width: 'auto' }}>
                        + Agregar producto
                    </Link>
                </div>
            )}

            {/* Inventory list */}
            {!isLoading && Object.values(groupedByProduct).map(({ product, batches }) => (
                <div key={product?.id || 'unknown'} className="card">
                    <div className="product-card">
                        <span className="product-name">{product?.name || 'Sin nombre'}</span>
                        {product?.brand && <span className="product-brand">{product.brand}</span>}
                        {product?.barcode && (
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                Código: {product.barcode}
                            </span>
                        )}
                    </div>

                    <div style={{ marginTop: 'var(--space-md)' }}>
                        {batches.map(batch => (
                            <div
                                key={batch.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--space-sm) 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}
                            >
                                <div style={{ fontSize: 'var(--font-size-sm)' }}>
                                    <span>{getStatusIcon(batch.status)} </span>
                                    <span>Lote: {batch.lot_number}</span>
                                    <span style={{ color: 'var(--text-muted)', marginLeft: 'var(--space-sm)' }}>
                                        (x{batch.quantity})
                                    </span>
                                </div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                    Vto: {formatDate(batch.expiration_date)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Toast notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}
