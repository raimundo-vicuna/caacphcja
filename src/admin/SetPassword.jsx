import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setBusy(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)

    if (updateError) {
      setError(updateError.message || 'No se pudo guardar la contraseña.')
      return
    }

    setNotice('Contraseña configurada. Ya puedes entrar al panel.')
    window.setTimeout(() => navigate('/admin/sugerencias', { replace: true }), 900)
  }

  return (
    <div className="adm-login">
      <form className="adm-login__box" onSubmit={submit}>
        <h1>Configurar contraseña</h1>
        <p>Elige una contraseña para tu cuenta de administrador.</p>
        {error && <div className="adm-alert adm-alert--err" role="alert">{error}</div>}
        {notice && <div className="adm-alert adm-alert--ok" role="status">{notice}</div>}
        <label>
          Nueva contraseña
          <input
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label>
          Repetir contraseña
          <input
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
        </label>
        <button className="adm-btn" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar contraseña'}
        </button>
        <Link to="/admin/sugerencias" className="adm-link">Volver al panel</Link>
      </form>
    </div>
  )
}
