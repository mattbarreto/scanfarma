/**
 * ScanFarma - Metrics & Intelligence Service
 * 
 * Calcula métricas preventivas y genera sugerencias para reducir vencimientos.
 */

import { supabase } from './supabase'
import { getWasteSummaryByProduct } from './wasteService'

/**
 * Calcula métricas completas de un producto
 * @param {string} productId - ID del producto
 * @returns {Promise<{data: object, error?: string}>}
 */
export async function getProductMetrics(productId) {
    try {
        // 1. Obtener info del producto
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name, barcode, brand')
            .eq('id', productId)
            .single()

        if (productError || !product) {
            return { data: null, error: 'Producto no encontrado' }
        }

        // 2. Obtener todos los lotes del producto
        const { data: batches, error: batchesError } = await supabase
            .from('batches')
            .select('id, quantity, quantity_remaining, expiration_date')
            .eq('product_id', productId)

        if (batchesError) {
            return { data: null, error: 'Error al obtener lotes' }
        }

        // 3. Calcular métricas de stock
        const totalPurchased = batches.reduce((sum, b) => sum + b.quantity, 0)
        const totalRemaining = batches.reduce((sum, b) => sum + b.quantity_remaining, 0)
        const totalSold = totalPurchased - totalRemaining

        // 4. Obtener métricas de pérdidas
        const { data: wasteSummary } = await getWasteSummaryByProduct(productId)
        const totalWasted = wasteSummary?.total || 0
        const wastedByReason = wasteSummary?.byReason || {}

        // 5. Calcular porcentajes
        const soldPercentage = totalPurchased > 0 ? (totalSold / totalPurchased) * 100 : 0
        const wastePercentage = totalPurchased > 0 ? (totalWasted / totalPurchased) * 100 : 0

        // 6. Identificar lotes próximos a vencer
        // Usar comparación de strings ISO para evitar bugs de timezone
        const todayStr = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
        const in15Days = new Date()
        in15Days.setDate(in15Days.getDate() + 15)
        const in15DaysStr = in15Days.toISOString().split('T')[0]

        // EXPIRED: vence HOY o antes (<= today)
        const expiredBatches = batches.filter(b => {
            return b.quantity_remaining > 0 && b.expiration_date <= todayStr
        })

        // EXPIRING: vence en los próximos 15 días (después de hoy, antes de +15d)
        const expiringBatches = batches.filter(b => {
            return b.quantity_remaining > 0 && b.expiration_date > todayStr && b.expiration_date <= in15DaysStr
        })

        const unitsExpired = expiredBatches.reduce((sum, b) => sum + b.quantity_remaining, 0)
        const unitsExpiring = expiringBatches.reduce((sum, b) => sum + b.quantity_remaining, 0)

        return {
            data: {
                product,
                metrics: {
                    totalPurchased,
                    totalSold,
                    totalRemaining,
                    totalWasted,
                    wastedByReason,
                    soldPercentage: Math.round(soldPercentage * 10) / 10,
                    wastePercentage: Math.round(wastePercentage * 10) / 10,
                    unitsExpiring,
                    unitsExpired,
                    expiringBatchCount: expiringBatches.length,
                    expiredBatchCount: expiredBatches.length
                }
            }
        }

    } catch (err) {
        console.error('Error in getProductMetrics:', err)
        return { data: null, error: 'Error de conexión' }
    }
}

