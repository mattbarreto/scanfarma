
import { useEffect } from 'react'
import Icon from './Icon'

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger'
}) {
    if (!isOpen) return null

    // Prevent background scrolling
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="modal-content" style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                width: '100%',
                maxWidth: '400px',
                padding: 'var(--space-lg)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transformOrigin: 'center center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    {type === 'danger' && <Icon name="alertTriangle" size={24} style={{ color: 'var(--color-danger)' }} />}
                    <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, margin: 0 }}>{title}</h3>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-xl)' }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        style={{ flex: 1 }}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn btn-${type}`}
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        style={{ flex: 1 }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
