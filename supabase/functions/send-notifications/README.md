# Configuración de Notificaciones Automáticas

## Requisitos

1. **Cuenta en Resend**: https://resend.com (gratis hasta 3000 emails/mes)
2. **Dominio verificado** en Resend (o usar el sandbox para testing)

## Configuración de Secrets

En Supabase Dashboard > Settings > Edge Functions > Secrets, agregar:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

## Desplegar Edge Function

```bash
# Desde la raíz del proyecto
supabase functions deploy send-notifications
```

## Probar manualmente

```bash
supabase functions invoke send-notifications
```

## Configurar Cron (3 opciones)

### Opción A: Supabase Dashboard (Recomendado)
1. Dashboard > Edge Functions > send-notifications
2. Click "Schedule"
3. Cron expression: `0 11 * * *` (8:00 AM Argentina = 11:00 UTC)

### Opción B: Webhook externo (cron-job.org)
1. Crear cuenta en https://cron-job.org
2. Nueva tarea con URL:
   ```
   POST https://<proyecto>.supabase.co/functions/v1/send-notifications
   ```
3. Header: `Authorization: Bearer <SERVICE_ROLE_KEY>`

### Opción C: pg_cron
Ver `007_cron_notifications.sql` para instrucciones.

## Verificar funcionamiento

Revisar tabla `notifications_log` en Supabase para ver historial de envíos.
