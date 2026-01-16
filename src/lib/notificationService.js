import { supabase } from './supabase'

/**
 * Get user's notification rules
 */
export async function getUserNotificationRules(userId) {
    const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('user_id', userId)

    if (error) {
        console.error('Error fetching notification rules:', error)
        return { data: null, error }
    }

    return { data, error: null }
}

/**
 * Get a specific rule (e.g., EXPIRING_SOON)
 */
export async function getNotificationRule(userId, ruleType) {
    const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('rule_type', ruleType)
        .maybeSingle()

    if (error) {
        console.error('Error fetching notification rule:', error)
        return { data: null, error }
    }

    return { data, error: null }
}

/**
 * Update notification threshold for a specific rule
 */
export async function updateNotificationThreshold(userId, ruleType, threshold) {
    const { data, error } = await supabase
        .from('notification_rules')
        .update({ threshold })
        .eq('user_id', userId)
        .eq('rule_type', ruleType)
        .select()
        .single()

    if (error) {
        console.error('Error updating threshold:', error)
        return { data: null, error }
    }

    return { data, error: null }
}

/**
 * Toggle notifications enabled/disabled for user profile
 */
export async function toggleNotifications(userId, enabled) {
    const { data, error } = await supabase
        .from('user_profiles')
        .update({ notifications_enabled: enabled })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('Error toggling notifications:', error)
        return { data: null, error }
    }

    return { data, error: null }
}

/**
 * Create default notification rules if they don't exist
 */
export async function ensureDefaultRules(userId) {
    const { data: existingRules } = await getUserNotificationRules(userId)

    if (!existingRules || existingRules.length === 0) {
        const defaultRules = [
            { user_id: userId, rule_type: 'EXPIRING_SOON', threshold: 30, enabled: true },
            { user_id: userId, rule_type: 'HIGH_WASTE', threshold: 20, enabled: true },
            { user_id: userId, rule_type: 'HIGH_RISK', threshold: 60, enabled: true }
        ]

        const { error } = await supabase
            .from('notification_rules')
            .insert(defaultRules)

        if (error) {
            console.error('Error creating default rules:', error)
        }
    }
}
