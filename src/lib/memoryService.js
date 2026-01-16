import { supabase } from './supabase'

export const memoryService = {
  /**
   * Get memory entry by barcode
   */
  async getByBarcode(user_id, barcode) {
    const { data, error } = await supabase
      .from('user_product_memory')
      .select('*')
      .eq('user_id', user_id)
      .eq('barcode', barcode)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Search memory by product name (simple ILIKE)
   */
  async search(user_id, query) {
    if (!query) return []

    const { data, error } = await supabase
      .from('user_product_memory')
      .select('*')
      .eq('user_id', user_id)
      .ilike('product_name', `%${query}%`)
      .order('usage_count', { ascending: false })
      .order('last_used_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return data
  },

  /**
   * Get suggestions for autocomplete
   * Wraps search for now
   */
  async getSuggestions(user_id, query) {
    return this.search(user_id, query)
  },

  /**
   * Update or insert memory entry
   * Last write wins, no history
   */
  async updateMemory(user_id, data) {
    const { barcode, product_name, laboratory, location } = data

    // Check for existing entry to increment usage
    let existing = null
    try {
      existing = await this.getByBarcode(user_id, barcode)
    } catch (e) {
      // ignore error
    }

    const newCount = existing ? ((existing.usage_count || 0) + 1) : 1

    const { error } = await supabase
      .from('user_product_memory')
      .upsert({
        user_id,
        barcode,
        product_name,
        laboratory: laboratory || null,
        location: location || null,
        usage_count: newCount,
        last_used_at: new Date()
      }, { onConflict: 'user_id,barcode' })

    if (error) throw error
    return true
  }
}
