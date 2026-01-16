import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'
import { supabase } from '../lib/supabase'
import { markBatchAsExpired, recordWaste } from '../lib/wasteService'

export default function Alerts() {
    const [batches, setBatches] = useState([])
    const [filter, setFilter] = useState('ALL') // ALL, EXPIRED, EXPIRING
    const [isLoading, setIsLoading] = useState(true)
    const [toast, setToast] = useState(null)

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [isProcessingBulk, setIsProcessingBulk] = useState(false)

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchBatches = async () => {
        setIsLoading(true)
        try {
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

            if (filter === 'EXPIRED') {
                query = query.eq('status', 'EXPIRED')
            } else if (filter === 'EXPIRING') {
                query = query.eq('status', 'EXPIRING')
            } else {
                query = query.in('status', ['EXPIRED', 'EXPIRING'])
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching batches:', error)
                showToast('Error al cargar alertas', 'error')
                return
            }

            setBatches(data || [])
            setSelectedIds(new Set()) // Clear selection when filter changes
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

    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'danger', title: '', message: '', onConfirm: () => { } })

    // Calculate counts for tabs
    const expiredCount = batches.filter(b => b.status === 'EXPIRED').length
    const expiringCount = batches.filter(b => b.status === 'EXPIRING').length

    // Selection handlers
    const toggleSelection = (batchId) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(batchId)) {
            newSelected.delete(batchId)
        } else {
            newSelected.add(batchId)
        }
        setSelectedIds(newSelected)
    }

    const selectAll = () => {
        if (selectedIds.size === batches.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(batches.map(b => b.id)))
        }
    }

    const isAllSelected = batches.length > 0 && selectedIds.size === batches.length

    // Bulk actions
    const handleBulkWaste = () => {
        const count = selectedIds.size
        setModalConfig({
            isOpen: true,
            type: 'warning',
            title: `Registrar ${count} lotes como pérdida`,
            message: `Los ${count} lotes seleccionados saldrán del inventario activo pero quedarán en el historial para métricas.`,
            confirmText: `Registrar ${count} lotes`,
            onConfirm: processBulkWaste
        })
    }

    const processBulkWaste = async () => {
        setIsProcessingBulk(true)
        let successCount = 0
        let errorCount = 0

        for (const batchId of selectedIds) {
            try {
                const result = await markBatchAsExpired(batchId)
                if (result.success) {
                    successCount++
                } else {
                    errorCount++
                }
            } catch (err) {
                errorCount++
            }
        }

        setIsProcessingBulk(false)

        if (errorCount === 0) {
            showToast(`${successCount} lotes registrados como pérdida`)
        } else {
            showToast(`${successCount} procesados, ${errorCount} errores`, 'error')
        }

        setSelectedIds(new Set())
        fetchBatches()
    }

    const handleDeleteClick = (batchId) => {
        setModalConfig({
            isOpen: true,
            type: 'danger',
            title: '¿Eliminar lote?',
            message: 'Esta acción no se puede deshacer. El lote será eliminado permanentemente del historial.',
            onConfirm: () => deleteBatch(batchId)
        })
    }

    const deleteBatch = async (batchId) => {
        try {
            const { error } = await supabase
                .from('batches')
                .delete()
                .eq('id', batchId)

            if (error) throw error

            showToast('Lote eliminado')
            fetchBatches()
        } catch (err) {
            console.error('Error:', err)
            showToast('Error al eliminar', 'error')
        }
    }

    const handleMarkExpiredClick = (batch) => {
        const action = batch.status === 'EXPIRED' ? 'vencido' : 'descartado'
        setModalConfig({
            isOpen: true,
            type: 'warning',
            title: `Registrar como ${action}`,
            message: `El lote saldrá del inventario activo pero quedará en el historial para métricas de pérdida.`,
            confirmText: 'Registrar',
            onConfirm: () => processMarkAsExpired(batch)
        })
    }

    const processMarkAsExpired = async (batch) => {
        const action = batch.status === 'EXPIRED' ? 'vencido' : 'descartado'
        try {
            const result = await markBatchAsExpired(batch.id)
            if (result.success) {
                showToast(`Lote registrado como ${action}`)
                fetchBatches()
            } else {
                showToast(result.error || 'Error al registrar', 'error')
            }
        } catch (err) {
            console.error('Error:', err)
            showToast('Error de conexión', 'error')
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
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
            case 'EXPIRED': return <Icon name="alertTriangle" size={16} />
            case 'EXPIRING': return <Icon name="alertTriangle" size={16} />
            default: return <Icon name="check" size={16} />
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'EXPIRED': return 'Vencido'
            case 'EXPIRING': return 'Por vencer'
            default: return 'Válido'
        }
    }

    const LoadingSkeleton = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton width="60%" height="24px" />
                        <Skeleton width="80px" height="24px" />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <Skeleton width="30%" height="16px" />
                        <Skeleton width="30%" height="16px" />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <Skeleton width="100%" height="40px" />
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <div className="app-container">
            <ConfirmModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                {...modalConfig}
            />

            <div className="page-header">
                <h1><Icon name="bell" size={32} style={{ marginRight: 'var(--space-sm)' }} /> Alertas</h1>
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
                    className={`alert-tab ${expiredCount > 0 ? 'tab-danger' : ''} ${filter === 'EXPIRED' ? 'active' : ''}`}
                    onClick={() => setFilter('EXPIRED')}
                >
                    <Icon name="alertTriangle" size={14} /> Vencidos ({expiredCount})
                </button>
                <button
                    className={`alert-tab ${expiringCount > 0 ? 'tab-warning' : ''} ${filter === 'EXPIRING' ? 'active' : ''}`}
                    onClick={() => setFilter('EXPIRING')}
                >
                    <Icon name="alertTriangle" size={14} /> Por vencer ({expiringCount})
                </button>
            </div>

            {/* Bulk Action Bar */}
            {batches.length > 0 && !isLoading && (
                <div className="bulk-action-bar">
                    <label className="bulk-select-all">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={selectAll}
                            className="bulk-checkbox"
                        />
                        <span>Seleccionar todos</span>
                    </label>

                    {selectedIds.size > 0 && (
                        <button
                            className="bulk-action-btn-main"
                            onClick={handleBulkWaste}
                            disabled={isProcessingBulk}
                        >
                            {isProcessingBulk ? (
                                <span>Procesando...</span>
                            ) : (
                                <>
                                    <Icon name="clipboard" size={16} />
                                    <span>Registrar pérdida ({selectedIds.size})</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <LoadingSkeleton />
            ) : batches.length === 0 ? (
                <EmptyState
                    type="success"
                    title="¡Todo limpio!"
                    description="No hay productos vencidos ni próximos a vencer. Tu inventario está saludable."
                />
            ) : (
                <div className="animate-slide-up">
                    {batches.map(batch => (
                        <div
                            key={batch.id}
                            className={`alert-item ${getStatusClass(batch.status)} ${selectedIds.has(batch.id) ? 'selected' : ''}`}
                        >
                            <div className="alert-item-header">
                                <label className="alert-item-select">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(batch.id)}
                                        onChange={() => toggleSelection(batch.id)}
                                        className="bulk-checkbox"
                                    />
                                    <span className="alert-item-title">
                                        {getStatusIcon(batch.status)} {batch.products?.name || 'Producto'}
                                    </span>
                                </label>
                                <span className={`status-badge ${getStatusClass(batch.status)}`}>
                                    {getStatusLabel(batch.status)}
                                </span>
                            </div>

                            <div className="alert-item-details">
                                <span className="alert-detail-item"><Icon name="package" size={14} /> Lote: {batch.lot_number}</span>
                                <span className="alert-detail-item"><Icon name="calendar" size={14} /> Vto: {formatDate(batch.expiration_date)}</span>
                                <span className="alert-detail-item"><Icon name="hash" size={14} /> Cant: {batch.quantity_remaining || batch.quantity}</span>
                                {batch.location && <span className="alert-detail-item"><Icon name="mapPin" size={14} /> {batch.location}</span>}
                            </div>

                            <div className="alert-item-actions">
                                <button className="btn btn-warning" onClick={() => handleMarkExpiredClick(batch)} style={{ flex: 1 }} aria-label="Registrar pérdida">
                                    <Icon name="clipboard" size={16} /> Registrar pérdida
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDeleteClick(batch.id)} style={{ flex: 0.5 }} aria-label="Eliminar lote">
                                    <Icon name="trash" size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}


            {/* Toast notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}
