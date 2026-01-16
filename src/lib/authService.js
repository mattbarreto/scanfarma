/**
 * ScanFarma - Auth Service
 * 
 * Servicio de autenticación usando Supabase Auth con confirmación de email.
 */

import { supabase } from './supabase'

/**
 * Registrar nuevo usuario
 * @param {string} email 
 * @param {string} password 
 * @param {string} pharmacyName 
 * @returns {Promise<{data?: object, error?: string}>}
 */
export async function register(email, password, pharmacyName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    pharmacy_name: pharmacyName
                },
                emailRedirectTo: `${window.location.origin}/login?confirmed=true`
            }
        })

        if (error) {
            console.error('Register error:', error)
            return { error: translateAuthError(error.message) }
        }

        // Si el usuario fue creado pero necesita confirmar email
        if (data.user && !data.session) {
            return {
                data: {
                    user: data.user,
                    needsConfirmation: true
                }
            }
        }

        return { data }

    } catch (err) {
        console.error('Register error:', err)
        return { error: 'Error de conexión' }
    }
}

/**
 * Login con email y password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data?: object, error?: string}>}
 */
export async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            console.error('Login error:', error)
            return { error: translateAuthError(error.message) }
        }

        return { data }

    } catch (err) {
        console.error('Login error:', err)
        return { error: 'Error de conexión' }
    }
}

/**
 * Cerrar sesión
 */
export async function logout() {
    try {
        await supabase.auth.signOut()
    } catch (err) {
        console.error('Logout error:', err)
    }
}

/**
 * Obtener usuario actual
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    } catch {
        return null
    }
}

/**
 * Obtener sesión actual
 * @returns {Promise<object|null>}
 */
export async function getSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        return session
    } catch {
        return null
    }
}

/**
 * Obtener perfil del usuario
 * @param {string} userId 
 * @returns {Promise<{data?: object, error?: string}>}
 */
export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error fetching profile:', error)
            return { error: 'Error al obtener perfil' }
        }

        return { data }

    } catch (err) {
        console.error('Error:', err)
        return { error: 'Error de conexión' }
    }
}

/**
 * Actualizar perfil del usuario
 * @param {string} userId 
 * @param {object} updates 
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateUserProfile(userId, updates) {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)

        if (error) {
            console.error('Error updating profile:', error)
            return { success: false, error: 'Error al actualizar' }
        }

        return { success: true }

    } catch (err) {
        console.error('Error:', err)
        return { success: false, error: 'Error de conexión' }
    }
}

/**
 * Escuchar cambios de autenticación
 * @param {function} callback 
 * @returns {object} subscription
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session)
    })
}

/**
 * Reenviar email de confirmación
 * @param {string} email 
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function resendConfirmationEmail(email) {
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/login?confirmed=true`
            }
        })

        if (error) {
            console.error('Resend error:', error)
            return { success: false, error: translateAuthError(error.message) }
        }

        return { success: true }

    } catch (err) {
        console.error('Error:', err)
        return { success: false, error: 'Error de conexión' }
    }
}

/**
 * Solicitar reset de password
 * @param {string} email 
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })

        if (error) {
            console.error('Reset password error:', error)
            return { success: false, error: translateAuthError(error.message) }
        }

        return { success: true }

    } catch (err) {
        console.error('Error:', err)
        return { success: false, error: 'Error de conexión' }
    }
}

/**
 * Traducir errores de Supabase Auth a español
 */
function translateAuthError(message) {
    const translations = {
        'Invalid login credentials': 'Email o contraseña incorrectos',
        'Email not confirmed': 'Debés confirmar tu email antes de ingresar',
        'User already registered': 'Este email ya está registrado',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
        'Unable to validate email address: invalid format': 'El formato del email no es válido',
        'For security purposes, you can only request this after': 'Por seguridad, esperá unos segundos antes de reintentar',
        'Email rate limit exceeded': 'Demasiados intentos. Esperá unos minutos.',
    }

    for (const [key, value] of Object.entries(translations)) {
        if (message.includes(key)) {
            return value
        }
    }

    return message
}
