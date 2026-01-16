import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../lib/authService'

export default function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pharmacyName, setPharmacyName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validaciones
        if (!email || !password || !pharmacyName) {
            setError('Completá todos los campos')
            return
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        setIsLoading(true)

        try {
            const result = await register(email, password, pharmacyName)

            if (result.error) {
                setError(result.error)
            } else if (result.data?.needsConfirmation) {
                setSuccess(true)
            } else {
                // Usuario creado y logueado (raro, pero posible si confirmación está deshabilitada)
                navigate('/')
            }
        } catch (err) {
            console.error('Register error:', err)
            setError('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    // Pantalla de éxito (después de registrarse)
    if (success) {
        return (
            <div className="app-container" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-lg)'
            }}>
                <div className="card" style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: 'var(--space-xl)',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '4rem' }}>📧</span>
                    <h2 style={{ margin: 'var(--space-md) 0' }}>¡Revisá tu email!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                        Te enviamos un link de confirmación a:<br />
                        <strong>{email}</strong>
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                        Hacé click en el link del email para activar tu cuenta.
                        Después podrás iniciar sesión.
                    </p>
                    <Link to="/login" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>
                        Ir a Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="app-container" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-lg)'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: 'var(--space-xl)'
            }}>
                {/* Logo/Title */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <span style={{ fontSize: '3rem' }}>💊</span>
                    <h1 style={{
                        margin: 'var(--space-md) 0 0',
                        fontSize: 'var(--font-size-2xl)'
                    }}>
                        Crear cuenta
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        margin: 'var(--space-xs) 0 0'
                    }}>
                        Registrate en ScanFarma
                    </p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nombre de la farmacia</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ej: Farmacia del Sol"
                            value={pharmacyName}
                            onChange={(e) => setPharmacyName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirmar contraseña</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Repetí tu contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: 'var(--space-sm) var(--space-md)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-md, 8px)',
                            color: 'var(--color-danger)',
                            fontSize: 'var(--font-size-sm)',
                            marginBottom: 'var(--space-md)'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{ width: '100%' }}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner" style={{ width: 20, height: 20 }}></div>
                                Creando cuenta...
                            </>
                        ) : (
                            '✨ Crear cuenta'
                        )}
                    </button>
                </form>

                {/* Link to login */}
                <p style={{
                    textAlign: 'center',
                    marginTop: 'var(--space-lg)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)'
                }}>
                    ¿Ya tenés cuenta?{' '}
                    <Link to="/login" style={{ color: 'var(--color-primary)' }}>
                        Iniciá sesión
                    </Link>
                </p>
            </div>
        </div>
    )
}
