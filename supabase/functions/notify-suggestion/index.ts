// Edge Function: envía un correo cada vez que llega una sugerencia nueva.
// Se conecta con un Database Webhook (ver README.md, paso 6).
//
// Secretos necesarios (supabase secrets set ...):
//   RESEND_API_KEY   clave de https://resend.com
//   NOTIFY_EMAIL     correo que recibirá los avisos
//   FROM_EMAIL       remitente (con Resend sin dominio propio: onboarding@resend.dev)
//   WEBHOOK_SECRET   texto secreto que también pones en el header del webhook

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('No autorizado', { status: 401 })
  }

  const payload = await req.json()
  if (payload.type !== 'INSERT' || payload.table !== 'suggestions') {
    return new Response('Ignorado', { status: 200 })
  }
  const r = payload.record

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('FROM_EMAIL'),
      to: [Deno.env.get('NOTIFY_EMAIL')],
      subject: `Nueva ${String(r.kind).toLowerCase()} en el buzón del Centro de Alumnos`,
      html: `
        <p><strong>Tipo:</strong> ${esc(r.kind)}</p>
        <p><strong>De:</strong> ${esc(r.name || 'Anónimo')}${r.course ? ' · ' + esc(r.course) : ''}</p>
        <p style="white-space:pre-wrap">${esc(r.message)}</p>
        <hr><p style="color:#667">Léelo y respóndelo desde el portal admin.</p>`,
    }),
  })

  return new Response(res.ok ? 'OK' : await res.text(), { status: res.ok ? 200 : 502 })
})
