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
        const today = new Date()
        const in15Days = new Date(today)
        in15Days.setDate(in15Days.getDate() + 15)

        const expiringBatches = batches.filter(b => {
            const expDate = new Date(b.expiration_date)
            return b.quantity_remaining > 0 && expDate <= in15Days && expDate >= today
        })

        const expiredBatches = batches.filter(b => {
            const expDate = new Date(b.expiration_date)
            return b.quantity_remaining > 0 && expDate < today
        })

        const unitsExpiring = expiringBatches.reduce((sum, b) => sum + b.quantity_remaining, 0)
        const unitsExpired = expiredBatches.reduce((sum, b) => sum + b.quantity_remaining, 0)

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

        const today = new Date()
        const in15Days = new Date(today)
        in15Days.setDate(in15Days.getDate() + 15)

        const riskProducts = []

        for (const product of products) {
            if (!product.batches || product.batches.length === 0) continue

            const totalPurchased = product.batches.reduce((sum, b) => sum + b.quantity, 0)
            const totalRemaining = product.batches.reduce((sum, b) => sum + b.quantity_remaining, 0)

            // Obtener waste
            const { data: wasteSummary } = await getWasteSummaryByProduct(product.id)
            const totalWasted = wasteSummary?.total || 0
            const wastePercentage = totalPurchased > 0 ? (totalWasted / totalPurchased) * 100 : 0

            // Lotes por vencer
            const expiringBatches = product.batches.filter(b => {
                const expDate = new Date(b.expiration_date)
                return b.quantity_remaining > 0 && expDate <= in15Days && expDate >= today
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
 * Obtiene métricas desde la vista product_expiration_metrics
 * Más eficiente que calcular en JS
 * @param {number} limit 
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getProductMetricsFromView(limit = 50) {
    try {
        const { data, error } = await supabase
            .from('product_expiration_metrics')
            .select('*')
            .order('risk_score', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching metrics view:', error)
            return { data: [], error: 'Error al obtener métricas' }
        }

        return { data }

    } catch (err) {
        console.error('Error:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Top N productos por pérdida
 * @param {number} limit 
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getTopWasteProducts(limit = 5) {
    try {
        const { data, error } = await supabase
            .from('product_expiration_metrics')
            .select('product_id, name, barcode, total_units_wasted, waste_ratio, risk_score')
            .gt('total_units_wasted', 0)
            .order('total_units_wasted', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching top waste:', error)
            return { data: [], error: 'Error al obtener datos' }
        }

        return { data }

    } catch (err) {
        console.error('Error:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Top N productos por riesgo próximo (vencen pronto)
 * @param {number} limit 
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getTopRiskProducts(limit = 5) {
    try {
        const { data, error } = await supabase
            .from('forecast_risk')
            .select('product_id, name, barcode, units_expiring_30d, days_to_next_expiry, suggested_order_adjustment')
            .gt('units_expiring_30d', 0)
            .order('units_expiring_30d', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching top risk:', error)
            return { data: [], error: 'Error al obtener datos' }
        }

        return { data }

    } catch (err) {
        console.error('Error:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Obtiene tendencias mensuales de pérdida
 * @param {number} months 
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getMonthlyTrends(months = 6) {
    try {
        const { data, error } = await supabase
            .from('time_based_waste')
            .select('month, wasted_units, sold_units')
            .order('month', { ascending: false })
            .limit(months * 10) // Get more and aggregate in JS

        if (error) {
            console.error('Error fetching trends:', error)
            return { data: [], error: 'Error al obtener tendencias' }
        }

        // Agregar por mes
        const byMonth = {}
        for (const row of data) {
            if (!byMonth[row.month]) {
                byMonth[row.month] = { month: row.month, wasted: 0, sold: 0 }
            }
            byMonth[row.month].wasted += row.wasted_units
            byMonth[row.month].sold += row.sold_units
        }

        return { data: Object.values(byMonth).slice(0, months) }

    } catch (err) {
        console.error('Error:', err)
        return { data: [], error: 'Error de conexión' }
    }
}

/**
 * Obtiene estadísticas globales para el dashboard
 * @returns {Promise<{data: object, error?: string}>}
 */
export async function getDashboardStats() {
    try {
        const { data: metrics, error } = await supabase
            .from('product_expiration_metrics')
            .select('total_units_wasted, waste_ratio, risk_score, units_expiring_20d')

        if (error) {
            console.error('Error fetching stats:', error)
            return { data: null, error: 'Error al obtener estadísticas' }
        }

        const stats = {
            totalProducts: metrics.length,
            totalWastedUnits: metrics.reduce((sum, m) => sum + (m.total_units_wasted || 0), 0),
            avgWasteRatio: metrics.length > 0
                ? Math.round(metrics.reduce((sum, m) => sum + (m.waste_ratio || 0), 0) / metrics.length * 10) / 10
                : 0,
            highRiskCount: metrics.filter(m => m.risk_score >= 60).length,
            unitsExpiring20d: metrics.reduce((sum, m) => sum + (m.units_expiring_20d || 0), 0)
        }

        return { data: stats }

    } catch (err) {
        console.error('Error:', err)
        return { data: null, error: 'Error de conexión' }
    }
}

/**
 * Obtiene sugerencias centralizadas desde todos los productos
 * @returns {Promise<{data: Array, error?: string}>}
 */
export async function getAllSuggestions() {
    try {
        const { data: forecast, error } = await supabase
            .from('forecast_risk')
            .select('product_id, name, units_expiring_30d, days_to_next_expiry, waste_ratio, suggested_order_adjustment')
            .or('units_expiring_30d.gt.0,waste_ratio.gte.15')
            .order('units_expiring_30d', { ascending: false })
            .limit(20)

        if (error) {
            console.error('Error fetching suggestions:', error)
            return { data: [], error: 'Error al obtener sugerencias' }
        }

        const suggestions = []

        for (const p of forecast) {
            // Reducir pedido
            if (p.suggested_order_adjustment < 0) {
                suggestions.push({
                    type: 'reduce_order',
                    productId: p.product_id,
                    productName: p.name,
                    message: `Reducir pedido ${Math.abs(p.suggested_order_adjustment)}%`,
                    priority: p.suggested_order_adjustment <= -30 ? 'high' : 'medium',
                    icon: '📉'
                })
            }

            // Liquidar stock
            if (p.units_expiring_30d >= 10 && p.days_to_next_expiry <= 15) {
                suggestions.push({
                    type: 'liquidate',
                    productId: p.product_id,
                    productName: p.name,
                    message: `Liquidar ${p.units_expiring_30d} unidades (${p.days_to_next_expiry} días)`,
                    priority: 'high',
                    icon: '🏷️'
                })
            }

            // Priorizar venta
            if (p.units_expiring_30d > 0 && p.units_expiring_30d < 10 && p.days_to_next_expiry <= 20) {
                suggestions.push({
                    type: 'prioritize_sale',
                    productId: p.product_id,
                    productName: p.name,
                    message: `Priorizar venta (${p.units_expiring_30d} uds vencen en ${p.days_to_next_expiry} días)`,
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

