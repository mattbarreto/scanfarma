import { useState, useRef } from 'react'
import { importSalesFromCSV, parseCSV, manualDeduction } from '../lib/salesService'

export default function SalesImport({ onImportComplete }) {
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [results, setResults] = useState(null)
    const [manualMode, setManualMode] = useState(false)
    const [manualBarcode, setManualBarcode] = useState('')
    const [manualQuantity, setManualQuantity] = useState(1)
    const [toast, setToast] = useState(null)
    const fileInputRef = useRef(null)

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = async (e) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            await processFile(file)
        }
    }

    const handleFileSelect = async (e) => {
        const file = e.target.files[0]
        if (file) {
            await processFile(file)
        }
    }

    const processFile = async (file) => {
        if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
            showToast('Solo se aceptan archivos CSV o TXT', 'error')
            return
        }

        setIsProcessing(true)
        setResults(null)

        try {
            const text = await file.text()
            const salesData = parseCSV(text)

            if (salesData.length === 0) {
                showToast('No se encontraron ventas en el archivo', 'error')
                setIsProcessing(false)
                return
            }

            const result = await importSalesFromCSV(salesData)
            setResults(result)

            if (result.success) {
                showToast(`✅ ${result.processed} ventas procesadas`)
            } else {
                showToast(`⚠️ ${result.processed} ventas procesadas, ${result.errors.length} errores`, 'warning')
            }

            if (onImportComplete) {
                onImportComplete(result)
            }

        } catch (err) {
            console.error('Error processing file:', err)
            showToast('Error al procesar archivo', 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleManualSubmit = async (e) => {
        e.preventDefault()

        if (!manualBarcode) {
            showToast('Ingresa un código de barras', 'error')
            return
        }

        setIsProcessing(true)

        try {
            const result = await manualDeduction(manualBarcode.trim(), parseInt(manualQuantity, 10))

            if (result.success) {
                showToast('✅ Baja registrada correctamente')
                setManualBarcode('')
                setManualQuantity(1)
                if (onImportComplete) {
                    onImportComplete(result)
                }
            } else {
                showToast(result.error || 'Error al procesar', 'error')
            }

            if (result.warning) {
                showToast(result.warning, 'warning')
            }

        } catch (err) {
            console.error('Error in manual deduction:', err)
            showToast('Error de conexión', 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="sales-import">
            {/* Mode toggle */}
            <div className="alert-tabs" style={{ marginBottom: 'var(--space-md)' }}>
                <button
                    className={`alert-tab ${!manualMode ? 'active' : ''}`}
                    onClick={() => setManualMode(false)}
                >
                    📄 Importar CSV
                </button>
                <button
                    className={`alert-tab ${manualMode ? 'active' : ''}`}
                    onClick={() => setManualMode(true)}
                >
                    ✋ Baja Manual
                </button>
            </div>

            {/* CSV Import */}
            {!manualMode && (
                <>
                    <div
                        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-xl)',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: isDragging ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-secondary)'
                        }}
                    >
                        {isProcessing ? (
                            <>
                                <div className="spinner" style={{ margin: '0 auto var(--space-md)' }}></div>
                                <p>Procesando ventas...</p>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-md)' }}>📥</span>
                                <p style={{ marginBottom: 'var(--space-sm)' }}>
                                    Arrastra un archivo CSV aquí
                                </p>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                    o haz clic para seleccionar
                                </p>
                            </>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    {/* CSV Format help */}
                    <div style={{
                        marginTop: 'var(--space-md)',
                        padding: 'var(--space-md)',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)'
                    }}>
                        <strong>Formato esperado:</strong>
                        <pre style={{
                            background: 'var(--bg-primary)',
                            padding: 'var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            marginTop: 'var(--space-sm)',
                            overflow: 'auto'
                        }}>
                            barcode,quantity,date{'\n'}
                            7790001234567,2,2026-01-15{'\n'}
                            7790009876543,1,2026-01-15
                        </pre>
                    </div>
                </>
            )}

            {/* Manual deduction */}
            {manualMode && (
                <form onSubmit={handleManualSubmit}>
                    <div className="form-group">
                        <label className="form-label">Código de Barras</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="7790001234567"
                            value={manualBarcode}
                            onChange={(e) => setManualBarcode(e.target.value)}
                            disabled={isProcessing}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cantidad a dar de baja</label>
                        <input
                            type="number"
                            className="form-input"
                            min="1"
                            value={manualQuantity}
                            onChange={(e) => setManualQuantity(e.target.value)}
                            disabled={isProcessing}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isProcessing}
                        style={{ width: '100%' }}
                    >
                        {isProcessing ? (
                            <>
                                <div className="spinner" style={{ width: 20, height: 20 }}></div>
                                Procesando...
                            </>
                        ) : (
                            '📤 Registrar Baja'
                        )}
                    </button>
                </form>
            )}

            {/* Results */}
            {results && (
                <div style={{
                    marginTop: 'var(--space-lg)',
                    padding: 'var(--space-md)',
                    background: results.success ? 'rgba(var(--success-rgb), 0.1)' : 'rgba(var(--warning-rgb), 0.1)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--space-sm)' }}>
                        {results.success ? '✅ Importación completada' : '⚠️ Importación con errores'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <p>Ventas procesadas: {results.processed}</p>
                        {results.errors.length > 0 && (
                            <p>Errores/Advertencias: {results.errors.length}</p>
                        )}
                    </div>

                    {/* Show errors if any */}
                    {results.errors.length > 0 && results.errors.length <= 5 && (
                        <div style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-size-sm)' }}>
                            <strong>Detalles:</strong>
                            <ul style={{ marginTop: 'var(--space-xs)', paddingLeft: 'var(--space-lg)' }}>
                                {results.errors.map((err, idx) => (
                                    <li key={idx} style={{ color: err.warning ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                                        {err.sale?.barcode}: {err.error || err.warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}
