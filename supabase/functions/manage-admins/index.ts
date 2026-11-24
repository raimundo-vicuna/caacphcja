import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return respond({ error: 'Método no permitido.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      || Deno.env.get('SUPABASE_SECRET_KEY')

    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.error('Faltan SUPABASE_URL, SUPABASE_ANON_KEY o una clave de servidor.')
      return respond({ error: 'La función no está configurada correctamente.' }, 500)
    }

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return respond({ error: 'Debes iniciar sesión.' }, 401)

    // Validar el JWT del usuario que llama a la función.
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser(token)
    const caller = userData.user
    if (userError || !caller) return respond({ error: 'La sesión no es válida.' }, 401)

    // Cliente privilegiado: se usa solo en el servidor, nunca en React.
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: callerAdmin, error: permissionError } = await adminClient
      .from('admins')
      .select('user_id')
      .eq('user_id', caller.id)
      .maybeSingle()

    if (permissionError || !callerAdmin) {
      return respond({ error: 'No tienes permisos para administrar estas cuentas.' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const action = body?.action

    if (action === 'list') {
      const { data: rows, error: rowsError } = await adminClient
        .from('admins')
        .select('user_id, created_at')
        .order('created_at', { ascending: true })

      if (rowsError) throw rowsError

      // Los correos se obtienen desde Auth Admin; auth.users nunca se expone al navegador.
      const usersById = new Map<string, string>()
      let page = 1
      const perPage = 1000
      while (true) {
        const { data: pageData, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage })
        if (listError) throw listError
        for (const authUser of pageData.users) {
          usersById.set(authUser.id, authUser.email || '')
        }
        if (pageData.users.length < perPage) break
        page += 1
      }

      return respond({
        admins: (rows || []).map((row) => ({
          ...row,
          email: usersById.get(row.user_id) || '',
        })),
      })
    }

    if (action === 'invite') {
      const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return respond({ error: 'Escribe un correo electrónico válido.' }, 400)
      }

      // Buscar si el correo ya tiene cuenta. Si existe, solo se le agregan permisos.
      let existingUser: { id: string; email?: string } | null = null
      let page = 1
      const perPage = 1000
      while (!existingUser) {
        const { data: pageData, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage })
        if (listError) throw listError
        existingUser = pageData.users.find((u) => (u.email || '').toLowerCase() === email) || null
        if (existingUser || pageData.users.length < perPage) break
        page += 1
      }

      let userId = existingUser?.id
      let invited = false

      if (!userId) {
        const appUrl = Deno.env.get('APP_URL')
        if (!appUrl) {
          return respond({ error: 'Falta configurar APP_URL con la dirección de la página y la ruta de configuración de contraseña.' }, 500)
        }
        const inviteOptions = { redirectTo: appUrl }
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, inviteOptions)
        if (inviteError) {
          console.error('Error invitando usuario:', inviteError.message)
          return respond({ error: 'No se pudo enviar la invitación. Comprueba el correo y la configuración de correo de Supabase.' }, 400)
        }
        userId = inviteData.user?.id
        invited = true
      }

      if (!userId) return respond({ error: 'Supabase no devolvió el usuario creado.' }, 500)

      const { error: insertError } = await adminClient
        .from('admins')
        .insert({ user_id: userId })

      if (insertError) {
        if (insertError.code === '23505') {
          return respond({ error: 'Ese usuario ya es administrador.' }, 409)
        }
        console.error('Error asignando permisos:', insertError.message)
        return respond({ error: 'La cuenta existe, pero no se pudieron asignar los permisos.' }, 500)
      }

      return respond({
        success: true,
        message: invited
          ? `Invitación enviada a ${email}. Cuando acepte, podrá configurar su contraseña.`
          : `Se agregaron permisos de administrador a ${email}.`,
      })
    }

    if (action === 'remove') {
      const userId = typeof body?.user_id === 'string' ? body.user_id : ''
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidPattern.test(userId)) return respond({ error: 'Identificador de usuario inválido.' }, 400)
      if (userId === caller.id) return respond({ error: 'No puedes quitarte tus propios permisos.' }, 400)

      const { count, error: countError } = await adminClient
        .from('admins')
        .select('user_id', { count: 'exact', head: true })
      if (countError) throw countError
      if ((count || 0) <= 1) return respond({ error: 'No puedes eliminar al último administrador.' }, 400)

      const { error: deleteError } = await adminClient
        .from('admins')
        .delete()
        .eq('user_id', userId)
      if (deleteError) throw deleteError

      return respond({ success: true, message: 'Se quitaron los permisos. La cuenta de acceso sigue existiendo.' })
    }

    return respond({ error: 'Acción no reconocida.' }, 400)
  } catch (error) {
    console.error('manage-admins:', error)
    return respond({ error: 'Ocurrió un error interno al administrar usuarios.' }, 500)
  }
})
