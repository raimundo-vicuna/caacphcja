import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_SETTINGS } from '../lib/content'
import { ImageField } from './Crud'

const TEXTS = [
  { name: 'bienvenida', label: 'Título de bienvenida', type: 'text' },
  { name: 'lema', label: 'Lema', type: 'text' },
  { name: 'nosotros_texto', label: 'Quiénes somos', type: 'textarea' },
  { name: 'mision', label: 'Misión', type: 'textarea' },
  { name: 'vision', label: 'Visión', type: 'textarea' },
  { name: 'email', label: 'Correo de contacto', type: 'text' },
  { name: 'instagram', label: 'Instagram', type: 'text' },
]

const COLORS = [
  { name: 'color_primary', label: 'Color principal (menú, títulos, footer)' },
  { name: 'color_accent', label: 'Color de acento (botones, subrayados)' },
  { name: 'color_gold', label: 'Color secundario (detalles)' },
]

export default function Settings() {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null) // { ok, text }

  useEffect(() => {
    supabase.from('site_settings').select('data').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) setMsg({ ok: false, text: error.message })
      setForm({ ...DEFAULT_SETTINGS, ...(data?.data || {}) })
    })
  }, [])

  if (!form) return <p className="adm-muted">Cargando…</p>
  const set = (k) => (v) => setForm({ ...form, [k]: v })

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: 1, data: form, updated_at: new Date().toISOString() })
    setSaving(false)
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Cambios guardados. Ya se ven en la página.' })
  }

  const reset = () => {
    setForm({ ...form, color_primary: DEFAULT_SETTINGS.color_primary, color_accent: DEFAULT_SETTINGS.color_accent, color_gold: DEFAULT_SETTINGS.color_gold })
  }

  return (
    <section>
      <div className="adm-head"><h1>Ajustes de la página</h1></div>
      {msg && <div className={`adm-alert ${msg.ok ? 'adm-alert--ok' : 'adm-alert--err'}`}>{msg.text}</div>}

      <form className="adm-form" onSubmit={save}>
        <h2>Textos</h2>
        {TEXTS.map((f) => (
          <label key={f.name}>
            <span>{f.label}</span>
            {f.type === 'textarea'
              ? <textarea rows={4} value={form[f.name] ?? ''} onChange={(e) => set(f.name)(e.target.value)} />
              : <input value={form[f.name] ?? ''} onChange={(e) => set(f.name)(e.target.value)} />}
          </label>
        ))}

        <h2>Logo del Centro de Alumnos</h2>
        <p className="adm-muted">Se muestra en el menú y en la portada junto al escudo del colegio. Si no subes ninguno, solo se usa el escudo del colegio.</p>
        <ImageField value={form.logo_url} onChange={set('logo_url')} folder="logo" />

        <h2>Colores</h2>
        <div className="adm-colors">
          {COLORS.map((c) => (
            <label key={c.name}>
              <span>{c.label}</span>
              <input type="color" value={form[c.name]} onChange={(e) => set(c.name)(e.target.value)} />
            </label>
          ))}
        </div>
        <button type="button" className="adm-link adm-link--btn" onClick={reset}>Restablecer colores originales</button>

        <div className="adm-actions">
          <button className="adm-btn" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </section>
  )
}
