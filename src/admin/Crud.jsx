
import { useCallback, useEffect, useState } from 'react'
import { supabase, uploadImage } from '../lib/supabase'

export function ImageField({ value, onChange, folder }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBusy(true)
    setErr('')

    try {
      onChange(await uploadImage(file, folder))
    } catch (ex) {
      setErr(ex.message || 'No se pudo subir la imagen.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="adm-img">
      {value && <img src={value} alt="" />}

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={pick}
          disabled={busy}
        />

        {busy && <small>Subiendo…</small>}

        {value && !busy && (
          <button
            type="button"
            className="adm-link adm-link--btn"
            onClick={() => onChange('')}
          >
            Quitar imagen
          </button>
        )}

        {err && <small className="adm-err">{err}</small>}
      </div>
    </div>
  )
}

function Field({ f, value, onChange }) {
  const common = {
    id: f.name,
    required: f.required,
    value: value ?? '',
    onChange: (e) => onChange(e.target.value),
  }

  switch (f.type) {
    case 'textarea':
      return <textarea rows={f.rows || 4} {...common} />

    case 'date':
      return <input type="date" {...common} />

    case 'number':
      return (
        <input
          type="number"
          {...common}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )

    case 'select':
      return (
        <select {...common}>
          {f.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )

    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      )

    case 'image':
      return (
        <ImageField
          value={value}
          onChange={onChange}
          folder={f.folder}
        />
      )

    default:
      return <input type="text" {...common} />
  }
}

export default function Crud({
  title,
  table,
  singular,
  order,
  defaults,
  row,
  fields,
  createLabel,
  formCreateTitle,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Carregar registros
  const load = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(order.column, {
        ascending: order.ascending,
      })

    if (error) {
      setError(error.message)
    } else {
      setRows(data)
      setError('')
    }

    setLoading(false)
  }, [table, order.column, order.ascending])

  useEffect(() => {
    load()
  }, [load])

  // Guardar registro
  const save = async (e) => {
    e.preventDefault()

    setSaving(true)
    setError('')

    const { id, created_at, ...payload } = editing

    Object.keys(payload).forEach((k) => {
      if (
        payload[k] === '' &&
        fields.find((f) => f.name === k)?.type === 'image'
      ) {
        payload[k] = null
      }
    })

    const q = id
      ? supabase.from(table).update(payload).eq('id', id)
      : supabase.from(table).insert(payload)

    const { error } = await q

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setEditing(null)
    load()
  }

  // Eliminar registro
  const remove = async (r) => {
    if (
      !window.confirm(
        `¿Eliminar "${row(r).title}"? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', r.id)

    if (error) {
      setError(error.message)
    } else {
      load()
    }
  }

  return (
    <section>
      <div className="adm-head">
        <h1>{title}</h1>

        {!editing && (
          <button
            className="adm-btn"
            onClick={() => setEditing(defaults())}
          >
            + {createLabel || `Nuevo ${singular}`}
          </button>
        )}
      </div>

      {error && (
        <div className="adm-alert adm-alert--err">
          {error}
        </div>
      )}

      {editing ? (
        <form className="adm-form" onSubmit={save}>
          <h2>
            {editing.id
              ? `Editar ${singular}`
              : formCreateTitle || `Nuevo ${singular}`}
          </h2>

          {fields.map((f) => (
            <label
              key={f.name}
              className={f.type === 'checkbox' ? 'adm-check' : ''}
            >
              <span>{f.label}</span>

              <Field
                f={f}
                value={editing[f.name]}
                onChange={(v) =>
                  setEditing({
                    ...editing,
                    [f.name]: v,
                  })
                }
              />
            </label>
          ))}

          <div className="adm-actions">
            <button
              className="adm-btn"
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>

            <button
              type="button"
              className="adm-btn adm-btn--ghost"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : loading ? (
        <p className="adm-muted">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="adm-muted">
          Aún no hay elementos. Crea el primero con el botón de arriba.
        </p>
      ) : (
        <ul className="adm-list">
          {rows.map((r) => {
            const v = row(r)

            return (
              <li key={r.id}>
                {v.image && (
                  <img src={v.image} alt="" />
                )}

                <div className="adm-list__text">
                  <strong>{v.title}</strong>
                  <small>{v.sub}</small>
                </div>

                <div className="adm-actions">
                  <button
                    className="adm-btn adm-btn--ghost"
                    onClick={() => setEditing(r)}
                  >
                    Editar
                  </button>

                  <button
                    className="adm-btn adm-btn--danger"
                    onClick={() => remove(r)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
