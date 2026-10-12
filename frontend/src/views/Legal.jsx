import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { getLang, t, useLang } from '../lib/i18n.js'

import Icon from '../components/Icon.jsx'

import { Row } from '../components/ui.jsx'



// ═════════════════════════════════════════════════════════════
// CHECKLIST INTERNO (no se muestra a los usuarios)
// Este texto afirma que lo siguiente YA existe. No publiques hasta que sea verdad:
//  [ ] Registro con casilla de aceptación de Términos y Política (fecha y versión guardadas).
//  [ ] Casilla SEPARADA y sin marcar para datos sensibles (peso corporal), con evidencia:
//      texto mostrado, fecha/hora, versión y cuenta. Opción para retirarla dentro de la app.
//  [ ] Autorización expresa para transferencias internacionales (puede ir en el registro).
//  [ ] Ajustes: "Eliminar mis datos de entrenamiento" y "Eliminar mi cuenta" (borran de verdad,
//      incluidas copias en BACKUP_DAYS y registros en LOG_DAYS).
//  [ ] Ajustes: cambio de correo con confirmación en el correo nuevo.
//  [ ] Periodo gratuito de TRIAL_DAYS días, contado desde la creación de la cuenta.
//  [ ] Pago: mostrar precio total, moneda, impuestos, periodo y renovación ANTES de confirmar;
//      cancelación desde la app; reembolsos y retracto atendidos según la ley.
//  [ ] Contraseñas guardadas solo como hash (bcrypt/argon2).
//  [ ] El APK solo pide los permisos que declara el texto (internet y notificaciones) y se
//      distribuye desde los canales oficiales indicados en el texto.
//  [ ] Correos de confirmación/recuperación sin enlaces a terceros ni rastreadores.
//  [ ] Pantalla de consentimiento de Google con el nombre correcto de la app.
//  [ ] Revisión de seguridad completa cerrada (accesos, secretos, copias, dependencias).
//  [ ] HOSTING_*, EMAIL_PROVIDER, PAYMENT_PROCESSOR y PLAN_PRICE completados con datos reales.
//  [ ] URL pública de esta política (sin iniciar sesión) para tiendas y consentimiento de Google.
//  [ ] Data Safety (Google Play) coincide con este texto, si publicas en Play.
//  [ ] Revisión final por un abogado colombiano.
// ═════════════════════════════════════════════════════════════



const OWNER = 'Juan Sebastián Arias Quintero'

const CONTACT = 'xsebas23@gmail.com'

const ADDRESS = 'El Carmen de Viboral, Antioquia, Colombia'

// Teléfono de contacto (recomendado). Si lo dejas vacío no se muestra.
const PHONE = ''

// Proveedor y país donde corre el servidor. Si lo dejas vacío se usa un texto genérico.
const HOSTING_NAME = ''

const HOSTING_COUNTRY = ''

// Proveedor que envía los correos de confirmación y recuperación (ej. Resend, SendGrid). Vacío = texto genérico.
const EMAIL_PROVIDER = ''

// Procesador de pagos (ej. Wompi, Mercado Pago, Stripe, Google Play). Vacío = texto genérico.
const PAYMENT_PROCESSOR = ''

// Precio actual del plan (ej. 'COP 19.900 por mes'). Vacío = el precio se muestra solo en la pantalla de compra.
const PLAN_PRICE = ''

// Duración del periodo gratuito, en días.
const TRIAL_DAYS = 30

// true si el plan se renueva solo hasta que lo canceles; false si cada periodo se paga manualmente.
const AUTO_RENEWAL = true

// Plazos reales de conservación tras eliminar datos o cuenta. Ajusta y cumple lo que publiques.
const BACKUP_DAYS = 30

const LOG_DAYS = 90

const VERSION = '1.4'

const UPDATED_EN = '12 October 2026'

const UPDATED_ES = '12 de octubre de 2026'



const phoneEn = PHONE ? ` Phone: ${PHONE}.` : ''

const phoneEs = PHONE ? ` Teléfono: ${PHONE}.` : ''

const hostLabel = HOSTING_NAME ? `${HOSTING_NAME}${HOSTING_COUNTRY ? ` (${HOSTING_COUNTRY})` : ''}` : ''

const hostedAbroad = !!HOSTING_COUNTRY && HOSTING_COUNTRY.trim().toLowerCase() !== 'colombia'

const mailEn = EMAIL_PROVIDER || 'our transactional email provider'

const mailEs = EMAIL_PROVIDER || 'nuestro proveedor de envío de correo'

const procEn = PAYMENT_PROCESSOR || 'our payment processor'

const procEs = PAYMENT_PROCESSOR || 'nuestro procesador de pagos'

const priceEn = PLAN_PRICE ? ` The current price is ${PLAN_PRICE}.` : ''

const priceEs = PLAN_PRICE ? ` El precio actual es ${PLAN_PRICE}.` : ''

const renewEn = AUTO_RENEWAL

  ? 'The plan renews automatically at the end of each billing period until you cancel. You can cancel at any time from the app; cancellation takes effect at the end of the period you already paid.'

  : 'The plan does not renew automatically: when the paid period ends, you decide whether to pay again.'

const renewEs = AUTO_RENEWAL

  ? 'El plan se renueva automáticamente al final de cada periodo de facturación hasta que lo canceles. Puedes cancelar en cualquier momento desde la app; la cancelación surte efecto al terminar el periodo que ya pagaste.'

  : 'El plan no se renueva automáticamente: al terminar el periodo pagado, tú decides si pagas de nuevo.'



