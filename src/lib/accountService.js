/**
 * ScanFarma - Account Service
 * 
 * Gestiona operaciones de cuenta de usuario
 */

import { supabase } from './supabase'

/**
 * Elimina la cuenta del usuario actual y todos sus datos
 * Esta operación es IRREVERSIBLE
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteUserAccount() {
    try {
        // Llamar a la función RPC que borra todos los datos
        const { data, error } = await supabase.rpc('delete_user_account')

        if (error) {
            console.error('Error deleting account:', error)
            return {
                success: false,
                error: error.message || 'Error al eliminar cuenta'
            }
        }

        if (!data.success) {
            return {
                success: false,
                error: data.error || 'Error desconocido'
            }
        }

        // Cerrar sesión después de eliminar datos
        await supabase.auth.signOut()

        return {
            success: true,
            deletedCounts: data.deleted_counts
        }

    } catch (err) {
        console.error('Error in deleteUserAccount:', err)
        return {
            success: false,
            error: 'Error de conexión'
        }
    }
}
