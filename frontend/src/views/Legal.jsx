import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getLang, t, useLang } from '../lib/i18n.js'
import Icon from '../components/Icon.jsx'
import { Row } from '../components/ui.jsx'

const OWNER = 'Juan Sebastián Arias Quintero'
const CONTACT = 'xsebas23@gmail.com'
const UPDATED = '11 October 2026'

export const DOCS = [
  { id: 'privacy', icon: 'shield', title: 'Privacy policy', es: 'Política de privacidad' },
  { id: 'collection', icon: 'list', title: 'Data collection notice', es: 'Declaración de recopilación de datos' },
  { id: 'third-parties', icon: 'globe', title: 'Third-party services', es: 'Servicios de terceros' },
  { id: 'ai', icon: 'sparkles', title: 'AI development disclosure', es: 'Declaración sobre el uso de IA' },
  { id: 'terms', icon: 'clipboard', title: 'Terms of use', es: 'Términos de uso' },
  { id: 'subscription', icon: 'trophy', title: 'Subscription terms', es: 'Condiciones de suscripción' },
  { id: 'fitness', icon: 'figureStrength', title: 'Fitness and health notice', es: 'Aviso de ejercicio y salud' },
]

const COPY = {
  privacy: {
    en: [
      ['Who is responsible', `${OWNER}, a natural person operating the gymbook brand in El Carmen de Viboral, Colombia, is responsible for personal data processed through gymbook. Contact: ${CONTACT}.`],
      ['Information we process', 'Depending on how you use the app, this can include your display name and email; account and sign-in identifiers; routines, exercises, dates, sets, repetitions, logged weights, body-weight entries, effort ratings, favorites, custom exercises, preferences and backup/import content. Training and body-weight information may be sensitive personal data under applicable law; body-weight tracking is optional. Optional notes may contain information you choose to enter. Do not enter medical records or information about other people. We do not request precise location.'],
      ['Why we use it', 'To create and secure your account, authenticate you, sync your profile and training data across your devices, restore imported profiles, provide requested notifications, answer support requests, manage subscriptions when available, prevent abuse and meet legal obligations. We do not sell personal data or use it for targeted advertising.'],
      ['Authorization and other grounds', 'We process information you provide to deliver the account and features you request, under your authorization where required, and where needed for security or legal obligations. Body-weight tracking and notifications are optional. You may withdraw an authorization or request deletion using the contact details below, subject to legal exceptions.'],
      ['Where it is stored and who receives it', 'Account and workout data for signed-in users are processed by Supabase Auth and stored in a Supabase database; the web app and API are hosted by Vercel. Google provides Google sign-in. jsDelivr may deliver exercise images and GIFs when the deployment is configured to use its CDN; its delivery network can include Cloudflare, Fastly, Bunny and Gcore. If you enable web push notifications, the browser or device push service receives a subscription endpoint and notification payload so it can deliver the alert. Google Play or Apple may handle purchases and subscription status when their store billing is enabled. See Third-party services for details. Providers may process technical data in countries where they operate.'],
      ['Local storage and guest use', 'Guest progress is stored on your device and is not synced to gymbook’s account database. The app uses browser or app storage for settings, workout state and Supabase sign-in session data, and an HttpOnly session cookie for the gymbook API. Clearing app data or uninstalling may remove local-only information. Signed-in profiles are synced to the service.'],
      ['AI', 'ChatGPT was used as a development assistant for portions of the source code and these policy drafts. gymbook does not currently include an AI feature and does not send your account, workout, or body-weight data to ChatGPT or another AI service.'],
      ['Retention and requests', 'We keep account data while your account is active and as needed to provide the service or meet legal obligations. Account deletion is not yet available as an in-app action. To request access, correction, deletion or withdrawal of consent, email us at the address above from the account email and describe your request. We may ask for reasonable verification. Some records may need to be retained where the law requires it. Resetting workout data in Settings does not itself delete your account.'],
      ['Your rights and changes', 'Subject to applicable law, you may request access to, correction or deletion of your personal data, ask about its use, or withdraw consent. In Colombia, you may also submit a complaint to the Superintendencia de Industria y Comercio (SIC) after contacting the responsible party. We may update this policy and will publish the current version here.'],
    ],
    es: [
      ['Responsable', `${OWNER}, persona natural que opera la marca gymbook desde El Carmen de Viboral, Colombia, es responsable del tratamiento de los datos personales procesados por gymbook. Contacto: ${CONTACT}.`],
      ['Información que tratamos', 'Según el uso de la app, podemos tratar tu nombre visible y correo; identificadores de cuenta e inicio de sesión; rutinas, ejercicios, fechas, series, repeticiones, pesos registrados, registros de peso corporal, esfuerzo percibido, favoritos, ejercicios personalizados, preferencias y contenido importado o de respaldo. Los datos de entrenamiento y peso corporal pueden ser datos personales sensibles según la ley aplicable; el registro de peso es opcional. Las notas opcionales pueden incluir información que decidas escribir. No incluyas historias clínicas ni datos de otras personas. No solicitamos ubicación precisa.'],
      ['Finalidades', 'Crear y proteger tu cuenta, autenticarte, sincronizar tu perfil y entrenamiento entre tus dispositivos, restaurar perfiles importados, entregar notificaciones que solicites, responder solicitudes de soporte, gestionar suscripciones cuando estén disponibles, prevenir abusos y cumplir obligaciones legales. No vendemos datos personales ni los usamos para publicidad dirigida.'],
      ['Autorización y otras bases', 'Tratamos la información que entregas para prestar las funciones y la cuenta que solicitas, con tu autorización cuando la ley lo requiera, y cuando sea necesario por seguridad u obligaciones legales. El registro de peso corporal y las notificaciones son opcionales. Puedes retirar una autorización o pedir la eliminación usando los datos de contacto indicados, sujeto a excepciones legales.'],
      ['Almacenamiento y destinatarios', 'Los datos de cuenta y entrenamiento de perfiles registrados se procesan mediante Supabase Auth y se guardan en una base de datos Supabase; Vercel aloja la web y la API. Google ofrece el inicio de sesión con Google. jsDelivr puede servir imágenes y GIF de ejercicios cuando la configuración del despliegue usa su CDN; su red de distribución puede incluir Cloudflare, Fastly, Bunny y Gcore. Si activas notificaciones web, el servicio de notificaciones del navegador o dispositivo recibe un endpoint de suscripción y el contenido de la alerta para entregarla. Google Play o Apple podrán gestionar compras y el estado de la suscripción cuando esté habilitada la facturación de sus tiendas. Consulta Servicios de terceros. Los proveedores pueden tratar datos técnicos en los países donde operan.'],
      ['Almacenamiento local e invitado', 'El progreso de invitado se guarda en tu dispositivo y no se sincroniza con la base de datos de cuentas de gymbook. La app usa el almacenamiento del navegador o dispositivo para preferencias, estado del entrenamiento y sesión de Supabase, además de una cookie HttpOnly de sesión para la API de gymbook. Borrar los datos de la app o desinstalarla puede eliminar información guardada solo localmente. Los perfiles registrados se sincronizan con el servicio.'],
      ['Inteligencia artificial', 'ChatGPT se usó como apoyo de desarrollo para partes del código fuente y estos borradores de políticas. gymbook actualmente no incluye funciones de IA y no envía a ChatGPT ni a otros servicios de IA los datos de cuenta, entrenamiento o peso corporal.'],
      ['Conservación y solicitudes', 'Conservamos los datos de la cuenta mientras esté activa y durante el tiempo necesario para prestar el servicio o cumplir obligaciones legales. La eliminación de cuenta todavía no está disponible como acción dentro de la app. Para solicitar acceso, corrección, eliminación o retiro de autorización, escríbenos al correo anterior desde el correo de tu cuenta y describe la solicitud. Podemos pedir una verificación razonable. Algunos registros podrían conservarse cuando la ley lo exija. Restablecer los datos de entrenamiento en Ajustes no elimina por sí solo la cuenta.'],
      ['Derechos y cambios', 'De acuerdo con la ley aplicable, puedes solicitar acceso, corrección o eliminación de tus datos personales, preguntar por su uso o retirar tu autorización. En Colombia, después de contactar al responsable, también puedes presentar una queja ante la Superintendencia de Industria y Comercio (SIC). Publicaremos aquí cualquier versión nueva de esta política.'],
    ],
  },
  collection: {
    en: [
      ['Collected when you register', 'Email and basic profile details provided by Google or entered for email sign-in, plus account identifiers. Supabase handles authentication and passwords; gymbook’s workout database does not store your password.'],
      ['Created by your use of gymbook', 'Training routines and logs, exercise selections, dates, sets, repetitions, weights, body-weight entries, effort ratings, custom exercises, preferences, and the name attached to your profile. These may reveal information about fitness or physical condition. They are optional except where needed for the feature you choose.'],
      ['Collected by the device or service', 'Session and storage data on your device; IP address, browser/device details, request times, and diagnostic or security logs may be processed by the hosting, authentication, database, CDN, or push providers. If you opt into web push, a push endpoint and notification settings are stored to deliver alerts.'],
      ['Not collected by gymbook in the current code', 'No precise GPS location, contact list, microphone, camera, advertising identifier, or in-app analytics events are requested by the current app code. Exercise photos/GIFs are content requests to the configured host/CDN, not user workout uploads.'],
      ['Guest mode', 'Guest data stays in browser/device storage. It is not sent to the account sync API unless you later choose to create or link an account and transfer that data.'],
    ],
    es: [
      ['Al registrarte', 'Correo y datos básicos de perfil entregados por Google o escritos para iniciar con correo, además de identificadores de cuenta. Supabase gestiona autenticación y contraseñas; la base de entrenamiento de gymbook no guarda tu contraseña.'],
      ['Generados por el uso de gymbook', 'Rutinas y entrenamientos, ejercicios elegidos, fechas, series, repeticiones, pesos, registros de peso corporal, esfuerzo percibido, ejercicios personalizados, preferencias y el nombre asociado al perfil. Estos datos pueden revelar información sobre actividad física o condición corporal. Son opcionales, salvo cuando una función que eliges los necesita.'],
      ['Procesados por el dispositivo o los servicios', 'Datos de sesión y almacenamiento en tu dispositivo; dirección IP, detalles del navegador/dispositivo, horas de solicitud y registros de diagnóstico o seguridad pueden ser tratados por proveedores de alojamiento, autenticación, base de datos, CDN o notificaciones. Si aceptas notificaciones web, se almacena un endpoint de notificación y sus preferencias para entregar alertas.'],
      ['No recopilados por el código actual de gymbook', 'La app actual no solicita ubicación GPS precisa, contactos, micrófono, cámara, identificador publicitario ni eventos de analítica integrada. Las imágenes y GIF de ejercicios son solicitudes de contenido al host/CDN configurado, no cargas de tus entrenamientos.'],
      ['Modo invitado', 'Los datos de invitado permanecen en el almacenamiento del navegador/dispositivo. No se envían a la API de sincronización de cuentas salvo que después decidas crear o vincular una cuenta y transferirlos.'],
    ],
  },
  'third-parties': {
    en: [
      ['Supabase', 'Authentication, email/password sign-in and recovery, and the hosted PostgreSQL database that stores signed-in profile and workout snapshots. Supabase may use its own subprocessors; its current list and privacy resources are available at supabase.com/legal.'],
      ['Vercel', 'Hosting and serverless API delivery for the web deployment. Infrastructure logs may include IP address, device/browser information, request paths, timestamps and errors.'],
      ['Google', 'Google OAuth sign-in receives the authorization request and returns basic identity claims such as name and email, subject to the permissions shown on Google’s consent screen. Android purchases, when enabled, are processed by Google Play.'],
      ['Apple', 'iOS distribution and purchases, when enabled, are handled by Apple and the App Store. Apple may share transaction identifiers and subscription status with gymbook; payment credentials are handled by Apple.'],
      ['jsDelivr and exercise media', 'The deployment may request exercise images and GIFs from jsDelivr’s CDN. A CDN request can reveal network and device metadata such as IP address, browser, referrer domain, requested asset and time. Depending on the CDN network, delivery infrastructure may include its network partners.'],
      ['CDN network partners', 'jsDelivr currently lists Cloudflare, Fastly, Bunny and Gcore as providers in its multi-CDN delivery network. They may route or serve asset requests and process request metadata. The delivery route may vary.'],
      ['Browser/device push service', 'If you enable web push, the browser/device’s push provider routes notifications using the subscription endpoint. This varies by browser and device. Native workout reminders are scheduled locally on the device.'],
      ['No payment processor is active in this code version', 'Subscription collection is intended to use Google Play and Apple App Store billing before public release. This version does not contain that billing integration, and gymbook does not currently receive card numbers through the app. The store’s checkout screen and terms will control the actual localized price and purchase conditions.'],
      ['Provider notices', 'Each provider handles some data under its own terms and privacy notices. Consult the current notices for [Supabase](https://supabase.com/legal), [Vercel](https://vercel.com/legal/privacy-policy), [Google](https://policies.google.com/privacy), [Apple](https://www.apple.com/legal/privacy/), and [jsDelivr](https://www.jsdelivr.com/terms/privacy-policy).'],
    ],
    es: [
      ['Supabase', 'Autenticación, inicio y recuperación con correo/contraseña y base de datos PostgreSQL alojada donde se guardan los perfiles registrados y copias de entrenamiento. Supabase puede usar sus propios subencargados; consulta su lista y recursos vigentes en supabase.com/legal.'],
      ['Vercel', 'Alojamiento y entrega de la API serverless del despliegue web. Los registros de infraestructura pueden incluir IP, datos de dispositivo/navegador, rutas solicitadas, fechas y errores.'],
      ['Google', 'Google OAuth procesa la solicitud de acceso y entrega datos básicos de identidad, como nombre y correo, de acuerdo con los permisos que muestra la pantalla de autorización. Las compras Android, cuando se habiliten, las procesa Google Play.'],
      ['Apple', 'La distribución iOS y las compras, cuando se habiliten, las gestiona Apple y App Store. Apple puede compartir identificadores de transacción y estado de suscripción con gymbook; Apple gestiona los datos de pago.'],
      ['jsDelivr y contenido de ejercicios', 'El despliegue puede pedir imágenes y GIF de ejercicios al CDN de jsDelivr. Una solicitud al CDN puede revelar metadatos de red y dispositivo como IP, navegador, dominio de referencia, archivo solicitado y hora. La entrega puede usar socios de infraestructura de la red CDN.'],
      ['Socios de la red CDN', 'jsDelivr actualmente identifica a Cloudflare, Fastly, Bunny y Gcore como proveedores de su red de distribución multi-CDN. Pueden enrutar o servir solicitudes de archivos y tratar metadatos de esas solicitudes. La ruta de entrega puede variar.'],
      ['Servicio de notificaciones del navegador/dispositivo', 'Si activas notificaciones web, el proveedor de notificaciones de tu navegador o dispositivo las entrega usando el endpoint de suscripción. Varía según el navegador y dispositivo. Los recordatorios nativos de entrenamiento se programan localmente en el dispositivo.'],
      ['No hay pasarela de pago activa en esta versión', 'Antes del lanzamiento público se prevé cobrar mediante Google Play y Apple App Store. Esta versión del código aún no integra esa facturación y gymbook no recibe actualmente números de tarjeta desde la app. La pantalla de compra de la tienda y sus condiciones definirán el precio localizado y las condiciones efectivas.'],
      ['Avisos de los proveedores', 'Cada proveedor trata algunos datos bajo sus propias condiciones y avisos de privacidad. Consulta los avisos vigentes de [Supabase](https://supabase.com/legal), [Vercel](https://vercel.com/legal/privacy-policy), [Google](https://policies.google.com/privacy), [Apple](https://www.apple.com/legal/privacy/) y [jsDelivr](https://www.jsdelivr.com/terms/privacy-policy).'],
    ],
  },
  ai: {
    en: [
      ['AI in development', 'ChatGPT, an AI tool from OpenAI, has been used by the developer as an assistant to discuss, review, and generate portions of gymbook’s source code and these policy drafts. No percentage or exact file list is claimed; code is also based on the project’s existing source, dependencies, and human edits.'],
      ['AI in the app', 'The current gymbook app does not include an AI assistant or send account, authentication, workout, or body-weight data to ChatGPT/OpenAI or another AI model. This may change only if a future feature is added and disclosed before use.'],
      ['Source-code license', 'The repository currently includes the GNU Affero General Public License, version 3 or later (AGPL-3.0-or-later), plus separate notices for exercise media. This disclosure does not alter those licenses. Refer to the LICENSE and NOTICE files distributed with the source.'],
    ],
    es: [
      ['IA durante el desarrollo', 'El desarrollador ha utilizado ChatGPT, herramienta de IA de OpenAI, como apoyo para conversar, revisar y generar partes del código fuente de gymbook y estos borradores de políticas. No se afirma un porcentaje ni una lista exacta de archivos; el código también proviene de la fuente existente del proyecto, sus dependencias y modificaciones humanas.'],
      ['IA dentro de la app', 'La versión actual de gymbook no incluye un asistente de IA ni envía datos de cuenta, autenticación, entrenamiento o peso corporal a ChatGPT/OpenAI ni a otros modelos de IA. Esto solo cambiaría si se incorpora una función futura y se informa antes de utilizarla.'],
      ['Licencia del código', 'El repositorio incluye actualmente la licencia GNU Affero General Public License, versión 3 o posterior (AGPL-3.0-or-later), y avisos separados para medios de ejercicios. Esta declaración no modifica esas licencias. Consulta los archivos LICENSE y NOTICE distribuidos con el código.'],
    ],
  },
  terms: {
    en: [
      ['Who may use gymbook', 'You must be at least 18 years old and able to enter into a binding agreement. By using the app, you agree to these terms and the Privacy Policy. If you do not agree, do not create an account or use the service.'],
      ['Accounts and user content', 'Keep your sign-in credentials secure and provide accurate account information. You are responsible for the routines, logs, notes, imports and other content you enter, and for keeping your own export/backup. Do not upload another person’s personal or medical information without permission.'],
      ['Fitness use only; no medical advice', 'gymbook is a workout logging and planning tool, not a medical service. Exercise estimates and progress summaries are informational and may be inaccurate. You choose your exercises and loads. Stop if you feel pain or unwell and consult a qualified health professional before exercising if you have a condition or concern.'],
      ['Subscriptions', 'The intended offer is a 30-day free trial followed by an automatically renewing subscription at USD $1 per month until cancelled. The checkout shown by Google Play or Apple will disclose the applicable local price, currency, tax, eligibility, renewal date and cancellation route and will control if it differs from this summary. Uninstalling the app does not cancel a store subscription. Manage or cancel through the store account used to subscribe. Refunds are handled under the applicable store rules and mandatory local law.'],
      ['Availability and changes', 'We may maintain, update, suspend or discontinue features for operational, security or legal reasons. We will use reasonable efforts to notify users about material changes to these terms. Nothing here removes rights that cannot be excluded by law.'],
      ['Software and third-party content', 'gymbook’s source code and exercise media may be subject to different licenses. These terms do not revoke rights granted under the AGPL-3.0-or-later license or the dataset’s separate terms. See the LICENSE and NOTICE files.'],
      ['Governing law and contact', `These terms are governed by Colombian law, subject to mandatory consumer protections that apply where you live. Contact ${CONTACT} with questions or complaints.`],
    ],
    es: [
      ['Quién puede usar gymbook', 'Debes tener al menos 18 años y capacidad para celebrar un acuerdo vinculante. Al usar la app, aceptas estos términos y la Política de Privacidad. Si no estás de acuerdo, no crees una cuenta ni uses el servicio.'],
      ['Cuentas y contenido', 'Protege tus credenciales y entrega información correcta para tu cuenta. Eres responsable de las rutinas, registros, notas, importaciones y contenido que agregues, así como de conservar tus propias copias. No cargues información personal o médica de otra persona sin autorización.'],
      ['Solo para ejercicio; no es asesoría médica', 'gymbook sirve para planificar y registrar entrenamientos, no es un servicio médico. Las estimaciones y resúmenes de progreso son informativos y pueden ser inexactos. Tú eliges ejercicios y cargas. Detente si sientes dolor o malestar y consulta a un profesional de salud antes de entrenar si tienes una condición o inquietud.'],
      ['Suscripciones', 'La oferta prevista es una prueba gratuita de 30 días y luego una suscripción con renovación automática por USD 1 al mes hasta que la canceles. La pantalla de compra de Google Play o Apple informará el precio local, moneda, impuestos, elegibilidad, fecha de renovación y forma de cancelación aplicables; prevalecerá si difiere de este resumen. Desinstalar la app no cancela la suscripción de la tienda. Adminístrala o cancélala desde la cuenta de la tienda usada para suscribirte. Los reembolsos se rigen por las reglas de la tienda y las normas obligatorias aplicables.'],
      ['Disponibilidad y cambios', 'Podemos mantener, actualizar, suspender o retirar funciones por motivos operativos, de seguridad o legales. Haremos esfuerzos razonables para avisar cambios importantes de estos términos. Nada de lo aquí indicado elimina derechos irrenunciables por ley.'],
      ['Software y contenido de terceros', 'El código fuente de gymbook y los medios de ejercicios pueden tener licencias diferentes. Estos términos no revocan derechos concedidos por la licencia AGPL-3.0-or-later ni las condiciones separadas del conjunto de datos. Consulta LICENSE y NOTICE.'],
      ['Ley aplicable y contacto', `Estos términos se rigen por la ley colombiana, sin perjuicio de las protecciones obligatorias para consumidores del lugar donde vivas. Escríbenos a ${CONTACT} para preguntas o reclamaciones.`],
    ],
  },
  subscription: {
    en: [
      ['Price and free period', 'The planned subscription includes 30 days free, followed by USD $1 per month. The store purchase sheet is the final source for the price in your currency, taxes, trial eligibility and next billing date.'],
      ['Automatic renewal and cancellation', 'Unless you cancel before the trial or current billing period ends, the store will automatically renew the subscription and charge the payment method on file. Cancel or manage it in Google Play Subscriptions or Apple Account → Subscriptions. Removing gymbook from your device does not cancel it.'],
      ['Billing and refunds', 'Google Play or Apple processes the payment and controls billing records. gymbook receives purchase or subscription status needed to provide access, not your full card number. Refunds, billing disputes, and some cancellations are handled by the relevant store, subject to applicable law.'],
      ['Current availability', 'This repository version does not yet contain store billing integration. These terms describe the intended launch offer and must be aligned with the final store products and checkout before public release.'],
    ],
    es: [
      ['Precio y periodo gratuito', 'La suscripción prevista incluye 30 días gratis y después cuesta USD 1 al mes. La pantalla de compra de la tienda será la referencia final sobre precio en moneda local, impuestos, elegibilidad para la prueba y fecha del siguiente cobro.'],
      ['Renovación automática y cancelación', 'Si no cancelas antes de que termine la prueba o el periodo vigente, la tienda renovará automáticamente la suscripción y cobrará el medio de pago registrado. Cancélala o adminístrala en Suscripciones de Google Play o Cuenta de Apple → Suscripciones. Eliminar gymbook del dispositivo no la cancela.'],
      ['Cobros y reembolsos', 'Google Play o Apple procesa el pago y gestiona los registros de facturación. gymbook recibe el estado de compra o suscripción necesario para habilitar el acceso, no el número completo de tu tarjeta. La tienda correspondiente gestiona reembolsos, disputas de cobro y algunas cancelaciones, conforme a la ley aplicable.'],
      ['Disponibilidad actual', 'Esta versión del repositorio todavía no integra facturación de las tiendas. Estas condiciones describen la oferta prevista para el lanzamiento y deben coincidir con los productos y la pantalla de compra definitivos antes de publicar.'],
    ],
  },
  fitness: {
    en: [
      ['Not medical advice', 'gymbook is not a healthcare provider and does not diagnose, treat, prevent or monitor illness or injury. Exercise logs, suggested routines, estimated one-rep max, trends and other calculations are general information only.'],
      ['Use your judgment', 'Exercise carries risk. Choose loads and movements appropriate to your ability and surroundings, use equipment safely, and stop if you experience pain, dizziness, shortness of breath or other concerning symptoms. Ask a qualified healthcare professional before beginning or changing exercise if you are pregnant, injured, have a health condition, or are unsure whether an activity is safe for you.'],
      ['Personal data', 'Workout logs and body-weight entries can be sensitive or reveal aspects of physical condition. Enter only information you are comfortable storing in your account or on your device. Do not use gymbook for emergency care or clinical monitoring.'],
    ],
    es: [
      ['No es asesoría médica', 'gymbook no es un proveedor de salud y no diagnostica, trata, previene ni monitorea enfermedades o lesiones. Los registros, rutinas sugeridas, estimaciones de repetición máxima, tendencias y cálculos son información general.'],
      ['Usa tu criterio', 'El ejercicio implica riesgos. Elige cargas y movimientos acordes con tu capacidad y entorno, utiliza el equipo de forma segura y detente si sientes dolor, mareo, falta de aire u otro síntoma preocupante. Consulta a un profesional de salud antes de empezar o cambiar tu ejercicio si estás embarazada, lesionado, tienes una condición de salud o dudas sobre la seguridad de una actividad.'],
      ['Datos personales', 'Los registros de entrenamiento y peso corporal pueden ser sensibles o revelar aspectos de tu condición física. Ingresa únicamente información que estés dispuesto a guardar en tu cuenta o dispositivo. No uses gymbook para emergencias ni monitoreo clínico.'],
    ],
  },
}

