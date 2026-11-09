// Tiny dependency-free i18n. English source strings are the keys; locale files in
// src/locales/ map them to translations and are lazy-loaded (Vite code-splits each
// import.meta.glob entry), so the initial bundle stays English-only.
// Exercise instructions come from separately generated packs in src/instr/ (one per
// language, from the upstream dataset) — also lazy-loaded on language switch.
import { useSyncExternalStore } from 'react'
import uiAdditions, { chromeTranslations, dynamicContentTranslations, guidedFlowTranslations, widgetTranslations, notificationTranslations } from '../locales/ui-additions.js'

// UI languages. de/pt have no instruction pack upstream — instructions fall back to English.
export const LANGS = {
  en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
  pt: 'Português', pl: 'Polski', tr: 'Türkçe', ru: 'Русский', zh: '中文',
  ko: '한국어', hi: 'हिन्दी'
}
export const INSTR_LANGS = ['en', 'es', 'fr', 'it', 'tr', 'ru', 'zh', 'hi', 'pl', 'ko']
const DATE_LOCALES = {
  en: 'en-GB', de: 'de-DE', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', pt: 'pt-PT',
  pl: 'pl-PL', tr: 'tr-TR', ru: 'ru-RU', zh: 'zh-CN', ko: 'ko-KR', hi: 'hi-IN'
}

