import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { getLang, t, useLang } from '../lib/i18n.js'

import Icon from '../components/Icon.jsx'

import { Row } from '../components/ui.jsx'



const OWNER = 'Juan Sebastián Arias Quintero'

const CONTACT = 'xsebas23@gmail.com'

const UPDATED = '12 October 2026'



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

      ['Consent and sensitive data', 'Before collecting or processing sensitive data, such as body-weight records or other data that may reveal physical condition, we will request prior, explicit, informed and separate consent where required by law. You may decline to provide sensitive data without losing access to features that do not need it. Pre-ticked boxes or silence are not treated as consent. Other processing is based on providing requested features, your consent where required, and legal obligations. You may withdraw consent or request deletion through the contact details below, subject to legal exceptions.'],

      ['Where it is stored and who receives it', 'Account and workout data for signed-in users are processed by the authentication, API and database services configured for the specific deployment. In a self-hosted installation, the instance operator controls the server and hosting configuration; in a managed deployment, the configured hosting and database providers may process the data. The operator must keep this notice aligned with the services actually enabled. Google provides Google sign-in. jsDelivr may deliver exercise images and GIFs when the deployment is configured to use its CDN; its delivery network can include Cloudflare, Fastly, Bunny and Gcore. If you enable web push notifications, the browser or device push service receives a subscription endpoint and notification payload so it can deliver the alert. Google Play or Apple may handle purchases and subscription status when their store billing is enabled. See Third-party services for details. Providers may process technical data in countries where they operate.'],

      ['Local storage and guest use', 'Guest progress is stored on your device and is not synced to gymbook’s account database. The app uses browser or app storage for settings and workout state, plus the session mechanisms implemented by the configured authentication/API services. Clearing app data or uninstalling may remove local-only information. Signed-in profiles are synced to the service.'],

      ['AI', 'ChatGPT was used as a development assistant for portions of the source code and these policy drafts. gymbook does not currently include an AI feature and does not send your account, workout, or body-weight data to ChatGPT or another AI service.'],

      ['Retention and requests', 'We keep account data while your account is active and as needed to provide the service or meet legal obligations. Account deletion is not yet available as an in-app action. To request access, correction, deletion or withdrawal of consent, email us at the address above from the account email and describe your request. We may ask for reasonable verification. Some records may need to be retained where the law requires it. Resetting workout data in Settings does not itself delete your account.'],

      ['Rights, inquiries and complaints', 'You may request access to, correction or deletion of personal data; ask for proof of consent where applicable; inquire about purposes and use; withdraw consent or request erasure where legally available; and submit inquiries or complaints to the contact email. Describe your request and a way to reply; we may reasonably verify your identity. We will respond within applicable legal deadlines. In Colombia, you may contact the Superintendencia de Industria y Comercio (SIC) after first using the responsible party’s process where required by law.'],

      ['Security and international transfers', 'We use reasonable security measures and restrict access according to the service configuration, but no internet-connected system can guarantee absolute security. Technical providers may process data in other countries; before operating, the responsible party must verify and document any legally required conditions for international transfers or transmissions.'],

      ['Changes', 'We will publish the current policy and its update date. If a material change affects purposes or processing, we will obtain renewed consent where required by law.'],

    ],

    es: [

      ['Responsable', `${OWNER}, persona natural que opera la marca gymbook desde El Carmen de Viboral, Colombia, es responsable del tratamiento de los datos personales procesados por gymbook. Contacto: ${CONTACT}.`],

      ['Información que tratamos', 'Según el uso de la app, podemos tratar tu nombre visible y correo; identificadores de cuenta e inicio de sesión; rutinas, ejercicios, fechas, series, repeticiones, pesos registrados, registros de peso corporal, esfuerzo percibido, favoritos, ejercicios personalizados, preferencias y contenido importado o de respaldo. Los datos de entrenamiento y peso corporal pueden ser datos personales sensibles según la ley aplicable; el registro de peso es opcional. Las notas opcionales pueden incluir información que decidas escribir. No incluyas historias clínicas ni datos de otras personas. No solicitamos ubicación precisa.'],

      ['Finalidades', 'Crear y proteger tu cuenta, autenticarte, sincronizar tu perfil y entrenamiento entre tus dispositivos, restaurar perfiles importados, entregar notificaciones que solicites, responder solicitudes de soporte, gestionar suscripciones cuando estén disponibles, prevenir abusos y cumplir obligaciones legales. No vendemos datos personales ni los usamos para publicidad dirigida.'],

      ['Autorización y datos sensibles', 'Antes de recopilar o tratar datos sensibles, como registros de peso corporal u otros datos que puedan revelar tu condición física, solicitaremos una autorización previa, expresa, informada y separada cuando la ley lo exija. Puedes negarte a entregar datos sensibles sin perder acceso a funciones que no los necesiten. No marques casillas por defecto ni interpretes el silencio como autorización. Las demás operaciones se basan en la prestación de las funciones solicitadas, tu autorización cuando corresponda y el cumplimiento de obligaciones legales. Puedes retirar tu autorización o pedir la supresión por los canales indicados, salvo excepciones legales.'],

      ['Almacenamiento y destinatarios', 'Los datos de cuenta y entrenamiento de perfiles registrados se procesan mediante los servicios de autenticación, API y base de datos configurados para cada despliegue. En una instalación autoalojada, el operador controla el servidor y el alojamiento; en un despliegue gestionado, los proveedores configurados pueden tratar los datos. El responsable debe mantener este aviso alineado con los servicios realmente activados. Google ofrece el inicio de sesión con Google. jsDelivr puede servir imágenes y GIF de ejercicios cuando la configuración del despliegue usa su CDN; su red de distribución puede incluir Cloudflare, Fastly, Bunny y Gcore. Si activas notificaciones web, el servicio de notificaciones del navegador o dispositivo recibe un endpoint de suscripción y el contenido de la alerta para entregarla. Google Play o Apple podrán gestionar compras y el estado de la suscripción cuando esté habilitada la facturación de sus tiendas. Consulta Servicios de terceros. Los proveedores pueden tratar datos técnicos en los países donde operan.'],

      ['Almacenamiento local e invitado', 'El progreso de invitado se guarda en tu dispositivo y no se sincroniza con la base de datos de cuentas de gymbook. La app usa el almacenamiento del navegador o dispositivo para preferencias y estado del entrenamiento, además de los mecanismos de sesión implementados por los servicios de autenticación y API configurados. Borrar los datos de la app o desinstalarla puede eliminar información guardada solo localmente. Los perfiles registrados se sincronizan con el servicio.'],

      ['Inteligencia artificial', 'ChatGPT se usó como apoyo de desarrollo para partes del código fuente y estos borradores de políticas. gymbook actualmente no incluye funciones de IA y no envía a ChatGPT ni a otros servicios de IA los datos de cuenta, entrenamiento o peso corporal.'],

      ['Conservación y solicitudes', 'Conservamos los datos de la cuenta mientras esté activa y durante el tiempo necesario para prestar el servicio o cumplir obligaciones legales. La eliminación de cuenta todavía no está disponible como acción dentro de la app. Para solicitar acceso, corrección, eliminación o retiro de autorización, escríbenos al correo anterior desde el correo de tu cuenta y describe la solicitud. Podemos pedir una verificación razonable. Algunos registros podrían conservarse cuando la ley lo exija. Restablecer los datos de entrenamiento en Ajustes no elimina por sí solo la cuenta.'],

      ['Derechos, consultas y reclamaciones', 'Puedes conocer, actualizar y rectificar tus datos; solicitar prueba de la autorización cuando proceda; preguntar por las finalidades y el uso; revocar la autorización o pedir la supresión cuando sea legalmente procedente; y presentar consultas o reclamaciones al correo indicado. Incluye tu solicitud y un medio de respuesta; podremos verificar tu identidad de forma razonable. Atenderemos las solicitudes dentro de los plazos legales aplicables. En Colombia, si consideras que no se respetaron tus derechos, puedes acudir a la Superintendencia de Industria y Comercio (SIC) después de agotar el trámite ante el responsable cuando la ley lo requiera.'],

      ['Seguridad y transferencias', 'Aplicamos medidas razonables de seguridad y acceso limitado según la configuración del servicio, pero ningún sistema conectado a internet puede garantizar seguridad absoluta. Los proveedores técnicos pueden tratar datos desde otros países; antes de operar, el responsable debe verificar y documentar las condiciones legales de transmisión o transferencia internacional que resulten aplicables.'],

      ['Cambios', 'Publicaremos la versión vigente de esta política e indicaremos su fecha de actualización. Si un cambio afecta de forma material las finalidades o el tratamiento, solicitaremos una nueva autorización cuando la ley lo exija.'],

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

      ['Supabase (if enabled)', 'If a deployment uses Supabase, it may provide authentication, email/password sign-in and recovery, and a hosted PostgreSQL database. Supabase may use subprocessors; consult its current list and privacy resources at supabase.com/legal. Do not treat Supabase as active unless it is actually configured in the deployed app.'],

      ['Vercel (if enabled)', 'If a deployment uses Vercel, it may provide web hosting and API delivery. Infrastructure logs may include IP address, device/browser information, request paths, timestamps and errors. Do not treat Vercel as active unless it is actually configured in the deployed app.'],

      ['Google', 'Google OAuth sign-in receives the authorization request and returns basic identity claims such as name and email, subject to the permissions shown on Google’s consent screen. Android purchases, when enabled, are processed by Google Play.'],

      ['Apple', 'iOS distribution and purchases, when enabled, are handled by Apple and the App Store. Apple may share transaction identifiers and subscription status with gymbook; payment credentials are handled by Apple.'],

      ['jsDelivr and exercise media', 'The deployment may request exercise images and GIFs from jsDelivr’s CDN. A CDN request can reveal network and device metadata such as IP address, browser, referrer domain, requested asset and time. Depending on the CDN network, delivery infrastructure may include its network partners.'],

      ['CDN network partners', 'jsDelivr currently lists Cloudflare, Fastly, Bunny and Gcore as providers in its multi-CDN delivery network. They may route or serve asset requests and process request metadata. The delivery route may vary.'],

      ['Browser/device push service', 'If you enable web push, the browser/device’s push provider routes notifications using the subscription endpoint. This varies by browser and device. Native workout reminders are scheduled locally on the device.'],

      ['No payment processor is active in this code version', 'Subscription collection is intended to use Google Play and Apple App Store billing before public release. This version does not contain that billing integration, and gymbook does not currently receive card numbers through the app. The store’s checkout screen and terms will control the actual localized price and purchase conditions.'],

      ['Provider notices', 'Each provider handles some data under its own terms and privacy notices. Consult the current notices for [Supabase](https://supabase.com/legal), [Vercel](https://vercel.com/legal/privacy-policy), [Google](https://policies.google.com/privacy), [Apple](https://www.apple.com/legal/privacy/), and [jsDelivr](https://www.jsdelivr.com/terms/privacy-policy).'],

    ],

    es: [

      ['Supabase (si está habilitado)', 'Si el despliegue usa Supabase, puede proporcionar autenticación, inicio y recuperación con correo/contraseña y una base de datos PostgreSQL alojada. Supabase puede usar subencargados; consulta su lista y recursos vigentes en supabase.com/legal. No lo consideres un proveedor activo si no está realmente configurado en la app desplegada.'],

      ['Vercel (si está habilitado)', 'Si el despliegue usa Vercel, puede proporcionar alojamiento web y entrega de API. Los registros de infraestructura pueden incluir IP, datos de dispositivo/navegador, rutas solicitadas, fechas y errores. No lo consideres un proveedor activo si no está realmente configurado en la app desplegada.'],

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

      ['Subscriptions and payments', 'This version does not integrate Google Play or Apple billing and therefore does not currently offer that in-app subscription. No charge should be made under this section. If subscriptions are enabled in the future, before purchase the app store checkout must clearly disclose the total price and currency, applicable taxes, trial duration and eligibility, renewal date and frequency, cancellation method and refund terms. Automatic renewal will only begin through an explicit purchase and acceptance in the store. Uninstalling the app does not cancel a store subscription. Mandatory consumer rights remain unaffected.'],

      ['Availability and changes', 'We may maintain, update, suspend or discontinue features for operational, security or legal reasons. We will use reasonable efforts to notify users about material changes to these terms. Nothing here removes rights that cannot be excluded by law.'],

      ['Software and third-party content', 'gymbook’s source code and exercise media may be subject to different licenses. These terms do not revoke rights granted under the AGPL-3.0-or-later license or the dataset’s separate terms. See the LICENSE and NOTICE files.'],

      ['Governing law and contact', `These terms are governed by Colombian law, subject to mandatory consumer protections that apply where you live. Contact ${CONTACT} with questions or complaints.`],

    ],

    es: [

      ['Quién puede usar gymbook', 'Debes tener al menos 18 años y capacidad para celebrar un acuerdo vinculante. Al usar la app, aceptas estos términos y la Política de Privacidad. Si no estás de acuerdo, no crees una cuenta ni uses el servicio.'],

      ['Cuentas y contenido', 'Protege tus credenciales y entrega información correcta para tu cuenta. Eres responsable de las rutinas, registros, notas, importaciones y contenido que agregues, así como de conservar tus propias copias. No cargues información personal o médica de otra persona sin autorización.'],

      ['Solo para ejercicio; no es asesoría médica', 'gymbook sirve para planificar y registrar entrenamientos, no es un servicio médico. Las estimaciones y resúmenes de progreso son informativos y pueden ser inexactos. Tú eliges ejercicios y cargas. Detente si sientes dolor o malestar y consulta a un profesional de salud antes de entrenar si tienes una condición o inquietud.'],

      ['Suscripciones y pagos', 'La versión actual no integra la facturación de Google Play ni de Apple y, por tanto, no ofrece actualmente esa suscripción dentro de la app. No se debe realizar ningún cobro con base en esta sección. Si se habilita una suscripción en el futuro, antes de confirmar la compra se mostrarán claramente el precio total y moneda, impuestos aplicables, duración y elegibilidad de la prueba, fecha y frecuencia de renovación, método de cancelación y condiciones de reembolso. La renovación automática solo se activará mediante una compra y aceptación expresa en la tienda. Desinstalar la app no cancela una suscripción contratada con una tienda. Se respetarán los derechos imperativos del consumidor.'],

      ['Disponibilidad y cambios', 'Podemos mantener, actualizar, suspender o retirar funciones por motivos operativos, de seguridad o legales. Haremos esfuerzos razonables para avisar cambios importantes de estos términos. Nada de lo aquí indicado elimina derechos irrenunciables por ley.'],

      ['Software y contenido de terceros', 'El código fuente de gymbook y los medios de ejercicios pueden tener licencias diferentes. Estos términos no revocan derechos concedidos por la licencia AGPL-3.0-or-later ni las condiciones separadas del conjunto de datos. Consulta LICENSE y NOTICE.'],

      ['Ley aplicable y contacto', `Estos términos se rigen por la ley colombiana, sin perjuicio de las protecciones obligatorias para consumidores del lugar donde vivas. Escríbenos a ${CONTACT} para preguntas o reclamaciones.`],

    ],

  },

  subscription: {

    en: [

      ['Current status', 'This version of gymbook does not integrate Google Play or Apple billing and does not currently offer an in-app paid subscription. No price or free trial is active in this version.'],

      ['Automatic renewal and cancellation', 'Unless you cancel before the trial or current billing period ends, the store will automatically renew the subscription and charge the payment method on file. Cancel or manage it in Google Play Subscriptions or Apple Account → Subscriptions. Removing gymbook from your device does not cancel it.'],

      ['Billing and refunds', 'Google Play or Apple processes the payment and controls billing records. gymbook receives purchase or subscription status needed to provide access, not your full card number. Refunds, billing disputes, and some cancellations are handled by the relevant store, subject to applicable law.'],

      ['Future availability', 'If billing is added in a future release, these terms and the store purchase screen must be updated before the subscription is offered to users.'],

    ],

    es: [

      ['Estado actual', 'Esta versión de gymbook no integra la facturación de Google Play ni Apple y no ofrece actualmente una suscripción de pago dentro de la app. No hay un precio ni una prueba gratuita activos en esta versión.'],

      ['Renovación automática y cancelación', 'Si no cancelas antes de que termine la prueba o el periodo vigente, la tienda renovará automáticamente la suscripción y cobrará el medio de pago registrado. Cancélala o adminístrala en Suscripciones de Google Play o Cuenta de Apple → Suscripciones. Eliminar gymbook del dispositivo no la cancela.'],

      ['Cobros y reembolsos', 'Google Play o Apple procesa el pago y gestiona los registros de facturación. gymbook recibe el estado de compra o suscripción necesario para habilitar el acceso, no el número completo de tu tarjeta. La tienda correspondiente gestiona reembolsos, disputas de cobro y algunas cancelaciones, conforme a la ley aplicable.'],

      ['Disponibilidad futura', 'Si se incorpora facturación en una versión futura, estas condiciones y la pantalla de compra de la tienda deberán actualizarse antes de ofrecer la suscripción.'],

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

    <p className="small dim">{lang === 'es' ? `Responsable: ${OWNER} · El Carmen de Viboral, Colombia · ${CONTACT} · Actualizado: 12 de octubre de 2026.` : `Responsible person: ${OWNER} · El Carmen de Viboral, Colombia · ${CONTACT} · Updated: ${UPDATED}.`}</p>

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

      <p className="legal-updated">{lang === 'es' ? 'Vigente desde el 12 de octubre de 2026' : `Effective 12 October 2026`}</p>

      <LegalText id={selected.id} />

    </> : <>

      <p className="muted small legal-intro">{lang === 'es' ? 'Información sobre privacidad, datos, proveedores externos y condiciones de uso de gymbook.' : 'Information about privacy, data, third-party providers and the terms for using gymbook.'}</p>

      <div className="sect-b">

        {DOCS.map(item => <Row key={item.id} icon={item.icon} title={lang === 'es' ? item.es : item.title} accessory="chevron" onClick={() => navigate(`/legal/${item.id}`, { state: { from } })} />)}

      </div>

    </>}

  </main>

}


