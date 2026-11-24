import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const KINDS = ['Sugerencia', 'Reclamo', 'Propuesta', 'Consulta']

export default function NotificationPreferences() {
  const [enabled, setEnabled] = useState(true)
  const [kinds, setKinds] = useState(KINDS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        if (active) {
          setMessage({ ok: false, text: 'No se pudo identificar tu cuenta. Vuelve a iniciar sesión.' })
          setLoading(false)
        }
        return
      }
      const { data, error } = await supabase
        .from('admin_notification_preferences')
        .select('enabled, kinds')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (!active) return
      if (error) setMessage({ ok: false, text: 'No se pudieron cargar tus preferencias.' })
      else if (data) {
        setEnabled(data.enabled)
        setKinds(data.kinds || [])
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const toggleKind = (kind) => {
    setKinds((current) => current.includes(kind)
      ? current.filter((item) => item !== kind)
      : [...current, kind])
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setMessage({ ok: false, text: 'No se pudo identificar tu cuenta.' })
      setSaving(false)
      return
    }

    const { error } = await supabase.from('admin_notification_preferences').upsert({
      user_id: userData.user.id,
      enabled,
      kinds,
      updated_at: new Date().toISOString(),
    })
    setMessage(error
      ? { ok: false, text: 'No se pudieron guardar tus preferencias. Inténtalo nuevamente.' }
      : { ok: true, text: 'Tus preferencias de notificaciones se guardaron.' })
    setSaving(false)
  }

  if (loading) return <p className="adm-muted">Cargando tus preferencias…</p>

  return (
    <section>
      <div className="adm-head"><h1>Mis notificaciones</h1></div>
      <p className="adm-muted">
        Estas opciones solo afectan los correos que recibes tú. No cambian las preferencias de los demás administradores.
      </p>
      {message && <div className={`adm-alert ${message.ok ? 'adm-alert--ok' : 'adm-alert--err'}`} role={message.ok ? 'status' : 'alert'}>{message.text}</div>}
      <form className="adm-form" onSubmit={save}>
        <label className="adm-check">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Recibir notificaciones por correo
        </label>
        <p className="adm-muted">Si desactivas esta opción, no recibirás ningún aviso del buzón.</p>
        <h2>Tipos de notificación</h2>
        <p className="adm-muted">Selecciona los tipos de mensajes que quieres recibir.</p>
        {KINDS.map((kind) => (
          <label className="adm-check" key={kind}>
            <input
              type="checkbox"
              checked={kinds.includes(kind)}
              disabled={!enabled}
              onChange={() => toggleKind(kind)}
            />
            {kind}
          </label>
        ))}
        <div className="adm-actions">
          <button className="adm-btn" disabled={saving}>{saving ? 'Guardando…' : 'Guardar preferencias'}</button>
        </div>
      </form>
    </section>
  )
}