function LegalText({ id }) {
  const lang = getLang() === 'es' ? 'es' : 'en'
  const sections = COPY[id]?.[lang] || []
  return <div className="legal-copy">
    {sections.map(([heading, text]) => <section key={heading}>
      <h3>{heading}</h3>
      <p>{text}</p>
    </section>)}
    {id === 'third-parties' && <p className="small dim">{lang === 'es' ? 'Avisos y listas de proveedores:' : 'Provider notices and lists:'} <a href="https://supabase.com/legal" target="_blank" rel="noreferrer">Supabase</a> · <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google</a> · <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noreferrer">Apple</a> · <a href="https://www.jsdelivr.com/terms/privacy-policy" target="_blank" rel="noreferrer">jsDelivr</a></p>}
    {id === 'privacy' && <p className="small dim">{lang === 'es' ? 'Autoridad colombiana de protección de datos: ' : 'Colombian data protection authority: '}<a href="https://www.sic.gov.co/" target="_blank" rel="noreferrer">Superintendencia de Industria y Comercio (SIC)</a></p>}
    <p className="small dim">{lang === 'es' ? `Responsable: ${OWNER} · El Carmen de Viboral, Colombia · ${CONTACT} · Actualizado: 11 de octubre de 2026.` : `Responsible person: ${OWNER} · El Carmen de Viboral, Colombia · ${CONTACT} · Updated: ${UPDATED}.`}</p>
  </div>
}

export default function Legal() {
  useLang()
  const { doc } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const lang = getLang() === 'es' ? 'es' : 'en'
  const selected = DOCS.find(item => item.id === doc)
  const from = location.state?.from || '/home'
  const title = selected ? (lang === 'es' ? selected.es : selected.title) : (lang === 'es' ? 'Legal y privacidad' : 'Legal & privacy')
  const goBack = () => navigate(selected ? '/legal' : from, { replace: true, state: selected ? { from } : undefined })

  return <main className="legal-page">
    <header className="hdr">
      <button className="iconbtn" onClick={goBack} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}><h1>{title}</h1></div>
    </header>
    {selected ? <>
      <p className="legal-updated">{lang === 'es' ? 'Vigente desde el 11 de octubre de 2026' : `Effective 11 October 2026`}</p>
      <LegalText id={selected.id} />
    </> : <>
      <p className="muted small legal-intro">{lang === 'es' ? 'Información sobre privacidad, datos, proveedores externos y condiciones de uso de gymbook.' : 'Information about privacy, data, third-party providers and the terms for using gymbook.'}</p>
      <div className="sect-b">
        {DOCS.map(item => <Row key={item.id} icon={item.icon} title={lang === 'es' ? item.es : item.title} accessory="chevron" onClick={() => navigate(`/legal/${item.id}`, { state: { from } })} />)}
      </div>
    </>}
  </main>
}