/**
 * Identifica productos de alto riesgo
 * @param {number} wasteThreshold - Porcentaje de pérdida para considerar alto riesgo (default 20%)
 * @param {number} limit - Límite de productos
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getHighRiskProducts(wasteThreshold = 20, limit = 20) {
    try {
        // 1. Obtener todos los productos con lotes
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
                id, name, barcode, brand,
                batches (
                    id, quantity, quantity_remaining, expiration_date
                )
            `)

        if (productsError) {
            return { data: [], error: 'Error al obtener productos' }
        }

        // Usar comparación de strings ISO para evitar bugs de timezone
        const todayStr = new Date().toISOString().split('T')[0]
        const in15Days = new Date()
        in15Days.setDate(in15Days.getDate() + 15)
        const in15DaysStr = in15Days.toISOString().split('T')[0]

        const riskProducts = []

        for (const product of products) {
            if (!product.batches || product.batches.length === 0) continue

            const totalPurchased = product.batches.reduce((sum, b) => sum + b.quantity, 0)
            const totalRemaining = product.batches.reduce((sum, b) => sum + b.quantity_remaining, 0)

            // Obtener waste
            const { data: wasteSummary } = await getWasteSummaryByProduct(product.id)
            const totalWasted = wasteSummary?.total || 0
            const wastePercentage = totalPurchased > 0 ? (totalWasted / totalPurchased) * 100 : 0

            // Lotes por vencer (FUTURO, no incluye hoy)
            const expiringBatches = product.batches.filter(b => {
                return b.quantity_remaining > 0 && b.expiration_date > todayStr && b.expiration_date <= in15DaysStr
            })

            const unitsExpiring = expiringBatches.reduce((sum, b) => sum + b.quantity_remaining, 0)

            // Determinar riesgo
            const isHighWaste = wastePercentage >= wasteThreshold
            const isExpiringSoon = unitsExpiring >= 5 || (totalRemaining > 0 && unitsExpiring / totalRemaining >= 0.3)

            if (isHighWaste || isExpiringSoon) {
                riskProducts.push({
                    product: {
                        id: product.id,
                        name: product.name,
                        barcode: product.barcode,
                        brand: product.brand
                    },
                    metrics: {
                        totalPurchased,
                        totalRemaining,
                        totalWasted,
                        wastePercentage: Math.round(wastePercentage * 10) / 10,
                        unitsExpiring
                    },
                    riskFactors: {
                        highWaste: isHighWaste,
                        expiringSoon: isExpiringSoon
                    }
                })
            }
        }

        // Ordenar por riesgo (primero los que tienen ambos factores, luego por % de pérdida)
        riskProducts.sort((a, b) => {
            const aScore = (a.riskFactors.highWaste ? 1 : 0) + (a.riskFactors.expiringSoon ? 1 : 0)
            const bScore = (b.riskFactors.highWaste ? 1 : 0) + (b.riskFactors.expiringSoon ? 1 : 0)
            if (aScore !== bScore) return bScore - aScore
            return b.metrics.wastePercentage - a.metrics.wastePercentage
        })

        return { data: riskProducts.slice(0, limit) }

    } catch (err) {
        console.error('Error in getHighRiskProducts:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Genera sugerencias para un producto basado en sus métricas
 * @param {object} metrics - Métricas del producto (de getProductMetrics)
 * @returns {Array<{type: string, message: string, priority: 'high'|'medium'|'low'}>}
 */
export function generateSuggestions(metrics) {
    const suggestions = []

    if (!metrics) return suggestions

    const { wastePercentage, unitsExpiring, unitsExpired, totalRemaining, totalPurchased } = metrics

    // Sugerencia: reducir pedido
    if (wastePercentage >= 30) {
        const reduction = Math.min(Math.round(wastePercentage), 50)
        suggestions.push({
            type: 'reduce_order',
            message: `Reducir pedido ${reduction}%`,
            priority: 'high',
            icon: '📉'
        })
    } else if (wastePercentage >= 15) {
        suggestions.push({
            type: 'reduce_order',
            message: 'Considerar reducir próximo pedido',
            priority: 'medium',
            icon: '📉'
        })
    }

    // Sugerencia: priorizar venta
    if (unitsExpiring > 0) {
        if (unitsExpiring >= 10 || (totalRemaining > 0 && unitsExpiring / totalRemaining >= 0.5)) {
            suggestions.push({
                type: 'prioritize_sale',
                message: `Priorizar venta de ${unitsExpiring} unidades por vencer`,
                priority: 'high',
                icon: '📢'
            })
        } else {
            suggestions.push({
                type: 'prioritize_sale',
                message: `${unitsExpiring} unidades por vencer en 15 días`,
                priority: 'medium',
                icon: '📢'
            })
        }
    }

    // Sugerencia: ofrecer promoción
    if (unitsExpiring >= 5 && wastePercentage >= 10) {
        suggestions.push({
            type: 'offer_discount',
            message: 'Ofrecer promoción para acelerar rotación',
            priority: 'high',
            icon: '🏷️'
        })
    }

    // Sugerencia: solicitar devolución
    if (unitsExpired > 0) {
        suggestions.push({
            type: 'request_return',
            message: `Solicitar devolución de ${unitsExpired} unidades vencidas`,
            priority: 'high',
            icon: '↩️'
        })
    }

    // Sugerencia: marcar como vencido
    if (unitsExpired > 0) {
        suggestions.push({
            type: 'mark_expired',
            message: 'Registrar unidades vencidas para historial',
            priority: 'medium',
            icon: '📋'
        })
    }

    return suggestions
}

