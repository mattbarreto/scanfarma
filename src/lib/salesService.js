/**
 * ScanFarma - Sales Integration Service
 * 
 * Maneja la integración con ventas del sistema de stock externo.
 * Aplica lógica FIFO para descontar de los lotes más próximos a vencer.
 */

import { supabase } from './supabase'

/**
 * Procesa un evento de venta usando FIFO por vencimiento
 * @param {string} barcode - Código de barras del producto
 * @param {number} quantity - Cantidad vendida
 * @param {string} saleDate - Fecha de la venta (YYYY-MM-DD)
 * @param {string} source - Origen: 'manual', 'csv', 'api'
 * @param {string} externalRef - Referencia del sistema externo (opcional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function processSale(barcode, quantity, saleDate, source = 'manual', externalRef = null) {
    try {
        // 1. Registrar el evento de venta
        const { data: saleEvent, error: saleError } = await supabase
            .from('sale_events')
            .insert({
                barcode,
                quantity,
                sale_date: saleDate,
                source,
                external_ref: externalRef,
                processed: false
            })
            .select()
            .single()

        if (saleError) {
            console.error('Error creating sale event:', saleError)
            return { success: false, error: 'Error al registrar venta' }
        }

        // 2. Ejecutar función FIFO en la base de datos
        const { data: fifoResult, error: fifoError } = await supabase
            .rpc('process_sale_fifo', {
                p_barcode: barcode,
                p_quantity: quantity,
                p_sale_date: saleDate
            })

        if (fifoError) {
            console.error('Error processing FIFO:', fifoError)
            return { success: false, error: 'Error al procesar FIFO' }
        }

        // 3. Marcar venta como procesada
        const { error: updateError } = await supabase
            .from('sale_events')
            .update({
                product_id: fifoResult.product_id,
                processed: true,
                processed_at: new Date().toISOString()
            })
            .eq('id', saleEvent.id)

        if (updateError) {
            console.error('Error updating sale event:', updateError)
            // La venta se procesó aunque falle el update
        }

        return {
            success: fifoResult.success,
            data: fifoResult,
            warning: fifoResult.warning
        }

    } catch (err) {
        console.error('Error in processSale:', err)
        return { success: false, error: 'Error de conexión' }
    }
}

/**
 * Baja manual de unidades de un producto
 * Útil cuando no hay sistema de stock integrado
 * @param {string} barcode - Código de barras
 * @param {number} quantity - Cantidad a dar de baja
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function manualDeduction(barcode, quantity) {
    const today = new Date().toISOString().split('T')[0]
    return processSale(barcode, quantity, today, 'manual')
}

/**
 * Importa ventas desde un CSV parseado
 * Formato esperado: { barcode, quantity, date }[]
 * @param {Array<{barcode: string, quantity: number, date: string}>} salesData
 * @returns {Promise<{success: boolean, processed: number, errors: Array}>}
 */
export async function importSalesFromCSV(salesData) {
    const results = {
        success: true,
        processed: 0,
        errors: []
    }

    for (const sale of salesData) {
        // Validar cada registro
        if (!sale.barcode || !sale.quantity || !sale.date) {
            results.errors.push({
                sale,
                error: 'Datos incompletos: barcode, quantity y date son requeridos'
            })
            continue
        }

        const qty = parseInt(sale.quantity, 10)
        if (isNaN(qty) || qty <= 0) {
            results.errors.push({
                sale,
                error: 'Cantidad inválida'
            })
            continue
        }

        // Procesar la venta
        const result = await processSale(
            sale.barcode.trim(),
            qty,
            sale.date.trim(),
            'csv'
        )

        if (result.success) {
            results.processed++
            if (result.warning) {
                results.errors.push({
                    sale,
                    warning: result.warning
                })
            }
        } else {
            results.errors.push({
                sale,
                error: result.error
            })
        }
    }

    results.success = results.errors.filter(e => e.error).length === 0

    return results
}

/**
 * Parsea un string CSV a array de objetos
 * @param {string} csvText - Contenido del CSV
 * @returns {Array<{barcode: string, quantity: string, date: string}>}
 */
export function parseCSV(csvText) {
    const lines = csvText.trim().split('\n')
    const result = []

    // Detectar si tiene header
    const firstLine = lines[0].toLowerCase()
    const hasHeader = firstLine.includes('barcode') || firstLine.includes('date') || firstLine.includes('quantity')
    const startIndex = hasHeader ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(/[,;]/).map(p => p.trim())

        // Esperamos: barcode, quantity, date
        if (parts.length >= 3) {
            result.push({
                barcode: parts[0],
                quantity: parts[1],
                date: parts[2]
            })
        } else if (parts.length === 2) {
            // Si solo hay 2 campos, asumir fecha = hoy
            result.push({
                barcode: parts[0],
                quantity: parts[1],
                date: new Date().toISOString().split('T')[0]
            })
        }
    }

    return result
}

/**
 * Obtiene el historial de ventas de un producto
 * @param {string} barcode - Código de barras
 * @param {number} limit - Límite de registros
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getSaleHistory(barcode, limit = 50) {
    try {
        // Primero obtener product_id
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id')
            .eq('barcode', barcode)
            .single()

        if (productError || !product) {
            return { data: [], error: 'Producto no encontrado' }
        }

        const { data, error } = await supabase
            .from('sale_events')
            .select('*')
            .eq('product_id', product.id)
            .order('sale_date', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching sale history:', error)
            return { data: [], error: 'Error al obtener historial' }
        }

        return { data }

    } catch (err) {
        console.error('Error in getSaleHistory:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Obtiene lotes de un producto ordenados por vencimiento (para ver FIFO)
 * @param {string} barcode - Código de barras
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getProductBatches(barcode) {
    try {
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name')
            .eq('barcode', barcode)
            .single()

        if (productError || !product) {
            return { data: [], error: 'Producto no encontrado' }
        }

        const { data, error } = await supabase
            .from('batches')
            .select('*')
            .eq('product_id', product.id)
            .order('expiration_date', { ascending: true })

        if (error) {
            console.error('Error fetching batches:', error)
            return { data: [], error: 'Error al obtener lotes' }
        }

        return { 
            data: data.map(b => ({
                ...b,
                product_name: product.name
            }))
        }

    } catch (err) {
        console.error('Error in getProductBatches:', err)
        return { data: [], error: 'Error de conexión' }
    }
}