const paywallTranslations = {
  de: {
    'Train with purpose.': 'Trainiere mit einem klaren Ziel.', 'Your routines, every set and your progress, all in one place.': 'Deine Trainingspläne, jede Serie und dein Fortschritt – alles an einem Ort.',
    'Organized routines for every session.': 'Organisierte Trainingspläne für jede Einheit.', 'Log weight, reps, RPE, RIR and rest times.': 'Erfasse Gewicht, Wiederholungen, RPE, RIR und Pausen.', 'Review your history and track your progress.': 'Sieh dir deinen Verlauf an und verfolge deinen Fortschritt.',
    'Annual plan': 'Jahresabo', 'Monthly plan': 'Monatsabo', 'Just {0}/mo': 'Nur {0}/Monat', 'No commitment': 'Keine Bindung', 'SAVE {0}%': 'SPARE {0}%', '/yr': '/Jahr', '/mo': '/Monat', 'Already subscribed?': 'Bereits abonniert?', 'Choose your plan': 'Wähle deinen Tarif', 'Try again': 'Erneut versuchen',
    'We could not verify your subscription. Check your connection, then try again.': 'Dein Abonnement konnte nicht überprüft werden. Prüfe deine Verbindung und versuche es erneut.'
  },
  es: {
    'Train with purpose.': 'Entrena con propósito.', 'Your routines, every set and your progress, all in one place.': 'Tus rutinas, cada serie y tu progreso, en un solo lugar.',
    'Organized routines for every session.': 'Organiza tus rutinas para cada sesión.', 'Log weight, reps, RPE, RIR and rest times.': 'Registra peso, repeticiones, RPE, RIR y descansos.', 'Review your history and track your progress.': 'Revisa tu historial y sigue tu progreso.',
    'Annual plan': 'Plan anual', 'Monthly plan': 'Plan mensual', 'Just {0}/mo': 'Solo {0}/mes', 'No commitment': 'Sin permanencia', 'SAVE {0}%': 'AHORRA {0}%', '/yr': '/año', '/mo': '/mes', 'Already subscribed?': '¿Ya tienes una suscripción?', 'Choose your plan': 'Elige tu plan', 'Try again': 'Volver a intentar',
    'We could not verify your subscription. Check your connection, then try again.': 'No pudimos verificar tu suscripción. Comprueba tu conexión e inténtalo de nuevo.'
  },
  fr: {
    'Train with purpose.': 'Entraînez-vous avec un objectif.', 'Your routines, every set and your progress, all in one place.': 'Vos programmes, chaque série et vos progrès, réunis au même endroit.',
    'Organized routines for every session.': 'Des programmes organisés pour chaque séance.', 'Log weight, reps, RPE, RIR and rest times.': 'Notez les poids, répétitions, RPE, RIR et temps de repos.', 'Review your history and track your progress.': 'Consultez votre historique et suivez vos progrès.',
    'Annual plan': 'Offre annuelle', 'Monthly plan': 'Offre mensuelle', 'Just {0}/mo': 'Seulement {0}/mois', 'No commitment': 'Sans engagement', 'SAVE {0}%': 'ÉCONOMISEZ {0} %', '/yr': '/an', '/mo': '/mois', 'Already subscribed?': 'Déjà abonné ?', 'Choose your plan': 'Choisissez une offre', 'Try again': 'Réessayer',
    'We could not verify your subscription. Check your connection, then try again.': 'Impossible de vérifier votre abonnement. Vérifiez votre connexion et réessayez.'
  },
  it: {
    'Train with purpose.': 'Allenati con uno scopo.', 'Your routines, every set and your progress, all in one place.': 'Le tue routine, ogni serie e i tuoi progressi, tutto in un unico posto.',
    'Organized routines for every session.': 'Routine organizzate per ogni sessione.', 'Log weight, reps, RPE, RIR and rest times.': 'Registra pesi, ripetizioni, RPE, RIR e tempi di recupero.', 'Review your history and track your progress.': 'Consulta lo storico e segui i tuoi progressi.',
    'Annual plan': 'Piano annuale', 'Monthly plan': 'Piano mensile', 'Just {0}/mo': 'Solo {0}/mese', 'No commitment': 'Senza vincoli', 'SAVE {0}%': 'RISPARMIA {0}%', '/yr': '/anno', '/mo': '/mese', 'Already subscribed?': 'Hai già un abbonamento?', 'Choose your plan': 'Scegli il tuo piano', 'Try again': 'Riprova',
    'We could not verify your subscription. Check your connection, then try again.': 'Impossibile verificare l’abbonamento. Controlla la connessione e riprova.'
  },
  pt: {
    'Train with purpose.': 'Treine com propósito.', 'Your routines, every set and your progress, all in one place.': 'Suas rotinas, cada série e seu progresso, tudo em um só lugar.',
    'Organized routines for every session.': 'Rotinas organizadas para cada treino.', 'Log weight, reps, RPE, RIR and rest times.': 'Registre peso, repetições, RPE, RIR e tempos de descanso.', 'Review your history and track your progress.': 'Consulte seu histórico e acompanhe seu progresso.',
    'Annual plan': 'Plano anual', 'Monthly plan': 'Plano mensal', 'Just {0}/mo': 'Apenas {0}/mês', 'No commitment': 'Sem compromisso', 'SAVE {0}%': 'ECONOMIZE {0}%', '/yr': '/ano', '/mo': '/mês', 'Already subscribed?': 'Já tem uma assinatura?', 'Choose your plan': 'Escolha seu plano', 'Try again': 'Tentar novamente',
    'We could not verify your subscription. Check your connection, then try again.': 'Não foi possível verificar sua assinatura. Confira sua conexão e tente novamente.'
  },
  pl: {
    'Train with purpose.': 'Trenuj z celem.', 'Your routines, every set and your progress, all in one place.': 'Twoje plany, każda seria i postępy w jednym miejscu.',
    'Organized routines for every session.': 'Uporządkowane plany na każdy trening.', 'Log weight, reps, RPE, RIR and rest times.': 'Zapisuj ciężar, powtórzenia, RPE, RIR i przerwy.', 'Review your history and track your progress.': 'Przeglądaj historię i śledź swoje postępy.',
    'Annual plan': 'Plan roczny', 'Monthly plan': 'Plan miesięczny', 'Just {0}/mo': 'Tylko {0}/mies.', 'No commitment': 'Bez zobowiązań', 'SAVE {0}%': 'OSZCZĘDZASZ {0}%', '/yr': '/rok', '/mo': '/mies.', 'Already subscribed?': 'Masz już subskrypcję?', 'Choose your plan': 'Wybierz plan', 'Try again': 'Spróbuj ponownie',
    'We could not verify your subscription. Check your connection, then try again.': 'Nie udało się zweryfikować subskrypcji. Sprawdź połączenie i spróbuj ponownie.'
  },
  tr: {
    'Train with purpose.': 'Amacına uygun antrenman yap.', 'Your routines, every set and your progress, all in one place.': 'Antrenman planların, her setin ve ilerlemen tek yerde.',
    'Organized routines for every session.': 'Her antrenman için düzenli planlar.', 'Log weight, reps, RPE, RIR and rest times.': 'Ağırlık, tekrar, RPE, RIR ve dinlenme sürelerini kaydet.', 'Review your history and track your progress.': 'Geçmişini incele ve gelişimini takip et.',
    'Annual plan': 'Yıllık plan', 'Monthly plan': 'Aylık plan', 'Just {0}/mo': 'Ayda yalnızca {0}', 'No commitment': 'Taahhüt yok', 'SAVE {0}%': '%{0} TASARRUF', '/yr': '/yıl', '/mo': '/ay', 'Already subscribed?': 'Zaten abone misin?', 'Choose your plan': 'Planını seç', 'Try again': 'Tekrar dene',
    'We could not verify your subscription. Check your connection, then try again.': 'Aboneliğini doğrulayamadık. Bağlantını kontrol edip tekrar dene.'
  },
  ru: {
    'Train with purpose.': 'Тренируйтесь с целью.', 'Your routines, every set and your progress, all in one place.': 'Ваши планы, каждый подход и прогресс — в одном месте.',
    'Organized routines for every session.': 'План тренировок для каждого занятия.', 'Log weight, reps, RPE, RIR and rest times.': 'Записывайте вес, повторы, RPE, RIR и время отдыха.', 'Review your history and track your progress.': 'Просматривайте историю и следите за прогрессом.',
    'Annual plan': 'Годовой план', 'Monthly plan': 'Помесячный план', 'Just {0}/mo': 'Всего {0} в месяц', 'No commitment': 'Без обязательств', 'SAVE {0}%': 'ЭКОНОМИЯ {0}%', '/yr': '/год', '/mo': '/мес.', 'Already subscribed?': 'Уже подписаны?', 'Choose your plan': 'Выберите план', 'Try again': 'Повторить',
    'We could not verify your subscription. Check your connection, then try again.': 'Не удалось проверить подписку. Проверьте подключение и попробуйте снова.'
  },
  zh: {
    'Train with purpose.': '有目标地训练。', 'Your routines, every set and your progress, all in one place.': '训练计划、每组记录和进度，一处尽览。',
    'Organized routines for every session.': '为每次训练整理训练计划。', 'Log weight, reps, RPE, RIR and rest times.': '记录重量、次数、RPE、RIR 和休息时间。', 'Review your history and track your progress.': '查看训练记录并追踪进步。',
    'Annual plan': '年度计划', 'Monthly plan': '月度计划', 'Just {0}/mo': '每月仅 {0}', 'No commitment': '无长期承诺', 'SAVE {0}%': '立省 {0}%', '/yr': '/年', '/mo': '/月', 'Already subscribed?': '已经订阅？', 'Choose your plan': '选择套餐', 'Try again': '重试',
    'We could not verify your subscription. Check your connection, then try again.': '无法验证订阅。请检查网络连接后重试。'
  },
  ko: {
    'Train with purpose.': '목표를 가지고 훈련하세요.', 'Your routines, every set and your progress, all in one place.': '운동 계획, 모든 세트와 진행 상황을 한곳에서 확인하세요.',
    'Organized routines for every session.': '매 세션을 위한 체계적인 운동 계획.', 'Log weight, reps, RPE, RIR and rest times.': '무게, 횟수, RPE, RIR 및 휴식 시간을 기록하세요.', 'Review your history and track your progress.': '기록을 확인하고 진행 상황을 추적하세요.',
    'Annual plan': '연간 요금제', 'Monthly plan': '월간 요금제', 'Just {0}/mo': '월 {0}만', 'No commitment': '약정 없음', 'SAVE {0}%': '{0}% 절약', '/yr': '/년', '/mo': '/월', 'Already subscribed?': '이미 구독 중인가요?', 'Choose your plan': '요금제를 선택하세요', 'Try again': '다시 시도',
    'We could not verify your subscription. Check your connection, then try again.': '구독을 확인할 수 없습니다. 연결을 확인한 뒤 다시 시도하세요.'
  },
  hi: {
    'Train with purpose.': 'उद्देश्य के साथ प्रशिक्षण करें।', 'Your routines, every set and your progress, all in one place.': 'आपकी दिनचर्या, हर सेट और आपकी प्रगति — सब एक ही जगह।',
    'Organized routines for every session.': 'हर सत्र के लिए व्यवस्थित दिनचर्या।', 'Log weight, reps, RPE, RIR and rest times.': 'वज़न, रेप्स, RPE, RIR और आराम का समय दर्ज करें।', 'Review your history and track your progress.': 'अपना इतिहास देखें और प्रगति ट्रैक करें।',
    'Annual plan': 'वार्षिक योजना', 'Monthly plan': 'मासिक योजना', 'Just {0}/mo': 'सिर्फ़ {0}/माह', 'No commitment': 'कोई प्रतिबद्धता नहीं', 'SAVE {0}%': '{0}% की बचत', '/yr': '/वर्ष', '/mo': '/माह', 'Already subscribed?': 'पहले से सदस्यता है?', 'Choose your plan': 'अपनी योजना चुनें', 'Try again': 'फिर से प्रयास करें',
    'We could not verify your subscription. Check your connection, then try again.': 'आपकी सदस्यता सत्यापित नहीं हो सकी। कनेक्शन जाँचकर फिर प्रयास करें।'
  },
}

