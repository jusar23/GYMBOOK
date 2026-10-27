import { useLocation, useNavigate } from 'react-router-dom'

import { getLang, t, useLang } from '../lib/i18n.js'

import Icon from '../components/Icon.jsx'

import { Row } from '../components/ui.jsx'



// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN (revisa estos valores antes de cada publicación)
// ─────────────────────────────────────────────────────────────
const OWNER = 'Juan Sebastián Arias Quintero'

const CONTACT = 'xsebas23@gmail.com'

const ADDRESS = 'El Carmen de Viboral, Antioquia, Colombia'

// Teléfono de contacto (recomendado por la normativa colombiana). Si lo dejas vacío no se muestra.
const PHONE = '' // Completa este dato antes de publicar si corresponde a tu canal de contacto

const VERSION = '1.7'

const UPDATED_EN = '18 October 2026'

const UPDATED_ES = '18 de octubre de 2026'

// Pon en true SOLO cuando exista el botón "Eliminar cuenta" dentro de la app (exigido por Google Play y Apple).
const ACCOUNT_DELETION_IN_APP = true



const phoneEn = PHONE ? ` Phone: ${PHONE}.` : ''

const phoneEs = PHONE ? ` Teléfono: ${PHONE}.` : ''



export const DOCS = [

  { id: 'privacy', icon: 'shield', title: 'Privacy policy', es: 'Política de privacidad' },

  { id: 'collection', icon: 'list', title: 'Data collection notice', es: 'Declaración de recopilación de datos' },

  { id: 'third-parties', icon: 'globe', title: 'Third-party services', es: 'Servicios de terceros' },

  { id: 'terms', icon: 'clipboard', title: 'Terms and conditions', es: 'Términos y condiciones' },

]



