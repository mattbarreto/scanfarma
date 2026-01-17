import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import DeleteAccountModal from './DeleteAccountModal'
import { getNotificationRule, updateNotificationThreshold, toggleNotifications } from '../lib/notificationService'
import { getUserProfile } from '../lib/authService'
import { deleteUserAccount } from '../lib/accountService'

export default function UserMenu({ userName, userId, onLogout }) {
    const [isOpen, setIsOpen] = useState(false)
    const [showConfig, setShowConfig] = useState(false)
    const [threshold, setThreshold] = useState(30)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error' | null
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const menuRef = useRef(null)
    const navigate = useNavigate()

    // Load user settings when menu opens
    useEffect(() => {
        if (isOpen && userId) {
            loadSettings()
        }
    }, [isOpen, userId])

    const loadSettings = async () => {
        try {
            // Get EXPIRING_SOON threshold
            const { data: rule } = await getNotificationRule(userId, 'EXPIRING_SOON')
            if (rule) {
                setThreshold(rule.threshold)
            }

            // Get notifications enabled status
            const { data: profile } = await getUserProfile(userId)
            if (profile) {
                setNotificationsEnabled(profile.notifications_enabled !== false)
            }
        } catch (err) {
            console.error('Error loading settings:', err)
        }
    }

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
                setShowConfig(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('touchstart', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [isOpen])

    // Close on Escape key
    useEffect(() => {
        function handleEscape(event) {
            if (event.key === 'Escape') {
                if (showConfig) {
                    setShowConfig(false)
                } else {
                    setIsOpen(false)
                }
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, showConfig])

    const handleLogout = () => {
        setIsOpen(false)
        onLogout()
    }

    const handleAboutClick = () => {
        setIsOpen(false)
        navigate('/acerca')
    }

    const handleSaveSettings = async () => {
        setIsSaving(true)
        setSaveStatus(null)

        try {
            // Update threshold
            await updateNotificationThreshold(userId, 'EXPIRING_SOON', threshold)

            // Update notifications enabled
            await toggleNotifications(userId, notificationsEnabled)

            setSaveStatus('success')
            setTimeout(() => setSaveStatus(null), 2000)
        } catch (err) {
            console.error('Error saving settings:', err)
            setSaveStatus('error')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteUserAccount()
            if (result.success) {
                // La función ya hace signOut, el App.jsx detectará el cambio
                setShowDeleteModal(false)
                setIsOpen(false)
            } else {
                alert(result.error || 'Error al eliminar cuenta')
            }
        } catch (err) {
            console.error('Error deleting account:', err)
            alert('Error de conexión')
        } finally {
            setIsDeleting(false)
        }
    }

    const getInitials = (name) => {
        if (!name) return <Icon name="user" size={20} />

        const words = name.trim().split(/\s+/).filter(Boolean)

        if (words.length === 0) return '??'

        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase()
        }

        return name.substring(0, 2).toUpperCase()
    }

    const initials = getInitials(userName)
    const isEmail = userName?.includes('@')

    return (
        <div className="user-menu" ref={menuRef}>
            {/* Avatar Trigger */}
            <button
                className="user-menu-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Menú de usuario"
                aria-expanded={isOpen}
            >
                {isEmail ? <Icon name="user" size={24} /> : initials}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="user-menu-dropdown" style={{ minWidth: showConfig ? '280px' : '220px' }}>
                    {/* User Info Header */}
                    <div className="user-menu-header">
                        <div className="user-menu-avatar">
                            {isEmail ? <Icon name="user" size={24} style={{ color: 'var(--text-primary)' }} /> : initials}
                        </div>
                        <div className="user-menu-info">
                            <span className="user-menu-name">{userName}</span>
                            <span className="user-menu-status">
                                <span className="status-dot online"></span>
                                Conectado
                            </span>
                        </div>
                    </div>

                    {/* Config Panel */}
                    {showConfig ? (
                        <div className="user-menu-config">
                            <div className="config-header">
                                <button
                                    className="config-back"
                                    onClick={() => setShowConfig(false)}
                                    aria-label="Volver"
                                >
                                    <Icon name="arrowLeft" size={16} />
                                </button>
                                <span>Configuración</span>
                            </div>

                            {/* Threshold Setting */}
                            <div className="config-item">
                                <label className="config-label">
                                    <Icon name="bell" size={16} />
                                    Alertar antes de vencer
                                </label>
                                <div className="config-slider-row">
                                    <input
                                        type="range"
                                        min="7"
                                        max="90"
                                        step="1"
                                        value={threshold}
                                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                                        className="config-slider"
                                    />
                                    <span className="config-value">{threshold} días</span>
                                </div>
                            </div>

                            {/* Notifications Toggle */}
                            <div className="config-item">
                                <label className="config-label">
                                    <Icon name="mail" size={16} />
                                    Notificaciones email
                                </label>
                                <button
                                    className={`config-toggle ${notificationsEnabled ? 'active' : ''}`}
                                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                    aria-pressed={notificationsEnabled}
                                >
                                    <span className="toggle-track">
                                        <span className="toggle-thumb"></span>
                                    </span>
                                    <span className="toggle-label">
                                        {notificationsEnabled ? 'Activadas' : 'Desactivadas'}
                                    </span>
                                </button>
                            </div>

                            {/* Save Button */}
                            <button
                                className={`config-save ${saveStatus === 'success' ? 'success' : ''}`}
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <span>Guardando...</span>
                                ) : saveStatus === 'success' ? (
                                    <>
                                        <Icon name="check" size={16} />
                                        <span>Guardado</span>
                                    </>
                                ) : (
                                    <span>Guardar cambios</span>
                                )}
                            </button>

                            {/* Danger Zone */}
                            <div className="config-danger-zone">
                                <button
                                    className="config-delete-btn"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <Icon name="trash" size={16} />
                                    <span>Eliminar cuenta</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Menu Items */}
                            <div className="user-menu-items">
                                <button
                                    className="user-menu-item"
                                    onClick={() => setShowConfig(true)}
                                >
                                    <span className="user-menu-item-icon"><Icon name="settings" size={18} /></span>
                                    <span>Configuración</span>
                                </button>
                                <button
                                    className="user-menu-item"
                                    onClick={handleAboutClick}
                                >
                                    <span className="user-menu-item-icon"><Icon name="info" size={18} /></span>
                                    <span>Info / Acerca de</span>
                                </button>
                            </div>

                            {/* Separator */}
                            <div className="user-menu-separator"></div>

                            {/* Logout */}
                            <button
                                className="user-menu-item user-menu-logout"
                                onClick={handleLogout}
                            >
                                <span className="user-menu-item-icon"><Icon name="logout" size={18} /></span>
                                <span>Cerrar sesión</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Delete Account Modal */}
            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                isDeleting={isDeleting}
            />

            <style>{`
                .config-danger-zone {
                    margin-top: var(--space-lg);
                    padding-top: var(--space-md);
                    border-top: 1px solid var(--border-color);
                }

                .config-delete-btn {
                    width: 100%;
                    padding: var(--space-sm) var(--space-md);
                    background: transparent;
                    border: 1px solid var(--color-error);
                    color: var(--color-error);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--space-xs);
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }

                .config-delete-btn:hover {
                    background: var(--color-error);
                    color: white;
                }
            `}</style>
        </div>
    )
}