/**
 * Obtiene productos con sus métricas y sugerencias
 * @param {number} limit - Límite de productos
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getProductsWithIntelligence(limit = 50) {
    try {
        // Obtener productos con batches
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                id, name, barcode, brand,
                batches (
                    id, quantity, quantity_remaining, expiration_date
                )
            `)
            .limit(limit)

        if (error) {
            return { data: [], error: 'Error al obtener productos' }
        }

        const result = []

        for (const product of products) {
            const { data: fullMetrics } = await getProductMetrics(product.id)
            if (!fullMetrics) continue

            const suggestions = generateSuggestions(fullMetrics.metrics)

            result.push({
                product: fullMetrics.product,
                metrics: fullMetrics.metrics,
                suggestions,
                hasSuggestions: suggestions.length > 0
            })
        }

        // Ordenar: primero los que tienen sugerencias de alta prioridad
        result.sort((a, b) => {
            const aHighPriority = a.suggestions.filter(s => s.priority === 'high').length
            const bHighPriority = b.suggestions.filter(s => s.priority === 'high').length
            if (aHighPriority !== bHighPriority) return bHighPriority - aHighPriority
            return b.suggestions.length - a.suggestions.length
        })

        return { data: result }

    } catch (err) {
        console.error('Error in getProductsWithIntelligence:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

// ============================================
// NEW: Functions using analytics views
// ============================================

/**
 * Obtiene métricas calculadas directamente desde tablas (respeta RLS)
 * @param {number} limit 
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getProductMetricsFromView(limit = 50) {
    try {
        // Query directa a productos y lotes (respeta RLS)
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select(`
                id,
                name,
                barcode,
                brand,
                batches (
                    id,
                    quantity,
                    quantity_remaining,
                    expiration_date
                )
            `)
            .limit(limit)

        if (prodError) {
            console.error('Error fetching products:', prodError)
            return { data: [], error: 'Error al obtener métricas' }
        }

        // Obtener waste events
        const { data: wasteEvents } = await supabase
            .from('waste_events')
            .select('product_id, quantity')

        // Calcular métricas por producto
        const today = new Date().toISOString().split('T')[0]
        const in20Days = new Date()
        in20Days.setDate(in20Days.getDate() + 20)
        const in20DaysStr = in20Days.toISOString().split('T')[0]

        const metrics = products.map(p => {
            const batches = p.batches || []
            const wasteForProduct = (wasteEvents || []).filter(w => w.product_id === p.id)

            const totalUnitsLoaded = batches.reduce((sum, b) => sum + (b.quantity || 0), 0)
            const totalUnitsWasted = wasteForProduct.reduce((sum, w) => sum + (w.quantity || 0), 0)
            const currentStock = batches.reduce((sum, b) => sum + (b.quantity_remaining || 0), 0)

            const unitsExpired = batches
                .filter(b => b.quantity_remaining > 0 && b.expiration_date <= today)
                .reduce((sum, b) => sum + b.quantity_remaining, 0)

            const unitsExpiring20d = batches
                .filter(b => b.quantity_remaining > 0 && b.expiration_date > today && b.expiration_date <= in20DaysStr)
                .reduce((sum, b) => sum + b.quantity_remaining, 0)

            const wasteRatio = totalUnitsLoaded > 0
                ? Math.round((totalUnitsWasted / totalUnitsLoaded) * 100 * 10) / 10
                : 0

            const riskScore = Math.min(100, Math.round(
                (wasteRatio * 0.4) +
                (currentStock > 0 ? (unitsExpired / currentStock) * 30 : 0) +
                (currentStock > 0 ? (unitsExpiring20d / currentStock) * 30 : 0)
            ))

            return {
                product_id: p.id,
                name: p.name,
                barcode: p.barcode,
                supplier: p.brand,
                total_units_loaded: totalUnitsLoaded,
                total_units_wasted: totalUnitsWasted,
                current_stock: currentStock,
                waste_ratio: wasteRatio,
                units_expired: unitsExpired,
                units_expiring_20d: unitsExpiring20d,
                risk_score: riskScore
            }
        })

        // Ordenar por risk_score
        metrics.sort((a, b) => b.risk_score - a.risk_score)

        return { data: metrics }

    } catch (err) {
        console.error('Error:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Top N productos por pérdida (query directa, respeta RLS)
 * @param {number} limit 
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getTopWasteProducts(limit = 5) {
    try {
        const { data: metrics } = await getProductMetricsFromView(100)

        const topWaste = (metrics || [])
            .filter(m => m.total_units_wasted > 0)
            .sort((a, b) => b.total_units_wasted - a.total_units_wasted)
            .slice(0, limit)

        return { data: topWaste }

    } catch (err) {
        console.error('Error:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Top N productos por riesgo próximo (query directa, respeta RLS)
 * @param {number} limit 
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getTopRiskProducts(limit = 5) {
    try {
        // Query directa a productos y lotes
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                barcode,
                batches (
                    quantity_remaining,
                    expiration_date
                )
            `)

        if (error) {
            console.error('Error fetching products:', error)
            return { data: [], error: 'Error al obtener datos' }
        }

        const today = new Date().toISOString().split('T')[0]
        const in30Days = new Date()
        in30Days.setDate(in30Days.getDate() + 30)
        const in30DaysStr = in30Days.toISOString().split('T')[0]

        const riskProducts = products
            .map(p => {
                const batches = p.batches || []

                const unitsExpired = batches
                    .filter(b => b.quantity_remaining > 0 && b.expiration_date <= today)
                    .reduce((sum, b) => sum + b.quantity_remaining, 0)

                const unitsExpiring30d = batches
                    .filter(b => b.quantity_remaining > 0 && b.expiration_date > today && b.expiration_date <= in30DaysStr)
                    .reduce((sum, b) => sum + b.quantity_remaining, 0)

                // Calcular días al próximo vencimiento
                const futureExpirations = batches
                    .filter(b => b.quantity_remaining > 0 && b.expiration_date > today)
                    .map(b => b.expiration_date)
                    .sort()

                let daysToNextExpiry = null
                if (futureExpirations.length > 0) {
                    const nextExp = new Date(futureExpirations[0])
                    const todayDate = new Date(today)
                    daysToNextExpiry = Math.ceil((nextExp - todayDate) / (1000 * 60 * 60 * 24))
                }

                return {
                    product_id: p.id,
                    name: p.name,
                    barcode: p.barcode,
                    units_expired: unitsExpired,
                    units_expiring_30d: unitsExpiring30d,
                    days_to_next_expiry: daysToNextExpiry
                }
            })
            .filter(p => p.units_expiring_30d > 0)
            .sort((a, b) => b.units_expiring_30d - a.units_expiring_30d)
            .slice(0, limit)

        return { data: riskProducts }

    } catch (err) {
        console.error('Error:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Obtiene tendencias mensuales de pérdida (query directa, respeta RLS)
 * @param {number} months 
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getMonthlyTrends(months = 6) {
    try {
        // Query directa a waste_events (respeta RLS)
        const { data, error } = await supabase
            .from('waste_events')
            .select('event_date, quantity')
            .order('event_date', { ascending: false })

        if (error) {
            console.error('Error fetching trends:', error)
            return { data: [], error: 'Error al obtener tendencias' }
        }

        // Agregar por mes
        const byMonth = {}
        for (const row of data) {
            const month = row.event_date.substring(0, 7) // YYYY-MM
            if (!byMonth[month]) {
                byMonth[month] = { month, wasted: 0, sold: 0 }
            }
            byMonth[month].wasted += row.quantity
        }

        return { data: Object.values(byMonth).slice(0, months) }

    } catch (err) {
        console.error('Error:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Obtiene estadísticas globales para el dashboard (query directa, respeta RLS)
 * @returns {Promise<{data: object, error?: string}>}
 */
