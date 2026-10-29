import { useEffect, useState } from 'react'
import { getLang, LANGS, useLang, setLang } from '../lib/i18n.js'
import Icon from '../components/Icon.jsx'
import Brand from '../components/Brand.jsx'
import { getAuthSession } from '../lib/supabaseAuth.js'
import { WEBSITE_COPY } from './websiteCopy.js'
import './Website.css'

const CONTACT_EMAIL = 'xsebas23@gmail.com'
const PUBLIC_SITE_URL = 'https://gymbooktraining.com/'
const LANGUAGE_KEY = 'gymbook_site_lang'
const FEATURE_ICONS = ['calendar', 'dumbbell', 'chart', 'star', 'timer', 'link', 'lightbulb', 'download', 'bell', 'flame', 'gear', 'shield']
const SOCIAL_LINKS = [
  { name: 'X', icon: 'xSocial', url: import.meta.env.VITE_SOCIAL_X_URL || '' },
  { name: 'Facebook', icon: 'facebook', url: import.meta.env.VITE_SOCIAL_FACEBOOK_URL || '' },
  { name: 'Instagram', icon: 'instagram', url: import.meta.env.VITE_SOCIAL_INSTAGRAM_URL || '' },
]

function safeSocialUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch { return '' }
}

function SiteBrand() {
  return <span className="site-brand-lockup" role="img" aria-label="GYMBOOK training">
    <img className="site-brand-symbol" src="/icons/icon-192.webp" alt="" />
    <span className="site-brand-name"><strong>GYMBOOK</strong><small>training</small></span>
  </span>
}
const EXTRA_FEATURES = {
  en: [
    ['Rest and set timers', 'Use a built-in rest timer or time holds and cardio sets while you train.'],
    ['Supersets', 'Pair exercises and move between them back-to-back, with rest after the pair.'],
    ['Progression guidance', 'Use recent performance and suggested targets to plan your next session.'],
    ['Your data, your way', 'Export routines or training history, and choose when to make a server backup.'],
    ['Workout reminders', 'On Android, schedule reminders for the days you choose and keep your plan in sight.'],
    ['Weekly streak and widget', 'On Android, follow your current streak and see which days you completed a workout.'],
    ['Personal settings', 'Choose your language, sounds, rest times, appearance and training preferences.'],
    ['Complete backups', 'Back up settings, routines and workout history to your account or export a JSON copy.']
  ],
  es: [
    ['Temporizadores de series y descanso', 'Usa el temporizador de descanso o mide ejercicios por tiempo y cardio.'],
    ['Superseries', 'Combina ejercicios y hazlos seguidos, con descanso al terminar el par.'],
    ['Guía de progresión', 'Consulta tus marcas recientes y objetivos sugeridos para planear la próxima sesión.'],
    ['Tus datos, a tu manera', 'Exporta rutinas o historial y decide cuándo guardar una copia en el servidor.'],
    ['Recordatorios de entrenamiento', 'En Android, programa avisos para los días que eliges y mantén tu plan presente.'],
    ['Racha semanal y widget', 'En Android, consulta tu racha actual y los días en que completaste un entrenamiento.'],
    ['Ajustes personales', 'Configura idioma, sonidos, descansos, apariencia y preferencias de entrenamiento.'],
    ['Copias completas', 'Guarda ajustes, rutinas e historial en tu cuenta o exporta una copia JSON.']
  ],
  de: [
    ['Timer für Sätze und Pausen', 'Nutze den Pausentimer oder stoppe Halteübungen und Cardio.'],
    ['Supersätze', 'Kombiniere Übungen und absolviere sie direkt nacheinander.'],
    ['Trainingsfortschritt', 'Nutze deine letzten Leistungen und Zielvorschläge für die nächste Einheit.'],
    ['Deine Daten, deine Wahl', 'Exportiere Trainingspläne oder Verlauf und starte Backups selbst.'],
    ['Trainingserinnerungen', 'Plane auf Android Erinnerungen für deine Trainingstage.'],
    ['Wochenserie und Widget', 'Sieh auf Android deine aktuelle Serie und absolvierte Trainingstage.'],
    ['Persönliche Einstellungen', 'Lege Sprache, Töne, Pausen, Darstellung und Trainingspräferenzen fest.'],
    ['Komplette Backups', 'Sichere Einstellungen, Trainingspläne und Verlauf oder exportiere eine JSON-Datei.']
  ],
  fr: [
    ['Chronos de séries et de repos', 'Utilisez le chronomètre de repos ou mesurez les exercices chronométrés et le cardio.'],
    ['Superséries', 'Associez des exercices et enchaînez-les avant la pause.'],
    ['Conseils de progression', 'Consultez vos performances récentes et des objectifs pour préparer la prochaine séance.'],
    ['Vos données, votre choix', 'Exportez vos programmes ou votre historique et lancez vos sauvegardes.'],
    ['Rappels d’entraînement', 'Sur Android, programmez des rappels pour vos jours d’entraînement.'],
    ['Série hebdomadaire et widget', 'Sur Android, consultez votre série et vos jours d’entraînement réalisés.'],
    ['Réglages personnels', 'Choisissez la langue, les sons, les temps de repos et vos préférences.'],
    ['Sauvegardes complètes', 'Sauvegardez vos réglages, programmes et historique ou exportez un fichier JSON.']
  ],
  it: [
    ['Timer per serie e recupero', 'Usa il timer di recupero o cronometra esercizi a tempo e cardio.'],
    ['Superset', 'Abbina gli esercizi e svolgili uno dopo l’altro prima del recupero.'],
    ['Indicazioni sui progressi', 'Usa i risultati recenti e gli obiettivi suggeriti per la prossima sessione.'],
    ['I tuoi dati, a modo tuo', 'Esporta programmi o cronologia e avvia i backup quando vuoi.'],
    ['Promemoria di allenamento', 'Su Android, programma promemoria per i giorni di allenamento scelti.'],
    ['Serie settimanale e widget', 'Su Android, controlla la serie attuale e i giorni di allenamento completati.'],
    ['Impostazioni personali', 'Scegli lingua, suoni, pause, aspetto e preferenze di allenamento.'],
    ['Backup completi', 'Salva impostazioni, programmi e cronologia o esporta un file JSON.']
  ],
  pt: [
    ['Temporizadores de séries e descanso', 'Use o temporizador de descanso ou cronometre exercícios e cardio.'],
    ['Superséries', 'Combine exercícios e faça-os em sequência antes de descansar.'],
    ['Orientação de progressão', 'Consulte os resultados recentes e as metas sugeridas para o próximo treino.'],
    ['Os seus dados, à sua maneira', 'Exporte planos ou histórico e inicie cópias de segurança quando quiser.'],
    ['Lembretes de treino', 'No Android, programe lembretes para os dias de treino que escolher.'],
    ['Sequência semanal e widget', 'No Android, acompanhe a sequência e os dias de treino concluídos.'],
    ['Definições pessoais', 'Escolha idioma, sons, pausas, aparência e preferências de treino.'],
    ['Cópias completas', 'Guarde definições, planos e histórico ou exporte um ficheiro JSON.']
  ],
  pl: [
    ['Czas serii i odpoczynku', 'Korzystaj z licznika przerw i mierz czas ćwiczeń oraz cardio.'],
    ['Superserie', 'Połącz ćwiczenia i wykonuj je jedno po drugim przed odpoczynkiem.'],
    ['Wskazówki dotyczące progresu', 'Korzystaj z ostatnich wyników i sugerowanych celów na kolejny trening.'],
    ['Twoje dane, Twój wybór', 'Eksportuj plany lub historię i twórz kopie, kiedy chcesz.'],
    ['Przypomnienia o treningu', 'Na Androidzie ustaw przypomnienia na wybrane dni treningowe.'],
    ['Tygodniowa seria i widżet', 'Na Androidzie sprawdzaj serię i ukończone dni treningowe.'],
    ['Ustawienia osobiste', 'Wybierz język, dźwięki, przerwy, wygląd i preferencje treningowe.'],
    ['Pełne kopie zapasowe', 'Zapisuj ustawienia, plany i historię lub eksportuj plik JSON.']
  ],
  tr: [
    ['Set ve dinlenme zamanlayıcıları', 'Dinlenme sayacını kullan veya süreli egzersizleri ve kardiyoyu ölç.'],
    ['Süpersetler', 'Egzersizleri eşleştir ve dinlenmeden önce arka arkaya tamamla.'],
    ['Gelişim önerileri', 'Son performansını ve bir sonraki antrenman için hedef önerilerini gör.'],
    ['Verilerin, senin seçimin', 'Programları veya geçmişi dışa aktar ve yedeklemeyi istediğinde başlat.'],
    ['Antrenman hatırlatıcıları', 'Android’de seçtiğin antrenman günleri için hatırlatıcı kur.'],
    ['Haftalık seri ve widget', 'Android’de serini ve tamamladığın antrenman günlerini gör.'],
    ['Kişisel ayarlar', 'Dil, sesler, dinlenme süreleri, görünüm ve antrenman tercihlerini seç.'],
    ['Eksiksiz yedekler', 'Ayarları, planları ve geçmişi kaydet veya JSON dosyası dışa aktar.']
  ],
  ru: [
    ['Таймеры подходов и отдыха', 'Используйте таймер отдыха и отслеживайте упражнения на время и кардио.'],
    ['Суперсеты', 'Объединяйте упражнения и выполняйте их подряд перед отдыхом.'],
    ['Подсказки для прогресса', 'Учитывайте недавние результаты и рекомендуемые цели следующей тренировки.'],
    ['Ваши данные — ваш выбор', 'Экспортируйте планы или историю и запускайте резервное копирование сами.'],
    ['Напоминания о тренировках', 'На Android настройте напоминания на выбранные дни тренировок.'],
    ['Недельная серия и виджет', 'На Android смотрите серию и завершённые тренировочные дни.'],
    ['Личные настройки', 'Настройте язык, звуки, отдых, оформление и параметры тренировок.'],
    ['Полные копии данных', 'Сохраняйте настройки, планы и историю или экспортируйте файл JSON.']
  ],
  zh: [
    ['组间休息与计时', '使用休息计时器，记录定时动作和有氧训练。'],
    ['超级组', '将动作配对，连续完成后再休息。'],
    ['训练进度建议', '参考近期表现和建议目标，规划下一次训练。'],
    ['数据由你掌控', '导出训练计划或记录，并自行决定何时备份到服务器。'],
    ['训练提醒', '在 Android 上为你选择的训练日设置提醒。'],
    ['每周连续训练与小组件', '在 Android 上查看当前连续训练天数和已完成的训练日。'],
    ['个性化设置', '选择语言、音效、休息时间、外观和训练偏好。'],
    ['完整备份', '备份设置、计划和训练记录，或导出 JSON 文件。']
  ],
  ko: [
    ['세트 및 휴식 타이머', '휴식 타이머를 사용하고 시간 운동과 유산소 운동을 기록하세요.'],
    ['슈퍼세트', '운동을 묶어 연속으로 수행한 뒤 휴식하세요.'],
    ['운동 진행 가이드', '최근 기록과 추천 목표를 참고해 다음 운동을 계획하세요.'],
    ['내 데이터는 내가 관리', '루틴이나 기록을 내보내고 원할 때 서버에 백업하세요.'],
    ['운동 알림', 'Android에서 원하는 운동 요일에 알림을 설정하세요.'],
    ['주간 연속 기록과 위젯', 'Android에서 현재 연속 기록과 완료한 운동일을 확인하세요.'],
    ['개인 설정', '언어, 소리, 휴식 시간, 화면과 운동 환경을 설정하세요.'],
    ['전체 백업', '설정, 루틴, 운동 기록을 백업하거나 JSON 파일로 내보내세요.']
  ],
  hi: [
    ['सेट और आराम के टाइमर', 'आराम का टाइमर इस्तेमाल करें और समय वाले व्यायाम व कार्डियो रिकॉर्ड करें।'],
    ['सुपरसेट', 'व्यायामों को जोड़ें और आराम से पहले लगातार पूरा करें।'],
    ['प्रगति के सुझाव', 'अगले वर्कआउट की योजना के लिए हाल के प्रदर्शन और सुझाए लक्ष्य देखें।'],
    ['आपका डेटा, आपकी पसंद', 'रूटीन या इतिहास एक्सपोर्ट करें और बैकअप खुद शुरू करें।'],
    ['वर्कआउट रिमाइंडर', 'Android पर चुने हुए वर्कआउट दिनों के लिए रिमाइंडर सेट करें।'],
    ['साप्ताहिक स्ट्रीक और विजेट', 'Android पर मौजूदा स्ट्रीक और पूरे किए गए वर्कआउट दिन देखें।'],
    ['व्यक्तिगत सेटिंग', 'भाषा, ध्वनि, आराम का समय, रूप और वर्कआउट प्राथमिकताएँ चुनें।'],
    ['पूरा बैकअप', 'सेटिंग, रूटीन और इतिहास सहेजें या JSON फ़ाइल निर्यात करें।']
  ]
}
const PRICING = {
  en: {
    eyebrow: 'SIMPLE SUBSCRIPTION', title: 'Train with a plan that fits.', description: 'Choose monthly access or save with the annual introductory offer.',
    monthly: 'Monthly', annual: 'Annual · first year', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ month', yearUnit: '/ first year', renewal: 'Then USD 12 per year',
    monthlyTerms: 'Recurring monthly subscription. Cancel any time before renewal.', annualTerms: 'Introductory price for eligible new subscribers. Renews at USD 12 per year.',
    detail: 'Google Play and Paddle may show a converted local price and applicable taxes at checkout. The checkout screen displays the exact amount, renewal frequency and cancellation instructions before you confirm. After cancellation, access remains until the end of the paid period. Deleting your account or uninstalling the app does not cancel a subscription.',
    legal: 'Read the unified legal terms'
  },
  es: {
    eyebrow: 'SUSCRIPCIÓN SENCILLA', title: 'Entrena con un plan a tu medida.', description: 'Elige el acceso mensual o ahorra con la oferta anual introductoria.',
    monthly: 'Mensual', annual: 'Anual · primer año', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ mes', yearUnit: '/ primer año', renewal: 'Luego USD 12 al año',
    monthlyTerms: 'Suscripción mensual recurrente. Cancela antes de la siguiente renovación.', annualTerms: 'Precio introductorio para nuevos suscriptores elegibles. Se renueva a USD 12 al año.',
    detail: 'Google Play y Paddle pueden mostrar el precio convertido a moneda local y los impuestos aplicables al pagar. Antes de confirmar, la pantalla de pago indica el importe exacto, la frecuencia de renovación y cómo cancelar. Tras cancelar, conservas el acceso hasta que termine el periodo pagado. Eliminar tu cuenta o desinstalar la app no cancela la suscripción.',
    legal: 'Consulta el texto legal unificado'
  },
  de: {
    eyebrow: 'EINFACHES ABO', title: 'Trainiere mit einem passenden Plan.', description: 'Wähle den Monatszugang oder spare mit dem Einführungspreis für das erste Jahr.',
    monthly: 'Monatlich', annual: 'Jährlich · erstes Jahr', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ Monat', yearUnit: '/ erstes Jahr', renewal: 'Danach USD 12 pro Jahr',
    monthlyTerms: 'Monatliches Abo mit automatischer Verlängerung. Vor der Verlängerung jederzeit kündbar.', annualTerms: 'Einführungspreis für berechtigte neue Abonnenten. Verlängert sich für USD 12 pro Jahr.',
    detail: 'Google Play und Paddle können beim Bezahlen den umgerechneten lokalen Preis und anfallende Steuern anzeigen. Vor der Bestätigung zeigt der Bezahlvorgang den genauen Betrag, die Verlängerung und die Kündigungshinweise. Nach der Kündigung bleibt der Zugriff bis zum Ende des bezahlten Zeitraums bestehen. Das Löschen des Kontos oder der App kündigt das Abo nicht.', legal: 'Einheitliche rechtliche Bedingungen lesen'
  },
  fr: {
    eyebrow: 'ABONNEMENT SIMPLE', title: 'Un programme adapté à votre rythme.', description: 'Choisissez l’accès mensuel ou profitez du tarif de lancement annuel.',
    monthly: 'Mensuel', annual: 'Annuel · première année', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ mois', yearUnit: '/ première année', renewal: 'Puis USD 12 par an',
    monthlyTerms: 'Abonnement mensuel récurrent. Résiliable à tout moment avant le renouvellement.', annualTerms: 'Tarif de lancement réservé aux nouveaux abonnés éligibles. Renouvellement à USD 12 par an.',
    detail: 'Google Play et Paddle peuvent afficher le prix converti dans votre devise et les taxes applicables au paiement. Avant confirmation, l’écran de paiement indique le montant exact, la fréquence de renouvellement et les modalités de résiliation. Après résiliation, l’accès reste disponible jusqu’à la fin de la période payée. Supprimer votre compte ou l’application ne résilie pas l’abonnement.', legal: 'Lire les conditions juridiques unifiées'
  },
  it: {
    eyebrow: 'ABBONAMENTO SEMPLICE', title: 'Allenati con un piano adatto a te.', description: 'Scegli l’accesso mensile o risparmia con l’offerta annuale introduttiva.',
    monthly: 'Mensile', annual: 'Annuale · primo anno', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ mese', yearUnit: '/ primo anno', renewal: 'Poi USD 12 all’anno',
    monthlyTerms: 'Abbonamento mensile ricorrente. Puoi annullarlo prima del rinnovo.', annualTerms: 'Prezzo introduttivo per i nuovi abbonati idonei. Si rinnova a USD 12 all’anno.',
    detail: 'Google Play e Paddle possono mostrare al pagamento il prezzo convertito nella valuta locale e le imposte applicabili. Prima della conferma, la schermata di pagamento indica l’importo esatto, la frequenza di rinnovo e come annullare. Dopo l’annullamento, l’accesso resta attivo fino alla fine del periodo pagato. Eliminare l’account o l’app non annulla l’abbonamento.', legal: 'Leggi le condizioni legali complete'
  },
  pt: {
    eyebrow: 'ASSINATURA SIMPLES', title: 'Treine com um plano adequado.', description: 'Escolha o acesso mensal ou poupe com a oferta anual de introdução.',
    monthly: 'Mensal', annual: 'Anual · primeiro ano', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ mês', yearUnit: '/ primeiro ano', renewal: 'Depois, USD 12 por ano',
    monthlyTerms: 'Assinatura mensal recorrente. Cancele antes da próxima renovação.', annualTerms: 'Preço introdutório para novos subscritores elegíveis. Renova por USD 12 por ano.',
    detail: 'O Google Play e a Paddle podem apresentar o preço convertido para a moeda local e os impostos aplicáveis no pagamento. Antes da confirmação, o ecrã de pagamento mostra o valor exato, a frequência de renovação e como cancelar. Após o cancelamento, o acesso mantém-se até ao fim do período pago. Eliminar a conta ou a aplicação não cancela a assinatura.', legal: 'Consultar as condições legais completas'
  },
  pl: {
    eyebrow: 'PROSTA SUBSKRYPCJA', title: 'Trenuj według planu dopasowanego do Ciebie.', description: 'Wybierz dostęp miesięczny lub skorzystaj z ceny wprowadzającej na pierwszy rok.',
    monthly: 'Miesięcznie', annual: 'Rocznie · pierwszy rok', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ miesiąc', yearUnit: '/ pierwszy rok', renewal: 'Następnie USD 12 rocznie',
    monthlyTerms: 'Subskrypcja odnawiana co miesiąc. Możesz ją anulować przed odnowieniem.', annualTerms: 'Cena wprowadzająca dla uprawnionych nowych subskrybentów. Odnowienie kosztuje USD 12 rocznie.',
    detail: 'Google Play i Paddle mogą podczas płatności wyświetlić cenę przeliczoną na lokalną walutę oraz należne podatki. Przed potwierdzeniem ekran płatności pokazuje dokładną kwotę, częstotliwość odnowienia i sposób anulowania. Po anulowaniu dostęp trwa do końca opłaconego okresu. Usunięcie konta lub aplikacji nie anuluje subskrypcji.', legal: 'Przeczytaj pełne warunki prawne'
  },
  tr: {
    eyebrow: 'BASİT ABONELİK', title: 'Sana uygun bir planla antrenman yap.', description: 'Aylık erişimi seç veya yıllık başlangıç teklifiyle tasarruf et.',
    monthly: 'Aylık', annual: 'Yıllık · ilk yıl', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ ay', yearUnit: '/ ilk yıl', renewal: 'Sonraki yıllar USD 12',
    monthlyTerms: 'Düzenli aylık abonelik. Yenilenmeden önce istediğin zaman iptal edebilirsin.', annualTerms: 'Uygun yeni aboneler için başlangıç fiyatı. Yıllık USD 12 ile yenilenir.',
    detail: 'Google Play ve Paddle ödeme sırasında yerel para birimine çevrilmiş fiyatı ve geçerli vergileri gösterebilir. Onaydan önce ödeme ekranında kesin tutar, yenileme sıklığı ve iptal bilgileri gösterilir. İptalden sonra erişim, ödenen dönem bitene kadar sürer. Hesabı veya uygulamayı silmek aboneliği iptal etmez.', legal: 'Birleşik yasal koşulları oku'
  },
  ru: {
    eyebrow: 'ПРОСТАЯ ПОДПИСКА', title: 'Тренируйся по подходящему плану.', description: 'Выбери помесячный доступ или годовое предложение по стартовой цене.',
    monthly: 'Ежемесячно', annual: 'Ежегодно · первый год', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ месяц', yearUnit: '/ первый год', renewal: 'Затем USD 12 в год',
    monthlyTerms: 'Ежемесячная подписка с продлением. Отменить можно до следующего списания.', annualTerms: 'Стартовая цена для новых подписчиков, отвечающих условиям. Далее продлевается за USD 12 в год.',
    detail: 'Google Play и Paddle могут показать при оплате цену в местной валюте и применимые налоги. До подтверждения на экране оплаты указываются точная сумма, периодичность продления и способ отмены. После отмены доступ сохраняется до конца оплаченного периода. Удаление аккаунта или приложения не отменяет подписку.', legal: 'Читать полные юридические условия'
  },
  zh: {
    eyebrow: '简单订阅', title: '选择适合你的训练计划。', description: '可选择月度方案，或享受首年年度入门优惠。',
    monthly: '月付', annual: '年付 · 首年', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ 月', yearUnit: '/ 首年', renewal: '之后每年 USD 12',
    monthlyTerms: '按月自动续订，可在续订前随时取消。', annualTerms: '符合条件的新订阅用户可享首年优惠，之后每年 USD 12 续订。',
    detail: 'Google Play 和 Paddle 结账时可能显示换算后的本地价格及适用税费。确认前，结账页面会显示准确金额、续订频率和取消方式。取消后仍可使用至已付费周期结束。删除账户或卸载应用不会取消订阅。', legal: '阅读完整法律条款'
  },
  ko: {
    eyebrow: '간편한 구독', title: '나에게 맞는 계획으로 운동하세요.', description: '월간 이용권을 선택하거나 연간 첫해 할인 혜택을 이용하세요.',
    monthly: '월간', annual: '연간 · 첫해', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ 월', yearUnit: '/ 첫해', renewal: '이후 연 USD 12',
    monthlyTerms: '매월 자동 갱신되는 구독입니다. 갱신 전에 언제든 취소할 수 있습니다.', annualTerms: '자격을 갖춘 신규 구독자 대상 첫해 할인 가격입니다. 이후 연 USD 12로 갱신됩니다.',
    detail: 'Google Play와 Paddle은 결제 시 현지 통화로 환산된 가격과 적용 세금을 표시할 수 있습니다. 결제 확인 전에 정확한 금액, 갱신 주기와 취소 방법이 안내됩니다. 취소해도 결제한 기간이 끝날 때까지 이용할 수 있습니다. 계정 삭제나 앱 제거만으로 구독이 취소되지는 않습니다.', legal: '통합 법률 약관 읽기'
  },
  hi: {
    eyebrow: 'सरल सदस्यता', title: 'अपने लिए सही योजना के साथ ट्रेन करें।', description: 'मासिक पहुँच चुनें या पहले साल की वार्षिक शुरुआती पेशकश का लाभ लें।',
    monthly: 'मासिक', annual: 'वार्षिक · पहला साल', monthPrice: 'USD 1', firstYear: 'USD 9', monthUnit: '/ महीना', yearUnit: '/ पहला साल', renewal: 'फिर USD 12 प्रति वर्ष',
    monthlyTerms: 'हर महीने नवीनीकृत होने वाली सदस्यता। नवीनीकरण से पहले कभी भी रद्द करें।', annualTerms: 'पात्र नए सदस्यों के लिए शुरुआती कीमत। इसके बाद USD 12 प्रति वर्ष पर नवीनीकरण।',
    detail: 'Google Play और Paddle भुगतान के समय स्थानीय मुद्रा में परिवर्तित कीमत और लागू कर दिखा सकते हैं। पुष्टि से पहले भुगतान स्क्रीन सटीक राशि, नवीनीकरण की अवधि और रद्द करने का तरीका दिखाती है। रद्द करने के बाद भुगतान की अवधि समाप्त होने तक पहुँच बनी रहती है। खाता हटाने या ऐप अनइंस्टॉल करने से सदस्यता रद्द नहीं होती।', legal: 'एकीकृत कानूनी शर्तें पढ़ें'
  }
}
const WEBSITE_UI = {
  en: { signIn: 'Sign in', gate: 'Sign in to contact the team.', department: 'Department', support: 'Support', contact: 'Contact', admin: 'Admin', suggestions: 'Suggestions', accountEmail: 'Account email', subject: 'Subject', message: 'Message', prepareEmail: 'Compose email', emailNotice: 'Your email app will open so you can review and send the message.' },
  es: { signIn: 'Iniciar sesión', gate: 'Inicia sesión para escribir al equipo.', department: 'Área', support: 'Soporte', contact: 'Contacto', admin: 'Administración', suggestions: 'Sugerencias', accountEmail: 'Tu correo de cuenta', subject: 'Asunto', message: 'Mensaje', prepareEmail: 'Preparar correo', emailNotice: 'Se abrirá tu aplicación de correo para que revises y envíes el mensaje.' },
  de: { signIn: 'Anmelden', gate: 'Melde dich an, um das Team zu kontaktieren.', department: 'Bereich', support: 'Support', contact: 'Kontakt', admin: 'Verwaltung', suggestions: 'Vorschläge', accountEmail: 'Konto-E-Mail', subject: 'Betreff', message: 'Nachricht', prepareEmail: 'E-Mail verfassen', emailNotice: 'Dein E-Mail-Programm wird geöffnet, damit du die Nachricht prüfen und senden kannst.' },
  fr: { signIn: 'Se connecter', gate: 'Connectez-vous pour contacter l’équipe.', department: 'Service', support: 'Assistance', contact: 'Contact', admin: 'Administration', suggestions: 'Suggestions', accountEmail: 'E-mail du compte', subject: 'Objet', message: 'Message', prepareEmail: 'Rédiger un e-mail', emailNotice: 'Votre messagerie s’ouvrira pour vous permettre de vérifier et d’envoyer le message.' },
  it: { signIn: 'Accedi', gate: 'Accedi per contattare il team.', department: 'Reparto', support: 'Assistenza', contact: 'Contatti', admin: 'Amministrazione', suggestions: 'Suggerimenti', accountEmail: 'E-mail dell’account', subject: 'Oggetto', message: 'Messaggio', prepareEmail: 'Prepara e-mail', emailNotice: 'Si aprirà la tua app di posta per controllare e inviare il messaggio.' },
  pt: { signIn: 'Iniciar sessão', gate: 'Inicie sessão para contactar a equipa.', department: 'Área', support: 'Suporte', contact: 'Contacto', admin: 'Administração', suggestions: 'Sugestões', accountEmail: 'E-mail da conta', subject: 'Assunto', message: 'Mensagem', prepareEmail: 'Preparar e-mail', emailNotice: 'A aplicação de e-mail será aberta para rever e enviar a mensagem.' },
  pl: { signIn: 'Zaloguj się', gate: 'Zaloguj się, aby skontaktować się z zespołem.', department: 'Dział', support: 'Pomoc techniczna', contact: 'Kontakt', admin: 'Administracja', suggestions: 'Sugestie', accountEmail: 'E-mail konta', subject: 'Temat', message: 'Wiadomość', prepareEmail: 'Przygotuj e-mail', emailNotice: 'Otworzy się aplikacja pocztowa, w której możesz sprawdzić i wysłać wiadomość.' },
  tr: { signIn: 'Giriş yap', gate: 'Ekiple iletişim kurmak için giriş yap.', department: 'Bölüm', support: 'Destek', contact: 'İletişim', admin: 'Yönetim', suggestions: 'Öneriler', accountEmail: 'Hesap e-postası', subject: 'Konu', message: 'Mesaj', prepareEmail: 'E-posta oluştur', emailNotice: 'Mesajı inceleyip gönderebilmen için e-posta uygulaman açılacak.' },
  ru: { signIn: 'Войти', gate: 'Войди, чтобы связаться с командой.', department: 'Тема обращения', support: 'Поддержка', contact: 'Связаться', admin: 'Администрация', suggestions: 'Предложения', accountEmail: 'Почта аккаунта', subject: 'Тема', message: 'Сообщение', prepareEmail: 'Подготовить письмо', emailNotice: 'Откроется почтовое приложение, где можно проверить и отправить сообщение.' },
  zh: { signIn: '登录', gate: '登录后即可联系团队。', department: '联系类别', support: '技术支持', contact: '一般联系', admin: '管理事务', suggestions: '建议', accountEmail: '账户邮箱', subject: '主题', message: '消息', prepareEmail: '撰写邮件', emailNotice: '系统将打开邮件应用，供你检查并发送消息。' },
  ko: { signIn: '로그인', gate: '팀에 문의하려면 로그인하세요.', department: '문의 분야', support: '지원', contact: '일반 문의', admin: '관리', suggestions: '제안', accountEmail: '계정 이메일', subject: '제목', message: '메시지', prepareEmail: '이메일 작성', emailNotice: '메시지를 확인하고 보낼 수 있도록 이메일 앱이 열립니다.' },
  hi: { signIn: 'साइन इन करें', gate: 'टीम से संपर्क करने के लिए साइन इन करें।', department: 'विभाग', support: 'सहायता', contact: 'संपर्क', admin: 'प्रशासन', suggestions: 'सुझाव', accountEmail: 'खाते का ईमेल', subject: 'विषय', message: 'संदेश', prepareEmail: 'ईमेल तैयार करें', emailNotice: 'संदेश की समीक्षा करके भेजने के लिए आपका ईमेल ऐप खुलेगा।' },
}

