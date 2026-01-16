import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'

export default function UserMenu({ userName, onLogout }) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)
    const navigate = useNavigate()

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
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
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen])

    const handleLogout = () => {
        setIsOpen(false)
        onLogout()
    }

    const handleAboutClick = () => {
        setIsOpen(false)
        navigate('/acerca')
    }

    const getInitials = (name) => {
        if (!name) return <Icon name="user" size={20} />

        // Defensive splitting and filtering
        const words = name.trim().split(/\s+/).filter(Boolean)

        if (words.length === 0) return '??'

        if (words.length >= 2) {
            // Safe access using optional chaining just in case, though filter(Boolean) protects us
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
                <div className="user-menu-dropdown">
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

                    {/* Menu Items */}
                    <div className="user-menu-items">
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
                </div>
            )}
        </div>
    )
}