const localePacks = import.meta.glob('../locales/*.js')
const localeCompletionPacks = import.meta.glob('../locales/completion/*.js')
const subscriptionTranslations = {
  de: {
    'Check your subscription': 'Prüfe dein Abonnement', 'Keep your training going.': 'Setze dein Training fort.',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': 'Dein Abonnement oder kostenloser Zugang konnte nicht überprüft werden. Stelle die Verbindung wieder her und versuche es erneut.',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': 'Dein Abonnement ist abgelaufen. Wähle einen Tarif, um Gym Book Training weiter zu nutzen. Deine Trainings bleiben auf diesem Telefon gespeichert.',
    'Checking your access…': 'Zugang wird überprüft…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} im ersten Jahr, danach {1} pro Jahr. Automatische Verlängerung bis zur Kündigung. Kündige unter Google Play-Abos; der Zugriff bleibt bis zum Ende des bezahlten Zeitraums bestehen.',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} pro Jahr, automatische Verlängerung bis zur Kündigung. Kündige unter Google Play-Abos; der Zugriff bleibt bis zum Ende des bezahlten Zeitraums bestehen.',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} pro Monat, automatische Verlängerung bis zur Kündigung. Kündige unter Google Play-Abos; der Zugriff bleibt bis zum Ende des bezahlten Zeitraums bestehen.',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · automatische Verlängerung bis zur Kündigung. Kündige unter Google Play-Abos; der Zugriff bleibt bis zum Ende des bezahlten Zeitraums bestehen.',
    'Opening Google Play…': 'Google Play wird geöffnet…', 'Subscribe · {0}': 'Abonnieren · {0}', 'Subscription plans are not available yet. Please try again later.': 'Abonnementtarife sind noch nicht verfügbar. Bitte versuche es später erneut.',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': 'Abonnements verlängern sich automatisch, bis sie gekündigt werden. Verwalte oder kündige sie unter Google Play → Zahlungen & Abos → Abos. Die Kündigung verhindert die nächste Verlängerung; der Zugriff bleibt bis zum Ende des bezahlten Zeitraums bestehen. Durch das Entfernen der App wird das Abonnement nicht gekündigt.',
    'Checking purchases…': 'Käufe werden überprüft…', 'Restore purchases': 'Käufe wiederherstellen', 'Manage subscription': 'Abonnement verwalten', 'Check again': 'Erneut prüfen', 'Sign out': 'Abmelden'
  },
  es: {
    'Check your subscription': 'Verifica tu suscripción', 'Keep your training going.': 'Continúa con tu entrenamiento.',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': 'No pudimos verificar tu suscripción ni tu acceso gratuito. Conéctate e inténtalo de nuevo.',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': 'Tu suscripción terminó. Elige un plan para seguir usando Gym Book Training. Tus entrenamientos permanecen guardados en este teléfono.',
    'Checking your access…': 'Verificando tu acceso…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} el primer año y luego {1} al año. Se renueva automáticamente hasta que canceles. Cancela en Suscripciones de Google Play; tendrás acceso hasta que termine el periodo pagado.',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} al año, con renovación automática hasta que canceles. Cancela en Suscripciones de Google Play; tendrás acceso hasta que termine el periodo pagado.',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} al mes, con renovación automática hasta que canceles. Cancela en Suscripciones de Google Play; tendrás acceso hasta que termine el periodo pagado.',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · renovación automática hasta que canceles. Cancela en Suscripciones de Google Play; tendrás acceso hasta que termine el periodo pagado.',
    'Opening Google Play…': 'Abriendo Google Play…', 'Subscribe · {0}': 'Suscribirme · {0}', 'Subscription plans are not available yet. Please try again later.': 'Los planes de suscripción aún no están disponibles. Inténtalo más tarde.',
    'Google Play Billing is unavailable on this device. Sign in to the Play Store with a licensed tester account and install the app from a Google Play test track.': 'Google Play Billing no está disponible en este emulador. Inicia sesión en Play Store con una cuenta de prueba autorizada e instala la app desde una prueba de Google Play.',
    'This account has a complimentary payment exemption. No Google Play subscription is linked to that exemption.': 'Esta cuenta tiene una exención de pago. Esa exención no está vinculada a una suscripción de Google Play.',
    'Your 30-day free period is active. {0} remain; it ends on {1}. There is no Google Play subscription to manage yet. Open Subscription plans to review the available plans.': 'Tu periodo gratuito de 30 días sigue activo. Te quedan {0}; termina el {1}. Todavía no hay una suscripción de Google Play que gestionar. Abre Planes de suscripción para consultar las opciones.',
    'There is no active paid subscription on this account. If you purchased through Google Play, use the Google account that made the purchase and restore purchases.': 'Esta cuenta no tiene una suscripción de pago activa. Si compraste mediante Google Play, usa la cuenta de Google con la que hiciste la compra y restaura las compras.',
    'Your 30-day free access ends on {0}. Saving a plan does not start a purchase. Confirm it in Google Play after that date.': 'Tus 30 días de acceso gratis terminan el {0}. Guardar un plan no inicia la compra. Confírmala en Google Play después de esa fecha.',
    'Plan saved. Google Play will ask you to confirm the purchase after your free access ends.': 'Plan guardado. Google Play te pedirá confirmar la compra cuando termine tu acceso gratis.',
    'Could not verify your free access period.': 'No se pudo verificar el periodo de acceso gratis.', 'Could not save your plan choice.': 'No se pudo guardar el plan elegido.',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': 'Las suscripciones se renuevan automáticamente hasta que las canceles. Adminístralas o cancélalas en Google Play → Pagos y suscripciones → Suscripciones. Al cancelar, se detiene la próxima renovación y conservas el acceso hasta que termine el periodo pagado. Desinstalar la app no cancela la suscripción.',
    'Checking purchases…': 'Verificando compras…', 'Restore purchases': 'Restaurar compras', 'Manage subscription': 'Gestionar suscripción', 'Check again': 'Volver a comprobar', 'Sign out': 'Cerrar sesión'
  },
  fr: {
    'Check your subscription': 'Vérifiez votre abonnement', 'Keep your training going.': 'Poursuivez votre entraînement.',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': 'Impossible de vérifier votre abonnement ou votre accès gratuit. Reconnectez-vous et réessayez.',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': 'Votre abonnement a expiré. Choisissez une offre pour continuer à utiliser Gym Book Training. Vos entraînements restent enregistrés sur ce téléphone.',
    'Checking your access…': 'Vérification de votre accès…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} la première année, puis {1} par an. Renouvellement automatique jusqu’à résiliation. Résiliez dans les abonnements Google Play ; l’accès reste actif jusqu’à la fin de la période payée.',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} par an, renouvellement automatique jusqu’à résiliation. Résiliez dans les abonnements Google Play ; l’accès reste actif jusqu’à la fin de la période payée.',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} par mois, renouvellement automatique jusqu’à résiliation. Résiliez dans les abonnements Google Play ; l’accès reste actif jusqu’à la fin de la période payée.',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · renouvellement automatique jusqu’à résiliation. Résiliez dans les abonnements Google Play ; l’accès reste actif jusqu’à la fin de la période payée.',
    'Opening Google Play…': 'Ouverture de Google Play…', 'Subscribe · {0}': 'S’abonner · {0}', 'Subscription plans are not available yet. Please try again later.': 'Les offres d’abonnement ne sont pas encore disponibles. Réessayez plus tard.',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': 'Les abonnements se renouvellent automatiquement jusqu’à résiliation. Gérez-les ou résiliez-les dans Google Play → Paiements et abonnements → Abonnements. La résiliation arrête le prochain renouvellement ; l’accès reste actif jusqu’à la fin de la période payée. La suppression de l’application ne résilie pas l’abonnement.',
    'Checking purchases…': 'Vérification des achats…', 'Restore purchases': 'Restaurer les achats', 'Manage subscription': 'Gérer l’abonnement', 'Check again': 'Réessayer', 'Sign out': 'Se déconnecter'
  },
  it: {
    'Check your subscription': 'Verifica il tuo abbonamento', 'Keep your training going.': 'Continua ad allenarti.',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': 'Non è stato possibile verificare l’abbonamento o l’accesso gratuito. Riconnettiti e riprova.',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': 'L’abbonamento è terminato. Scegli un piano per continuare a usare Gym Book Training. Gli allenamenti restano salvati su questo telefono.',
    'Checking your access…': 'Verifica dell’accesso…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} per il primo anno, poi {1} all’anno. Rinnovo automatico fino alla disdetta. Disdici in Abbonamenti Google Play; l’accesso continua fino alla fine del periodo pagato.',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} all’anno, con rinnovo automatico fino alla disdetta. Disdici in Abbonamenti Google Play; l’accesso continua fino alla fine del periodo pagato.',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} al mese, con rinnovo automatico fino alla disdetta. Disdici in Abbonamenti Google Play; l’accesso continua fino alla fine del periodo pagato.',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · rinnovo automatico fino alla disdetta. Disdici in Abbonamenti Google Play; l’accesso continua fino alla fine del periodo pagato.',
    'Opening Google Play…': 'Apertura di Google Play…', 'Subscribe · {0}': 'Abbonati · {0}', 'Subscription plans are not available yet. Please try again later.': 'I piani di abbonamento non sono ancora disponibili. Riprova più tardi.',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': 'Gli abbonamenti si rinnovano automaticamente fino alla disdetta. Gestiscili o disdici da Google Play → Pagamenti e abbonamenti → Abbonamenti. La disdetta interrompe il rinnovo successivo; l’accesso continua fino alla fine del periodo pagato. Disinstallare l’app non annulla l’abbonamento.',
    'Checking purchases…': 'Verifica degli acquisti…', 'Restore purchases': 'Ripristina acquisti', 'Manage subscription': 'Gestisci abbonamento', 'Check again': 'Riprova', 'Sign out': 'Esci'
  },
  pt: {
    'Check your subscription': 'Verifique sua assinatura', 'Keep your training going.': 'Continue seu treino.',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': 'Não foi possível verificar sua assinatura ou acesso gratuito. Reconecte-se e tente novamente.',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': 'Sua assinatura terminou. Escolha um plano para continuar usando o Gym Book Training. Seus treinos continuam salvos neste celular.',
    'Checking your access…': 'Verificando seu acesso…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} no primeiro ano e depois {1} por ano. Renovação automática até o cancelamento. Cancele em Assinaturas do Google Play; o acesso continua até o fim do período pago.',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} por ano, com renovação automática até o cancelamento. Cancele em Assinaturas do Google Play; o acesso continua até o fim do período pago.',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} por mês, com renovação automática até o cancelamento. Cancele em Assinaturas do Google Play; o acesso continua até o fim do período pago.',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · renovação automática até o cancelamento. Cancele em Assinaturas do Google Play; o acesso continua até o fim do período pago.',
    'Opening Google Play…': 'Abrindo o Google Play…', 'Subscribe · {0}': 'Assinar · {0}', 'Subscription plans are not available yet. Please try again later.': 'Os planos de assinatura ainda não estão disponíveis. Tente novamente mais tarde.',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': 'As assinaturas são renovadas automaticamente até o cancelamento. Gerencie ou cancele em Google Play → Pagamentos e assinaturas → Assinaturas. O cancelamento impede a próxima renovação; o acesso continua até o fim do período pago. Remover o app não cancela a assinatura.',
    'Checking purchases…': 'Verificando compras…', 'Restore purchases': 'Restaurar compras', 'Manage subscription': 'Gerenciar assinatura', 'Check again': 'Verificar novamente', 'Sign out': 'Sair'
  },
  pl: {
    'Check your subscription': 'Sprawdź subskrypcję', 'Keep your training going.': 'Kontynuuj trening.',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': 'Nie udało się zweryfikować subskrypcji ani bezpłatnego dostępu. Połącz się ponownie i spróbuj jeszcze raz.',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': 'Subskrypcja wygasła. Wybierz plan, aby nadal korzystać z Gym Book Training. Treningi pozostają zapisane na tym telefonie.',
    'Checking your access…': 'Sprawdzanie dostępu…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} przez pierwszy rok, następnie {1} rocznie. Automatyczne odnowienie do anulowania. Anuluj w subskrypcjach Google Play; dostęp trwa do końca opłaconego okresu.',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} rocznie, automatyczne odnowienie do anulowania. Anuluj w subskrypcjach Google Play; dostęp trwa do końca opłaconego okresu.',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} miesięcznie, automatyczne odnowienie do anulowania. Anuluj w subskrypcjach Google Play; dostęp trwa do końca opłaconego okresu.',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · automatyczne odnowienie do anulowania. Anuluj w subskrypcjach Google Play; dostęp trwa do końca opłaconego okresu.',
    'Opening Google Play…': 'Otwieranie Google Play…', 'Subscribe · {0}': 'Subskrybuj · {0}', 'Subscription plans are not available yet. Please try again later.': 'Plany subskrypcji nie są jeszcze dostępne. Spróbuj ponownie później.',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': 'Subskrypcje odnawiają się automatycznie do momentu anulowania. Zarządzaj nimi lub anuluj je w Google Play → Płatności i subskrypcje → Subskrypcje. Anulowanie zatrzymuje kolejne odnowienie; dostęp trwa do końca opłaconego okresu. Usunięcie aplikacji nie anuluje subskrypcji.',
    'Checking purchases…': 'Sprawdzanie zakupów…', 'Restore purchases': 'Przywróć zakupy', 'Manage subscription': 'Zarządzaj subskrypcją', 'Check again': 'Sprawdź ponownie', 'Sign out': 'Wyloguj się'
  },
  tr: {
    'Check your subscription': 'Aboneliğini kontrol et', 'Keep your training going.': 'Antrenmanına devam et.',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': 'Aboneliğin veya ücretsiz erişimin doğrulanamadı. Yeniden bağlanıp tekrar dene.',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': 'Aboneliğin sona erdi. Gym Book Training kullanmaya devam etmek için bir plan seç. Antrenmanların bu telefonda kayıtlı kalır.',
    'Checking your access…': 'Erişimin kontrol ediliyor…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': 'İlk yıl {0}, ardından yıllık {1}. İptal edilene kadar otomatik yenilenir. Google Play Abonelikleri bölümünden iptal et; erişimin ödenen dönem sonuna kadar sürer.',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': 'Yıllık {0}; iptal edilene kadar otomatik yenilenir. Google Play Abonelikleri bölümünden iptal et; erişimin ödenen dönem sonuna kadar sürer.',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': 'Aylık {0}; iptal edilene kadar otomatik yenilenir. Google Play Abonelikleri bölümünden iptal et; erişimin ödenen dönem sonuna kadar sürer.',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · iptal edilene kadar otomatik yenilenir. Google Play Abonelikleri bölümünden iptal et; erişimin ödenen dönem sonuna kadar sürer.',
    'Opening Google Play…': 'Google Play açılıyor…', 'Subscribe · {0}': 'Abone ol · {0}', 'Subscription plans are not available yet. Please try again later.': 'Abonelik planları henüz kullanılamıyor. Lütfen daha sonra tekrar dene.',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': 'Abonelikler iptal edilene kadar otomatik yenilenir. Google Play → Ödemeler ve abonelikler → Abonelikler bölümünden yönet veya iptal et. İptal, sonraki yenilemeyi durdurur; erişimin ödenen dönem sonuna kadar sürer. Uygulamayı kaldırmak aboneliği iptal etmez.',
    'Checking purchases…': 'Satın almalar kontrol ediliyor…', 'Restore purchases': 'Satın almaları geri yükle', 'Manage subscription': 'Aboneliği yönet', 'Check again': 'Tekrar kontrol et', 'Sign out': 'Çıkış yap'
  },
  ru: {
    'Check your subscription': 'Проверьте подписку', 'Keep your training going.': 'Продолжайте тренироваться.',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': 'Не удалось проверить подписку или бесплатный доступ. Подключитесь к сети и повторите попытку.',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': 'Срок подписки истёк. Выберите план, чтобы продолжить пользоваться Gym Book Training. Тренировки останутся сохранены на этом телефоне.',
    'Checking your access…': 'Проверяем доступ…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} за первый год, затем {1} в год. Автопродление действует до отмены. Отмените подписку в Google Play; доступ сохранится до конца оплаченного периода.',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} в год с автопродлением до отмены. Отмените подписку в Google Play; доступ сохранится до конца оплаченного периода.',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} в месяц с автопродлением до отмены. Отмените подписку в Google Play; доступ сохранится до конца оплаченного периода.',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · автопродление до отмены. Отмените подписку в Google Play; доступ сохранится до конца оплаченного периода.',
    'Opening Google Play…': 'Открываем Google Play…', 'Subscribe · {0}': 'Оформить · {0}', 'Subscription plans are not available yet. Please try again later.': 'Тарифы пока недоступны. Повторите попытку позже.',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': 'Подписки продлеваются автоматически до отмены. Управляйте ими или отменяйте их в Google Play → Платежи и подписки → Подписки. Отмена остановит следующее продление; доступ сохранится до конца оплаченного периода. Удаление приложения не отменяет подписку.',
    'Checking purchases…': 'Проверяем покупки…', 'Restore purchases': 'Восстановить покупки', 'Manage subscription': 'Управление подпиской', 'Check again': 'Проверить снова', 'Sign out': 'Выйти'
  },
  zh: {
    'Check your subscription': '检查订阅状态', 'Keep your training going.': '继续你的训练。',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': '无法验证你的订阅或免费使用权限。请重新连接后重试。',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': '订阅已到期。请选择套餐以继续使用 Gym Book Training。训练记录仍保存在此手机上。',
    'Checking your access…': '正在检查使用权限…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '首年 {0}，之后每年 {1}。订阅会自动续订，直到取消。请在 Google Play 订阅中取消；付费期限结束前仍可使用。',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '每年 {0}，自动续订，直到取消。请在 Google Play 订阅中取消；付费期限结束前仍可使用。',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '每月 {0}，自动续订，直到取消。请在 Google Play 订阅中取消；付费期限结束前仍可使用。',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · 自动续订，直到取消。请在 Google Play 订阅中取消；付费期限结束前仍可使用。',
    'Opening Google Play…': '正在打开 Google Play…', 'Subscribe · {0}': '订阅 · {0}', 'Subscription plans are not available yet. Please try again later.': '订阅套餐暂不可用，请稍后重试。',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': '订阅会自动续订，直到取消。请前往 Google Play → 付款和订阅 → 订阅进行管理或取消。取消后将停止下次续订；付费期限结束前仍可使用。卸载应用不会取消订阅。',
    'Checking purchases…': '正在检查购买记录…', 'Restore purchases': '恢复购买', 'Manage subscription': '管理订阅', 'Check again': '重新检查', 'Sign out': '退出登录'
  },
  ko: {
    'Check your subscription': '구독을 확인하세요', 'Keep your training going.': '운동을 계속하세요.',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': '구독 또는 무료 이용 권한을 확인할 수 없습니다. 다시 연결한 후 시도해 주세요.',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': '구독이 종료되었습니다. Gym Book Training을 계속 이용하려면 요금제를 선택하세요. 운동 기록은 이 휴대전화에 저장되어 있습니다.',
    'Checking your access…': '이용 권한 확인 중…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '첫해 {0}, 이후 연간 {1}입니다. 취소할 때까지 자동 갱신됩니다. Google Play 구독에서 취소하세요. 결제 기간이 끝날 때까지 이용할 수 있습니다.',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '연간 {0}이며 취소할 때까지 자동 갱신됩니다. Google Play 구독에서 취소하세요. 결제 기간이 끝날 때까지 이용할 수 있습니다.',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '월간 {0}이며 취소할 때까지 자동 갱신됩니다. Google Play 구독에서 취소하세요. 결제 기간이 끝날 때까지 이용할 수 있습니다.',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · 취소할 때까지 자동 갱신됩니다. Google Play 구독에서 취소하세요. 결제 기간이 끝날 때까지 이용할 수 있습니다.',
    'Opening Google Play…': 'Google Play 여는 중…', 'Subscribe · {0}': '구독 · {0}', 'Subscription plans are not available yet. Please try again later.': '아직 구독 요금제를 이용할 수 없습니다. 나중에 다시 시도해 주세요.',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': '구독은 취소할 때까지 자동 갱신됩니다. Google Play → 결제 및 정기 결제 → 정기 결제에서 관리하거나 취소하세요. 취소하면 다음 갱신이 중단되며 결제 기간이 끝날 때까지 이용할 수 있습니다. 앱을 삭제해도 구독은 취소되지 않습니다.',
    'Checking purchases…': '구매 내역 확인 중…', 'Restore purchases': '구매 복원', 'Manage subscription': '구독 관리', 'Check again': '다시 확인', 'Sign out': '로그아웃'
  },
  hi: {
    'Check your subscription': 'अपनी सदस्यता जाँचें', 'Keep your training going.': 'अपना प्रशिक्षण जारी रखें।',
    'We could not verify your subscription or complimentary access. Reconnect and try again.': 'हम आपकी सदस्यता या निःशुल्क पहुँच की पुष्टि नहीं कर सके। फिर से कनेक्ट करके प्रयास करें।',
    'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': 'आपकी सदस्यता समाप्त हो गई है। Gym Book Training का उपयोग जारी रखने के लिए योजना चुनें। आपके वर्कआउट इस फ़ोन पर सुरक्षित हैं।',
    'Checking your access…': 'आपकी पहुँच जाँची जा रही है…', '{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': 'पहले वर्ष के लिए {0}, फिर प्रति वर्ष {1}। रद्द करने तक अपने-आप नवीनीकृत होगा। Google Play सदस्यताओं में रद्द करें; भुगतान अवधि के अंत तक पहुँच बनी रहेगी।',
    '{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': 'प्रति वर्ष {0}, रद्द करने तक अपने-आप नवीनीकृत होगा। Google Play सदस्यताओं में रद्द करें; भुगतान अवधि के अंत तक पहुँच बनी रहेगी।',
    '{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': 'प्रति माह {0}, रद्द करने तक अपने-आप नवीनीकृत होगा। Google Play सदस्यताओं में रद्द करें; भुगतान अवधि के अंत तक पहुँच बनी रहेगी।',
    '{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.': '{0} · रद्द करने तक स्वतः नवीनीकरण। Google Play सदस्यताओं में रद्द करें; भुगतान अवधि के अंत तक पहुँच बनी रहेगी।',
    'Opening Google Play…': 'Google Play खोला जा रहा है…', 'Subscribe · {0}': 'सदस्यता लें · {0}', 'Subscription plans are not available yet. Please try again later.': 'सदस्यता योजनाएँ अभी उपलब्ध नहीं हैं। कृपया बाद में फिर प्रयास करें।',
    'Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.': 'सदस्यताएँ रद्द किए जाने तक अपने-आप नवीनीकृत होती हैं। Google Play → भुगतान और सदस्यताएँ → सदस्यताएँ में इन्हें प्रबंधित या रद्द करें। रद्द करने से अगला नवीनीकरण रुकता है; भुगतान अवधि के अंत तक पहुँच बनी रहती है। ऐप हटाने से सदस्यता रद्द नहीं होती।',
    'Checking purchases…': 'खरीदारी जाँची जा रही है…', 'Restore purchases': 'खरीदारियाँ पुनर्स्थापित करें', 'Manage subscription': 'सदस्यता प्रबंधित करें', 'Check again': 'फिर जाँचें', 'Sign out': 'साइन आउट'
  }
}
const accessEndedTranslations = {
  de: 'Dein kostenloser Zugang oder dein Abonnement ist abgelaufen. Wähle einen Tarif, um Gym Book Training weiter zu nutzen. Deine Trainings bleiben auf diesem Telefon gespeichert.',
  es: 'Tu acceso gratis o tu suscripción terminó. Elige un plan para seguir usando Gym Book Training. Tus entrenamientos permanecen guardados en este teléfono.',
  fr: 'Votre accès gratuit ou votre abonnement a pris fin. Choisissez une offre pour continuer à utiliser Gym Book Training. Vos entraînements restent enregistrés sur ce téléphone.',
  it: 'Il periodo gratuito o l’abbonamento è terminato. Scegli un piano per continuare a usare Gym Book Training. Gli allenamenti restano salvati su questo telefono.',
  pt: 'Seu acesso gratuito ou sua assinatura terminou. Escolha um plano para continuar usando o Gym Book Training. Seus treinos continuam salvos neste celular.',
  pl: 'Bezpłatny dostęp lub subskrypcja wygasły. Wybierz plan, aby nadal korzystać z Gym Book Training. Twoje treningi pozostają zapisane na tym telefonie.',
  tr: 'Ücretsiz erişimin veya aboneliğin sona erdi. Gym Book Training’i kullanmaya devam etmek için bir plan seç. Antrenmanların bu telefonda kayıtlı kalır.',
  ru: 'Бесплатный доступ или подписка закончились. Выберите план, чтобы продолжить пользоваться Gym Book Training. Тренировки останутся сохранены на этом телефоне.',
  zh: '免费使用期或订阅已结束。请选择套餐以继续使用 Gym Book Training。训练记录仍保存在此手机上。',
  ko: '무료 이용 기간 또는 구독이 종료되었습니다. Gym Book Training을 계속 사용하려면 요금제를 선택하세요. 운동 기록은 이 휴대전화에 저장되어 있습니다.',
  hi: 'आपकी मुफ़्त अवधि या सदस्यता समाप्त हो गई है। Gym Book Training का उपयोग जारी रखने के लिए कोई योजना चुनें। आपके वर्कआउट इस फ़ोन पर सुरक्षित हैं।'
}
const subscriptionErrorTranslations = {
  de: ['Der Kauf konnte nicht abgeschlossen werden. Prüfe Google Play und versuche es erneut.', 'Käufe konnten nicht wiederhergestellt werden.', 'Die Abonnementverwaltung konnte nicht geöffnet werden.', 'Der Abonnementstatus konnte nicht überprüft werden. Bitte versuche es erneut.'],
  es: ['No se pudo completar la compra. Revisa Google Play e inténtalo de nuevo.', 'No se pudieron restaurar las compras.', 'No se pudo abrir la gestión de suscripciones.', 'No se pudo verificar el acceso a la suscripción. Inténtalo de nuevo.'],
  fr: ['L’achat n’a pas pu aboutir. Vérifiez Google Play et réessayez.', 'Impossible de restaurer les achats.', 'Impossible d’ouvrir la gestion de l’abonnement.', 'Impossible de vérifier l’accès à l’abonnement. Réessayez.'],
  it: ['Non è stato possibile completare l’acquisto. Controlla Google Play e riprova.', 'Non è stato possibile ripristinare gli acquisti.', 'Non è stato possibile aprire la gestione dell’abbonamento.', 'Non è stato possibile verificare l’accesso all’abbonamento. Riprova.'],
  pt: ['Não foi possível concluir a compra. Confira o Google Play e tente novamente.', 'Não foi possível restaurar as compras.', 'Não foi possível abrir o gerenciamento da assinatura.', 'Não foi possível verificar o acesso à assinatura. Tente novamente.'],
  pl: ['Nie udało się zrealizować zakupu. Sprawdź Google Play i spróbuj ponownie.', 'Nie udało się przywrócić zakupów.', 'Nie udało się otworzyć zarządzania subskrypcją.', 'Nie udało się sprawdzić dostępu do subskrypcji. Spróbuj ponownie.'],
  tr: ['Satın alma tamamlanamadı. Google Play’i kontrol edip tekrar dene.', 'Satın almalar geri yüklenemedi.', 'Abonelik yönetimi açılamadı.', 'Abonelik erişimi kontrol edilemedi. Lütfen tekrar dene.'],
  ru: ['Не удалось завершить покупку. Проверьте Google Play и повторите попытку.', 'Не удалось восстановить покупки.', 'Не удалось открыть управление подпиской.', 'Не удалось проверить доступ к подписке. Повторите попытку.'],
  zh: ['无法完成购买。请检查 Google Play 后重试。', '无法恢复购买记录。', '无法打开订阅管理。', '无法检查订阅权限，请重试。'],
  ko: ['구매를 완료할 수 없습니다. Google Play를 확인한 후 다시 시도하세요.', '구매 내역을 복원할 수 없습니다.', '구독 관리를 열 수 없습니다.', '구독 이용 권한을 확인할 수 없습니다. 다시 시도하세요.'],
  hi: ['खरीद पूरी नहीं हो सकी। Google Play जाँचें और फिर प्रयास करें।', 'खरीदारियाँ पुनर्स्थापित नहीं हो सकीं।', 'सदस्यता प्रबंधन नहीं खुल सका।', 'सदस्यता पहुँच की जाँच नहीं हो सकी। फिर प्रयास करें।']
}
const subscriptionErrorKeys = [
  'Purchase could not be completed. Check Google Play and try again.',
  'Could not restore purchases.',
  'Could not open subscription management.',
  'Subscription access could not be checked. Please try again.'
]
// The informational website never displays exercise instructions. Keep those large
// exercise packs out of its deploy; the mobile app loads a pack only when it is needed.
const instrPacks = import.meta.env.MODE === 'mobile' || import.meta.env.VITE_MOBILE === '1' ? import.meta.glob('../instr/*.js') : {}

