import { useEffect } from 'react'
import { useLang, setLang } from '../lib/i18n.js'
import Icon from '../components/Icon.jsx'
import './Website.css'

const CONTACT_EMAIL = 'xsebas23@gmail.com'
const APK_URL = import.meta.env.VITE_ANDROID_APK_URL || ''

const FEATURES = [
  { icon: 'calendar', title: 'Rutinas a tu manera', text: 'Organiza ejercicios en rutinas y distribúyelas durante la semana.' },
  { icon: 'dumbbell', title: 'Entrena y registra', text: 'Registra peso, repeticiones, tiempo y descanso mientras entrenas.' },
  { icon: 'chart', title: 'Mira tu progreso', text: 'Revisa tu historial y observa cómo evolucionan tus marcas.' },
  { icon: 'star', title: 'Tu biblioteca', text: 'Explora ejercicios, guarda favoritos y crea ejercicios propios.' },
]

export default function Website() {
  useLang()
  useEffect(() => {
    void setLang('es')
    document.documentElement.lang = 'es'
    document.title = 'GYMBOOK — Entrena a tu ritmo'
    const description = document.querySelector('meta[name="description"]')
    if (description) description.content = 'GYMBOOK es tu app de entrenamiento para Android: crea rutinas, registra tus sesiones y sigue tu progreso.'
    return () => { document.documentElement.lang = 'es' }
  }, [])

  const downloadButton = (className, label) => APK_URL
    ? <a className={className} href={APK_URL} download><Icon name="download" /> {label}</a>
    : <span className={`${className} site-download-disabled`} aria-disabled="true"><Icon name="download" /> APK en preparación</span>

  return <div className="site">
    <header className="site-nav">
      <a className="site-brand" href="#inicio" aria-label="GYMBOOK, inicio"><span className="site-brand-mark"><Icon name="dumbbell" /></span>gymbook</a>
      <nav aria-label="Navegación principal">
        <a href="#funciones">Funciones</a>
        <a href="#legal">Términos</a>
        <a href="#contacto">Contacto</a>
      </nav>
      {downloadButton('site-nav-download', 'Descargar APK')}
    </header>

    <main>
      <section className="site-hero" id="inicio">
        <div className="site-hero-copy">
          <span className="site-eyebrow"><span className="site-live-dot" /> TU ENTRENAMIENTO, EN TU BOLSILLO</span>
          <h1>Entrena con intención.<br /><span>Progresa a tu ritmo.</span></h1>
          <p>GYMBOOK te ayuda a organizar tus rutinas, registrar cada sesión y ver tu progreso. Diseñada para entrenar desde tu celular Android.</p>
          <div className="site-hero-actions">
            {downloadButton('site-button primary', 'Descargar para Android')}
            <a className="site-text-link" href="#funciones">Conoce las funciones <Icon name="arrowDown" /></a>
          </div>
          <div className="site-compat"><Icon name="info" /> Disponible para Android · La app se usa desde el celular</div>
        </div>
        <div className="site-hero-art" aria-label="Vista ilustrativa de la aplicación GYMBOOK">
          <div className="site-orbit orbit-one" /><div className="site-orbit orbit-two" />
          <div className="site-phone">
            <div className="site-phone-camera" />
            <div className="site-phone-head"><span>gymbook</span><Icon name="gear" /></div>
            <div className="site-phone-date">MIÉRCOLES, 18 DE JUNIO</div>
            <div className="site-phone-greeting">Hoy es día de<br /><strong>entrenar.</strong></div>
            <div className="site-phone-routine"><div className="site-routine-icon"><Icon name="arm" /></div><div><small>RUTINA DE HOY</small><strong>Tren superior</strong><span>6 ejercicios · 45 min</span></div><Icon name="chevronRight" /></div>
            <div className="site-phone-progress"><div><span>Esta semana</span><b>2 de 4 sesiones</b></div><div className="site-progress-bars"><i /><i /><i /><i /></div></div>
            <div className="site-phone-tabs"><span><Icon name="house" />Inicio</span><span><Icon name="calendar" />Plan</span><b><Icon name="dumbbell" />Empezar</b><span><Icon name="chart" />Progreso</span><span><Icon name="list" />Ejercicios</span></div>
          </div>
          <div className="site-float-card"><span className="site-float-icon"><Icon name="check" /></span><div><small>SESIÓN GUARDADA</small><strong>Entrenamiento completo</strong></div></div>
          <div className="site-art-caption">TU CONSTANCIA, A TU MANERA <span>✳</span></div>
        </div>
      </section>

      <section className="site-trust-strip" aria-label="Características principales">
        <div><Icon name="lock" /><span>Entrenamientos guardados en tu dispositivo</span></div>
        <div><Icon name="chartLine" /><span>Seguimiento claro de tu progreso</span></div>
        <div><Icon name="timer" /><span>Hecha para acompañarte en el gym</span></div>
      </section>

      <section className="site-features" id="funciones">
        <div className="site-section-heading"><span className="site-eyebrow">TODO LO QUE NECESITAS PARA ENTRENAR</span><h2>Menos vueltas.<br /><span>Más entrenamiento.</span></h2><p>Herramientas sencillas para planear, registrar y seguir tus sesiones desde un solo lugar.</p></div>
        <div className="site-feature-grid">
          {FEATURES.map((feature, i) => <article className="site-feature-card" key={feature.title}>
            <div className="site-feature-top"><span className="site-feature-icon"><Icon name={feature.icon} /></span><span className="site-feature-number">0{i + 1}</span></div>
            <h3>{feature.title}</h3><p>{feature.text}</p>
          </article>)}
        </div>
      </section>

      <section className="site-data-band">
        <div className="site-data-icon"><Icon name="shield" /></div>
        <div><span className="site-eyebrow">TUS DATOS, BAJO TU CONTROL</span><h2>Tu entrenamiento vive en tu dispositivo.</h2><p>El uso principal es local. Si autorizas el respaldo, GYMBOOK actualiza una copia en el servidor al terminar tus sesiones; la restauración se inicia manualmente desde Ajustes.</p></div>
        <a href="#legal" className="site-inline-link">Lee cómo tratamos tus datos <Icon name="chevronRight" /></a>
      </section>

      <section className="site-download" id="descargar">
        <div className="site-download-mark"><Icon name="dumbbell" /></div>
        <span className="site-eyebrow">LISTA PARA TU PRÓXIMO ENTRENAMIENTO</span>
        <h2>Lleva GYMBOOK contigo.</h2>
        <p>Descarga el APK e instala la app en tu dispositivo Android.</p>
        {downloadButton('site-button primary', 'Descargar APK para Android')}
        <small>Android · Instalación mediante archivo APK</small>
      </section>

      <section className="site-legal" id="legal">
        <div className="site-section-heading"><span className="site-eyebrow">TRANSPARENCIA</span><h2>Información legal</h2><p>Consulta los documentos que explican las condiciones de uso y el tratamiento de datos de GYMBOOK.</p></div>
        <div className="site-legal-list">
          <a href="/#/legal/terms"><span className="site-legal-icon"><Icon name="clipboard" /></span><span><strong>Términos y condiciones</strong><small>Reglas de uso, responsabilidades y condiciones del servicio.</small></span><Icon name="chevronRight" /></a>
          <a href="/#/legal/privacy"><span className="site-legal-icon"><Icon name="shield" /></span><span><strong>Política de privacidad</strong><small>Qué datos se procesan, para qué y cuáles son tus derechos.</small></span><Icon name="chevronRight" /></a>
          <a href="/#/legal/collection"><span className="site-legal-icon"><Icon name="list" /></span><span><strong>Datos y servicios externos</strong><small>Información de recopilación y proveedores tecnológicos.</small></span><Icon name="chevronRight" /></a>
        </div>
      </section>

      <section className="site-contact" id="contacto">
        <span className="site-eyebrow">¿PODEMOS AYUDARTE?</span><h2>Hablemos.</h2><p>Escríbenos si tienes preguntas sobre GYMBOOK, la descarga o tus datos.</p>
        <a className="site-contact-link" href={`mailto:${CONTACT_EMAIL}`}><Icon name="link" />{CONTACT_EMAIL}<Icon name="arrowUp" /></a>
        <div className="site-social-note"><span>Redes sociales</span><span>Próximamente</span></div>
      </section>
    </main>

    <footer className="site-footer"><a className="site-brand" href="#inicio"><span className="site-brand-mark"><Icon name="dumbbell" /></span>gymbook</a><span>Entrena a tu ritmo.</span><div><a href="#legal">Legal y privacidad</a><a href="#contacto">Contacto</a><span>© {new Date().getFullYear()} GYMBOOK</span></div></footer>
  </div>
}
