import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const KINDS = ['Todos', 'Sugerencia', 'Reclamo', 'Propuesta', 'Consulta']
const VIEWS = [
  { id: 'inbox', label: 'Bandeja' },
  { id: 'unread', label: 'No leídas' },
  { id: 'archived', label: 'Archivadas' },
]

const fmt = (iso) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

export default function Suggestions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('inbox')
  const [kind, setKind] = useState('Todos')
  const [openId, setOpenId] = useState(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('suggestions').select('*').order('created_at', { ascending: false }).limit(500)
    if (error) setError(error.message)
    else { setRows(data); setError('') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Se actualiza sola cuando llega una sugerencia nueva
  useEffect(() => {
    const ch = supabase.channel('suggestions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const patch = async (id, values) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...values } : r)))
    const { error } = await supabase.from('suggestions').update(values).eq('id', id)
    if (error) { setError(error.message); load() }
  }

  const remove = async (r) => {
    if (!window.confirm('¿Eliminar este mensaje definitivamente?')) return
    const { error } = await supabase.from('suggestions').delete().eq('id', r.id)
    if (error) setError(error.message)
    else setRows((rs) => rs.filter((x) => x.id !== r.id))
  }

  const toggle = (r) => {
    setOpenId(openId === r.id ? null : r.id)
    if (!r.read) patch(r.id, { read: true })
  }

  const visible = useMemo(
    () => rows.filter((r) => {
      if (kind !== 'Todos' && r.kind !== kind) return false
      if (view === 'archived') return r.archived
      if (r.archived) return false
      if (view === 'unread') return !r.read
      return true
    }),
    [rows, view, kind]
  )
  const unread = rows.filter((r) => !r.read && !r.archived).length

  return (
    <section>
      <div className="adm-head">
        <h1>Sugerencias {unread > 0 && <span className="adm-badge">{unread} nuevas</span>}</h1>
      </div>
      {error && <div className="adm-alert adm-alert--err">{error}</div>}

      <div className="adm-filters">
        <div className="adm-tabs">
          {VIEWS.map((v) => (
            <button key={v.id} className={view === v.id ? 'active' : ''} onClick={() => setView(v.id)}>{v.label}</button>
          ))}
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filtrar por tipo">
          {KINDS.map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="adm-muted">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="adm-muted">No hay mensajes en esta vista.</p>
      ) : (
        <ul className="adm-sug">
          {visible.map((r) => (
            <li key={r.id} className={`${r.read ? '' : 'unread'} ${openId === r.id ? 'open' : ''}`}>
              <button className="adm-sug__row" onClick={() => toggle(r)}>
                <span className={`adm-kind adm-kind--${r.kind}`}>{r.kind}</span>
                <span className="adm-sug__who">{r.name || 'Anónimo'}{r.course ? ` · ${r.course}` : ''}</span>
                <span className="adm-sug__preview">{r.message}</span>
                <time>{fmt(r.created_at)}</time>
              </button>
              {openId === r.id && (
                <div className="adm-sug__body">
                  <p>{r.message}</p>
                  <div className="adm-actions">
                    <button className="adm-btn adm-btn--ghost" onClick={() => patch(r.id, { read: !r.read })}>
                      Marcar como {r.read ? 'no leída' : 'leída'}
                    </button>
                    <button className="adm-btn adm-btn--ghost" onClick={() => patch(r.id, { archived: !r.archived })}>
                      {r.archived ? 'Desarchivar' : 'Archivar'}
                    </button>
                    <button className="adm-btn adm-btn--danger" onClick={() => remove(r)}>Eliminar</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