// Cada sección es [título, texto]. El texto puede ser un string (párrafo) o un array de strings (viñetas).
const COPY = {

  privacy: {

    en: [

      ['Who is responsible', `${OWNER}, a natural person operating the Gym Book Training brand, is responsible for the processing of your personal data (Law 1581 of 2012, Colombia). Address: ${ADDRESS}. Email: ${CONTACT}.${phoneEn} This email is also the contact point for queries, complaints and data-protection requests.`],

      ['Information we process', [

        'Account data: display name, email address, sign-in identifiers, date of birth, country, and records of the terms, privacy notice and separate training-data consent you accepted.',

        'Training data: routines, exercises, dates, sets, repetitions, logged weights, effort ratings, favorites, custom exercises, preferences and backup/import content.',

        'Body-weight entries (optional).',

        'Optional notes and any other text you choose to enter. Please do not enter medical records or information about other people.',

        'Technical data processed by our providers: IP address, browser/device details, request times and security logs.',

        'We do not request precise location, contacts, camera or microphone access.',

      ]],

      ['Why we use it', [

        'Create and secure your account, authenticate you, verify the minimum-age requirement and identify the country whose mandatory rules may apply.',

        'On signed-in mobile accounts, update your server backup after each completed workout and let you restore it manually. Guest data stays on the device.',

        'Send notifications you request.',

        'Answer support requests and handle your rights requests.',

        'Prevent abuse and fraud, keep the service secure and meet legal obligations.',

        'We do not sell personal data, do not use it for targeted advertising and do not share it with advertisers.',

      ]],

      ['Sensitive data and your consent', [

        'Workout history and body-weight records may reveal information about your physical condition or health and may therefore constitute sensitive personal data depending on their content and context.',

        'Before creating a signed-in account, the app asks separately for your explicit authorization to process workout logs and body-weight entries, which may reveal sensitive health information. The control is unticked by default; the app records the authorization, time and policy version. This authorization is separate from accepting these terms and the privacy notice.',

        'Providing sensitive data is optional. Declining does not prevent you from using features that do not need it, and you will be told which features depend on it.',

        'Where authorization is required, we retain evidence of the specific consent given, including its wording, date/time, policy version and the account or session associated with it. A general acceptance of the terms is not a substitute for separate sensitive-data consent.',

        `You can withdraw this authorization in Settings or request deletion through ${CONTACT}. Withdrawal stops future uploads and blocks access to the server copy while authorization is off. The existing copy remains stored in Supabase until you request its deletion or delete your account; reauthorizing makes it available again. Withdrawal does not delete workout data stored on this device.`,

      ]],

      ['Who receives your data', [

        'Supabase Auth stores account identifiers and the registration details and consent versions you submit. Supabase Postgres stores a server backup of workout data after each completed workout when you have separately authorized it. Withdrawing authorization stops future uploads but retains the existing copy until you request deletion or delete your account. Supabase processes these data under its applicable service terms; the project region is the one configured by the operator.',

        'The web/server hosting provider actually used for the published instance. If Gym Book Training is self-hosted, this is the person or organization operating the server and its infrastructure provider, if any.',

        'Google: Google sign-in and, when subscriptions are enabled, Google Play for Android purchases. Google Play processes the payment and shares subscription status.',

        'RevenueCat: if subscription billing is enabled, purchase verification and cross-platform subscription status. It receives an account identifier and purchase/entitlement information, not card details.',

        'Paddle: if website billing is enabled, subscription checkout, billing, taxes, receipts and customer-portal cancellation. Paddle acts as merchant of record and handles payment credentials.',

        'Apple: App Store distribution and purchases if billing is enabled.',

        'jsDelivr (and its CDN partners Cloudflare, Fastly, Bunny and Gcore): delivery of exercise images and GIFs.',

        'Your browser or device push service, only if you enable web push notifications.',

        "Each provider's role depends on the service and applicable arrangements: some may act as processors and others as independent controllers. The published list must identify only providers actually used by the version you are using. See Third-party services.",

      ]],

      ['International transfers and transmissions', 'If the deployed version uses providers or servers outside Colombia, some account or technical data may be processed in those countries. Before publication, we will identify the actual providers, countries and purposes and apply the mechanism required by Colombian law for each transfer or transmission; general acceptance of this policy does not replace any consent or safeguards required by law. If the service is hosted exclusively in Colombia, this clause must be adjusted to reflect that fact.'],

      ['Local storage and server backups', 'Workout history and settings are stored on your device. If you separately authorize processing of workout data, the app sends one updated backup to Supabase after each completed workout; restoration is started manually. Withdrawing authorization stops future uploads and blocks access to the existing server copy while authorization is off; that copy remains until you request deletion or delete your account. Clearing app data or uninstalling may erase the local copy.'],

      ['Minors', 'Gym Book Training is intended for people over 18 and is not directed at children or teenagers. We do not knowingly collect data from minors. If we learn that a minor has created an account, we will delete the account and its data. If you believe a minor is using the app, write to us at the email above.'],

      ['Retention and account deletion', [

        'We retain account and workout data while needed to provide the service and for a defined period after account deletion only where necessary for security, dispute handling or legal obligations. Before publication, the operator must set and follow actual retention periods for backups, logs and deleted accounts; data will not be kept indefinitely merely because it remains in a backup.',

        ACCOUNT_DELETION_IN_APP

          ? 'You can delete your account and its data at any time from Settings. Some records may be kept where the law requires it.'

          : `Account deletion is currently handled by request: write to ${CONTACT} from your account email. We will verify the request proportionately and process it within the applicable legal deadlines, deleting data that no longer needs to be retained and explaining any lawful retention exceptions.`,

        'Resetting workout data in Settings clears your training data but does not delete your account.',

      ]],

      ['Your rights', [

        'Know, update and rectify your personal data.',

        'Request proof of the authorization you gave.',

        'Be informed about how your data has been used.',

        'File complaints with the Superintendencia de Industria y Comercio (SIC) for violations of data-protection law.',

        'Revoke your authorization and/or request deletion of your data when processing does not respect legal principles and rights, or when no legal or contractual duty requires keeping it.',

        'Access your personal data free of charge.',

      ]],

      ['How to submit queries and complaints', [

        `Send your request to ${CONTACT}, preferably from the email associated with your account. Describe your request and provide a reply channel. We may ask for only the additional information reasonably necessary to verify your identity or clarify the request; do not send unnecessary sensitive documents.`,

        'Queries are answered within 10 business days; if we cannot, we will tell you the reason and a new date, which will not exceed 5 additional business days.',

        'Complaints are answered within 15 business days; if we cannot, we will tell you the reason and a new date, which will not exceed 8 additional business days. If your complaint is incomplete, we will ask you to complete it within 5 days.',

        'You may complain to the SIC (sic.gov.co) only after having used this process with us.',

      ]],

      ['Security and incidents', 'We use security measures appropriate to the actual deployment, which may include encrypted connections, access controls, authentication protections, backups and software updates. These measures must be configured and maintained in practice; no system is completely secure. We will manage and report personal-data incidents to the competent authority and affected people as required by applicable law.'],

      ['Changes and validity', `This policy is effective from ${UPDATED_EN} (version ${VERSION}). If a change materially affects purposes or processing, we will notify you in the app and ask for renewed authorization where the law requires it. Previous versions are available on request.`],

      ['Language', 'This policy is provided in English and Spanish. If they differ, the Spanish version prevails.'],

    ],

    es: [

      ['Responsable', `${OWNER}, persona natural que opera la marca Gym Book Training, es responsable del tratamiento de tus datos personales (Ley 1581 de 2012, Colombia). Domicilio: ${ADDRESS}. Correo: ${CONTACT}.${phoneEs} Este correo también es el canal para consultas, reclamos y solicitudes sobre protección de datos.`],

      ['Información que tratamos', [

        'Datos de cuenta: nombre visible, correo, identificadores de inicio de sesión, fecha de nacimiento, país y constancias de aceptación de los términos, el aviso de privacidad y la autorización separada para datos de entrenamiento.',

        'Datos de entrenamiento: rutinas, ejercicios, fechas, series, repeticiones, pesos registrados, esfuerzo percibido, favoritos, ejercicios personalizados, preferencias y contenido importado o de respaldo.',

        'Registros de peso corporal (opcionales).',

        'Notas opcionales y cualquier otro texto que decidas escribir. No incluyas historias clínicas ni datos de otras personas.',

        'Datos técnicos tratados por nuestros proveedores: dirección IP, detalles de navegador o dispositivo, horas de solicitud y registros de seguridad.',

        'No solicitamos ubicación precisa, contactos, cámara ni micrófono.',

      ]],

      ['Finalidades', [

        'Crear y proteger tu cuenta, autenticarte, verificar la edad mínima e identificar el país cuyas normas obligatorias pueden aplicar.',

        'En cuentas móviles con sesión iniciada y autorización separada, actualizar la copia del servidor al terminar cada entrenamiento y permitirte restaurarla manualmente. Sin esa autorización, los datos permanecen en el dispositivo y no se habilitan copias del servidor.',

        'Enviar las notificaciones que solicites.',

        'Responder solicitudes de soporte y atender el ejercicio de tus derechos.',

        'Prevenir abusos y fraudes, mantener la seguridad del servicio y cumplir obligaciones legales.',

        'No vendemos datos personales, no los usamos para publicidad dirigida y no los compartimos con anunciantes.',

      ]],

      ['Datos sensibles y tu autorización', [

        'Tu historial de entrenamiento y los registros de peso corporal pueden revelar información sobre tu condición física o salud y, según su contenido y contexto, pueden constituir datos personales sensibles.',

        'Antes de crear una cuenta, la app solicita por separado tu autorización expresa para tratar registros de entrenamiento y peso corporal, que pueden revelar información sensible de salud. La casilla aparece desmarcada; la app conserva la autorización, fecha y versión de los documentos. Esta autorización es independiente de aceptar los términos y el aviso de privacidad.',

        'Entregar datos sensibles es opcional. Si te niegas, puedes seguir usando las funciones que no los necesitan, y te indicaremos cuáles dependen de ellos.',

        'Cuando se requiera autorización, conservaremos evidencia del consentimiento específico, incluido el texto mostrado, fecha y hora, versión de la política y cuenta o sesión asociada. La aceptación general de los términos no sustituye la autorización separada para datos sensibles.',

        `Puedes revocar esta autorización desde Ajustes o solicitar la supresión escribiendo a ${CONTACT}. La revocatoria detiene nuevas subidas y bloquea el acceso a la copia del servidor mientras la autorización esté desactivada. La copia existente permanece en Supabase hasta que solicites su eliminación o elimines tu cuenta; si vuelves a autorizar, estará disponible otra vez. Revocar no elimina los datos guardados en este dispositivo.`,

      ]],

      ['Quiénes reciben tus datos', [

        'Supabase Auth guarda identificadores de cuenta y los datos de registro y versiones de consentimiento que envías. Supabase Postgres guarda una copia de entrenamiento al terminar cada sesión si autorizaste por separado ese tratamiento. Revocar la autorización detiene futuras subidas, pero conserva la copia existente hasta que solicites su eliminación o elimines tu cuenta. Supabase trata estos datos conforme a las condiciones aplicables del servicio; el proyecto usa la región configurada por el operador.',

        'Proveedor de infraestructura: el proveedor real del servidor o alojamiento puede procesar registros técnicos. Debe identificarse según el despliegue publicado.',

        'Google: inicio de sesión con Google y Google Play para compras Android. Google Play procesa el pago y comparte el estado de la suscripción.',

        'RevenueCat: si se habilitan las suscripciones, verifica compras y el estado entre plataformas. Recibe un identificador de cuenta e información de compra/derechos, no datos de tarjeta.',

        'Paddle: si se habilitan pagos web, procesa suscripciones, facturación, impuestos, recibos y cancelación desde su portal. Paddle actúa como comerciante registrado y gestiona los datos de pago.',

        'Apple: distribución en App Store y, si se habilita la facturación, compras.',

        'jsDelivr (y sus socios de CDN Cloudflare, Fastly, Bunny y Gcore): entrega de imágenes y GIF de ejercicios.',

        'El servicio de notificaciones de tu navegador o dispositivo, solo si activas las notificaciones web.',

        'El papel de cada proveedor depende del servicio concreto y de los acuerdos aplicables: algunos pueden actuar como encargados y otros como responsables independientes. La lista publicada debe identificar únicamente los proveedores realmente utilizados en la versión que estás usando. Consulta Servicios de terceros.',

      ]],

      ['Transferencias y transmisiones internacionales', 'Si la versión desplegada utiliza proveedores o servidores fuera de Colombia, algunos datos técnicos o de cuenta podrían tratarse en esos países. Antes de publicar, identificaremos los proveedores, países y finalidades reales y aplicaremos el mecanismo exigido por la normativa colombiana para cada transferencia o transmisión; una aceptación genérica de esta política no reemplaza las autorizaciones o garantías que legalmente se requieran. Si el servicio está alojado exclusivamente en Colombia, esta cláusula deberá ajustarse a esa realidad.'],

      ['Almacenamiento local y copias en el servidor', 'El historial de entrenamiento y la configuración se guardan en tu dispositivo. Si autorizas por separado el tratamiento de datos de entrenamiento, la app envía una copia actualizada a Supabase al terminar cada entrenamiento; la restauración se inicia manualmente. Revocar la autorización detiene futuras subidas y bloquea el acceso a la copia existente mientras esté desactivada; la copia permanece hasta que solicites su eliminación o elimines tu cuenta. Borrar los datos de la app o desinstalarla puede eliminar la copia local.'],

      ['Menores de edad', 'Gym Book Training está dirigida a personas mayores de 18 años y no a niños, niñas o adolescentes. No recopilamos a sabiendas datos de menores. Si detectamos que un menor creó una cuenta, la eliminaremos junto con sus datos. Si crees que un menor usa la app, escríbenos al correo indicado.'],

      ['Conservación y eliminación de cuenta', [

        'Conservamos los datos de cuenta y entrenamiento mientras sean necesarios para prestar el servicio y, tras eliminar una cuenta, solo durante un plazo definido cuando resulte necesario por seguridad, gestión de disputas u obligaciones legales. Antes de publicar, el operador debe fijar y cumplir plazos reales para copias de seguridad, registros técnicos y cuentas eliminadas; los datos no se conservarán indefinidamente solo por permanecer en una copia.',

        ACCOUNT_DELETION_IN_APP

          ? 'Puedes eliminar tu cuenta y tus datos en cualquier momento desde Ajustes. Algunos registros podrían conservarse cuando la ley lo exija.'

          : `Por ahora la eliminación de cuenta se gestiona por solicitud: escribe a ${CONTACT} desde el correo de tu cuenta. Verificaremos la solicitud de forma proporcional y la tramitaremos dentro de los plazos legales aplicables, suprimiendo los datos que ya no deban conservarse y explicando cualquier excepción legal.`,

        'Restablecer los datos de entrenamiento en Ajustes borra tu información de entrenamiento, pero no elimina tu cuenta.',

      ]],

      ['Tus derechos', [

        'Conocer, actualizar y rectificar tus datos personales.',

        'Solicitar prueba de la autorización que otorgaste.',

        'Ser informado sobre el uso que se ha dado a tus datos.',

        'Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley de protección de datos.',

        'Revocar la autorización y/o solicitar la supresión de tus datos cuando el tratamiento no respete los principios y derechos legales, o cuando no exista un deber legal o contractual de conservarlos.',

        'Acceder de forma gratuita a tus datos personales.',

      ]],

      ['Cómo presentar consultas y reclamos', [

        `Escribe a ${CONTACT}, preferiblemente desde el correo asociado a tu cuenta. Describe tu solicitud e indica un medio de respuesta. Podremos pedir únicamente la información adicional razonablemente necesaria para verificar tu identidad o aclarar la solicitud; no envíes documentos sensibles innecesarios.`,

        'Las consultas se responden en máximo 10 días hábiles; si no es posible, te informaremos el motivo y una nueva fecha, que no superará 5 días hábiles adicionales.',

        'Los reclamos se responden en máximo 15 días hábiles; si no es posible, te informaremos el motivo y una nueva fecha, que no superará 8 días hábiles adicionales. Si tu reclamo está incompleto, te pediremos completarlo dentro de los 5 días siguientes.',

        'Solo podrás acudir a la SIC (sic.gov.co) después de haber agotado este trámite con nosotros.',

      ]],

      ['Seguridad e incidentes', 'Aplicamos medidas de seguridad adecuadas al despliegue real, que pueden incluir conexiones cifradas, controles de acceso, protección de autenticación, copias de seguridad y actualizaciones. Estas medidas deben estar configuradas y mantenerse efectivamente; ningún sistema es totalmente seguro. Gestionaremos y reportaremos los incidentes de datos personales a la autoridad y a las personas afectadas cuando lo exija la normativa aplicable.'],

      ['Cambios y vigencia', `Esta política rige desde el ${UPDATED_ES} (versión ${VERSION}). Si un cambio afecta de forma material las finalidades o el tratamiento, te avisaremos en la app y solicitaremos una nueva autorización cuando la ley lo exija. Las versiones anteriores están disponibles si las solicitas.`],

      ['Idioma', 'Esta política se ofrece en español e inglés. Si hay diferencias, prevalece la versión en español.'],

    ],

  },

  collection: {

    en: [

      ['Collected when you register', 'Email, name, date of birth, country and account identifiers. The app records the versions and time of your acceptance of the Terms and Conditions, Privacy policy and separate workout-data authorization. Sign-in credentials are handled by Supabase Auth.'],

      ['Created by your use of Gym Book Training', 'Training routines and logs, exercise selections, dates, sets, repetitions, weights, body-weight entries, effort ratings, custom exercises, preferences and the name attached to your profile. This information may reveal aspects of your physical condition and may constitute sensitive data depending on its content and context. Signed-in server backups are enabled only after separate authorization.'],

      ['Collected by the device or service', 'Session and storage data on your device. IP address, browser/device details, request times and diagnostic or security logs may be processed by our hosting, authentication, database, CDN and push providers. If you enable web push, a push endpoint and notification settings are stored to deliver alerts; you can turn them off at any time from your browser or device settings.'],

      ['Not collected', 'The app does not request precise GPS location, contact list, microphone, camera, advertising identifier or third-party analytics events. Exercise photos/GIFs are content requests to the CDN, not uploads of your workouts.'],

      ['Local-only storage', 'Workout data can remain on the device when server backup authorization has not been granted. It is not sent to the account backup service without that separate authorization.'],

    ],

    es: [

      ['Al registrarte', 'Correo, nombre, fecha de nacimiento, país e identificadores de cuenta. La app registra las versiones y la fecha de aceptación de los Términos y condiciones, la Política de privacidad y la autorización separada para datos de entrenamiento. Supabase Auth gestiona las credenciales de inicio de sesión.'],

      ['Generados por el uso de Gym Book Training', 'Rutinas y entrenamientos, ejercicios elegidos, fechas, series, repeticiones, pesos, registros de peso corporal, esfuerzo percibido, ejercicios personalizados, preferencias y el nombre asociado al perfil. Esta información puede revelar aspectos de tu condición física y constituir datos sensibles según su contenido y contexto. Las copias en el servidor solo se habilitan después de una autorización separada.'],

      ['Procesados por el dispositivo o los servicios', 'Datos de sesión y almacenamiento en tu dispositivo. Dirección IP, detalles del navegador o dispositivo, horas de solicitud y registros de diagnóstico o seguridad pueden ser tratados por nuestros proveedores de alojamiento, autenticación, base de datos, CDN y notificaciones. Si activas notificaciones web, se almacena un endpoint de notificación y sus preferencias para entregar alertas; puedes desactivarlas en cualquier momento desde los ajustes de tu navegador o dispositivo.'],

      ['No recopilados', 'La app no solicita ubicación GPS precisa, contactos, micrófono, cámara, identificador publicitario ni eventos de analítica de terceros. Las imágenes y GIF de ejercicios son solicitudes de contenido al CDN, no cargas de tus entrenamientos.'],

      ['Almacenamiento solo local', 'Los datos de entrenamiento pueden permanecer en el dispositivo si no se ha otorgado la autorización para copias en el servidor. No se envían al servicio de copias de la cuenta sin esa autorización separada.'],

    ],

  },

  'third-parties': {

    en: [

      ['Self-hosted Node.js API and data storage', 'In the self-hosted deployment, the Node.js API and configured data volume process account and workout data. The server operator and infrastructure provider, if any, may process technical logs.'],

      ['Server infrastructure', 'The server operator and the infrastructure provider actually used for the published instance may process IP address, device/browser information, request paths, timestamps and errors. The identity of the real infrastructure provider must be disclosed in the deployed policy.'],

      ['Google', 'Google OAuth sign-in receives your authorization request and returns basic identity details such as name and email, subject to the permissions shown on Google’s consent screen. Android purchases, if enabled in the future, are processed by Google Play.'],

      ['Apple', 'iOS distribution and, if enabled in the future, purchases are handled by Apple and the App Store. Apple may share transaction identifiers and subscription status with Gym Book Training; payment credentials are handled by Apple.'],

      ['jsDelivr and exercise media', 'Exercise images and GIFs are requested from jsDelivr’s CDN. A CDN request can reveal network and device metadata such as IP address, browser, referrer domain, requested asset and time.'],

      ['CDN network partners', 'jsDelivr lists Cloudflare, Fastly, Bunny and Gcore as providers in its multi-CDN delivery network. They may route or serve asset requests and process request metadata. The delivery route may vary.'],

      ['Browser/device push service', 'If you enable web push, your browser/device’s push provider routes notifications using the subscription endpoint. This varies by browser and device. Native workout reminders are scheduled locally on your device.'],

      ['Payments', 'When subscription billing is enabled, Android purchases are handled by Google Play and website purchases by Paddle. RevenueCat checks subscription status across platforms. Payment credentials are handled by Google Play or Paddle and are not received by Gym Book Training. No payment is due unless an offer is displayed and you confirm a purchase.'],

      ['International processing', 'These providers may process data in countries outside Colombia, including the United States. See “International transfers and transmissions” in the Privacy policy.'],

      ['Provider notices', 'Consult the current privacy notices of each provider actually used in the deployed version, including Google, Apple or jsDelivr only if those services are enabled. The operator must add the name and privacy notice of the actual hosting/infrastructure provider.'],

    ],

    es: [

      ['Supabase', 'Supabase Auth guarda identificadores de cuenta y los datos de registro y versiones de consentimiento que envías. Supabase Postgres guarda una copia de entrenamiento al terminar cada sesión si autorizaste por separado ese tratamiento. Supabase trata estos datos conforme a las condiciones aplicables del servicio; el proyecto usa la región configurada por el operador.'],

      ['Infraestructura del servidor', 'El operador del servidor y el proveedor de infraestructura realmente utilizado en la versión publicada pueden tratar IP, datos de dispositivo/navegador, rutas solicitadas, fechas y errores. La política desplegada debe identificar al proveedor de infraestructura real.'],

      ['Google', 'Google OAuth procesa tu solicitud de acceso y entrega datos básicos de identidad, como nombre y correo, de acuerdo con los permisos que muestra la pantalla de autorización de Google. Las compras Android, si se habilitan en el futuro, las procesará Google Play.'],

      ['Apple', 'La distribución iOS y, si se habilitan en el futuro, las compras las gestionan Apple y App Store. Apple puede compartir identificadores de transacción y estado de suscripción con Gym Book Training; Apple gestiona los datos de pago.'],

      ['jsDelivr y contenido de ejercicios', 'Las imágenes y GIF de ejercicios se solicitan al CDN de jsDelivr. Una solicitud al CDN puede revelar metadatos de red y dispositivo como IP, navegador, dominio de referencia, archivo solicitado y hora.'],

      ['Socios de la red CDN', 'jsDelivr identifica a Cloudflare, Fastly, Bunny y Gcore como proveedores de su red de distribución multi-CDN. Pueden enrutar o servir solicitudes de archivos y tratar metadatos de esas solicitudes. La ruta de entrega puede variar.'],

      ['Servicio de notificaciones del navegador/dispositivo', 'Si activas notificaciones web, el proveedor de notificaciones de tu navegador o dispositivo las entrega usando el endpoint de suscripción. Varía según el navegador y dispositivo. Los recordatorios nativos de entrenamiento se programan localmente en tu dispositivo.'],

      ['Pagos', 'Cuando se habiliten suscripciones, Google Play gestionará las compras Android y Paddle las compras desde la web. RevenueCat comprobará el estado de la suscripción entre plataformas. Google Play o Paddle gestionan los datos de pago; Gym Book Training no recibe los datos de tu tarjeta. No hay cobro salvo que se muestre una oferta y confirmes una compra.'],

      ['Tratamiento internacional', 'Estos proveedores pueden tratar datos en países fuera de Colombia, incluido Estados Unidos. Consulta “Transferencias y transmisiones internacionales” en la Política de privacidad.'],

      ['Avisos de los proveedores', 'Consulta los avisos de privacidad vigentes de cada proveedor que realmente use la versión desplegada, incluidos Google, Apple o jsDelivr solo si esos servicios están habilitados. El operador debe añadir el nombre y aviso de privacidad del proveedor real de alojamiento/infraestructura.'],

    ],

  },

  terms: {

    en: [

      ['Who may use Gym Book Training', 'You must be over 18 and able to enter into a binding agreement. Gym Book Training requires a registered account. Account creation asks for your date of birth and country; you confirm these details are accurate and must accept the current Terms and Conditions and Privacy policy. Authorization to process workout and body-weight data for server backups is separate and optional; without it, workouts stay on this device and server backup and restoration are unavailable. If we learn that a minor created an account, we may suspend and delete it.'],

      ['Accounts and user content', 'Keep your sign-in credentials secure and provide accurate information. You are responsible for the routines, logs, notes, imports and other content you enter, and for keeping your own export/backup. Do not upload another person’s personal or medical information without permission. You keep ownership of your content and grant us only the permission needed to store and sync it to provide the service.'],

      ['Fitness use only; no medical advice', 'Gym Book Training is a workout logging and planning tool, not a medical service. Estimates and progress summaries are informational and may be inaccurate. You choose your exercises and loads. Stop if you feel pain or unwell and consult a qualified health professional before exercising if you have a condition or concern. The complete Fitness and health notice is included below.'],

      ['Paid plans', 'Planned subscriptions are USD 1 per month or USD 9 for the first year with annual renewal at USD 12. They are purchasable only when a plan is displayed at checkout. Before confirming, Google Play or Paddle shows the applicable localized price and currency, taxes, renewal amount and frequency, cancellation method and refund terms. See the Subscription terms below.'],

      ['Availability and changes', 'We may maintain, update, suspend or discontinue features for operational, security or legal reasons. We will make reasonable efforts to notify users of material changes to these terms. If we discontinue the service, we will give reasonable notice and a reasonable opportunity to export or retrieve your data where feasible.'],

      ['Liability', 'We provide the service with reasonable care but do not guarantee that it will be uninterrupted or error-free. To the extent permitted by law, we are not liable for indirect damages or for injuries resulting from how you use workout information. This does not exclude or limit liability that cannot be excluded by law (such as intent or gross negligence), nor your mandatory rights as a consumer under Law 1480 of 2011, including legal warranty and, where applicable, the right of withdrawal for distance purchases.'],

      ['Software and third-party content', 'Gym Book Training’s source code and exercise media may be subject to different licenses. These terms do not revoke rights granted under the AGPL-3.0-or-later license or the dataset’s separate terms. See the LICENSE and NOTICE files distributed with the source.'],

      ['Governing law, language and contact', `These terms are governed by Colombian law, subject to mandatory consumer protections that apply where you live. If the English and Spanish versions differ, the Spanish version prevails. Contact ${CONTACT} with questions or complaints. Version ${VERSION}, effective ${UPDATED_EN}.`],

    ],

    es: [

      ['Quién puede usar Gym Book Training', 'Debes ser mayor de 18 años y tener capacidad para celebrar un acuerdo vinculante. Gym Book Training requiere una cuenta registrada. Al crearla pedimos tu fecha de nacimiento y país; confirmas que son correctos y debes aceptar los Términos y condiciones y la Política de privacidad vigentes. La autorización para tratar datos de entrenamiento y peso para copias en el servidor es independiente y opcional; si no la otorgas, los entrenamientos permanecen en este dispositivo y no estarán disponibles las copias ni la restauración desde el servidor. Si sabemos que un menor creó una cuenta, podremos suspenderla y eliminarla.'],

      ['Cuentas y contenido', 'Protege tus credenciales y entrega información correcta. Eres responsable de las rutinas, registros, notas, importaciones y contenido que agregues, así como de conservar tus propias copias. No cargues información personal o médica de otra persona sin autorización. Conservas la titularidad de tu contenido y nos otorgas solo el permiso necesario para almacenarlo y sincronizarlo para prestar el servicio.'],

      ['Solo para ejercicio; no es asesoría médica', 'Gym Book Training sirve para planificar y registrar entrenamientos, no es un servicio médico. Las estimaciones y resúmenes de progreso son informativos y pueden ser inexactos. Tú eliges ejercicios y cargas. Detente si sientes dolor o malestar y consulta a un profesional de salud antes de entrenar si tienes una condición o inquietud. El Aviso de ejercicio y salud completo está incluido más abajo.'],

      ['Planes de pago', 'Los planes previstos cuestan USD 1 al mes o USD 9 el primer año, con renovación anual por USD 12. Solo se pueden comprar cuando aparezcan en la pantalla de pago. Antes de confirmar, Google Play o Paddle muestra el precio y la moneda local, impuestos, valor y frecuencia de renovación, método de cancelación y condiciones de reembolso. Consulta las Condiciones de suscripción completas más abajo.'],

      ['Disponibilidad y cambios', 'Podemos mantener, actualizar, suspender o retirar funciones por motivos operativos, de seguridad o legales. Haremos esfuerzos razonables para avisar cambios importantes de estos términos. Si cerramos el servicio, daremos un aviso razonable y, cuando sea viable, una oportunidad razonable para exportar o recuperar tus datos.'],

      ['Responsabilidad', 'Prestamos el servicio con diligencia razonable, pero no garantizamos que sea ininterrumpido o libre de errores. En la medida permitida por la ley, no respondemos por daños indirectos ni por lesiones derivadas del uso que hagas de la información de entrenamiento. Esto no excluye ni limita la responsabilidad que no pueda excluirse por ley (como el dolo o la culpa grave), ni tus derechos imperativos como consumidor bajo la Ley 1480 de 2011, incluida la garantía legal y, cuando aplique, el derecho de retracto en compras a distancia.'],

      ['Software y contenido de terceros', 'El código fuente de Gym Book Training y los medios de ejercicios pueden tener licencias diferentes. Estos términos no revocan derechos concedidos por la licencia AGPL-3.0-or-later ni las condiciones separadas del conjunto de datos. Consulta los archivos LICENSE y NOTICE distribuidos con el código.'],

      ['Ley aplicable, idioma y contacto', `Estos términos se rigen por la ley colombiana, sin perjuicio de las protecciones obligatorias para consumidores del lugar donde vivas. Si hay diferencias entre las versiones en español e inglés, prevalece la española. Escríbenos a ${CONTACT} para preguntas o reclamaciones. Versión ${VERSION}, vigente desde el ${UPDATED_ES}.`],

    ],

  },

  subscription: {

    en: [

      ['Plans and prices', 'The planned monthly subscription is USD 1 per month. Eligible new subscribers may receive the planned annual introductory offer of USD 9 for the first year, then USD 12 per year. If you are not eligible, checkout shows the price available to you. These plans are available only when displayed at checkout. Google Play and Paddle localize price and currency by country; the exact amount, taxes and renewal terms shown at checkout control your purchase. There is no free trial unless the checkout explicitly says otherwise.'],

      ['Renewal, management and cancellation', [

        'By confirming a plan, you authorize recurring charges at the price and frequency disclosed by the checkout. The annual introductory offer charges USD 9 for the first year and renews at USD 12 each following year, unless the localized checkout displays different converted amounts.',

        'Android purchases are billed and managed through Google Play. Website purchases are billed and managed through the Paddle customer portal. Cancel before the next renewal to stop future charges. After cancellation, access continues until the end of the paid period. Uninstalling the app or deleting your Gym Book Training account does not cancel a subscription; cancel it with the provider separately.',

        'Google Play or Paddle handles payment credentials and applicable refund requests. Gym Book Training receives purchase and subscription status to provide or restrict access. Any mandatory consumer rights remain unaffected.',

        'When a subscription expires, the app continues to let you sign in but limits app use to subscription renewal and account actions. Training data stored locally remains on the device. Complimentary access may be assigned to selected accounts by the service operator and is not transferable.',

        'Your mandatory consumer rights remain unaffected, including legal warranty and, where applicable, the right of withdrawal.',

      ]],

    ],

    es: [

      ['Planes y precios', 'El plan mensual previsto cuesta USD 1 al mes. Los nuevos suscriptores que cumplan los requisitos pueden recibir la oferta anual introductoria prevista de USD 9 el primer año y luego USD 12 al año. Si no cumples los requisitos, el pago muestra el precio que te corresponde. Solo se pueden contratar cuando aparezcan en la pantalla de pago. Google Play y Paddle adaptan precio y moneda al país; el importe exacto, los impuestos y las condiciones de renovación que aparezcan en el pago rigen tu compra. No hay prueba gratuita salvo que el pago la indique expresamente.'],

      ['Renovación, gestión y cancelación', [

        'Al confirmar un plan, autorizas cobros recurrentes al precio y frecuencia informados por el pago. La oferta anual introductoria cobra USD 9 el primer año y se renueva a USD 12 cada año siguiente, salvo que el pago localizado muestre otros importes convertidos.',

        'Las compras Android se cobran y gestionan mediante Google Play. Las compras de la web se cobran y gestionan desde el portal de clientes de Paddle. Cancela antes de la siguiente renovación para detener cobros futuros. Tras cancelar, el acceso continúa hasta finalizar el periodo pagado. Desinstalar la app o eliminar tu cuenta de Gym Book Training no cancela la suscripción; debes cancelarla por separado con el proveedor.',

        'Google Play o Paddle gestionan los datos de pago y las solicitudes de reembolso que correspondan. Gym Book Training recibe el estado de compra y suscripción para habilitar o limitar el acceso. Se respetan los derechos imperativos que te otorgue la ley de protección al consumidor.',

        'Al vencer una suscripción, la app permite iniciar sesión, pero limita el uso a renovar la suscripción y gestionar la cuenta. Los datos de entrenamiento guardados localmente permanecen en el dispositivo. El operador puede asignar acceso gratuito a cuentas seleccionadas; no es transferible.',

      ]],

    ],

  },

  fitness: {

    en: [

      ['Not medical advice', 'Gym Book Training is not a healthcare provider and does not diagnose, treat, prevent or monitor illness or injury. Exercise logs, suggested routines, estimated one-rep max, trends and other calculations are general information only.'],

      ['Use your judgment', 'Exercise carries risk. Choose loads and movements appropriate to your ability and surroundings, use equipment safely, and stop if you experience pain, dizziness, shortness of breath or other concerning symptoms. Ask a qualified healthcare professional before beginning or changing exercise if you are pregnant, injured, have a health condition, or are unsure whether an activity is safe for you.'],

      ['Personal data', 'Workout logs and body-weight entries may reveal aspects of your physical condition and may constitute sensitive data depending on their content and context. Enter only information you are comfortable storing in your account or on your device. Do not use Gym Book Training for emergency care or clinical monitoring.'],

    ],

    es: [

      ['No es asesoría médica', 'Gym Book Training no es un proveedor de salud y no diagnostica, trata, previene ni monitorea enfermedades o lesiones. Los registros, rutinas sugeridas, estimaciones de repetición máxima, tendencias y cálculos son información general.'],

      ['Usa tu criterio', 'El ejercicio implica riesgos. Elige cargas y movimientos acordes con tu capacidad y entorno, utiliza el equipo de forma segura y detente si sientes dolor, mareo, falta de aire u otro síntoma preocupante. Consulta a un profesional de salud antes de empezar o cambiar tu ejercicio si estás embarazada, lesionado, tienes una condición de salud o dudas sobre la seguridad de una actividad.'],

      ['Datos personales', 'Los registros de entrenamiento y de peso corporal pueden revelar aspectos de tu condición física y constituir datos sensibles según su contenido y contexto. Ingresa únicamente información que estés dispuesto a guardar en tu cuenta o dispositivo. No uses Gym Book Training para emergencias ni monitoreo clínico.'],

    ],

  },

}



