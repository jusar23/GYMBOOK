import { useLocation, useNavigate } from 'react-router-dom'

import { getLang, setLang, t, useLang } from '../lib/i18n.js'

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

const VERSION = '1.10'

const UPDATED_EN = '29 October 2026'

const UPDATED_ES = '29 de octubre de 2026'

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

        'Supabase Auth stores account identifiers and registration and consent details. Supabase Postgres stores the workout backup you explicitly authorize; the app uploads it after completed workouts and allows manual restoration. Supabase also processes network and security metadata needed to provide authentication and database services.',

        'The Android app does not use the self-hosted Node.js server. The website or a self-hosted deployment may have separate hosting providers described in its own applicable notice.',

        'Google: Google sign-in returns basic profile details. Google Play processes Android subscription checkout, payment credentials, transaction records and purchase status.',

        'RevenueCat: subscription offerings, purchase verification and subscription status. It receives the Gym Book Training account ID, app/SDK and purchase identifiers, and subscription/entitlement information. It does not receive card details from this app.',

        'Paddle: if website billing is enabled, subscription checkout, billing, taxes, receipts and customer-portal cancellation. Paddle acts as merchant of record and handles payment credentials.',

        'Apple: not used for distribution or purchases by the Android app. It may apply to a separately published iOS version.',

        'The Android app bundles exercise images and GIFs; it does not request them from a media CDN. The website may use jsDelivr and its CDN partners.',

        'Your browser or device push service, only if you enable web push notifications.',

        'Google Play processes Android purchases and payment credentials. Google, Supabase and RevenueCat receive only information needed for the feature described above. Their privacy notices explain their independent processing and retention. Paddle, Apple, jsDelivr and browser push relate only to separate website or iOS versions, not the Android APK.',

      ]],

      ['International processing', 'Supabase, Google, RevenueCat, and the hosting or network providers used by the relevant feature may process data outside Colombia, including in the United States or other countries where they or their subprocessors operate. Cross-border processing is limited to the purposes described here and is subject to the providers’ applicable safeguards and Colombian data-protection requirements. The Android app’s exercise images are bundled with the app; it does not request them from a media CDN.'],

      ['Android workout notification and widget', 'During an active workout, the app can show a persistent notification with the current exercise and a rest countdown. The widget displays the current streak and completed training days using local workout history and the selected language. These features process data on the device and do not add a category of data sent to the server.'],

      ['Local storage and server backups', 'Workout history and settings are stored on your device. On Android, if you separately authorize processing of workout data, the app replaces your previous Supabase backup with a current copy after each completed workout; it includes app preferences (such as language, sounds and rest duration), routines, exercise data and workout history. You can also save or restore a server copy manually. Restoring replaces local app settings and training data with the latest server copy. JSON exports can include settings, routines, exercise data and training history. Withdrawing authorization stops future uploads and blocks access to the existing server copy while authorization is off; that copy remains until you request deletion or delete your account. Clearing app data or uninstalling may erase the local copy.'],

      ['Minors', 'Gym Book Training is intended for people over 18 and is not directed at children or teenagers. We do not knowingly collect data from minors. If we learn that a minor has created an account, we will delete the account and its data. If you believe a minor is using the app, write to us at the email above.'],

      ['Retention and account deletion', [

        'We keep account data while the account is active and workout backups while you keep them enabled and authorized. Deleting your account removes its Supabase Auth account and linked live backup. Residual provider backups and security logs may persist for the provider’s normal rotation or where law requires retention; they are not available for normal app use and are deleted or overwritten under the provider’s retention schedule. Purchase and tax records may be retained by Google Play as required for transactions and legal obligations. We do not use account deletion to cancel a subscription.',

        ACCOUNT_DELETION_IN_APP

          ? 'You can delete your account and its data at any time from Settings. Some records may be kept where the law requires it.'

          : `Account deletion is currently handled by request: write to ${CONTACT} from your account email. We will verify the request proportionately and process it within the applicable legal deadlines, deleting data that no longer needs to be retained and explaining any lawful retention exceptions.`,

        `If you cannot sign in, request deletion at ${CONTACT} from your account email or use the public account-deletion page. We process these external requests within 30 days.`,

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

        'Supabase Auth guarda identificadores de cuenta y datos de registro y consentimiento. Supabase Postgres guarda la copia de entrenamiento que autorizas por separado; la app la actualiza después de entrenamientos completados y permite restaurarla manualmente. Supabase también trata metadatos de red y seguridad necesarios para prestar autenticación y base de datos.',

        'La app Android no usa el servidor Node.js autoalojado. El sitio web o una instalación autoalojada puede tener proveedores de alojamiento independientes sujetos a su aviso aplicable.',

        'Google: el inicio de sesión devuelve datos básicos del perfil. Google Play procesa la compra de suscripciones Android, los datos de pago, registros de transacción y estado de compra.',

        'RevenueCat: muestra planes, verifica compras y comunica el estado de la suscripción. Recibe el ID de tu cuenta Gym Book Training, identificadores de app/SDK y compra, e información de suscripción/derechos. Esta app no le entrega datos de tarjeta.',

        'Paddle: si se habilitan pagos web, procesa suscripciones, facturación, impuestos, recibos y cancelación desde su portal. Paddle actúa como comerciante registrado y gestiona los datos de pago.',

        'Apple: la app Android no se distribuye por App Store ni usa compras de Apple. Podría aplicar a una versión iOS distribuida por separado.',

        'El APK Android incluye imágenes y GIF de ejercicios; no los solicita a un CDN de medios. El sitio web puede usar jsDelivr y sus socios de CDN.',

        'El servicio de notificaciones de tu navegador o dispositivo, solo si activas las notificaciones web.',

        'Google Play procesa las compras Android y los datos de pago. Google, Supabase y RevenueCat reciben únicamente la información necesaria para las funciones descritas. Consulta sus avisos vigentes para conocer sus tratamientos y plazos. Paddle, Apple, jsDelivr y las notificaciones web corresponden solo a versiones web o iOS independientes, no al APK Android.',

      ]],

      ['Tratamiento internacional', 'Supabase, Google, RevenueCat y los proveedores de alojamiento o red que usa cada función pueden tratar datos fuera de Colombia, incluido Estados Unidos u otros países donde ellos o sus subencargados operen. El tratamiento se limita a las finalidades aquí descritas y se sujeta a las garantías aplicables de cada proveedor y a la normativa colombiana. Las imágenes de ejercicios del APK Android vienen incluidas en la app; no se solicitan a un CDN de medios.'],

      ['Notificaciones y widget Android', 'Durante un entrenamiento en curso, la app puede mostrar una notificación persistente con el ejercicio activo y, durante el descanso, una cuenta regresiva. El widget muestra la racha y los días de entrenamiento completados usando el historial local y el idioma configurado. Estas funciones procesan los datos en el dispositivo; no añaden una categoría de datos transmitidos al servidor.'],

      ['Almacenamiento local y copias en el servidor', 'El historial de entrenamiento y la configuración se guardan en tu dispositivo. En Android, si autorizas por separado el tratamiento de datos de entrenamiento, la app reemplaza la copia anterior de Supabase con una copia actualizada al terminar cada entrenamiento. Incluye preferencias de la app (como idioma, sonidos y tiempo de descanso), rutinas, datos de ejercicios e historial. También puedes guardar o restaurar una copia manualmente. La restauración reemplaza la configuración y los datos de entrenamiento locales con la copia más reciente del servidor. Las exportaciones JSON pueden incluir configuración, rutinas, datos de ejercicios e historial. Revocar la autorización detiene futuras subidas y bloquea el acceso a la copia existente mientras esté desactivada; la copia permanece hasta que solicites su eliminación o elimines tu cuenta. Borrar los datos de la app o desinstalarla puede eliminar la copia local.'],

      ['Menores de edad', 'Gym Book Training está dirigida a personas mayores de 18 años y no a niños, niñas o adolescentes. No recopilamos a sabiendas datos de menores. Si detectamos que un menor creó una cuenta, la eliminaremos junto con sus datos. Si crees que un menor usa la app, escríbenos al correo indicado.'],

      ['Conservación y eliminación de cuenta', [

        'Conservamos los datos de cuenta mientras la cuenta esté activa y las copias de entrenamiento mientras las mantengas habilitadas y autorizadas. Al eliminar tu cuenta, se elimina la cuenta Auth de Supabase y su copia activa vinculada. Copias residuales del proveedor y registros de seguridad pueden persistir durante la rotación normal del proveedor o cuando la ley exija conservarlos; no están disponibles para el uso normal de la app y se eliminan o sobrescriben según el calendario de conservación del proveedor. Google Play puede conservar registros de compras e impuestos según las obligaciones transaccionales y legales. Eliminar la cuenta no cancela una suscripción.',

        ACCOUNT_DELETION_IN_APP

          ? 'Puedes eliminar tu cuenta y tus datos en cualquier momento desde Ajustes. Algunos registros podrían conservarse cuando la ley lo exija.'

          : `Por ahora la eliminación de cuenta se gestiona por solicitud: escribe a ${CONTACT} desde el correo de tu cuenta. Verificaremos la solicitud de forma proporcional y la tramitaremos dentro de los plazos legales aplicables, suprimiendo los datos que ya no deban conservarse y explicando cualquier excepción legal.`,

        `Si no puedes iniciar sesión, solicita la eliminación en ${CONTACT} desde el correo asociado a tu cuenta o usa la página pública de eliminación. Atendemos estas solicitudes externas dentro de 30 días.`,

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

      ['Collected when you register', 'Email, name, date of birth, country, account ID and legal-consent records are sent to Supabase Auth to create and manage your account.'],

      ['Created by your use of Gym Book Training', 'Routines, workouts, exercise selections, dates, sets, repetitions, lifted weights, body-weight entries, effort ratings, custom exercises and preferences are stored locally. They are sent to Supabase only when you separately authorize a cloud backup. Workout and body-weight data may reveal health or fitness information.'],

      ['Collected by services and subscription SDK', 'Supabase and Google may process IP address, account/session identifiers and security metadata for sign-in, backups and purchases. RevenueCat processes the app user ID, purchase and subscription identifiers/status to verify access. The configured app does not call RevenueCat’s optional device-identifier collection method.'],

      ['Not collected by the Android app', 'The Android app does not request location, contacts, microphone or camera and does not include an advertising or analytics SDK. Exercise media is bundled in the APK. The release manifest does not declare the Android Advertising ID permission.'],

      ['Local-only storage', 'Workout data can remain on the device when server backup authorization has not been granted. It is not sent to the account backup service without that separate authorization.'],

    ],

    es: [

      ['Al registrarte', 'Correo, nombre, fecha de nacimiento, país, ID de cuenta y constancias de autorización se envían a Supabase Auth para crear y gestionar tu cuenta.'],

      ['Generados por el uso de Gym Book Training', 'Rutinas, entrenamientos, ejercicios elegidos, fechas, series, repeticiones, pesos levantados, registros de peso corporal, esfuerzo percibido, ejercicios personalizados y preferencias se guardan localmente. Se envían a Supabase solo si autorizas por separado la copia en la nube. Estos datos pueden revelar información de salud o condición física.'],

      ['Tratados por servicios y SDK de suscripción', 'Supabase y Google pueden tratar IP, identificadores de cuenta/sesión y metadatos de seguridad para acceso, copias y compras. RevenueCat trata el ID de usuario de la app e identificadores y estado de compra/suscripción para verificar acceso. La app configurada no llama al método opcional de RevenueCat para recopilar identificadores del dispositivo.'],

      ['No recopilados por la app Android', 'La app Android no solicita ubicación, contactos, micrófono ni cámara y no incluye SDK de publicidad o analítica. Los medios de ejercicios vienen incluidos en el APK. El manifiesto release no declara el permiso Android Advertising ID.'],

      ['Almacenamiento solo local', 'Los datos de entrenamiento pueden permanecer en el dispositivo si no se ha otorgado la autorización para copias en el servidor. No se envían al servicio de copias de la cuenta sin esa autorización separada.'],

    ],

  },

  'third-parties': {

    en: [

      ['Supabase', 'Supabase Auth and Postgres process account details, consent records and workout backups when the user separately authorizes cloud backup. Supabase also processes network and security metadata needed to operate these services.'],

      ['Android infrastructure', 'The native Android app uses Supabase for account and optional backup services. It does not use the self-hosted Node.js API. Website/self-host deployments may use separate hosting providers.'],

      ['Google and Google Play', 'Google OAuth receives your sign-in request and returns basic identity details such as name and email, subject to the consent screen. Google Play processes Android subscription checkout, payment credentials, transaction records and purchase status.'],

      ['RevenueCat', 'The Android RevenueCat SDK receives the Gym Book Training account ID and processes app/SDK and purchase identifiers, subscription transactions and entitlement status to present plans and verify access. It does not receive card details from the app. This app does not call RevenueCat’s optional device-identifier collection method.'],

      ['Exercise media', 'Exercise images and GIFs are packaged in the Android app and do not require an external media CDN. The website version may use jsDelivr and its CDN network partners.'],

      ['CDN network partners', 'jsDelivr lists Cloudflare, Fastly, Bunny and Gcore as providers in its multi-CDN delivery network. They may route or serve asset requests and process request metadata. The delivery route may vary.'],

      ['Browser/device push service', 'If you enable web push, your browser/device’s push provider routes notifications using the subscription endpoint. This varies by browser and device. Native workout reminders are scheduled locally on your device.'],

      ['Payments', 'Android subscriptions are purchased and managed through Google Play; RevenueCat verifies purchase status. Google Play handles payment credentials, which Gym Book Training does not receive. Website purchases, if offered, use Paddle separately. No charge is made until you select a plan and confirm the purchase in Google Play.'],

      ['International processing', 'Supabase, Google and RevenueCat may process the information described above in countries where they or their providers operate, including the United States. See “International processing” in the Privacy policy.'],

      ['Provider notices', 'For Android features, consult the current privacy notices of Google, Supabase and RevenueCat. Paddle, Apple and jsDelivr apply only to separate web or iOS versions if those services are enabled.'],

    ],

    es: [

      ['Supabase', 'Supabase Auth y Postgres tratan datos de cuenta, constancias de autorización y copias de entrenamiento cuando autorizas por separado el respaldo en la nube. Supabase también trata metadatos de red y seguridad necesarios para operar esos servicios.'],

      ['Infraestructura Android', 'La app Android nativa usa Supabase para cuenta y copias opcionales. No usa la API Node.js autoalojada. Las versiones web o autoalojadas pueden tener proveedores de alojamiento independientes.'],

      ['Google y Google Play', 'Google OAuth recibe tu solicitud de acceso y entrega datos básicos de identidad, como nombre y correo, según los permisos que muestra su pantalla. Google Play procesa el pago de las suscripciones Android, los datos de pago, registros de transacción y estado de compra.'],

      ['RevenueCat', 'El SDK Android de RevenueCat recibe el ID de cuenta Gym Book Training y trata identificadores de app/SDK y compra, transacciones y estado de suscripción para mostrar planes y verificar acceso. La app no le entrega datos de tarjeta y no llama al método opcional de RevenueCat para recopilar identificadores del dispositivo.'],

      ['Contenido de ejercicios', 'Las imágenes y GIF de ejercicios están incluidos en la app Android y no requieren un CDN externo. La versión web puede usar jsDelivr y su red de distribución CDN.'],

      ['Socios de la red CDN', 'jsDelivr identifica a Cloudflare, Fastly, Bunny y Gcore como proveedores de su red de distribución multi-CDN. Pueden enrutar o servir solicitudes de archivos y tratar metadatos de esas solicitudes. La ruta de entrega puede variar.'],

      ['Servicio de notificaciones del navegador/dispositivo', 'Si activas notificaciones web, el proveedor de notificaciones de tu navegador o dispositivo las entrega usando el endpoint de suscripción. Varía según el navegador y dispositivo. Los recordatorios nativos de entrenamiento se programan localmente en tu dispositivo.'],

      ['Pagos', 'Las suscripciones Android se compran y gestionan mediante Google Play; RevenueCat verifica su estado. Google Play gestiona los datos de pago, que Gym Book Training no recibe. Las compras web, si se ofrecen, usan Paddle por separado. No se cobra hasta que eliges un plan y confirmas la compra en Google Play.'],

      ['Tratamiento internacional', 'Supabase, Google y RevenueCat pueden tratar la información descrita en países donde operan ellos o sus proveedores, incluido Estados Unidos. Consulta “Tratamiento internacional” en la Política de privacidad.'],

      ['Avisos de los proveedores', 'Para las funciones Android, consulta los avisos vigentes de Google, Supabase y RevenueCat. Paddle, Apple y jsDelivr corresponden solo a versiones web o iOS independientes si se habilitan.'],

    ],

  },

  terms: {

    en: [

      ['Who may use Gym Book Training', 'You must be over 18 and able to enter into a binding agreement. Gym Book Training requires a registered account. Account creation asks for your date of birth and country; you confirm these details are accurate and must accept the current Terms and Conditions and Privacy policy. Authorization to process workout and body-weight data for server backups is separate and optional; without it, workouts stay on this device and server backup and restoration are unavailable. If we learn that a minor created an account, we may suspend and delete it.'],

      ['Accounts and user content', 'Keep your sign-in credentials secure and provide accurate information. You are responsible for the routines, logs, notes, imports and other content you enter, and for keeping your own export/backup. Do not upload another person’s personal or medical information without permission. You keep ownership of your content and grant us only the permission needed to store and sync it to provide the service.'],

      ['Fitness use only; no medical advice', 'Gym Book Training is a workout logging and planning tool, not a medical service. Estimates and progress summaries are informational and may be inaccurate. You choose your exercises and loads. Stop if you feel pain or unwell and consult a qualified health professional before exercising if you have a condition or concern. The complete Fitness and health notice is included below.'],

      ['Paid plans', 'The native Android app includes one month of access from account registration without a payment method. After that, users can choose a monthly or annual plan. The planned monthly subscription is USD 1/month; the annual plan is USD 9 for the first year and renews at USD 12/year. Google Play displays the localized price, renewal terms and cancellation method before purchase. The self-hosted edition remains free and open source.'],

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

      ['Plans, free access and prices', 'One month of free access starts when you register, with no payment method required. The app does not show or start a paid plan during this period. When the month ends, training features are locked and you can choose a monthly or annual plan to continue. The monthly plan is USD 1/month. Eligible new subscribers may receive USD 9 for the first year on the annual plan, then USD 12/year. Google Play localizes price and currency; the amount, taxes and renewal terms shown at checkout control. This app-provided free access is not a Google Play free-trial offer.'],

      ['Renewal, management and cancellation', [

        'By confirming a plan, you authorize recurring charges at the price and frequency disclosed by the checkout. The annual introductory offer charges USD 9 for the first year and renews at USD 12 each following year, unless the localized checkout displays different converted amounts.',

        'Android purchases are billed and managed through Google Play. Website purchases, if offered, are managed separately through Paddle. Cancel before renewal to stop future charges. After cancellation, access continues until the end of the paid period. Uninstalling the app or deleting your Gym Book Training account does not cancel a subscription; cancel it separately with Google Play.',

        'Google Play or Paddle handles payment credentials and applicable refund requests. Gym Book Training receives purchase and subscription status to provide or restrict access. Any mandatory consumer rights remain unaffected.',

        'When a subscription expires, the app continues to let you sign in but limits app use to subscription renewal and account actions. Training data stored locally remains on the device. Complimentary access may be assigned to selected accounts by the service operator and is not transferable.',

        'Your mandatory consumer rights remain unaffected, including legal warranty and, where applicable, the right of withdrawal.',

      ]],

    ],

    es: [

      ['Planes, acceso gratis y precios', 'El mes de acceso gratis empieza al registrarte y no requiere método de pago. La app no muestra ni inicia un plan de pago durante ese periodo. Al terminar el mes, las funciones de entrenamiento se bloquean y puedes elegir un plan mensual o anual para continuar. El plan mensual cuesta USD 1/mes. Los nuevos suscriptores que cumplan los requisitos pueden recibir USD 9 el primer año del plan anual y luego USD 12/año. Google Play adapta precio y moneda; rigen el importe, los impuestos y la renovación que aparezcan en el pago. Este acceso gratis lo concede la app; no es una prueba gratuita de Google Play.'],

      ['Renovación, gestión y cancelación', [

        'Al confirmar un plan, autorizas cobros recurrentes al precio y frecuencia informados por el pago. La oferta anual introductoria cobra USD 9 el primer año y se renueva a USD 12 cada año siguiente, salvo que el pago localizado muestre otros importes convertidos.',

        'Las compras Android se cobran y gestionan mediante Google Play. Las compras web, si se ofrecen, se gestionan por separado desde Paddle. Cancela antes de la renovación para detener los siguientes cobros. Tras cancelar, el acceso continúa hasta finalizar el periodo pagado. Desinstalar la app o eliminar tu cuenta de Gym Book Training no cancela la suscripción; debes cancelarla por separado en Google Play.',

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

  const interfaceLang = getLang()
  const lang = interfaceLang === 'es' ? 'es' : 'en'
  const legalUi = WEBSITE_LEGAL_UI[interfaceLang] || WEBSITE_LEGAL_UI.en

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

    {(id === 'third-parties' || id === 'terms') && <p className="small dim">{lang === 'es' ? 'Avisos de privacidad de proveedores Android: ' : 'Android provider privacy notices: '}<a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google</a> · <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">Supabase</a> · <a href="https://www.revenuecat.com/privacy/" target="_blank" rel="noreferrer">RevenueCat</a></p>}

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

const WEBSITE_LEGAL_UI = {
  en: { back: 'Back to website', center: 'INFORMATION CENTER', documents: 'Documents', navLabel: 'Legal documents', kicker: 'GYMBOOK · TRANSPARENCY', overview: 'Legal information', intro: 'Learn how the service works, what data it processes and what your rights are.', version: 'Version', updated: 'Updated', read: 'Read document', sourceNotice: 'The full legal documents are currently available in English and Spanish. Choose a language to read the full text.', english: 'English', spanish: 'Español' },
  es: { back: 'Volver al sitio', center: 'CENTRO DE INFORMACIÓN', documents: 'Documentos', navLabel: 'Documentos legales', kicker: 'GYMBOOK · TRANSPARENCIA', overview: 'Información legal', intro: 'Consulta cómo funciona el servicio, qué datos trata y cuáles son tus derechos.', version: 'Versión', updated: 'Actualizado', read: 'Leer documento', sourceNotice: 'Los documentos legales completos están disponibles en español e inglés. Elige un idioma para leer el texto completo.', english: 'English', spanish: 'Español' },
  de: { back: 'Zur Website', center: 'INFORMATIONSZENTRUM', documents: 'Dokumente', navLabel: 'Rechtliche Dokumente', kicker: 'GYMBOOK · TRANSPARENZ', overview: 'Rechtliche Informationen', intro: 'Erfahre, wie der Dienst funktioniert, welche Daten verarbeitet werden und welche Rechte du hast.', version: 'Version', updated: 'Aktualisiert', read: 'Dokument lesen', sourceNotice: 'Die vollständigen rechtlichen Dokumente sind derzeit auf Deutsch nicht verfügbar. Wähle Englisch oder Spanisch, um den vollständigen Text zu lesen.', english: 'English', spanish: 'Español' },
  fr: { back: 'Retour au site', center: 'CENTRE D’INFORMATION', documents: 'Documents', navLabel: 'Documents juridiques', kicker: 'GYMBOOK · TRANSPARENCE', overview: 'Informations juridiques', intro: 'Découvrez le fonctionnement du service, les données traitées et vos droits.', version: 'Version', updated: 'Mis à jour', read: 'Lire le document', sourceNotice: 'Les documents juridiques complets ne sont actuellement pas disponibles en français. Choisissez l’anglais ou l’espagnol pour lire le texte intégral.', english: 'English', spanish: 'Español' },
  it: { back: 'Torna al sito', center: 'CENTRO INFORMAZIONI', documents: 'Documenti', navLabel: 'Documenti legali', kicker: 'GYMBOOK · TRASPARENZA', overview: 'Informazioni legali', intro: 'Scopri come funziona il servizio, quali dati tratta e quali sono i tuoi diritti.', version: 'Versione', updated: 'Aggiornato', read: 'Leggi il documento', sourceNotice: 'I documenti legali completi non sono attualmente disponibili in italiano. Scegli inglese o spagnolo per leggere il testo integrale.', english: 'English', spanish: 'Español' },
  pt: { back: 'Voltar ao site', center: 'CENTRO DE INFORMAÇÕES', documents: 'Documentos', navLabel: 'Documentos legais', kicker: 'GYMBOOK · TRANSPARÊNCIA', overview: 'Informações legais', intro: 'Saiba como o serviço funciona, que dados trata e quais são os seus direitos.', version: 'Versão', updated: 'Atualizado', read: 'Ler documento', sourceNotice: 'Os documentos legais completos ainda não estão disponíveis em português. Escolha inglês ou espanhol para ler o texto integral.', english: 'English', spanish: 'Español' },
  pl: { back: 'Wróć do strony', center: 'CENTRUM INFORMACJI', documents: 'Dokumenty', navLabel: 'Dokumenty prawne', kicker: 'GYMBOOK · PRZEJRZYSTOŚĆ', overview: 'Informacje prawne', intro: 'Dowiedz się, jak działa usługa, jakie dane przetwarza i jakie masz prawa.', version: 'Wersja', updated: 'Aktualizacja', read: 'Czytaj dokument', sourceNotice: 'Pełne dokumenty prawne nie są obecnie dostępne po polsku. Wybierz angielski lub hiszpański, aby przeczytać pełny tekst.', english: 'English', spanish: 'Español' },
  tr: { back: 'Siteye dön', center: 'BİLGİ MERKEZİ', documents: 'Belgeler', navLabel: 'Yasal belgeler', kicker: 'GYMBOOK · ŞEFFAFLIK', overview: 'Yasal bilgiler', intro: 'Hizmetin nasıl çalıştığını, hangi verileri işlediğini ve haklarını öğren.', version: 'Sürüm', updated: 'Güncelleme', read: 'Belgeyi oku', sourceNotice: 'Yasal belgelerin tam metni şu anda Türkçe olarak sunulmuyor. Tam metni okumak için İngilizce veya İspanyolca seç.', english: 'English', spanish: 'Español' },
  ru: { back: 'Вернуться на сайт', center: 'ИНФОРМАЦИОННЫЙ ЦЕНТР', documents: 'Документы', navLabel: 'Юридические документы', kicker: 'GYMBOOK · ПРОЗРАЧНОСТЬ', overview: 'Правовая информация', intro: 'Узнай, как работает сервис, какие данные он обрабатывает и какие у тебя есть права.', version: 'Версия', updated: 'Обновлено', read: 'Читать документ', sourceNotice: 'Полные юридические документы пока недоступны на русском языке. Выбери английский или испанский, чтобы прочитать полный текст.', english: 'English', spanish: 'Español' },
  zh: { back: '返回网站', center: '信息中心', documents: '文档', navLabel: '法律文档', kicker: 'GYMBOOK · 信息透明', overview: '法律信息', intro: '了解服务的运作方式、处理的数据以及你享有的权利。', version: '版本', updated: '更新日期', read: '阅读文档', sourceNotice: '目前暂无完整的中文法律文件。请选择英文或西班牙文阅读完整内容。', english: 'English', spanish: 'Español' },
  ko: { back: '웹사이트로 돌아가기', center: '정보 센터', documents: '문서', navLabel: '법률 문서', kicker: 'GYMBOOK · 투명성', overview: '법률 정보', intro: '서비스 운영 방식, 처리하는 데이터와 이용자의 권리를 확인하세요.', version: '버전', updated: '업데이트', read: '문서 읽기', sourceNotice: '현재 전체 법률 문서는 한국어로 제공되지 않습니다. 전체 내용을 읽으려면 영어 또는 스페인어를 선택하세요.', english: 'English', spanish: 'Español' },
  hi: { back: 'वेबसाइट पर वापस जाएँ', center: 'जानकारी केंद्र', documents: 'दस्तावेज़', navLabel: 'कानूनी दस्तावेज़', kicker: 'GYMBOOK · पारदर्शिता', overview: 'कानूनी जानकारी', intro: 'जानें कि सेवा कैसे काम करती है, कौन-सा डेटा प्रोसेस होता है और आपके क्या अधिकार हैं।', version: 'संस्करण', updated: 'अपडेट', read: 'दस्तावेज़ पढ़ें', sourceNotice: 'पूरे कानूनी दस्तावेज़ अभी हिंदी में उपलब्ध नहीं हैं। पूरा पाठ पढ़ने के लिए अंग्रेज़ी या स्पेनिश चुनें।', english: 'English', spanish: 'Español' },
}



export default function Legal({ web = false }) {

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

  const title = selected ? (lang === 'es' ? selected.es : t(selected.title)) : legalUi.overview
  const chooseLegalLanguage = next => {
    localStorage.setItem('gymbook_site_lang', next)
    void setLang(next)
  }

  const goBack = () => navigate(from, { replace: true, state: returnState })
  const openWebDocument = id => {
    navigate(`/legal/${id}`, { state: { from, returnState } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (web) return <main className="legal-page website-legal-page">
    <header className="website-legal-top">
      <a className="website-legal-brand" href="/" aria-label="GYMBOOK home"><span className="website-legal-mark"><Icon name="dumbbell" /></span><span>GYMBOOK <small>LEGAL</small></span></a>
      <a className="website-legal-home" href="/">{legalUi.back}<Icon name="arrowUp" /></a>
    </header>
    <div className="website-legal-layout">
      <aside className="website-legal-sidebar">
        <span className="site-eyebrow">{legalUi.center}</span>
        <strong>{legalUi.documents}</strong>
        <nav aria-label={legalUi.navLabel}>
          {DOCS.map(item => <button className={selected?.id === item.id ? 'is-selected' : ''} key={item.id} onClick={() => openWebDocument(item.id)}>
            <Icon name={item.icon} /><span>{lang === 'es' ? item.es : t(item.title)}</span><Icon name="chevronRight" />
          </button>)}
        </nav>
      </aside>
      <article className="website-legal-document">
        <span className="website-legal-kicker">{legalUi.kicker}</span>
        <h1>{title}</h1>
        <p className="website-legal-intro">{legalUi.intro}</p>
        <div className="website-legal-meta"><span>{legalUi.version} {VERSION}</span><span>{legalUi.updated} {lang === 'es' ? UPDATED_ES : UPDATED_EN}</span></div>
        {!['en', 'es'].includes(interfaceLang) && <div className="website-legal-language-note">
          <p>{legalUi.sourceNotice}</p>
          <div><button onClick={() => chooseLegalLanguage('en')}>{legalUi.english}</button><button onClick={() => chooseLegalLanguage('es')}>{legalUi.spanish}</button></div>
        </div>}
        {selected
          ? <LegalText id={selected.id} />
          : <div className="website-legal-cards">{DOCS.map(item => <button key={item.id} onClick={() => openWebDocument(item.id)}>
            <span className="website-legal-card-icon"><Icon name={item.icon} /></span>
            <strong>{lang === 'es' ? item.es : t(item.title)}</strong>
            <span>{legalUi.read}<Icon name="arrowUp" /></span>
          </button>)}</div>}
      </article>
    </div>
  </main>



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