let lang = 'en'
let dict = {}
let instr = null            // { exId: [steps] } for the current language, null = English
let instrLang = null
let instrLoad = null
let version = 0
let langRequest = 0
const subs = new Set()
const notify = () => { version++; subs.forEach(f => f()) }

export const getLang = () => lang
export const dateLocale = () => DATE_LOCALES[lang] || 'en-GB'

// Translate a source string; {0},{1}… are replaced with args (also on the English fallback).
export function t(s, ...args) {
  let v = dict[s] || s
  for (let i = 0; i < args.length; i++) v = v.replaceAll('{' + i + '}', args[i])
  return v
}
// Instructions for an exercise in the current language (English steps as fallback).
export const instrFor = ex => (instr && instr[ex.id]) || ex.st || []

export async function loadInstructions() {
  const requestedLang = lang
  if (!INSTR_LANGS.includes(requestedLang) || requestedLang === 'en') return null
  if (instrLang === requestedLang && instr) return instr
  if (instrLoad?.lang === requestedLang) return instrLoad.promise

  const promise = instrPacks['../instr/' + requestedLang + '.js']()
    .then(module => {
      if (lang === requestedLang) {
        instr = module.default
        instrLang = requestedLang
        notify()
      }
      return module.default
    })
    .catch(() => null)
  instrLoad = { lang: requestedLang, promise }
  try { return await promise }
  finally { if (instrLoad?.promise === promise) instrLoad = null }
}

