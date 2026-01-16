import { useState } from 'react'
import { Link } from 'react-router-dom'
import SalesImport from '../components/SalesImport'

export default function Sales() {
    const [lastResult, setLastResult] = useState(null)

    const handleImportComplete = (result) => {
        setLastResult(result)
    }

    return (
        <div className="app-container">
            <div className="page-header">
                <Link to="/" className="back-button">←</Link>
                <h1>📥 Ventas</h1>
            </div>

            <div className="card">
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <h3 style={{ margin: 0 }}>Sincronizar Ventas</h3>
                    <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--space-xs)'
                    }}>
                        Importa las ventas de tu sistema de stock para mantener ScanFarma actualizado.
                        Las ventas se descontarán automáticamente de los lotes más próximos a vencer (FIFO).
                    </p>
                </div>

                <SalesImport onImportComplete={handleImportComplete} />
            </div>

            {/* Info card */}
            <div className="card" style={{
                background: 'var(--bg-secondary)',
                borderLeft: '4px solid var(--color-primary)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-md)'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>💡</span>
                    <div>
                        <strong style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>
                            ¿Por qué es importante?
                        </strong>
                        <p style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-secondary)',
                            margin: 0
                        }}>
                            Cuando un producto se vende y no se registra en ScanFarma,
                            el sistema puede alertar sobre vencimientos de productos que ya no existen.
                            Sincronizar las ventas evita que busques productos que ya fueron vendidos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
