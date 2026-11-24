import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, configured } from './supabase'
import { CENTRO, NOSOTROS, DIRECTIVA, NOTICIAS, EVENTOS, PROPUESTAS } from '../data'

export const DEFAULT_SETTINGS = {
  lema: CENTRO.lema,
  bienvenida: CENTRO.bienvenida,
  email: CENTRO.email,
  instagram: CENTRO.instagram,
  nosotros_texto: NOSOTROS.texto,
  mision: NOSOTROS.mision,
  vision: NOSOTROS.vision,
  logo_url: '',
  color_primary: '#14305e',
  color_accent: '#963234',
  color_gold: '#e0b84a',
}

const FALLBACK = {
  news: NOTICIAS.map((n, i) => ({
    id: `n${i}`, title: n.titulo, summary: n.resumen, published_at: null, image_url: null,
    dateLabel: n.fecha,
  })),
  events: EVENTOS.map((e, i) => ({
    id: `e${i}`, title: e.titulo, detail: e.detalle, event_date: null, dia: e.dia, mes: e.mes,
  })),
  proposals: PROPUESTAS.map((p, i) => ({ id: `p${i}`, title: p.titulo, text: p.texto, status: p.estado })),
  board: DIRECTIVA.map((d, i) => ({ id: `b${i}`, role: d.cargo, name: '', course: '', photo_url: null })),
}

const Ctx = createContext(null)
export const useContent = () => useContext(Ctx)

export function ContentProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [data, setData] = useState(FALLBACK)
  const [loading, setLoading] = useState(configured)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!configured) return
    try {
      const [s, n, e, p, b] = await Promise.all([
        supabase.from('site_settings').select('data').eq('id', 1).maybeSingle(),
        supabase.from('news').select('*').eq('published', true).order('published_at', { ascending: false }).limit(12),
        supabase.from('events').select('*').gte('event_date', new Date().toISOString().slice(0, 10)).order('event_date').limit(12),
        supabase.from('proposals').select('*').order('sort').order('created_at'),
        supabase.from('board_members').select('*').order('sort').order('created_at'),
      ])
      const firstErr = [s, n, e, p, b].find((r) => r.error)?.error
      if (firstErr) throw firstErr
      setSettings({ ...DEFAULT_SETTINGS, ...(s.data?.data || {}) })
      setData({ news: n.data, events: e.data, proposals: p.data, board: b.data })
      setError('')
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el contenido.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    const r = document.documentElement.style
    r.setProperty('--navy', settings.color_primary)
    r.setProperty('--accent', settings.color_accent)
    r.setProperty('--gold', settings.color_gold)
  }, [settings])

  const value = useMemo(() => ({ settings, ...data, loading, error, reload }), [settings, data, loading, error, reload])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
export function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return { y, m, d, mes: MESES[m - 1], dia: String(d).padStart(2, '0') }
}
export function formatDate(str) {
  const p = parseDate(str)
  return p ? `${p.d} ${p.mes.toLowerCase()} ${p.y}` : ''
}
