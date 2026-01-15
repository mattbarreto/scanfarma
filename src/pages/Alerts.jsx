import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Alerts() {
    const [batches, setBatches] = useState([])
    const [filter, setFilter] = useState('ALL') // ALL, EXPIRED, EXPIRING
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

            // Apply filter
            if (filter === 'EXPIRED') {
                query = query.eq('status', 'EXPIRED')
            } else if (filter === 'EXPIRING') {
                query = query.eq('status', 'EXPIRING')
            } else {
                // Show both expired and expiring by default
                query = query.in('status', ['EXPIRED', 'EXPIRING'])
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching batches:', error)
                showToast('Error al cargar alertas', 'error')
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

    const handleDelete = async (batchId) => {
        if (!confirm('¿Eliminar este lote?')) return

        try {
            const { error } = await supabase
                .from('batches')
                .delete()
                .eq('id', batchId)

            if (error) {
                console.error('Error deleting batch:', error)
                showToast('Error al eliminar', 'error')
                return
            }

            showToast('Lote eliminado')
            fetchBatches()
        } catch (err) {
            console.error('Error:', err)
            showToast('Error de conexión', 'error')
        }
    }

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

    const getStatusLabel = (status) => {
        switch (status) {
            case 'EXPIRED': return 'Vencido'
            case 'EXPIRING': return 'Por vencer'
            default: return 'Válido'
        }
    }

    const expiredCount = batches.filter(b => b.status === 'EXPIRED').length
    const expiringCount = batches.filter(b => b.status === 'EXPIRING').length

    return (
        <div className="app-container">
            <div className="page-header">
                <Link to="/" className="back-button">←</Link>
                <h1>🔔 Alertas</h1>
            </div>

            {/* Filter tabs */}
            <div className="alert-tabs">
                <button
                    className={`alert-tab ${filter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilter('ALL')}
                >
                    Todos ({expiredCount + expiringCount})
                </button>
                <button
                    className={`alert-tab ${filter === 'EXPIRED' ? 'active' : ''}`}
                    onClick={() => setFilter('EXPIRED')}
                >
                    🔴 Vencidos ({expiredCount})
                </button>
                <button
                    className={`alert-tab ${filter === 'EXPIRING' ? 'active' : ''}`}
                    onClick={() => setFilter('EXPIRING')}
                >
                    🟡 Por vencer ({expiringCount})
                </button>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="empty-state">
                    <div className="spinner"></div>
                    <p className="loading-text">Cargando alertas...</p>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && batches.length === 0 && (
                <div className="empty-state">
                    <span className="icon">✅</span>
                    <p>No hay productos vencidos o próximos a vencer</p>
                </div>
            )}

            {/* Batch list */}
            {!isLoading && batches.map(batch => (
                <div
                    key={batch.id}
                    className={`alert-item ${getStatusClass(batch.status)}`}
                >
                    <div className="alert-item-header">
                        <span className="alert-item-title">
                            {getStatusIcon(batch.status)} {batch.products?.name || 'Producto'}
                        </span>
                        <span className={`status-badge ${getStatusClass(batch.status)}`}>
                            {getStatusLabel(batch.status)}
                        </span>
                    </div>

                    <div className="alert-item-details">
                        <span>📦 Lote: {batch.lot_number}</span>
                        <span>📅 Vto: {formatDate(batch.expiration_date)}</span>
                        <span>🔢 Cant: {batch.quantity}</span>
                        {batch.location && <span>📍 {batch.location}</span>}
                    </div>

                    <div className="alert-item-actions">
                        <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(batch.id)}
                        >
                            🗑️ Eliminar
                        </button>
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