export async function setLang(l) {
  if (!LANGS[l]) l = 'en'
  if (l === lang && version > 0) return
  const request = ++langRequest
  lang = l
  instr = null
  instrLang = null
  try {
    const [basePack, completionPack] = l === 'en' ? [null, null] : await Promise.all([
      localePacks['../locales/' + l + '.js'](),
      localeCompletionPacks['../locales/completion/' + l + '.js']?.(),
    ])
    if (request !== langRequest) return
    const translatedErrors = Object.fromEntries(subscriptionErrorKeys.map((key, index) => [key, subscriptionErrorTranslations[l]?.[index] || key]))
    dict = { ...(basePack?.default || {}), ...(completionPack?.default || {}), ...(uiAdditions[l] || {}), ...(chromeTranslations[l] || {}), ...(dynamicContentTranslations[l] || {}), ...(guidedFlowTranslations[l] || {}), ...(widgetTranslations[l] || {}), ...(notificationTranslations[l] || {}), ...(subscriptionTranslations[l] || {}), ...(paywallTranslations[l] || {}), 'Your free access or subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.': accessEndedTranslations[l] || 'Your free access or subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.', ...translatedErrors }
  } catch (e) {
    if (request !== langRequest) return
    dict = {}; instr = null
  }
  notify()
}

// Re-renders the subscribing component (and its children) whenever the language changes.
export function useLang() {
  return useSyncExternalStore(fn => { subs.add(fn); return () => subs.delete(fn) }, () => version)
}