function LegalText({ id }) {

  const lang = getLang() === 'es' ? 'es' : 'en'

  const groups = id === 'terms'
    ? [
        { title: lang === 'es' ? 'Condiciones del servicio' : 'Service terms', sections: COPY.terms?.[lang] || [] },
        { title: lang === 'es' ? 'Privacidad y tratamiento de datos' : 'Privacy and data processing', sections: COPY.privacy?.[lang] || [] },
        { title: lang === 'es' ? 'Recopilación y conservación' : 'Data collection and retention', sections: COPY.collection?.[lang] || [] },
        { title: lang === 'es' ? 'Proveedores y servicios externos' : 'Third-party providers and services', sections: COPY['third-parties']?.[lang] || [] },
        { title: lang === 'es' ? 'Uso relacionado con el ejercicio' : 'Exercise-related use', sections: COPY.fitness?.[lang] || [] },
        { title: lang === 'es' ? 'Suscripciones, precios y cancelación' : 'Subscriptions, pricing and cancellation', sections: COPY.subscription?.[lang] || [] },
      ]
    : [{ title: null, sections: COPY[id]?.[lang] || [] }]

  return <div className="legal-copy">

    {groups.map(group => <div className="legal-document-group" key={group.title || id}>
      {group.title && <h2>{group.title}</h2>}
      {group.sections.map(([heading, text]) => <section key={heading}>

        <h3>{heading}</h3>

        {Array.isArray(text)

          ? <ul className="legal-list" style={{ paddingLeft: 20, margin: '6px 0' }}>{text.map(item => <li key={item}>{item}</li>)}</ul>

          : <p>{text}</p>}

      </section>)}
    </div>)}

    {(id === 'third-parties' || id === 'terms') && <p className="small dim">{lang === 'es' ? 'Avisos de privacidad (consulta solo los servicios que estén habilitados): ' : 'Privacy notices (consult only services that are enabled): '}<a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google</a> · <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noreferrer">Apple</a> · <a href="https://www.jsdelivr.com/terms/privacy-policy" target="_blank" rel="noreferrer">jsDelivr</a></p>}

    {id === 'privacy' && <p className="small dim">{lang === 'es' ? 'Autoridad colombiana de protección de datos: ' : 'Colombian data protection authority: '}<a href="https://www.sic.gov.co/" target="_blank" rel="noreferrer">Superintendencia de Industria y Comercio (SIC)</a></p>}

    <p className="small dim">{lang === 'es' ? `Responsable: ${OWNER} · ${ADDRESS} · ${CONTACT} · Versión ${VERSION} · Actualizado: ${UPDATED_ES}.` : `Responsible person: ${OWNER} · ${ADDRESS} · ${CONTACT} · Version ${VERSION} · Updated: ${UPDATED_EN}.`}</p>

  </div>

}

export function LegalContent({ ids = ['terms'] }) {
  useLang()
  return <div className="legal-copy">
    {ids.map(id => <LegalText key={id} id={id} />)}
  </div>
}



export default function Legal() {

  useLang()

  const location = useLocation()

  // Legal is rendered directly by Shell (outside <Routes>), so useParams() is empty.
  // Read the document slug from the current HashRouter pathname instead.
  const doc = location.pathname.split('/')[2] || undefined

  const navigate = useNavigate()

  const lang = getLang() === 'es' ? 'es' : 'en'

  const selected = DOCS.find(item => item.id === doc)

  const from = location.state?.from || '/home'
  const returnState = location.state?.returnState

  const title = selected ? (lang === 'es' ? selected.es : t(selected.title)) : (lang === 'es' ? 'Legal y privacidad' : t('Legal & privacy'))

  const goBack = () => navigate(from, { replace: true, state: returnState })



  return <main className="legal-page">

    <header className="hdr">

      <button className="iconbtn" onClick={goBack} aria-label={t('Back')}><Icon name="chevronLeft" /></button>

      <div style={{ flex: 1, marginLeft: 10 }}><h1>{title}</h1></div>

    </header>

    {selected ? <>

      <p className="legal-updated">{lang === 'es' ? `Vigente desde el ${UPDATED_ES} · Versión ${VERSION}` : `Effective ${UPDATED_EN} · Version ${VERSION}`}</p>

      <LegalText id={selected.id} />

    </> : <>

      <p className="muted small legal-intro">{lang === 'es' ? 'Información sobre privacidad, datos, proveedores externos y condiciones de uso de Gym Book Training.' : 'Information about privacy, data, third-party providers and the terms for using Gym Book Training.'}</p>

      <div className="sect-b">

        {DOCS.map(item => <Row key={item.id} icon={item.icon} title={lang === 'es' ? item.es : t(item.title)} accessory="chevron" onClick={() => navigate(`/legal/${item.id}`, { state: { from, returnState } })} />)}

      </div>

    </>}

  </main>

}