export default function Website() {
  const languageVersion = useLang()
  const language = getLang()
  const copy = WEBSITE_COPY[language] || WEBSITE_COPY.en
  const pricing = PRICING[language] || PRICING.en
  const ui = WEBSITE_UI[language] || WEBSITE_UI.en

  useEffect(() => {
    document.documentElement.lang = language
    document.title = copy.title
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.href = PUBLIC_SITE_URL
    const description = document.querySelector('meta[name="description"]')
    if (description) description.content = copy.hero[3]
    const openGraphUrl = document.querySelector('meta[property="og:url"]')
    if (openGraphUrl) openGraphUrl.content = PUBLIC_SITE_URL
    const openGraphTitle = document.querySelector('meta[property="og:title"]')
    if (openGraphTitle) openGraphTitle.content = copy.title
    const openGraphDescription = document.querySelector('meta[property="og:description"]')
    if (openGraphDescription) openGraphDescription.content = copy.hero[3]
  }, [languageVersion, language, copy])

  const changeLanguage = event => {
    const next = event.target.value
    localStorage.setItem(LANGUAGE_KEY, next)
    void setLang(next)
  }

  const featureCopy = [...copy.features[4], ...(EXTRA_FEATURES[language] || EXTRA_FEATURES.en)]
  const phone = copy.phone
  const [siteUser, setSiteUser] = useState(null)
  const [contactCategory, setContactCategory] = useState('support')
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')

  useEffect(() => {
    let current = true
    void getAuthSession().then(session => { if (current) setSiteUser(session?.user || null) }).catch(() => {})
    return () => { current = false }
  }, [])

  const sendContact = event => {
    event.preventDefault()
    const categories = {
      support: ui.support,
      contact: ui.contact,
      admin: ui.admin,
      suggestions: ui.suggestions,
    }
    const subject = `[${categories[contactCategory]}] ${contactSubject.trim()}`
    const body = `${ui.accountEmail}: ${siteUser?.email || ''}\n\n${contactMessage.trim()}`
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return <div className="site">
    <header className="site-nav">
      <a className="site-brand" href="#inicio" aria-label="GYMBOOK training, home"><SiteBrand /></a>
      <nav aria-label={copy.nav[0]}>
        <a href="#funciones">{copy.nav[0]}</a>
        <a href="#legal">{copy.nav[1]}</a>
        <a href="#contacto">{copy.nav[2]}</a>
        <a className="site-account-link" href="/#/account">{ui.signIn}</a>
      </nav>
      <div className="site-nav-actions">
        <label className="site-language" aria-label="Language">
          <Icon name="globe" />
          <select aria-label="Language" value={language} onChange={changeLanguage}>
            {Object.entries(LANGS).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          <Icon name="chevronDown" />
        </label>
      </div>
    </header>

    <main>
      <section className="site-hero" id="inicio">
        <div className="site-hero-copy">
          <span className="site-eyebrow"><span className="site-live-dot" /> {copy.hero[0]}</span>
          <h1>{copy.hero[1]}<br /><span>{copy.hero[2]}</span></h1>
          <p>{copy.hero[3]}</p>
          <div className="site-hero-actions">
            <a className="site-text-link" href="#funciones">{copy.hero[4]} <Icon name="arrowDown" /></a>
          </div>
          <div className="site-compat"><Icon name="info" /> {copy.hero[5]}</div>
        </div>
        <div className="site-hero-art" aria-label={copy.hero[0]}>
          <div className="site-orbit orbit-one" /><div className="site-orbit orbit-two" />
          <div className="site-phone">
            <div className="site-phone-camera" />
            <div className="site-phone-head"><Brand className="site-phone-brand" showIcon={false} /><Icon name="gear" /></div>
            <div className="site-phone-date">{phone[0]}</div>
            <div className="site-phone-greeting">{phone[1]}<br /><strong>{phone[2]}</strong></div>
            <div className="site-phone-routine"><div className="site-routine-icon"><Icon name="arm" /></div><div><small>{phone[3]}</small><strong>{phone[4]}</strong><span>{phone[5]}</span></div><Icon name="chevronRight" /></div>
            <div className="site-phone-progress"><div><span>{phone[6]}</span><b>{phone[7]}</b></div><div className="site-progress-bars"><i /><i /><i /><i /></div></div>
            <div className="site-phone-tabs"><span><Icon name="house" />{phone[8]}</span><span><Icon name="calendar" />{phone[9]}</span><b><Icon name="dumbbell" />{phone[10]}</b><span><Icon name="chart" />{phone[11]}</span><span><Icon name="list" />{phone[12]}</span></div>
          </div>
          <div className="site-float-card"><span className="site-float-icon"><Icon name="check" /></span><div><small>{phone[13]}</small><strong>{phone[14]}</strong></div></div>
          <div className="site-art-caption">{copy.hero[0]} <span>✳</span></div>
        </div>
      </section>

      <section className="site-trust-strip" aria-label={copy.features[0]}>
        {copy.trust.map((item, i) => <div key={item}><Icon name={['lock', 'chartLine', 'timer'][i]} /><span>{item}</span></div>)}
      </section>

      <section className="site-features" id="funciones">
        <div className="site-section-heading"><span className="site-eyebrow">{copy.features[0]}</span><h2>{copy.features[1]}<br /><span>{copy.features[2]}</span></h2><p>{copy.features[3]}</p></div>
        <div className="site-feature-grid">
          {featureCopy.map((feature, i) => <article className="site-feature-card" key={feature[0]}>
            <div className="site-feature-top"><span className="site-feature-icon"><Icon name={FEATURE_ICONS[i]} /></span><span className="site-feature-number">0{i + 1}</span></div>
            <h3>{feature[0]}</h3><p>{feature[1]}</p>
          </article>)}
        </div>
      </section>

      <section className="site-pricing" id="precios">
        <div className="site-section-heading"><span className="site-eyebrow">{pricing.eyebrow}</span><h2>{pricing.title}</h2><p>{pricing.description}</p></div>
        <div className="site-pricing-grid">
          <article className="site-price-card"><span>{pricing.monthly}</span><strong>{pricing.monthPrice}<small>{pricing.monthUnit}</small></strong><p>{pricing.monthlyTerms}</p></article>
          <article className="site-price-card site-price-card-featured"><span>{pricing.annual}</span><strong>{pricing.firstYear}<small>{pricing.yearUnit}</small></strong><p>{pricing.renewal}</p><p>{pricing.annualTerms}</p></article>
        </div>
        <p className="site-pricing-detail">{pricing.detail}</p>
      </section>

      <section className="site-data-band">
        <div className="site-data-icon"><Icon name="shield" /></div>
        <div><span className="site-eyebrow">{copy.data[0]}</span><h2>{copy.data[1]}</h2><p>{copy.data[2]}</p></div>
        <a href="#legal" className="site-inline-link">{copy.data[3]} <Icon name="chevronRight" /></a>
      </section>

      <section className="site-download" id="descargar">
        <div className="site-download-mark"><Icon name="dumbbell" /></div>
        <span className="site-eyebrow">{copy.download[0]}</span>
        <h2>{copy.download[1]}</h2>
        <p>{copy.download[2]}</p>
      </section>

      <section className="site-legal" id="legal">
        <div className="site-section-heading"><span className="site-eyebrow">{copy.legal[0]}</span><h2>{copy.legal[1]}</h2><p>{copy.legal[2]}</p></div>
        <div className="site-legal-list">
          <a href="/#/legal/terms"><span className="site-legal-icon"><Icon name="clipboard" /></span><span><strong>{pricing.legal}</strong><small>{copy.legal[2]}</small></span><Icon name="chevronRight" /></a>
        </div>
      </section>

      <section className="site-contact" id="contacto">
        <span className="site-eyebrow">{copy.contact[0]}</span><h2>{copy.contact[1]}</h2><p>{copy.contact[2]}</p>
        {siteUser
          ? <form className="site-contact-form" onSubmit={sendContact}>
            <label>{ui.department}
              <select value={contactCategory} onChange={event => setContactCategory(event.target.value)}>
                <option value="support">{ui.support}</option>
                <option value="contact">{ui.contact}</option>
                <option value="admin">{ui.admin}</option>
                <option value="suggestions">{ui.suggestions}</option>
              </select>
            </label>
            <label>{ui.accountEmail}<input type="email" value={siteUser.email || ''} readOnly /></label>
            <label>{ui.subject}<input value={contactSubject} onChange={event => setContactSubject(event.target.value)} maxLength={120} required /></label>
            <label className="site-contact-message">{ui.message}<textarea value={contactMessage} onChange={event => setContactMessage(event.target.value)} rows={5} maxLength={5000} required /></label>
            <button className="site-button primary" type="submit"><Icon name="link" />{ui.prepareEmail}</button>
            <small>{ui.emailNotice}</small>
          </form>
          : <div className="site-contact-gate"><Icon name="lock" /><span>{ui.gate}</span><a className="site-button primary" href="/#/account">{ui.signIn}</a></div>}
        <div className="site-social-section">
          <span className="site-social-heading">{copy.contact[3]}</span>
          <div className="site-social-grid">
            {SOCIAL_LINKS.map(social => {
              const href = safeSocialUrl(social.url)
              const content = <><Icon name={social.icon} /><span>{social.name}</span>{!href && <small>{copy.contact[4]}</small>}</>
              return href
                ? <a className="site-social-link" key={social.name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${social.name} — GYMBOOK`}>{content}</a>
                : <span className="site-social-link is-unavailable" key={social.name} aria-disabled="true" title={copy.contact[4]}>{content}</span>
            })}
          </div>
        </div>
      </section>
    </main>

    <footer className="site-footer"><a className="site-brand" href="#inicio" aria-label="GYMBOOK training, home"><SiteBrand /></a><span>{copy.footer[0]}</span><div><a href="#legal">{copy.footer[1]}</a><a href="#contacto">{copy.nav[2]}</a><span>© {new Date().getFullYear()} GYMBOOK</span></div></footer>
  </div>
}
