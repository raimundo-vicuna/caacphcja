import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

Deno.serve(async (req) => {
  // Este endpoint se ejecuta desde un Database Webhook, no desde el navegador.
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('No autorizado', { status: 401 })
  }

  try {
    const payload = await req.json()
    if (payload.type !== 'INSERT' || payload.table !== 'suggestions') {
      return new Response('Ignorado', { status: 200 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY')
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL')

    if (!supabaseUrl || !serviceKey || !resendKey || !fromEmail) {
      console.error('Falta configurar uno o más secretos de notificación.')
      return new Response('Función no configurada', { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: recipients, error: recipientsError } = await adminClient
      .from('notification_recipients')
      .select('email')
      .eq('active', true)

    if (recipientsError) throw recipientsError

    const emails = [...new Set((recipients || [])
      .map((item) => String(item.email || '').trim().toLowerCase())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))]

    if (emails.length === 0) {
      return new Response('No hay destinatarios activos.', { status: 200 })
    }

    const record = payload.record || {}
    const kind = esc(String(record.kind || 'Sugerencia'))
    const name = esc(String(record.name || 'Anónimo'))
    const course = record.course ? ` · ${esc(String(record.course))}` : ''
    const message = esc(String(record.message || ''))
    const subject = `Nueva ${String(record.kind || 'sugerencia').toLowerCase()} en el buzón del Centro de Alumnos`

    // Enviar un correo por destinatario para no revelar las direcciones entre sí.
    const results = await Promise.all(emails.map(async (email) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject,
          html: `
            <p><strong>Tipo:</strong> ${kind}</p>
            <p><strong>De:</strong> ${name}${course}</p>
            <p style="white-space:pre-wrap">${message}</p>
            <hr>
            <p style="color:#667">Léelo y respóndelo desde el portal administrador.</p>
          `,
        }),
      })
      return { ok: response.ok, email, details: response.ok ? '' : await response.text() }
    }))

    const failed = results.filter((result) => !result.ok)
    if (failed.length) {
      console.error('Falló el envío a uno o más destinatarios:', failed.map((item) => item.email))
      return new Response('No se pudo enviar a todos los destinatarios.', { status: 502 })
    }

    return new Response(`Avisos enviados: ${results.length}`, { status: 200 })
  } catch (error) {
    console.error('notify-suggestion:', error)
    return new Response('Error interno al enviar las notificaciones.', { status: 500 })
  }
})