export async function getDashboardStats() {
    try {
        // Usar getProductMetricsFromView que ya usa queries directas
        const { data: metrics, error } = await getProductMetricsFromView(100)

        if (error) {
            return { data: null, error }
        }

        const stats = {
            totalProducts: metrics.length,
            totalWastedUnits: metrics.reduce((sum, m) => sum + (m.total_units_wasted || 0), 0),
            avgWasteRatio: metrics.length > 0
                ? Math.round(metrics.reduce((sum, m) => sum + (m.waste_ratio || 0), 0) / metrics.length * 10) / 10
                : 0,
            highRiskCount: metrics.filter(m => (m.units_expired || 0) > 0 || m.risk_score >= 60).length,
            unitsExpired: metrics.reduce((sum, m) => sum + (m.units_expired || 0), 0),
            unitsExpiring20d: metrics.reduce((sum, m) => sum + (m.units_expiring_20d || 0), 0)
        }

        return { data: stats }

    } catch (err) {
        console.error('Error:', err)
        return { data: null, error: 'Error de conexión' }
    }
}

/**
 * Obtiene sugerencias centralizadas (query directa, respeta RLS)
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getAllSuggestions() {
    try {
        // Usar getProductMetricsFromView que ya usa queries directas
        const { data: metrics } = await getProductMetricsFromView(50)

        if (!metrics || metrics.length === 0) {
            return { data: [] }
        }

        const suggestions = []

        for (const p of metrics) {
            // Registrar pérdida para productos VENCIDOS
            if ((p.units_expired || 0) > 0) {
                suggestions.push({
                    type: 'register_waste',
                    productId: p.product_id,
                    productName: p.name,
                    message: `Registrar ${p.units_expired} unidades vencidas como pérdida`,
                    priority: 'high',
                    icon: '⚠️'
                })
            }

            // Reducir pedido (basado en historial de pérdida)
            if (p.waste_ratio >= 20) {
                const adjustment = p.waste_ratio >= 30 ? -30 : p.waste_ratio >= 20 ? -20 : -10
                suggestions.push({
                    type: 'reduce_order',
                    productId: p.product_id,
                    productName: p.name,
                    message: `Reducir pedido ${Math.abs(adjustment)}%`,
                    priority: adjustment <= -30 ? 'high' : 'medium',
                    icon: '📉'
                })
            }

            // Priorizar venta (productos por vencer pronto)
            if ((p.units_expiring_20d || 0) > 0 && (p.units_expiring_20d || 0) < 10) {
                suggestions.push({
                    type: 'prioritize_sale',
                    productId: p.product_id,
                    productName: p.name,
                    message: `Priorizar venta (${p.units_expiring_20d} uds por vencer)`,
                    priority: 'medium',
                    icon: '📢'
                })
            }
        }

        // Ordenar por prioridad
        suggestions.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1
            if (b.priority === 'high' && a.priority !== 'high') return 1
            return 0
        })

        return { data: suggestions.slice(0, 10) }

    } catch (err) {
        console.error('Error:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

