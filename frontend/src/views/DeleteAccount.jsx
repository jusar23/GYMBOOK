import { Link } from 'react-router-dom'
import { getLang, useLang } from '../lib/i18n.js'
import Brand from '../components/Brand.jsx'
import './Website.css'

const CONTACT = 'xsebas23@gmail.com'

export default function DeleteAccount() {
  useLang()
  const isSpanish = getLang() === 'es'
  const subject = encodeURIComponent(isSpanish
    ? 'Solicitud para eliminar mi cuenta de GYMBOOK Training'
    : 'Request to delete my GYMBOOK Training account')
  const body = encodeURIComponent(isSpanish
    ? 'Hola, solicito eliminar mi cuenta de GYMBOOK Training y los datos personales asociados.\n\nCorreo de la cuenta: '
    : 'Hello, I request deletion of my GYMBOOK Training account and associated personal data.\n\nAccount email: ')

  return <main className="account-page">
    <header className="site-nav" style={{ maxWidth: 760, margin: '0 auto', padding: 0 }}>
      <Link className="site-brand" to="/"><Brand /></Link>
      <Link className="site-text-link" to="/">{isSpanish ? 'Volver al inicio' : 'Back to home'}</Link>
    </header>
    <header className="account-heading">
      <span className="site-eyebrow">GYM BOOK TRAINING</span>
      <h1>{isSpanish ? <>Eliminar tu <span>cuenta</span></> : <>Delete your <span>account</span></>}</h1>
      <p>{isSpanish
        ? 'Puedes iniciar la eliminación de tu cuenta y de los datos asociados desde la app o solicitarla aquí.'
        : 'You can start deleting your account and associated data from the app, or request it here.'}</p>
    </header>
    <section className="account-card" aria-labelledby="delete-account-title">
      <h2 id="delete-account-title">{isSpanish ? 'Cómo solicitarlo' : 'How to request deletion'}</h2>
      <ol className="delete-account-steps">
        <li>{isSpanish ? 'En la app, abre Ajustes y elige «Eliminar cuenta».' : 'In the app, open Settings and choose “Delete account”.'}</li>
        <li>{isSpanish ? 'Si no puedes entrar en la app, usa el botón de abajo para escribirnos desde el correo asociado a tu cuenta.' : 'If you cannot access the app, use the button below to contact us from the email address linked to your account.'}</li>
      </ol>
      <p className="account-muted">{isSpanish
        ? 'Indica únicamente el correo de tu cuenta. No envíes tu contraseña ni documentos sensibles. Eliminaremos la cuenta y los datos asociados, salvo la información que debamos conservar por una obligación legal; te explicaremos cualquier excepción.'
        : 'Include only the email address for your account. Do not send your password or sensitive documents. We will delete the account and associated data, except information we must retain by law; we will explain any exception.'}</p>
      <a className="site-button primary" href={`mailto:${CONTACT}?subject=${subject}&body=${body}`}>
        {isSpanish ? 'Solicitar eliminación por correo' : 'Request deletion by email'}
      </a>
      <p className="account-muted delete-account-contact">{isSpanish ? 'Contacto: ' : 'Contact: '}<a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </section>
    <p className="delete-account-privacy">
      <Link to="/legal/privacy">{isSpanish ? 'Consulta la Política de privacidad' : 'Read the Privacy Policy'}</Link>
    </p>
  </main>
}
