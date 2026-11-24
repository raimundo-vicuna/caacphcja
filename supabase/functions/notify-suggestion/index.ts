import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_KINDS = ['Sugerencia', 'Reclamo', 'Propuesta', 'Consulta']

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

    // Los destinatarios salen de la tabla real de administradores, no de una
    // lista paralela de correos que alguien tenga que mantener manualmente.
    const [{ data: adminRows, error: adminsError }, { data: preferenceRows, error: preferencesError }] = await Promise.all([
      adminClient.from('admins').select('user_id'),
      adminClient.from('admin_notification_preferences').select('user_id, enabled, kinds'),
    ])
    if (adminsError) throw adminsError
    if (preferencesError) throw preferencesError

    const preferences = new Map((preferenceRows || []).map((row) => [row.user_id, row]))
    const adminIds = (adminRows || []).map((row) => row.user_id)
    if (adminIds.length === 0) return new Response('No hay administradores.', { status: 200 })

    const usersById = new Map<string, string>()
    let page = 1
    const perPage = 1000
    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
      if (error) throw error
      for (const user of data.users) {
        if (adminIds.includes(user.id) && user.email) usersById.set(user.id, user.email.trim().toLowerCase())
      }
      if (data.users.length < perPage) break
      page += 1
    }

    const record = payload.record || {}
    const kind = ALLOWED_KINDS.includes(record.kind) ? record.kind : 'Sugerencia'
    const emails = [...new Set(adminIds.flatMap((id) => {
      const email = usersById.get(id)
      const preference = preferences.get(id)
      const enabled = preference?.enabled ?? true
      const kinds = preference?.kinds ?? ALLOWED_KINDS
      return email && enabled && kinds.includes(kind) ? [email] : []
    }))]

    if (emails.length === 0) {
      return new Response('Ningún administrador tiene activadas las notificaciones para este tipo.', { status: 200 })
    }

    const safeKind = esc(String(kind))
    const name = esc(String(record.name || 'Anónimo'))
    const course = record.course ? ` · ${esc(String(record.course))}` : ''
    const message = esc(String(record.message || ''))
    const subject = `Nueva ${kind.toLowerCase()} en el buzón del Centro de Alumnos`

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
            <p><strong>Tipo:</strong> ${safeKind}</p>
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
      console.error('Falló el envío a uno o más administradores:', failed.map((item) => item.email))
      return new Response('No se pudo enviar a todos los administradores seleccionados.', { status: 502 })
    }

    return new Response(`Avisos enviados: ${results.length}`, { status: 200 })
  } catch (error) {
    console.error('notify-suggestion:', error)
    return new Response('Error interno al enviar las notificaciones.', { status: 500 })
  }
})
