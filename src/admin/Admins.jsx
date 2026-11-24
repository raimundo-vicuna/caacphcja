import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

async function manageAdmins(body) {
  const { data, error } = await supabase.functions.invoke('manage-admins', {
    body,
  })

  if (error) {
    let message = error.message || 'No se pudo completar la operación.'
    // Supabase puede adjuntar el Response del servidor al error.
    try {
      if (error.context && typeof error.context.clone === 'function') {
        const responseBody = await error.context.clone().json()
        if (responseBody?.error) message = responseBody.error
      }
    } catch {
      // Conserva el mensaje original si la respuesta no contiene JSON.
    }
    throw new Error(message)
  }

  if (data?.error) throw new Error(data.error)
  return data
}

export default function Admins() {
  const [admins, setAdmins] = useState([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [removingId, setRemovingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadAdmins = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [{ admins: rows }, { data: userData, error: userError }] = await Promise.all([
        manageAdmins({ action: 'list' }),
        supabase.auth.getUser(),
      ])

      if (userError) throw userError
      setAdmins(rows || [])
      setCurrentUserId(userData.user?.id || '')
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los administradores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  const invite = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    try {
      const result = await manageAdmins({
        action: 'invite',
        email: email.trim().toLowerCase(),
      })
      setNotice(result.message || 'Administrador agregado correctamente.')
      setEmail('')
      await loadAdmins()
    } catch (err) {
      setError(err.message || 'No se pudo agregar al administrador.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (admin) => {
    if (admin.user_id === currentUserId) {
      setError('No puedes quitarte tus propios permisos desde esta pantalla.')
      return
    }

    const confirmed = window.confirm(
      `¿Quitar los permisos de administrador a ${admin.email || 'este usuario'}? Su cuenta de acceso no será eliminada.`
    )
    if (!confirmed) return

    setRemovingId(admin.user_id)
    setError('')
    setNotice('')

    try {
      const result = await manageAdmins({
        action: 'remove',
        user_id: admin.user_id,
      })
      setNotice(result.message || 'Permisos de administrador eliminados.')
      await loadAdmins()
    } catch (err) {
      setError(err.message || 'No se pudieron quitar los permisos.')
    } finally {
      setRemovingId('')
    }
  }

  return (
    <section>
      <div className="adm-head">
        <h1>Administradores</h1>
        <button
          type="button"
          className="adm-btn adm-btn--ghost"
          onClick={loadAdmins}
          disabled={loading || busy || Boolean(removingId)}
        >
          Actualizar lista
        </button>
      </div>

      <p className="adm-muted">
        Agrega cuentas que podrán iniciar sesión y administrar el contenido del sitio.
        Si el correo todavía no tiene cuenta, recibirá una invitación de Supabase.
      </p>

      {error && <div className="adm-alert adm-alert--err" role="alert">{error}</div>}
      {notice && <div className="adm-alert adm-alert--ok" role="status">{notice}</div>}

      <form className="adm-form" onSubmit={invite}>
        <h2>Agregar administrador</h2>
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="persona@ejemplo.cl"
            autoComplete="email"
            required
          />
        </label>
        <div className="adm-actions">
          <button className="adm-btn" type="submit" disabled={busy || !email.trim()}>
            {busy ? 'Procesando…' : 'Agregar administrador'}
          </button>
        </div>
        <small className="adm-muted">
          Si la persona ya tiene una cuenta en este proyecto, se le asignarán permisos.
          Si no, se enviará una invitación para que configure su acceso.
        </small>
      </form>

      <div style={{ marginTop: 28 }}>
        <h2>Administradores actuales</h2>
        {loading ? (
          <p className="adm-muted">Cargando administradores…</p>
        ) : admins.length === 0 ? (
          <p className="adm-muted">No se encontraron administradores.</p>
        ) : (
          <ul className="adm-list">
            {admins.map((admin) => (
              <li key={admin.user_id}>
                <div className="adm-list__text">
                  <strong>{admin.email || 'Correo no disponible'}</strong>
                  <small>
                    {admin.user_id === currentUserId ? 'Tu cuenta · ' : ''}
                    Agregado {admin.created_at ? new Date(admin.created_at).toLocaleDateString('es-CL') : ''}
                  </small>
                </div>
                {admin.user_id === currentUserId ? (
                  <small className="adm-muted">Sesión actual</small>
                ) : (
                  <button
                    type="button"
                    className="adm-btn adm-btn--danger"
                    onClick={() => remove(admin)}
                    disabled={Boolean(removingId) || busy}
                  >
                    {removingId === admin.user_id ? 'Quitando…' : 'Quitar acceso'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
