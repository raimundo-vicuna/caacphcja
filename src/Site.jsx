import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SCHOOL, CENTRO, NAV, NOSOTROS } from './data'
import { useContent, parseDate, formatDate } from './lib/content'
import { supabase, configured } from './lib/supabase'
import { Analytics } from "@vercel/analytics/next"

function Img({ src, className = '', alt }) {
  const [ok, setOk] = useState(true)
  if (!src || !ok) return null
  return <img className={className} src={src} alt={alt} onError={() => setOk(false)} />
}

function Header() {
  const [open, setOpen] = useState(false)
  const { settings } = useContent()
  return (
    <header className="header">
      <div className="topbar">
        <a href={SCHOOL.sitio} target="_blank" rel="noreferrer">
          Ir al sitio oficial del colegio ↗
        </a>
      </div>
      <div className="header__inner">
        <a href="#/" onClick={() => window.scrollTo({ top: 0 })} className="brand">
          <Img className="brand__logo" src={settings.logo_url} alt={`Logo ${CENTRO.nombre}`} />
          <Img className="brand__logo" src={SCHOOL.escudo} alt={`Escudo ${SCHOOL.sigla}`} />
          <span className="brand__text">
            <strong>{CENTRO.nombre}</strong>
            <small>{SCHOOL.sigla}</small>
          </span>
        </a>
        <button
          className="burger"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
        <nav className={`nav ${open ? 'nav--open' : ''}`}>
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#/`}
              onClick={(e) => {
                e.preventDefault()
                setOpen(false)
                document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {n.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  const { settings } = useContent()
  return (
    <section id="inicio" className="hero">
      <div className="hero__overlay" />
      <div className="hero__content">
        <Img className="hero__logo" src={settings.logo_url || SCHOOL.escudo} alt="Logo" />
        <h1>{settings.bienvenida}</h1>
        <p className="hero__lema">“{settings.lema}”</p>
        <a
          className="btn"
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('noticias')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          VER NOTICIAS
        </a>
      </div>
    </section>
  )
}

function Empty({ children }) {
  return <p className="empty">{children}</p>
}

function Nosotros() {
  const { settings, board } = useContent()
  return (
    <section id="nosotros" className="section">
      <div className="container">
        <h2 className="title">{NOSOTROS.titulo}</h2>
        <p className="lead">{settings.nosotros_texto}</p>
        <div className="grid grid--2">
          <article className="card card--accent">
            <h3>Misión</h3>
            <p>{settings.mision}</p>
          </article>
          <article className="card card--accent">
            <h3>Visión</h3>
            <p>{settings.vision}</p>
          </article>
        </div>

        <h2 className="title title--sub">Directiva</h2>
        {board.length === 0 ? (
          <Empty>Pronto publicaremos a la directiva.</Empty>
        ) : (
          <div className="grid grid--3">
            {board.map((d) => (
              <article key={d.id} className="person">
                <div className="person__photo">
                  {d.photo_url ? (
                    <img src={d.photo_url} alt={d.name || d.role} />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" />
                    </svg>
                  )}
                </div>
                <h3>{d.role}</h3>
                <p>{d.name || 'Nombre'}{d.course ? ` · ${d.course}` : !d.name ? ' y curso' : ''}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Noticias() {
  const { news, events } = useContent()
  return (
    <section id="noticias" className="section section--alt">
      <div className="container">
        <h2 className="title">NOTICIAS</h2>
        {news.length === 0 ? (
          <Empty>Aún no hay noticias publicadas.</Empty>
        ) : (
          <div className="grid grid--3">
            {news.map((n) => (
              <article key={n.id} className="news">
                {n.image_url ? (
                  <img className="news__img" src={n.image_url} alt={n.title} />
                ) : (
                  <div className="news__img" aria-hidden="true">Imagen</div>
                )}
                <div className="news__body">
                  <h3>{n.title}</h3>
                  <p>{n.summary}</p>
                  <time>{n.published_at ? formatDate(n.published_at) : n.dateLabel}</time>
                </div>
              </article>
            ))}
          </div>
        )}

        <h2 className="title title--sub">Calendario de eventos</h2>
        {events.length === 0 ? (
          <Empty>No hay eventos próximos.</Empty>
        ) : (
          <ul className="events">
            {events.map((e) => {
              const d = parseDate(e.event_date)
              return (
                <li key={e.id} className="event">
                  <div className="event__date">
                    <strong>{d ? d.dia : e.dia}</strong>
                    <span>{d ? d.mes : e.mes}</span>
                  </div>
                  <div>
                    <h3>{e.title}</h3>
                    <p>{e.detail}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function Propuestas() {
  const { proposals } = useContent()
  return (
    <section id="propuestas" className="section">
      <div className="container">
        <h2 className="title">Propuestas y proyectos</h2>
        {proposals.length === 0 ? (
          <Empty>Pronto compartiremos nuestras propuestas.</Empty>
        ) : (
          <div className="grid grid--3">
            {proposals.map((p) => (
              <article key={p.id} className="card">
                <span className="tag">{p.status}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Contacto() {
  const { settings } = useContent()
  const [form, setForm] = useState({ nombre: '', curso: '', tipo: 'Sugerencia', mensaje: '', web: '' })
  const [status, setStatus] = useState('idle') // idle | sending | ok | error
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    if (form.web) return // campo trampa para bots: los humanos no lo ven

    // Sin Supabase configurado: respaldo por correo
    if (!configured) {
      const asunto = encodeURIComponent(`${form.tipo} - Buzón del Centro de Alumnos`)
      const cuerpo = encodeURIComponent(`Nombre: ${form.nombre || 'Anónimo'}\nCurso: ${form.curso}\n\n${form.mensaje}`)
      window.location.href = `mailto:${settings.email}?subject=${asunto}&body=${cuerpo}`
      return
    }

    setStatus('sending')
    const { error } = await supabase.from('suggestions').insert({
      name: form.nombre.trim(),
      course: form.curso.trim(),
      kind: form.tipo,
      message: form.mensaje.trim(),
    })
    if (error) {
      console.error(error)
      setStatus('error')
    } else {
      setStatus('ok')
      setForm({ nombre: '', curso: '', tipo: 'Sugerencia', mensaje: '', web: '' })
    }
  }

  return (
    <section id="contacto" className="section section--alt">
      <div className="container grid grid--2 contact">
        <div>
          <h2 className="title">Contáctanos</h2>
          <p className="lead">
            ¿Tienes una idea, un reclamo o quieres participar? Escríbenos desde el buzón de sugerencias.
          </p>
          <ul className="contact__list">
            <li><strong>Correo:</strong> {settings.email}</li>
            <li><strong>Instagram:</strong> {settings.instagram}</li>
            <li><strong>Colegio:</strong> {SCHOOL.direccion}</li>
          </ul>
        </div>

        <form className="form" onSubmit={enviar}>
          <h3>Buzón de sugerencias</h3>
          {status === 'ok' && <p className="form__msg form__msg--ok">¡Gracias! Recibimos tu mensaje.</p>}
          {status === 'error' && (
            <p className="form__msg form__msg--err">No pudimos enviar tu mensaje. Inténtalo de nuevo más tarde.</p>
          )}
          <label>
            Nombre (opcional)
            <input maxLength={100} value={form.nombre} onChange={set('nombre')} />
          </label>
          <label>
            Curso
            <input maxLength={50} value={form.curso} onChange={set('curso')} />
          </label>
          <label>
            Tipo de mensaje
            <select value={form.tipo} onChange={set('tipo')}>
              <option>Sugerencia</option>
              <option>Reclamo</option>
              <option>Propuesta</option>
              <option>Consulta</option>
            </select>
          </label>
          <label>
            Mensaje
            <textarea rows="5" required maxLength={2000} value={form.mensaje} onChange={set('mensaje')} />
          </label>
          <input
            className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true"
            name="web" value={form.web} onChange={set('web')}
          />
          <button className="btn" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'ENVIANDO…' : 'ENVIAR'}
          </button>
        </form>
      </div>
    </section>
  )
}

function Footer() {
  const { settings } = useContent()
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <Img className="footer__logo" src={SCHOOL.escudo} alt={`Escudo ${SCHOOL.sigla}`} />
        <div>
          <h4>{CENTRO.nombre}</h4>
          <p>{SCHOOL.nombre}</p>
          <p>{SCHOOL.direccion}</p>
        </div>
        <div>
          <h4>Síguenos</h4>
          <p>{settings.instagram}</p>
        </div>
      </div>
      <div className="footer__bottom">
        Sitio del Centro de Alumnos · No es el sitio oficial del colegio ·{' '}
        <a href={SCHOOL.sitio} target="_blank" rel="noreferrer">cph-cja.com</a>
        {configured && <> · <Link to="/admin">Admin</Link></>}
                <div>
          <p>Raimundo Vicuña © 2026</p>
        </div>
      </div>
    </footer>
  )
}

export default function Site() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Nosotros />
        <Noticias />
        <Propuestas />
        <Contacto />
      </main>
      <Footer />
    </>
  )
}
