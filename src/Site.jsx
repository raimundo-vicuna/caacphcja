import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SCHOOL, CENTRO, NAV, NOSOTROS } from './data'
import { useContent, parseDate, formatDate } from './lib/content'
import { supabase, configured } from './lib/supabase'

function Img({ src, className = '', alt }) {
  const [ok, setOk] = useState(true)
  if (!src || !ok) return null
  return <img className={className} src={src} alt={alt} onError={() => setOk(false)} />
}

const LOGO_FALLBACK = '/logo.jpg'

/* Cordillera: motivo del escudo. Se usa como marca de título y como imagen de relleno. */
export function Peak({ className = '' }) {
  return (
    <svg className={`peak ${className}`} viewBox="0 0 40 14" aria-hidden="true">
      <path d="M1 13 L12 3 L18 9 L27 1 L39 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function Title({ children, sub = false, id }) {
  return (
    <h2 id={id} className={`title ${sub ? 'title--sub' : ''}`}>
      <Peak />
      {children}
    </h2>
  )
}

export function Ridge() {
  return (
    <svg className="ridge" viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path className="ridge__far" d="M0 150 L120 118 L210 138 L340 66 L430 110 L520 82 L640 132 L760 58 L850 98 L960 122 L1080 50 L1170 96 L1290 74 L1440 120 L1440 220 L0 220Z" />
      <path className="ridge__line" pathLength="1" d="M0 150 L120 118 L210 138 L340 66 L430 110 L520 82 L640 132 L760 58 L850 98 L960 122 L1080 50 L1170 96 L1290 74 L1440 120" />
      <path className="ridge__mid" d="M0 182 L150 150 L260 170 L420 128 L560 166 L700 140 L880 176 L1040 138 L1200 172 L1340 146 L1440 164 L1440 220 L0 220Z" />
      <path className="ridge__near" d="M0 204 L200 182 L340 196 L520 170 L700 194 L900 176 L1100 198 L1280 178 L1440 192 L1440 220 L0 220Z" />
    </svg>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const { settings } = useContent()
  const navigate = useNavigate()
  return (
    <header className="header">
      <div className="topbar">
        <a href={SCHOOL.sitio} target="_blank" rel="noreferrer">
          Ir al sitio oficial del colegio
        </a>
      </div>
      <div className="header__inner">
        <a href="#/" onClick={() => window.scrollTo({ top: 0 })} className="brand">
          <Img className="brand__logo" src={settings.logo_url || LOGO_FALLBACK} alt={`Logo ${CENTRO.nombre}`} />
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
                const target = document.getElementById(n.id)
                // Fuera de la portada (p. ej. en la 404) no existe la sección: volvemos al inicio y bajamos allí.
                if (target) target.scrollIntoView({ behavior: 'smooth' })
                else navigate('/', { state: { scrollTo: n.id } })
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
  const go = (id) => (e) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <section id="inicio" className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <h1>{settings.bienvenida}</h1>
          <p className="hero__lema">{settings.lema}</p>
          <div className="hero__actions">
            <a className="btn" href="#/" onClick={go('noticias')}>Ver noticias</a>
            <a className="btn btn--ghost" href="#/" onClick={go('contacto')}>Escríbenos</a>
          </div>
        </div>
        <div className="hero__crest">
          <Img src={settings.logo_url || LOGO_FALLBACK} alt={`Logo ${CENTRO.nombre}`} />
        </div>
      </div>
      <Ridge />
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
        <div className="about">
          <div>
            <Title>{NOSOTROS.titulo}</Title>
            <p className="lead">{settings.nosotros_texto}</p>
          </div>
          <div className="about__pillars">
            <article>
              <h3>Misión</h3>
              <p>{settings.mision}</p>
            </article>
            <article>
              <h3>Visión</h3>
              <p>{settings.vision}</p>
            </article>
          </div>
        </div>

        <Title sub>Directiva</Title>
        {board.length === 0 ? (
          <Empty>Pronto publicaremos a la directiva.</Empty>
        ) : (
          <div className="board">
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

function NewsImage({ n }) {
  if (n.image_url) return <img className="news__img" src={n.image_url} alt={n.title} />
  return (
    <div className="news__img news__img--empty" aria-hidden="true">
      <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice">
        <path d="M0 190 L70 130 L120 165 L200 70 L260 135 L320 100 L400 170 L400 250 L0 250Z" />
        <path className="near" d="M0 225 L90 190 L170 215 L260 180 L340 210 L400 195 L400 250 L0 250Z" />
      </svg>
    </div>
  )
}

function NewsMeta({ n }) {
  return <time>{n.published_at ? formatDate(n.published_at) : n.dateLabel}</time>
}

function Noticias() {
  const { news, events } = useContent()
  const [lead, ...rest] = news
  return (
    <section id="noticias" className="section section--alt">
      <div className="container">
        <Title>Noticias</Title>
        {news.length === 0 ? (
          <Empty>Aún no hay noticias publicadas.</Empty>
        ) : (
          <>
            <article className="news news--lead">
              <NewsImage n={lead} />
              <div className="news__body">
                <NewsMeta n={lead} />
                <h3>{lead.title}</h3>
                <p>{lead.summary}</p>
              </div>
            </article>
            {rest.length > 0 && (
              <div className="news__grid">
                {rest.map((n) => (
                  <article key={n.id} className="news">
                    <NewsImage n={n} />
                    <div className="news__body">
                      <NewsMeta n={n} />
                      <h3>{n.title}</h3>
                      <p>{n.summary}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        <div className="agenda">
          <Title sub>Calendario de eventos</Title>
          {events.length === 0 ? (
            <Empty>No hay eventos próximos.</Empty>
          ) : (
            <ol className="events">
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
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}

const statusKey = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')

function Propuestas() {
  const { proposals } = useContent()
  return (
    <section id="propuestas" className="section">
      <div className="container">
        <Title>Propuestas y proyectos</Title>
        {proposals.length === 0 ? (
          <Empty>Pronto compartiremos nuestras propuestas.</Empty>
        ) : (
          <div className="proposals">
            {proposals.map((p) => (
              <article key={p.id} className={`proposal proposal--${statusKey(p.status)}`}>
                <span className="status">{p.status}</span>
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
    <section id="contacto" className="section section--dark">
      <div className="container contact">
        <div>
          <Title>Contáctanos</Title>
          <p className="lead">
            ¿Tienes una idea, un reclamo o quieres participar? Escríbenos desde el buzón de sugerencias.
          </p>
          <dl className="contact__list">
            <div><dt>Correo</dt><dd>{settings.email}</dd></div>
            <div><dt>Instagram</dt><dd>{settings.instagram}</dd></div>
            <div><dt>Colegio</dt><dd>{SCHOOL.direccion}</dd></div>
          </dl>
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
            {status === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
          </button>
        </form>
      </div>
    </section>
  )
}

export function Footer() {
  const { settings } = useContent()
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Img className="footer__logo" src={SCHOOL.escudo} alt={`Escudo ${SCHOOL.sigla}`} />
          <div>
            <h4>{CENTRO.nombre}</h4>
            <p>{SCHOOL.nombre}</p>
          </div>
        </div>
        <div>
          <h4>Contáctanos</h4>
          <p>{settings.email}</p>
          <p>{SCHOOL.direccion}</p>
        </div>
        <div>
          <h4>Síguenos</h4>
          <p>{settings.instagram}</p>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>
            Sitio del Centro de Alumnos. No es el sitio oficial del colegio:{' '}
            <a href={SCHOOL.sitio} target="_blank" rel="noreferrer">cph-cja.com</a>
            {configured && <> · <Link to="/admin">Admin</Link></>}
          </span>
          <span>Raimundo Vicuña © 2026</span>
        </div>
      </div>
    </footer>
  )
}

export default function Site() {
  const { state } = useLocation()
  const navigate = useNavigate()

  // Si llegamos desde otra página (como la 404) pidiendo una sección, bajamos hasta ella.
  useEffect(() => {
    const id = state?.scrollTo
    if (!id) return
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }))
    navigate('/', { replace: true, state: null })
  }, [state, navigate])

  return (
    <div className="site">
      <Header />
      <main>
        <Hero />
        <Nosotros />
        <Noticias />
        <Propuestas />
        <Contacto />
      </main>
      <Footer />
    </div>
  )
}