export const DOCS = [

  { id: 'privacy', icon: 'shield', title: 'Privacy policy', es: 'Política de privacidad' },

  { id: 'collection', icon: 'list', title: 'Data collection notice', es: 'Declaración de recopilación de datos' },

  { id: 'third-parties', icon: 'globe', title: 'Third-party services', es: 'Servicios de terceros' },

  { id: 'terms', icon: 'clipboard', title: 'Terms of use', es: 'Términos de uso' },

  { id: 'subscription', icon: 'trophy', title: 'Subscription terms', es: 'Condiciones de suscripción' },

  { id: 'fitness', icon: 'figureStrength', title: 'Fitness and health notice', es: 'Aviso de ejercicio y salud' },

]



// Cada sección es [título, texto]. El texto puede ser un string (párrafo) o un array de strings (viñetas).
const COPY = {

  privacy: {

    en: [

      ['Who is responsible', `${OWNER}, a natural person operating the gymbook service, is responsible for the processing of your personal data (Law 1581 of 2012, Colombia). Address: ${ADDRESS}. Email: ${CONTACT}.${phoneEn} This email is also the contact point for queries, complaints and data-protection requests.`],

      ['Scope', 'This policy applies to the gymbook service operated by the responsible person above, including its web app and its Android app (APK). If someone installs the gymbook software on their own server, that person is responsible for their own processing and must publish their own policy.'],

      ['Information we process', [

        'Account data: display name, email address and sign-in identifiers (including those provided by Google if you choose Google sign-in).',

        'Training data: routines, exercises, dates, sets, repetitions, logged weights, effort ratings, favorites, custom exercises, preferences and backup/import content.',

        'Body-weight entries (optional). We treat them as sensitive data.',

        'Plan data: the start and end dates of your free period, your plan status and billing period, and payment confirmations. We do not receive or store your card number.',

        'Records of your acceptances and authorizations: the policy version, date and time.',

        'Optional notes and any other text you choose to enter. Please do not enter medical records or information about other people.',

        'Technical data processed by our providers: IP address, browser/device details, request times and security logs.',

        'We do not request precise location, contacts, camera or microphone access.',

      ]],

      ['Why we use it', [

        'Create and secure your account and authenticate you.',

        'Sync your profile and training data across your devices and restore imported profiles.',

        'Send service emails: account confirmation, password recovery, email-change confirmation and notices about your plan. We do not send advertising emails.',

        'Manage your free period and your plan, and confirm payments.',

        'Send notifications you request.',

        'Answer support requests and handle your rights requests.',

        'Prevent abuse and fraud, keep the service secure and meet legal obligations.',

        'We do not sell personal data, do not use it for targeted advertising and do not share it with advertisers.',

      ]],

      ['Sensitive data and your consent', [

        'Body-weight records can reveal information about your health or physical condition, so we treat them as sensitive data.',

        'We process them only with your prior, express, informed and separate authorization, given through a box that is not pre-ticked. Silence or inaction is never consent, and accepting the Terms does not replace this authorization.',

        'Providing sensitive data is optional. If you decline, you can still use every feature that does not need it, and the app tells you which features depend on it.',

        'We keep evidence of your authorization: the text shown, date and time, policy version and the account associated with it.',

        'You can withdraw your authorization at any time from Settings, or through the contact details in this policy. We will stop the related processing and delete the data where the law allows. Withdrawal does not affect processing carried out lawfully before it.',

      ]],

      ['Who receives your data', [

        hostLabel

          ? `${hostLabel}: hosting of gymbook’s server, API and database.`

          : 'gymbook server: the API and database run on infrastructure that we administer.',

        `${mailEn[0].toUpperCase()}${mailEn.slice(1)}: sending of confirmation, recovery and service emails, which requires your email address and the content of the message.`,

        `${procEn[0].toUpperCase()}${procEn.slice(1)}: processing of payments for plans. It handles your payment data under its own terms and tells us whether a payment was completed.`,

        'Google: Google sign-in, if you choose it. Google acts as an independent controller for that service.',

        'jsDelivr (and its CDN partners Cloudflare, Fastly, Bunny and Gcore): delivery of exercise images and GIFs. Your device requests them directly, so these providers can see your IP address and basic request data.',

        'Your browser or device push service, only if you enable web push notifications.',

        'Each provider processes data under its own terms and privacy notice. See Third-party services.',

      ]],

      ['International transfers and transmissions', `Some providers process data outside Colombia, including the United States: Google (sign-in), jsDelivr and its CDN partners (exercise images)${hostedAbroad ? `, ${hostLabel} (hosting)` : ''} and, depending on where they operate, our email and payment providers. When you accept the sign-up authorization, you expressly authorize these transfers and transmissions, which are necessary to provide the service. We do not use your data for purposes other than those in this policy.`],

      ['Local storage, Android app and guest use', [

        'We only use storage on your browser or device that is strictly necessary to run the app (settings, workout state and sign-in session). We do not use advertising cookies or third-party analytics.',

        'The Android app (APK) requests only the permissions it needs to work, such as internet access and notifications. Install it only from the official channels we indicate, so you receive authentic updates.',

        'Guest progress stays on your device and is not synced to our account database; clearing app data or uninstalling may erase it. Signed-in profiles are synced to the service.',

      ]],

      ['Minors', 'gymbook is intended for people aged 18 or over and is not directed at children or teenagers. We do not knowingly collect data from minors. If we learn that a minor has created an account, we will delete the account and its data. If you believe a minor is using the app, write to us at the email above.'],

      ['Managing, deleting and correcting your data', [

        'Correct your data: you can edit your profile and change your email address from Settings. To change your email, we confirm the new address before applying the change.',

        'Delete your training data: from Settings you can delete all your training data while keeping your account.',

        'Delete your account: from Settings you can delete your account and all associated data. You can also request it by writing to the contact email.',

        `When you delete data or your account, we remove it from active systems immediately and from backups within ${BACKUP_DAYS} days. Technical and security logs are kept for up to ${LOG_DAYS} days. We keep records longer only where the law requires it (for example, payment records) or to handle a dispute, and we will tell you which.`,

        'Deleting your account does not by itself cancel a plan paid through a third party; cancel the plan first if it is active.',

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

        `Send your request to ${CONTACT}, preferably from the email associated with your account. Describe your request and provide a reply channel. We may ask only for the additional information reasonably necessary to verify your identity or clarify the request; please do not send unnecessary sensitive documents.`,

        'Queries are answered within 10 business days; if we cannot, we will tell you the reason and a new date, which will not exceed 5 additional business days.',

        'Complaints are answered within 15 business days; if we cannot, we will tell you the reason and a new date, which will not exceed 8 additional business days.',

        'If your complaint is incomplete, we will ask you to complete it within 5 days of receiving it. If you do not respond within 2 months, we will consider the complaint withdrawn.',

        'You may complain to the SIC (sic.gov.co) only after having used this process with us.',

      ]],

      ['Security and incidents', 'We protect your data with encrypted connections, access controls, passwords stored only as hashes, backups and regular software updates, and we review the security of the service periodically. No system is completely secure. If a security incident affects personal data, we will report it to the competent authority and notify affected people as required by applicable law.'],

      ['Changes and validity', `This policy is effective from ${UPDATED_EN} (version ${VERSION}) and applies for as long as the service is operated. If a change materially affects purposes or processing, we will notify you in the app and ask you to accept the new version, and ask for renewed authorization where the law requires it. Previous versions are available on request.`],

      ['Language', 'This policy is provided in English and Spanish. If they differ, the Spanish version prevails.'],

    ],

    es: [

      ['Responsable', `${OWNER}, persona natural que opera el servicio gymbook, es responsable del tratamiento de tus datos personales (Ley 1581 de 2012, Colombia). Domicilio: ${ADDRESS}. Correo: ${CONTACT}.${phoneEs} Este correo también es el canal para consultas, reclamos y solicitudes sobre protección de datos.`],

      ['Alcance', 'Esta política aplica al servicio gymbook operado por el responsable indicado, incluida su app web y su app Android (APK). Si alguien instala el software de gymbook en su propio servidor, esa persona es responsable de su propio tratamiento y debe publicar su propia política.'],

      ['Información que tratamos', [

        'Datos de cuenta: nombre visible, correo electrónico e identificadores de inicio de sesión (incluidos los entregados por Google si eliges ese método).',

        'Datos de entrenamiento: rutinas, ejercicios, fechas, series, repeticiones, pesos registrados, esfuerzo percibido, favoritos, ejercicios personalizados, preferencias y contenido importado o de respaldo.',

        'Registros de peso corporal (opcionales). Los tratamos como datos sensibles.',

        'Datos del plan: fechas de inicio y fin de tu periodo gratuito, estado del plan y periodo de facturación, y confirmaciones de pago. No recibimos ni guardamos el número de tu tarjeta.',

        'Constancias de tus aceptaciones y autorizaciones: versión de la política, fecha y hora.',

        'Notas opcionales y cualquier otro texto que decidas escribir. No incluyas historias clínicas ni datos de otras personas.',

        'Datos técnicos tratados por nuestros proveedores: dirección IP, detalles de navegador o dispositivo, horas de solicitud y registros de seguridad.',

        'No solicitamos ubicación precisa, contactos, cámara ni micrófono.',

      ]],

      ['Finalidades', [

        'Crear y proteger tu cuenta y autenticarte.',

        'Sincronizar tu perfil y entrenamiento entre tus dispositivos y restaurar perfiles importados.',

        'Enviar correos del servicio: confirmación de cuenta, recuperación de contraseña, confirmación de cambio de correo y avisos sobre tu plan. No enviamos correos publicitarios.',

        'Gestionar tu periodo gratuito y tu plan, y confirmar pagos.',

        'Enviar las notificaciones que solicites.',

        'Responder solicitudes de soporte y atender el ejercicio de tus derechos.',

        'Prevenir abusos y fraudes, mantener la seguridad del servicio y cumplir obligaciones legales.',

        'No vendemos datos personales, no los usamos para publicidad dirigida y no los compartimos con anunciantes.',

      ]],

      ['Datos sensibles y tu autorización', [

        'Los registros de peso corporal pueden revelar información sobre tu salud o condición física, por eso los tratamos como datos sensibles.',

        'Solo los tratamos con tu autorización previa, expresa, informada y separada, otorgada mediante una casilla que no viene marcada por defecto. El silencio o la inacción nunca son autorización, y aceptar los Términos no sustituye esta autorización.',

        'Entregar datos sensibles es opcional. Si te niegas, puedes usar todas las funciones que no los necesitan, y la app te indica cuáles dependen de ellos.',

        'Conservamos evidencia de tu autorización: el texto mostrado, fecha y hora, versión de la política y cuenta asociada.',

        'Puedes revocar tu autorización en cualquier momento desde Ajustes o por los canales de esta política. Detendremos el tratamiento relacionado y eliminaremos los datos cuando la ley lo permita. La revocatoria no afecta el tratamiento realizado lícitamente antes de ella.',

      ]],

      ['Quiénes reciben tus datos', [

        hostLabel

          ? `${hostLabel}: alojamiento del servidor, la API y la base de datos de gymbook.`

          : 'Servidor de gymbook: la API y la base de datos se ejecutan en infraestructura que administramos nosotros.',

        `${mailEs[0].toUpperCase()}${mailEs.slice(1)}: envío de correos de confirmación, recuperación y avisos del servicio, para lo cual recibe tu correo y el contenido del mensaje.`,

        `${procEs[0].toUpperCase()}${procEs.slice(1)}: procesamiento de los pagos de los planes. Trata tus datos de pago bajo sus propias condiciones y nos informa si un pago se completó.`,

        'Google: inicio de sesión con Google, si lo eliges. Google actúa como responsable independiente de ese servicio.',

        'jsDelivr (y sus socios de CDN Cloudflare, Fastly, Bunny y Gcore): entrega de imágenes y GIF de ejercicios. Tu dispositivo los solicita directamente, por lo que estos proveedores pueden ver tu dirección IP y datos básicos de la solicitud.',

        'El servicio de notificaciones de tu navegador o dispositivo, solo si activas las notificaciones web.',

        'Cada proveedor trata datos bajo sus propias condiciones y aviso de privacidad. Consulta Servicios de terceros.',

      ]],

      ['Transferencias y transmisiones internacionales', `Algunos proveedores tratan datos fuera de Colombia, incluido Estados Unidos: Google (inicio de sesión), jsDelivr y sus socios de CDN (imágenes de ejercicios)${hostedAbroad ? `, ${hostLabel} (alojamiento)` : ''} y, según dónde operen, nuestros proveedores de correo y de pagos. Al aceptar la autorización de registro, autorizas expresamente estas transferencias y transmisiones, necesarias para prestar el servicio. No usamos tus datos para finalidades distintas de las de esta política.`],

      ['Almacenamiento local, app Android e invitado', [

        'Solo usamos almacenamiento del navegador o dispositivo estrictamente necesario para que la app funcione (preferencias, estado del entrenamiento y sesión). No usamos cookies publicitarias ni analítica de terceros.',

        'La app Android (APK) solicita únicamente los permisos que necesita para funcionar, como acceso a internet y notificaciones. Instálala solo desde los canales oficiales que indicamos, para recibir actualizaciones auténticas.',

        'El progreso de invitado permanece en tu dispositivo y no se sincroniza con nuestra base de datos de cuentas; borrar los datos de la app o desinstalarla puede eliminarlo. Los perfiles registrados se sincronizan con el servicio.',

      ]],

      ['Menores de edad', 'gymbook está dirigida a personas mayores de 18 años y no a niños, niñas o adolescentes. No recopilamos a sabiendas datos de menores. Si detectamos que un menor creó una cuenta, la eliminaremos junto con sus datos. Si crees que un menor usa la app, escríbenos al correo indicado.'],

      ['Gestionar, eliminar y corregir tus datos', [

        'Corregir tus datos: puedes editar tu perfil y cambiar tu correo desde Ajustes. Para cambiar el correo, confirmamos la nueva dirección antes de aplicar el cambio.',

        'Eliminar tus datos de entrenamiento: desde Ajustes puedes borrar todos tus datos de entrenamiento y conservar tu cuenta.',

        'Eliminar tu cuenta: desde Ajustes puedes eliminar tu cuenta y todos los datos asociados. También puedes solicitarlo escribiendo al correo de contacto.',

        `Cuando eliminas datos o tu cuenta, los retiramos de inmediato de los sistemas activos y de las copias de seguridad en un máximo de ${BACKUP_DAYS} días. Los registros técnicos y de seguridad se conservan hasta ${LOG_DAYS} días. Solo conservamos registros por más tiempo cuando la ley lo exija (por ejemplo, registros de pagos) o para atender una disputa, y te informaremos cuáles.`,

        'Eliminar tu cuenta no cancela por sí solo un plan pagado a través de un tercero; cancela primero el plan si está activo.',

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

        'Los reclamos se responden en máximo 15 días hábiles; si no es posible, te informaremos el motivo y una nueva fecha, que no superará 8 días hábiles adicionales.',

        'Si tu reclamo está incompleto, te pediremos completarlo dentro de los 5 días siguientes a su recepción. Si no respondes en 2 meses, entenderemos que desististe del reclamo.',

        'Solo podrás acudir a la SIC (sic.gov.co) después de haber agotado este trámite con nosotros.',

      ]],

      ['Seguridad e incidentes', 'Protegemos tus datos con conexiones cifradas, controles de acceso, contraseñas guardadas únicamente como hash, copias de seguridad y actualizaciones periódicas de software, y revisamos periódicamente la seguridad del servicio. Ningún sistema es totalmente seguro. Si un incidente de seguridad afecta datos personales, lo reportaremos a la autoridad competente y avisaremos a las personas afectadas según lo exija la normativa aplicable.'],

      ['Cambios y vigencia', `Esta política rige desde el ${UPDATED_ES} (versión ${VERSION}) y durante el tiempo que se opere el servicio. Si un cambio afecta de forma material las finalidades o el tratamiento, te avisaremos en la app, te pediremos aceptar la nueva versión y solicitaremos una nueva autorización cuando la ley lo exija. Las versiones anteriores están disponibles si las solicitas.`],

      ['Idioma', 'Esta política se ofrece en español e inglés. Si hay diferencias, prevalece la versión en español.'],

    ],

  },

  collection: {

    en: [

      ['Collected when you register', 'Email and basic profile details provided by Google or entered for email sign-in, plus account identifiers. Passwords entered for email sign-in are stored only as a cryptographic hash, never in plain text. At sign-up we also record your acceptance of these documents (date and version) and, separately, your authorization for sensitive data. The start date of your free period is recorded when you create your account.'],

      ['Created by your use of gymbook', 'Training routines and logs, exercise selections, dates, sets, repetitions, weights, effort ratings, custom exercises, preferences and the name attached to your profile. Body-weight entries are optional and treated as sensitive data, processed only with your separate authorization.'],

      ['Plan and payment data', 'Free-period dates, plan status, billing period and payment confirmations. Payments are handled by the payment processor shown at checkout; gymbook does not receive or store your card number.'],

      ['Emails we send', 'We send account confirmation, password recovery, email-change confirmation and plan notices to the email address of your account. We do not send advertising emails.'],

      ['Collected by the device or service', 'Session and storage data on your device. IP address, browser/device details, request times and diagnostic or security logs may be processed by our hosting provider, the CDN that serves exercise images, our email provider and, if you enable them, push notification services. If you enable web push, a push endpoint and notification settings are stored to deliver alerts; you can turn them off at any time from your browser or device settings.'],

      ['Not collected', 'The app does not request precise GPS location, contact list, microphone, camera, advertising identifier or third-party analytics events. Exercise photos/GIFs are content requests to the CDN, not uploads of your workouts.'],

      ['Guest mode', 'Guest data stays in browser/device storage. It is not sent to the account sync API unless you later choose to create or link an account and transfer that data.'],

    ],

    es: [

      ['Al registrarte', 'Correo y datos básicos de perfil entregados por Google o escritos para iniciar con correo, además de identificadores de cuenta. Las contraseñas del inicio con correo se almacenan únicamente como hash criptográfico, nunca en texto plano. Al registrarte también guardamos constancia de tu aceptación de estos documentos (fecha y versión) y, por separado, de tu autorización para datos sensibles. La fecha de inicio de tu periodo gratuito se registra al crear tu cuenta.'],

      ['Generados por el uso de gymbook', 'Rutinas y entrenamientos, ejercicios elegidos, fechas, series, repeticiones, pesos, esfuerzo percibido, ejercicios personalizados, preferencias y el nombre asociado al perfil. Los registros de peso corporal son opcionales y se tratan como datos sensibles, solo con tu autorización separada.'],

      ['Datos de plan y de pago', 'Fechas del periodo gratuito, estado del plan, periodo de facturación y confirmaciones de pago. Los pagos los gestiona el procesador de pagos que se muestra al pagar; gymbook no recibe ni guarda el número de tu tarjeta.'],

      ['Correos que enviamos', 'Enviamos confirmación de cuenta, recuperación de contraseña, confirmación de cambio de correo y avisos del plan al correo de tu cuenta. No enviamos correos publicitarios.'],

      ['Procesados por el dispositivo o los servicios', 'Datos de sesión y almacenamiento en tu dispositivo. Dirección IP, detalles del navegador o dispositivo, horas de solicitud y registros de diagnóstico o seguridad pueden ser tratados por nuestro proveedor de alojamiento, por el CDN que sirve las imágenes de ejercicios, por nuestro proveedor de correo y, si los activas, por los servicios de notificaciones. Si activas notificaciones web, se almacena un endpoint de notificación y sus preferencias para entregar alertas; puedes desactivarlas en cualquier momento desde los ajustes de tu navegador o dispositivo.'],

      ['No recopilados', 'La app no solicita ubicación GPS precisa, contactos, micrófono, cámara, identificador publicitario ni eventos de analítica de terceros. Las imágenes y GIF de ejercicios son solicitudes de contenido al CDN, no cargas de tus entrenamientos.'],

      ['Modo invitado', 'Los datos de invitado permanecen en el almacenamiento del navegador o dispositivo. No se envían a la API de sincronización de cuentas salvo que después decidas crear o vincular una cuenta y transferirlos.'],

    ],

  },

  'third-parties': {

    en: [

      ['Hosting and server', hostLabel ? `${hostLabel} hosts gymbook’s server, API and database. It may process IP address, device/browser information, request paths, timestamps and errors in its logs.` : 'gymbook’s server, API and database run on infrastructure administered by the responsible person. Server logs may include IP address, device/browser information, request paths, timestamps and errors.'],

      ['Email delivery', `${mailEn[0].toUpperCase()}${mailEn.slice(1)} sends our confirmation, recovery and service emails. To do so it receives your email address and the content of the message, and may keep delivery logs under its own privacy notice.`],

      ['Payments', `${procEn[0].toUpperCase()}${procEn.slice(1)} processes the payments for plans and handles your payment data under its own terms and privacy notice. gymbook receives only the information needed to confirm that a payment was completed and to manage your plan; it does not receive your card number.`],

      ['Google', 'If you choose Google sign-in, Google receives your authorization request and returns basic identity details such as name and email, subject to the permissions shown on Google’s consent screen. Google acts as an independent controller for that service.'],

      ['jsDelivr and exercise media', 'Exercise images and GIFs are requested from jsDelivr’s CDN. A CDN request can reveal network and device metadata such as IP address, browser, referrer domain, requested asset and time.'],

      ['CDN network partners', 'jsDelivr lists Cloudflare, Fastly, Bunny and Gcore as providers in its multi-CDN delivery network. They may route or serve asset requests and process request metadata. The delivery route may vary.'],

      ['Browser/device push service', 'If you enable web push, your browser/device’s push provider routes notifications using the subscription endpoint. This varies by browser and device. Native workout reminders are scheduled locally on your device.'],

      ['International processing', `Google, jsDelivr and its CDN partners${hostedAbroad ? `, ${hostLabel},` : ''} and, depending on where they operate, our email and payment providers may process data outside Colombia, including the United States. See “International transfers and transmissions” in the Privacy policy.`],

    ],

    es: [

      ['Alojamiento y servidor', hostLabel ? `${hostLabel} aloja el servidor, la API y la base de datos de gymbook. Puede tratar en sus registros la dirección IP, datos de dispositivo/navegador, rutas solicitadas, fechas y errores.` : 'El servidor, la API y la base de datos de gymbook se ejecutan en infraestructura administrada por el responsable. Los registros del servidor pueden incluir IP, datos de dispositivo/navegador, rutas solicitadas, fechas y errores.'],

      ['Envío de correos', `${mailEs[0].toUpperCase()}${mailEs.slice(1)} envía nuestros correos de confirmación, recuperación y avisos del servicio. Para ello recibe tu correo y el contenido del mensaje, y puede conservar registros de entrega según su propio aviso de privacidad.`],

      ['Pagos', `${procEs[0].toUpperCase()}${procEs.slice(1)} procesa los pagos de los planes y trata tus datos de pago bajo sus propias condiciones y aviso de privacidad. gymbook recibe solo la información necesaria para confirmar que un pago se completó y gestionar tu plan; no recibe el número de tu tarjeta.`],

      ['Google', 'Si eliges iniciar con Google, Google recibe tu solicitud de acceso y entrega datos básicos de identidad, como nombre y correo, de acuerdo con los permisos que muestra su pantalla de autorización. Google actúa como responsable independiente de ese servicio.'],

      ['jsDelivr y contenido de ejercicios', 'Las imágenes y GIF de ejercicios se solicitan al CDN de jsDelivr. Una solicitud al CDN puede revelar metadatos de red y dispositivo como IP, navegador, dominio de referencia, archivo solicitado y hora.'],

      ['Socios de la red CDN', 'jsDelivr identifica a Cloudflare, Fastly, Bunny y Gcore como proveedores de su red de distribución multi-CDN. Pueden enrutar o servir solicitudes de archivos y tratar metadatos de esas solicitudes. La ruta de entrega puede variar.'],

      ['Servicio de notificaciones del navegador/dispositivo', 'Si activas notificaciones web, el proveedor de notificaciones de tu navegador o dispositivo las entrega usando el endpoint de suscripción. Varía según el navegador y dispositivo. Los recordatorios nativos de entrenamiento se programan localmente en tu dispositivo.'],

      ['Tratamiento internacional', `Google, jsDelivr y sus socios de CDN${hostedAbroad ? `, ${hostLabel},` : ''} y, según dónde operen, nuestros proveedores de correo y de pagos pueden tratar datos fuera de Colombia, incluido Estados Unidos. Consulta “Transferencias y transmisiones internacionales” en la Política de privacidad.`],

    ],

  },

  terms: {

    en: [

      ['Who may use gymbook', 'You must be at least 18 years old and able to enter into a binding agreement. When you create an account, you expressly accept these terms and the Privacy policy in their current versions, and we record the version and date. This acceptance does not replace separate authorizations required by law. If you do not agree, do not create an account or use the service. If we learn that a minor has an account, we will delete it.'],

      ['Accounts and user content', 'Keep your sign-in credentials secure and provide accurate information. You can change your email address and delete your data or account from Settings. You are responsible for the routines, logs, notes, imports and other content you enter, and for keeping your own export/backup. Do not upload another person’s personal or medical information without permission. You keep ownership of your content and grant us only the permission needed to store and sync it to provide the service.'],

      ['Fitness use only; no medical advice', 'gymbook is a workout logging and planning tool, not a medical service. Estimates and progress summaries are informational and may be inaccurate. You choose your exercises and loads, and the information does not replace the advice of a professional. Stop if you feel pain or unwell and consult a qualified health professional before exercising if you have a condition or concern. See the Fitness and health notice.'],

      ['Free period and paid plans', `New accounts have a free period of ${TRIAL_DAYS} days from account creation, with no charge. When it ends, access to account features requires an active plan. Your data is not deleted because the free period ends: you can activate a plan, or delete your data or account whenever you want. Plans are paid through the payment methods shown in the app, and before you confirm any purchase we show the total price, currency, taxes, billing period, renewal terms and cancellation method.${priceEn} See Subscription terms.`],

      ['Availability and changes', 'We may maintain, update, suspend or discontinue features for operational, security or legal reasons. We will make reasonable efforts to notify users of material changes to these terms, and of price changes before they apply to you. If we discontinue the service, we will give reasonable notice and a reasonable opportunity to export or retrieve your data where feasible.'],

      ['Liability', 'We provide the service with reasonable care but do not guarantee that it will be uninterrupted or error-free. To the extent permitted by law, we are not liable for indirect damages. Nothing in these terms excludes or limits liability that cannot be excluded by law, such as liability for intent or gross negligence or for damage to a person’s life or physical integrity, nor your mandatory rights as a consumer under Law 1480 of 2011, including legal warranty and, where applicable, the right of withdrawal for distance purchases.'],

      ['Software and third-party content', 'gymbook’s source code and exercise media may be subject to different licenses. These terms do not revoke rights granted under the AGPL-3.0-or-later license or the dataset’s separate terms. See the LICENSE and NOTICE files distributed with the source. Install the Android app (APK) only from the official channels we indicate.'],

      ['Governing law, language and contact', `These terms are governed by Colombian law, subject to mandatory consumer protections that apply where you live. If the English and Spanish versions differ, the Spanish version prevails. Contact ${CONTACT} with questions or complaints. For consumer complaints you may also go to the Superintendencia de Industria y Comercio (SIC). Version ${VERSION}, effective ${UPDATED_EN}.`],

    ],

    es: [

      ['Quién puede usar gymbook', 'Debes tener al menos 18 años y capacidad para celebrar un acuerdo vinculante. Al crear una cuenta aceptas expresamente estos términos y la Política de privacidad en su versión vigente, y guardamos la versión y la fecha. Esta aceptación no sustituye autorizaciones separadas que exija la ley. Si no estás de acuerdo, no crees una cuenta ni uses el servicio. Si detectamos que un menor tiene una cuenta, la eliminaremos.'],

      ['Cuentas y contenido', 'Protege tus credenciales y entrega información correcta. Puedes cambiar tu correo y eliminar tus datos o tu cuenta desde Ajustes. Eres responsable de las rutinas, registros, notas, importaciones y contenido que agregues, así como de conservar tus propias copias. No cargues información personal o médica de otra persona sin autorización. Conservas la titularidad de tu contenido y nos otorgas solo el permiso necesario para almacenarlo y sincronizarlo para prestar el servicio.'],

      ['Solo para ejercicio; no es asesoría médica', 'gymbook sirve para planificar y registrar entrenamientos, no es un servicio médico. Las estimaciones y resúmenes de progreso son informativos y pueden ser inexactos. Tú eliges ejercicios y cargas, y la información no sustituye el consejo de un profesional. Detente si sientes dolor o malestar y consulta a un profesional de salud antes de entrenar si tienes una condición o inquietud. Consulta el Aviso de ejercicio y salud.'],

      ['Periodo gratuito y planes de pago', `Las cuentas nuevas tienen un periodo gratuito de ${TRIAL_DAYS} días desde la creación de la cuenta, sin costo. Al terminar, el acceso a las funciones de la cuenta requiere un plan activo. Tus datos no se eliminan porque termine el periodo gratuito: puedes activar un plan, o eliminar tus datos o tu cuenta cuando quieras. Los planes se pagan con los medios de pago que muestra la app y, antes de que confirmes cualquier compra, mostramos el precio total, moneda, impuestos, periodo de facturación, condiciones de renovación y método de cancelación.${priceEs} Consulta Condiciones de suscripción.`],

      ['Disponibilidad y cambios', 'Podemos mantener, actualizar, suspender o retirar funciones por motivos operativos, de seguridad o legales. Haremos esfuerzos razonables para avisar cambios importantes de estos términos y los cambios de precio antes de que te apliquen. Si cerramos el servicio, daremos un aviso razonable y, cuando sea viable, una oportunidad razonable para exportar o recuperar tus datos.'],

      ['Responsabilidad', 'Prestamos el servicio con diligencia razonable, pero no garantizamos que sea ininterrumpido o libre de errores. En la medida permitida por la ley, no respondemos por daños indirectos. Nada en estos términos excluye ni limita la responsabilidad que no pueda excluirse por ley, como la derivada de dolo o culpa grave o de daños a la vida o la integridad física de una persona, ni tus derechos imperativos como consumidor bajo la Ley 1480 de 2011, incluida la garantía legal y, cuando aplique, el derecho de retracto en compras a distancia.'],

      ['Software y contenido de terceros', 'El código fuente de gymbook y los medios de ejercicios pueden tener licencias diferentes. Estos términos no revocan derechos concedidos por la licencia AGPL-3.0-or-later ni las condiciones separadas del conjunto de datos. Consulta los archivos LICENSE y NOTICE distribuidos con el código. Instala la app Android (APK) solo desde los canales oficiales que indicamos.'],

      ['Ley aplicable, idioma y contacto', `Estos términos se rigen por la ley colombiana, sin perjuicio de las protecciones obligatorias para consumidores del lugar donde vivas. Si hay diferencias entre las versiones en español e inglés, prevalece la española. Escríbenos a ${CONTACT} para preguntas o reclamaciones. Para reclamaciones de consumo también puedes acudir a la Superintendencia de Industria y Comercio (SIC). Versión ${VERSION}, vigente desde el ${UPDATED_ES}.`],

    ],

  },

  subscription: {

    en: [

      ['Free period', `Every new account has a free period of ${TRIAL_DAYS} days, counted from account creation, with no charge. When it ends, access to account features requires an active plan. Your data is kept: you can activate a plan, or delete your data or account at any time from Settings.`],

      ['Plan, price and payment', [

        `Before you confirm a purchase, the app shows the total price, currency, taxes, billing period, renewal terms and cancellation method.${priceEn}`,

        `Payments are processed by ${procEn}, under its own terms. gymbook does not receive or store your card number; it only receives the confirmation that a payment was completed and your plan status.`,

        'We will notify you before any price change applies to you, and you can cancel before it takes effect.',

      ]],

      ['Renewal and cancellation', [

        renewEn,

        'If you stop paying, you keep your data and can reactivate a plan later. Uninstalling the app does not cancel a plan.',

      ]],

      ['Refunds and right of withdrawal', [

        'Under Law 1480 of 2011, for distance purchases you may have a right of withdrawal of 5 business days, subject to the exceptions in the law. If it applies to your purchase, write to us and we will return the amount through the same payment method.',

        'For payment errors, duplicate charges or unauthorized charges, write to us at the contact email with the payment details and we will review the case with the payment processor.',

        'Your mandatory consumer rights, including legal warranty, remain unaffected.',

      ]],

      ['Contact', `For questions about your plan or payments, write to ${CONTACT}. For consumer complaints you may also go to the Superintendencia de Industria y Comercio (SIC).`],

    ],

    es: [

      ['Periodo gratuito', `Toda cuenta nueva tiene un periodo gratuito de ${TRIAL_DAYS} días, contados desde la creación de la cuenta, sin costo. Al terminar, el acceso a las funciones de la cuenta requiere un plan activo. Tus datos se conservan: puedes activar un plan, o eliminar tus datos o tu cuenta en cualquier momento desde Ajustes.`],

      ['Plan, precio y pago', [

        `Antes de que confirmes una compra, la app muestra el precio total, la moneda, los impuestos, el periodo de facturación, las condiciones de renovación y el método de cancelación.${priceEs}`,

        `Los pagos los procesa ${procEs}, bajo sus propias condiciones. gymbook no recibe ni guarda el número de tu tarjeta; solo recibe la confirmación de que un pago se completó y el estado de tu plan.`,

        'Te avisaremos antes de que cualquier cambio de precio te aplique, y podrás cancelar antes de que entre en vigor.',

      ]],

      ['Renovación y cancelación', [

        renewEs,

        'Si dejas de pagar, conservas tus datos y puedes reactivar un plan más adelante. Desinstalar la app no cancela un plan.',

      ]],

      ['Reembolsos y derecho de retracto', [

        'Según la Ley 1480 de 2011, en compras a distancia puedes tener derecho de retracto de 5 días hábiles, sujeto a las excepciones de la ley. Si aplica a tu compra, escríbenos y devolveremos el valor por el mismo medio de pago.',

        'Si hay errores de pago, cobros duplicados o cobros no autorizados, escríbenos al correo de contacto con los datos del pago y revisaremos el caso con el procesador de pagos.',

        'Se respetan tus derechos imperativos como consumidor, incluida la garantía legal.',

      ]],

      ['Contacto', `Para preguntas sobre tu plan o tus pagos, escribe a ${CONTACT}. Para reclamaciones de consumo también puedes acudir a la Superintendencia de Industria y Comercio (SIC).`],

    ],

  },

  fitness: {

    en: [

      ['Not medical advice', 'gymbook is not a healthcare provider and does not diagnose, treat, prevent or monitor illness or injury. Exercise logs, suggested routines, estimated one-rep max, trends and other calculations are general information only.'],

      ['Use your judgment', 'Exercise carries risk. Choose loads and movements appropriate to your ability and surroundings, use equipment safely, and stop if you experience pain, dizziness, shortness of breath or other concerning symptoms. Ask a qualified healthcare professional before beginning or changing exercise if you are pregnant, injured, have a health condition, or are unsure whether an activity is safe for you.'],

      ['Personal data', 'Body-weight entries are sensitive data because they can reveal aspects of your physical condition, and workout logs may do so as well. Enter only information you are comfortable storing in your account or on your device. Do not use gymbook for emergency care or clinical monitoring.'],

    ],

    es: [

      ['No es asesoría médica', 'gymbook no es un proveedor de salud y no diagnostica, trata, previene ni monitorea enfermedades o lesiones. Los registros, rutinas sugeridas, estimaciones de repetición máxima, tendencias y cálculos son información general.'],

      ['Usa tu criterio', 'El ejercicio implica riesgos. Elige cargas y movimientos acordes con tu capacidad y entorno, utiliza el equipo de forma segura y detente si sientes dolor, mareo, falta de aire u otro síntoma preocupante. Consulta a un profesional de salud antes de empezar o cambiar tu ejercicio si estás embarazada, lesionado, tienes una condición de salud o dudas sobre la seguridad de una actividad.'],

      ['Datos personales', 'Los registros de peso corporal son datos sensibles porque pueden revelar aspectos de tu condición física, y los registros de entrenamiento también pueden hacerlo. Ingresa únicamente información que estés dispuesto a guardar en tu cuenta o dispositivo. No uses gymbook para emergencias ni monitoreo clínico.'],

    ],

  },

}



