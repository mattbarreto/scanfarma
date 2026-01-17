import { useState } from 'react'
import Icon from './Icon'

/**
 * Modal de confirmación para eliminar cuenta
 * Requiere que el usuario escriba "ELIMINAR" para confirmar
 */
export default function DeleteAccountModal({ isOpen, onClose, onConfirm, isDeleting }) {
    const [confirmText, setConfirmText] = useState('')

    const CONFIRMATION_WORD = 'ELIMINAR'
    const isConfirmValid = confirmText.toUpperCase() === CONFIRMATION_WORD

    const handleClose = () => {
        setConfirmText('')
        onClose()
    }

    const handleConfirm = () => {
        if (isConfirmValid) {
            onConfirm()
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-content delete-account-modal"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header danger">
                    <Icon name="alertTriangle" size={32} />
                    <h2>Eliminar cuenta permanentemente</h2>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <div className="warning-box">
                        <p><strong>⚠️ Esta acción es IRREVERSIBLE</strong></p>
                        <p>Se eliminarán permanentemente:</p>
                        <ul>
                            <li>Todos tus productos</li>
                            <li>Todos tus lotes e inventario</li>
                            <li>Todo el historial de ventas</li>
                            <li>Todo el historial de pérdidas</li>
                            <li>Todas las métricas y estadísticas</li>
                            <li>Tu configuración y preferencias</li>
                        </ul>
                    </div>

                    <div className="confirm-input-section">
                        <label>
                            Para confirmar, escribe <strong>{CONFIRMATION_WORD}</strong> a continuación:
                        </label>
                        <input
                            type="text"
                            className="form-input confirm-input"
                            placeholder={CONFIRMATION_WORD}
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            disabled={isDeleting}
                            autoComplete="off"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={handleClose}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </button>
                    <button
                        className={`btn btn-danger ${isDeleting ? 'loading' : ''}`}
                        onClick={handleConfirm}
                        disabled={!isConfirmValid || isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <div className="spinner" style={{ width: 16, height: 16 }}></div>
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <Icon name="trash" size={16} />
                                Eliminar mi cuenta
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                .delete-account-modal {
                    max-width: 480px;
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                }

                .modal-header.danger {
                    background: linear-gradient(135deg, var(--color-error), #c0392b);
                    color: white;
                    padding: var(--space-lg);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-sm);
                    text-align: center;
                }

                .modal-header.danger h2 {
                    margin: 0;
                    font-size: 1.25rem;
                }

                .modal-body {
                    padding: var(--space-lg);
                }

                .warning-box {
                    background: rgba(231, 76, 60, 0.1);
                    border: 1px solid var(--color-error);
                    border-radius: var(--radius-md);
                    padding: var(--space-md);
                    margin-bottom: var(--space-lg);
                }

                .warning-box p {
                    margin: 0 0 var(--space-sm) 0;
                    color: var(--text-primary);
                }

                .warning-box ul {
                    margin: var(--space-sm) 0 0 0;
                    padding-left: var(--space-lg);
                    color: var(--text-secondary);
                }

                .warning-box li {
                    margin: var(--space-xs) 0;
                }

                .confirm-input-section {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-sm);
                }

                .confirm-input-section label {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .confirm-input {
                    text-align: center;
                    font-size: 1.1rem;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }

                .modal-footer {
                    padding: var(--space-md) var(--space-lg);
                    background: var(--bg-tertiary);
                    display: flex;
                    gap: var(--space-md);
                    justify-content: flex-end;
                }

                .btn-danger {
                    background: var(--color-error);
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: var(--space-xs);
                }

                .btn-danger:hover:not(:disabled) {
                    background: #c0392b;
                }

                .btn-danger:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-danger.loading {
                    pointer-events: none;
                }
            `}</style>
        </div>
    )
}
