import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login, resendConfirmationEmail } from '../lib/authService'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [resendEmail, setResendEmail] = useState('')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // Mostrar mensaje si viene de confirmación
    useEffect(() => {
        if (searchParams.get('confirmed') === 'true') {
            setMessage('✅ Email confirmado. Ya podés iniciar sesión.')
        }
    }, [searchParams])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (!email || !password) {
            setError('Ingresá email y contraseña')
            return
        }

        setIsLoading(true)

        try {
            const result = await login(email, password)

            if (result.error) {
                setError(result.error)
                // Si el error es de email no confirmado, mostrar opción de reenviar
                if (result.error.includes('confirmar')) {
                    setResendEmail(email)
                }
            } else {
                navigate('/')
            }
        } catch (err) {
            console.error('Login error:', err)
            setError('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendEmail = async () => {
        setIsLoading(true)
        setError('')
        setMessage('')

        const result = await resendConfirmationEmail(resendEmail)

        if (result.success) {
            setMessage('📧 Email de confirmación reenviado. Revisá tu bandeja de entrada.')
            setResendEmail('')
        } else {
            setError(result.error || 'Error al reenviar email')
        }

        setIsLoading(false)
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
                        ScanFarma
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        margin: 'var(--space-xs) 0 0'
                    }}>
                        Control de Vencimientos
                    </p>
                </div>

                {/* Success message */}
                {message && (
                    <div style={{
                        padding: 'var(--space-sm) var(--space-md)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: 'var(--border-radius-sm)',
                        color: 'var(--color-success)',
                        fontSize: 'var(--font-size-sm)',
                        marginBottom: 'var(--space-md)',
                        textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
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
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: 'var(--space-sm) var(--space-md)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--border-radius-sm)',
                            color: 'var(--color-danger)',
                            fontSize: 'var(--font-size-sm)',
                            marginBottom: 'var(--space-md)'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Resend confirmation email option */}
                    {resendEmail && (
                        <button
                            type="button"
                            onClick={handleResendEmail}
                            disabled={isLoading}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--color-primary)',
                                padding: 'var(--space-sm) var(--space-md)',
                                borderRadius: 'var(--border-radius-sm)',
                                fontSize: 'var(--font-size-sm)',
                                cursor: 'pointer',
                                width: '100%',
                                marginBottom: 'var(--space-md)'
                            }}
                        >
                            📧 Reenviar email de confirmación
                        </button>
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
                                Ingresando...
                            </>
                        ) : (
                            '🔐 Ingresar'
                        )}
                    </button>
                </form>

                {/* Link to register */}
                <p style={{
                    textAlign: 'center',
                    marginTop: 'var(--space-lg)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)'
                }}>
                    ¿No tenés cuenta?{' '}
                    <Link to="/register" style={{ color: 'var(--color-primary)' }}>
                        Registrate
                    </Link>
                </p>

                {/* Footer */}
                <p style={{
                    textAlign: 'center',
                    marginTop: 'var(--space-lg)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)'
                }}>
                    © 2026 ScanFarma
                </p>
            </div>
        </div>
    )
}
