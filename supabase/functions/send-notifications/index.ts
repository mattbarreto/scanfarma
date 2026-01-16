// Supabase Edge Function: Send Notification Emails
// Uses Resend for email delivery

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface NotificationAlert {
    rule_type: string
    products: Array<{
        name: string
        value: number
        detail: string
    }>
}

serve(async (req) => {
    console.log('🚀 Starting send-notifications function')

    try {
        // Verify environment variables
        if (!RESEND_API_KEY) {
            console.error('❌ RESEND_API_KEY not configured')
            return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 })
        }
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('❌ Supabase credentials not configured')
            return new Response(JSON.stringify({ error: 'Supabase credentials not configured' }), { status: 500 })
        }

        console.log('✅ Environment variables OK')

        // Initialize Supabase client with service role for full access
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // 1. Get products expiring soon (within 30 days)
        console.log('📦 Fetching expiring products...')
        const { data: expiringProducts, error: productsError } = await supabase
            .from('forecast_risk')
            .select('name, units_expiring_30d, days_to_next_expiry')
            .gt('units_expiring_30d', 0)
            .lte('days_to_next_expiry', 30)
            .limit(10)

        if (productsError) {
            console.error('❌ Error fetching products:', productsError)
            return new Response(JSON.stringify({ error: productsError.message }), { status: 500 })
        }

        console.log(`📦 Found ${expiringProducts?.length || 0} expiring products`)

        if (!expiringProducts || expiringProducts.length === 0) {
            console.log('✅ No products expiring soon, no email needed')
            return new Response(JSON.stringify({
                success: true,
                message: 'No products expiring soon',
                processed: 0
            }))
        }

        // 2. Get users with notifications enabled
        console.log('👥 Fetching users...')
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()

        if (authError) {
            console.error('❌ Error fetching auth users:', authError)
            // Fallback: use hardcoded test email
            console.log('⚠️ Using fallback email')
        }

        // Force email to registered Resend account for free tier testing
        // TODO: Remove this override once domain is verified in Resend
        const targetEmail = 'matiasbarreto@gmail.com'
        const pharmacyName = 'Mi Farmacia'

        console.log(`📧 Sending email to: ${targetEmail}`)

        // 3. Build email content
        const productList = expiringProducts
            .map(p => `<li><strong>${p.name}</strong>: ${p.units_expiring_30d} unidades (${p.days_to_next_expiry} días)</li>`)
            .join('')

        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: sans-serif; background: #f8fafc; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px;">
                <h1 style="color: #1e293b;">🔔 Alertas de Inventario</h1>
                <p style="color: #64748b;">${pharmacyName}</p>
                
                <h3 style="color: #f59e0b;">📅 Productos por vencer</h3>
                <ul>${productList}</ul>
                
                <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
                    Email automático de ScanFarma
                </p>
            </div>
        </body>
        </html>
        `

        // 4. Send email via Resend
        // Using Resend's test domain for unverified accounts
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'ScanFarma <onboarding@resend.dev>',  // Using Resend test domain
                to: targetEmail,
                subject: `⚠️ Alertas de inventario - ${pharmacyName}`,
                html: emailHtml
            })
        })

        const resData = await res.json()
        console.log('📧 Resend response:', JSON.stringify(resData))

        if (!res.ok) {
            console.error('❌ Resend error:', resData)

            // Log to database
            await supabase.from('notifications_log').insert({
                rule_type: 'EXPIRING_SOON',
                message: `Error sending email: ${JSON.stringify(resData)}`,
                channel: 'email',
                status: 'failed',
                error_message: JSON.stringify(resData)
            })

            return new Response(JSON.stringify({
                success: false,
                error: resData
            }), { status: 500 })
        }

        // 5. Log success
        await supabase.from('notifications_log').insert({
            rule_type: 'EXPIRING_SOON',
            message: `Enviadas alertas de ${expiringProducts.length} productos`,
            channel: 'email',
            status: 'sent'
        })

        console.log('✅ Email sent successfully!')

        return new Response(JSON.stringify({
            success: true,
            processed: 1,
            email: targetEmail,
            products: expiringProducts.length
        }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