function LegalText({ id }) {

  const lang = getLang() === 'es' ? 'es' : 'en'

  const sections = COPY[id]?.[lang] || []

  return <div className="legal-copy">

    {sections.map(([heading, text]) => <section key={heading}>

      <h3>{heading}</h3>

      {Array.isArray(text)

        ? <ul className="legal-list" style={{ paddingLeft: 20, margin: '6px 0' }}>{text.map(item => <li key={item}>{item}</li>)}</ul>

        : <p>{text}</p>}

    </section>)}

    {id === 'third-parties' && <p className="small dim">{lang === 'es' ? 'Avisos de privacidad: ' : 'Privacy notices: '}<a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google</a> · <a href="https://www.jsdelivr.com/terms/privacy-policy" target="_blank" rel="noreferrer">jsDelivr</a></p>}

    {id === 'privacy' && <p className="small dim">{lang === 'es' ? 'Autoridad colombiana de protección de datos: ' : 'Colombian data protection authority: '}<a href="https://www.sic.gov.co/" target="_blank" rel="noreferrer">Superintendencia de Industria y Comercio (SIC)</a></p>}

    <p className="small dim">{lang === 'es' ? `Responsable: ${OWNER} · ${ADDRESS} · ${CONTACT} · Versión ${VERSION} · Actualizado: ${UPDATED_ES}.` : `Responsible person: ${OWNER} · ${ADDRESS} · ${CONTACT} · Version ${VERSION} · Updated: ${UPDATED_EN}.`}</p>

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

      <p className="legal-updated">{lang === 'es' ? `Vigente desde el ${UPDATED_ES} · Versión ${VERSION}` : `Effective ${UPDATED_EN} · Version ${VERSION}`}</p>

      <LegalText id={selected.id} />

    </> : <>

      <p className="muted small legal-intro">{lang === 'es' ? 'Información sobre privacidad, datos, proveedores externos y condiciones de uso de gymbook.' : 'Information about privacy, data, third-party providers and the terms for using gymbook.'}</p>

      <div className="sect-b">

        {DOCS.map(item => <Row key={item.id} icon={item.icon} title={lang === 'es' ? item.es : item.title} accessory="chevron" onClick={() => navigate(`/legal/${item.id}`, { state: { from } })} />)}

      </div>

    </>}

  </main>

}
