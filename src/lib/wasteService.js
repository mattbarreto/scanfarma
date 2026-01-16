/**
 * ScanFarma - Waste Events Service
 * 
 * Registra y consulta eventos de pérdida (vencimientos, devoluciones, descuentos).
 */

import { supabase } from './supabase'

/**
 * Registra un evento de pérdida
 * @param {string} batchId - ID del lote
 * @param {number} quantity - Cantidad perdida
 * @param {'expired'|'returned'|'discounted'|'damaged'} reason - Razón
 * @param {string} eventDate - Fecha del evento (YYYY-MM-DD)
 * @param {string} notes - Notas adicionales (opcional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function recordWaste(batchId, quantity, reason, eventDate, notes = null) {
    try {
        // Obtener info del lote para saber el product_id
        const { data: batch, error: batchError } = await supabase
            .from('batches')
            .select('product_id, quantity_remaining')
            .eq('id', batchId)
            .single()

        if (batchError || !batch) {
            return { success: false, error: 'Lote no encontrado' }
        }

        // Validar que hay suficiente stock
        if (batch.quantity_remaining < quantity) {
            return {
                success: false,
                error: `Stock insuficiente. Disponible: ${batch.quantity_remaining}`
            }
        }

        // Registrar evento de pérdida
        const { data: wasteEvent, error: wasteError } = await supabase
            .from('waste_events')
            .insert({
                batch_id: batchId,
                product_id: batch.product_id,
                quantity,
                reason,
                event_date: eventDate,
                notes
            })
            .select()
            .single()

        if (wasteError) {
            console.error('Error recording waste:', wasteError)
            return { success: false, error: 'Error al registrar pérdida' }
        }

        // Descontar del quantity_remaining del lote
        const { error: updateError } = await supabase
            .from('batches')
            .update({
                quantity_remaining: batch.quantity_remaining - quantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', batchId)

        if (updateError) {
            console.error('Error updating batch:', updateError)
            // El waste event se registró, pero no se actualizó el stock
        }

        return { success: true, data: wasteEvent }

    } catch (err) {
        console.error('Error in recordWaste:', err)
        return { success: false, error: 'Error de conexión' }
    }
}

/**
 * Marca un lote completo como vencido
 * @param {string} batchId - ID del lote
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markBatchAsExpired(batchId) {
    try {
        const { data: batch, error: batchError } = await supabase
            .from('batches')
            .select('product_id, quantity_remaining, expiration_date')
            .eq('id', batchId)
            .single()

        if (batchError || !batch) {
            return { success: false, error: 'Lote no encontrado' }
        }

        if (batch.quantity_remaining === 0) {
            return { success: true } // Ya está agotado
        }

        // Registrar como waste con la cantidad restante
        return recordWaste(
            batchId,
            batch.quantity_remaining,
            'expired',
            batch.expiration_date,
            'Marcado como vencido manualmente'
        )

    } catch (err) {
        console.error('Error in markBatchAsExpired:', err)
        return { success: false, error: 'Error de conexión' }
    }
}

/**
 * Obtiene resumen de pérdidas por producto
 * @param {string} productId - ID del producto
 * @returns {Promise<{data: object, error?: string}>}
 */
export async function getWasteSummaryByProduct(productId) {
    try {
        const { data, error } = await supabase
            .from('waste_events')
            .select('quantity, reason')
            .eq('product_id', productId)

        if (error) {
            console.error('Error fetching waste:', error)
            return { data: null, error: 'Error al obtener pérdidas' }
        }

        // Agregar por razón
        const summary = {
            total: 0,
            byReason: {
                expired: 0,
                returned: 0,
                discounted: 0,
                damaged: 0
            }
        }

        for (const event of data) {
            summary.total += event.quantity
            if (summary.byReason[event.reason] !== undefined) {
                summary.byReason[event.reason] += event.quantity
            }
        }

        return { data: summary }

    } catch (err) {
        console.error('Error in getWasteSummaryByProduct:', err)
        return { data: null, error: 'Error de conexión' }
    }
}

/**
 * Obtiene historial de pérdidas de un producto
 * @param {string} productId - ID del producto
 * @param {number} limit - Límite de registros
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getWasteHistory(productId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('waste_events')
            .select(`
                *,
                batches (
                    lot_number,
                    expiration_date
                )
            `)
            .eq('product_id', productId)
            .order('event_date', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching waste history:', error)
            return { data: [], error: 'Error al obtener historial' }
        }

        return { data }

    } catch (err) {
        console.error('Error in getWasteHistory:', err)
        return { data: [], error: 'Error de conexión' }
    }
}
