import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CENTRO, NAV, SCHOOL } from './data'
import { useContent } from './lib/content'
import { Header, Footer, Ridge, Peak } from './Site'

const LOGO_FALLBACK = '/logo.jpg'

// Textos cortos para cada acceso rápido (los ids vienen de NAV, igual que el menú).
const DESCRIPCIONES = {
  nosotros: 'Quiénes somos y quién forma la directiva.',
  noticias: 'Lo último que pasa en el colegio y el calendario.',
  propuestas: 'Proyectos en curso y lo que viene.',
  contacto: 'Cuéntanos tu idea en el buzón de sugerencias.',
}

export default function NotFound() {
  const { settings } = useContent()
  const [logoOk, setLogoOk] = useState(true)

  useEffect(() => {
    const previo = document.title
    document.title = `Página no encontrada · ${CENTRO.nombre} ${SCHOOL.sigla}`
    window.scrollTo({ top: 0 })
    return () => {
      document.title = previo
    }
  }, [])

  const accesos = NAV.filter((n) => DESCRIPCIONES[n.id])

  return (
    <div className="site">
      <Header />
      <main>
        <section className="nf">
          <div className="container nf__inner">
            <p className="nf__eyebrow">Error 404</p>
            {/* El "0" es el logo del centro de alumnos, con el mismo aro dorado de la portada */}
            <h1 className="nf__code" aria-label="Error 404">
              <span aria-hidden="true">4</span>
              <span className="nf__zero" aria-hidden="true">
                {logoOk ? (
                  <img
                    src={settings.logo_url || LOGO_FALLBACK}
                    alt=""
                    onError={() => setLogoOk(false)}
                  />
                ) : (
                  '0'
                )}
              </span>
              <span aria-hidden="true">4</span>
            </h1>
            <p className="nf__title">Uy, esta página se fue de recreo</p>
            <p className="nf__text">
              No encontramos lo que buscabas. Puede que el enlace esté roto o que la página se haya
              movido. ¡Pero no te quedes aquí, vuelve a clases!
            </p>
            <div className="hero__actions nf__actions">
              <Link className="btn" to="/">Volver al inicio</Link>
              <Link className="btn btn--ghost" to="/" state={{ scrollTo: 'contacto' }}>
                Avísanos del enlace roto
              </Link>
            </div>
          </div>
          <Ridge />
        </section>

        <section className="section">
          <div className="container">
            <h2 className="title">
              <Peak />
              ¿Buscabas algo de esto?
            </h2>
            <div className="nf__links">
              {accesos.map((n) => (
                <Link key={n.id} className="nf__link" to="/" state={{ scrollTo: n.id }}>
                  <h3>{n.label}</h3>
                  <p>{DESCRIPCIONES[n.id]}</p>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
