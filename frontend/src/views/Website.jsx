import { useEffect } from 'react'
import { getLang, LANGS, useLang, setLang } from '../lib/i18n.js'
import Icon from '../components/Icon.jsx'
import { WEBSITE_COPY } from './websiteCopy.js'
import './Website.css'

const CONTACT_EMAIL = 'xsebas23@gmail.com'
const APK_URL = import.meta.env.VITE_ANDROID_APK_URL || ''
const PUBLIC_SITE_URL = 'https://gymbooktraining.com/'
const LANGUAGE_KEY = 'gymbook_site_lang'
const FEATURE_ICONS = ['calendar', 'dumbbell', 'chart', 'star', 'timer', 'link', 'lightbulb', 'download']
const EXTRA_FEATURES = {
  en: [
    ['Rest and set timers', 'Use a built-in rest timer or time holds and cardio sets while you train.'],
    ['Supersets', 'Pair exercises and move between them back-to-back, with rest after the pair.'],
    ['Progression guidance', 'Use recent performance and suggested targets to plan your next session.'],
    ['Your data, your way', 'Export routines or training history, and choose when to make a server backup.']
  ],
  es: [
    ['Temporizadores de series y descanso', 'Usa el temporizador de descanso o mide ejercicios por tiempo y cardio.'],
    ['Superseries', 'Combina ejercicios y hazlos seguidos, con descanso al terminar el par.'],
    ['Guía de progresión', 'Consulta tus marcas recientes y objetivos sugeridos para planear la próxima sesión.'],
    ['Tus datos, a tu manera', 'Exporta rutinas o historial y decide cuándo guardar una copia en el servidor.']
  ],
  de: [
    ['Timer für Sätze und Pausen', 'Nutze den Pausentimer oder stoppe Halteübungen und Cardio.'],
    ['Supersätze', 'Kombiniere Übungen und absolviere sie direkt nacheinander.'],
    ['Trainingsfortschritt', 'Nutze deine letzten Leistungen und Zielvorschläge für die nächste Einheit.'],
    ['Deine Daten, deine Wahl', 'Exportiere Trainingspläne oder Verlauf und starte Backups selbst.']
  ],
  fr: [
    ['Chronos de séries et de repos', 'Utilisez le chronomètre de repos ou mesurez les exercices chronométrés et le cardio.'],
    ['Superséries', 'Associez des exercices et enchaînez-les avant la pause.'],
    ['Conseils de progression', 'Consultez vos performances récentes et des objectifs pour préparer la prochaine séance.'],
    ['Vos données, votre choix', 'Exportez vos programmes ou votre historique et lancez vos sauvegardes.']
  ],
  it: [
    ['Timer per serie e recupero', 'Usa il timer di recupero o cronometra esercizi a tempo e cardio.'],
    ['Superset', 'Abbina gli esercizi e svolgili uno dopo l’altro prima del recupero.'],
    ['Indicazioni sui progressi', 'Usa i risultati recenti e gli obiettivi suggeriti per la prossima sessione.'],
    ['I tuoi dati, a modo tuo', 'Esporta programmi o cronologia e avvia i backup quando vuoi.']
  ],
  pt: [
    ['Temporizadores de séries e descanso', 'Use o temporizador de descanso ou cronometre exercícios e cardio.'],
    ['Superséries', 'Combine exercícios e faça-os em sequência antes de descansar.'],
    ['Orientação de progressão', 'Consulte os resultados recentes e as metas sugeridas para o próximo treino.'],
    ['Os seus dados, à sua maneira', 'Exporte planos ou histórico e inicie cópias de segurança quando quiser.']
  ],
  pl: [
    ['Czas serii i odpoczynku', 'Korzystaj z licznika przerw i mierz czas ćwiczeń oraz cardio.'],
    ['Superserie', 'Połącz ćwiczenia i wykonuj je jedno po drugim przed odpoczynkiem.'],
    ['Wskazówki dotyczące progresu', 'Korzystaj z ostatnich wyników i sugerowanych celów na kolejny trening.'],
    ['Twoje dane, Twój wybór', 'Eksportuj plany lub historię i twórz kopie, kiedy chcesz.']
  ],
  tr: [
    ['Set ve dinlenme zamanlayıcıları', 'Dinlenme sayacını kullan veya süreli egzersizleri ve kardiyoyu ölç.'],
    ['Süpersetler', 'Egzersizleri eşleştir ve dinlenmeden önce arka arkaya tamamla.'],
    ['Gelişim önerileri', 'Son performansını ve bir sonraki antrenman için hedef önerilerini gör.'],
    ['Verilerin, senin seçimin', 'Programları veya geçmişi dışa aktar ve yedeklemeyi istediğinde başlat.']
  ],
  ru: [
    ['Таймеры подходов и отдыха', 'Используйте таймер отдыха и отслеживайте упражнения на время и кардио.'],
    ['Суперсеты', 'Объединяйте упражнения и выполняйте их подряд перед отдыхом.'],
    ['Подсказки для прогресса', 'Учитывайте недавние результаты и рекомендуемые цели следующей тренировки.'],
    ['Ваши данные — ваш выбор', 'Экспортируйте планы или историю и запускайте резервное копирование сами.']
  ],
  zh: [
    ['组间休息与计时', '使用休息计时器，记录定时动作和有氧训练。'],
    ['超级组', '将动作配对，连续完成后再休息。'],
    ['训练进度建议', '参考近期表现和建议目标，规划下一次训练。'],
    ['数据由你掌控', '导出训练计划或记录，并自行决定何时备份到服务器。']
  ],
  ko: [
    ['세트 및 휴식 타이머', '휴식 타이머를 사용하고 시간 운동과 유산소 운동을 기록하세요.'],
    ['슈퍼세트', '운동을 묶어 연속으로 수행한 뒤 휴식하세요.'],
    ['운동 진행 가이드', '최근 기록과 추천 목표를 참고해 다음 운동을 계획하세요.'],
    ['내 데이터는 내가 관리', '루틴이나 기록을 내보내고 원할 때 서버에 백업하세요.']
  ],
  hi: [
    ['सेट और आराम के टाइमर', 'आराम का टाइमर इस्तेमाल करें और समय वाले व्यायाम व कार्डियो रिकॉर्ड करें।'],
    ['सुपरसेट', 'व्यायामों को जोड़ें और आराम से पहले लगातार पूरा करें।'],
    ['प्रगति के सुझाव', 'अगले वर्कआउट की योजना के लिए हाल के प्रदर्शन और सुझाए लक्ष्य देखें।'],
    ['आपका डेटा, आपकी पसंद', 'रूटीन या इतिहास एक्सपोर्ट करें और बैकअप खुद शुरू करें।']
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
  }
}

export default function Website() {
  const languageVersion = useLang()
  const language = getLang()
  const copy = WEBSITE_COPY[language] || WEBSITE_COPY.en
  const pricing = PRICING[language] || PRICING.en

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

  const downloadButton = (className, label) => APK_URL
    ? <a className={className} href={APK_URL} download><Icon name="download" /> {label}</a>
    : <span className={`${className} site-download-disabled`} aria-disabled="true"><Icon name="download" /> {label}</span>

  const featureCopy = [...copy.features[4], ...(EXTRA_FEATURES[language] || EXTRA_FEATURES.en)]
  const phone = copy.phone

  return <div className="site">
    <header className="site-nav">
      <a className="site-brand" href="#inicio" aria-label="Gym Book Training, home"><span className="site-brand-mark"><Icon name="dumbbell" /></span><span className="site-wordmark"><span>gym book</span><small>training</small></span></a>
      <nav aria-label={copy.nav[0]}>
        <a href="#funciones">{copy.nav[0]}</a>
        <a href="#legal">{copy.nav[1]}</a>
        <a href="#contacto">{copy.nav[2]}</a>
        <a className="site-account-link" href="/#/account">{language === 'es' ? 'Iniciar sesión' : 'Sign in'}</a>
      </nav>
      <div className="site-nav-actions">
        <label className="site-language" aria-label="Language">
          <Icon name="globe" />
          <select aria-label="Language" value={language} onChange={changeLanguage}>
            {Object.entries(LANGS).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          <Icon name="chevronDown" />
        </label>
        {downloadButton('site-nav-download', copy.nav[3])}
      </div>
    </header>

    <main>
      <section className="site-hero" id="inicio">
        <div className="site-hero-copy">
          <span className="site-eyebrow"><span className="site-live-dot" /> {copy.hero[0]}</span>
          <h1>{copy.hero[1]}<br /><span>{copy.hero[2]}</span></h1>
          <p>{copy.hero[3]}</p>
          <div className="site-hero-actions">
            {downloadButton('site-button primary', copy.download[3])}
            <a className="site-text-link" href="#funciones">{copy.hero[4]} <Icon name="arrowDown" /></a>
          </div>
          <div className="site-compat"><Icon name="info" /> {copy.hero[5]}</div>
        </div>
        <div className="site-hero-art" aria-label="Gym Book Training app preview">
          <div className="site-orbit orbit-one" /><div className="site-orbit orbit-two" />
          <div className="site-phone">
            <div className="site-phone-camera" />
            <div className="site-phone-head"><span>Gym Book Training</span><Icon name="gear" /></div>
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
        {downloadButton('site-button primary', copy.download[3])}
        <small>{copy.download[4]}</small>
      </section>

      <section className="site-legal" id="legal">
        <div className="site-section-heading"><span className="site-eyebrow">{copy.legal[0]}</span><h2>{copy.legal[1]}</h2><p>{copy.legal[2]}</p></div>
        <div className="site-legal-list">
          <a href="/#/legal/terms"><span className="site-legal-icon"><Icon name="clipboard" /></span><span><strong>{pricing.legal}</strong><small>{copy.legal[2]}</small></span><Icon name="chevronRight" /></a>
        </div>
      </section>

      <section className="site-contact" id="contacto">
        <span className="site-eyebrow">{copy.contact[0]}</span><h2>{copy.contact[1]}</h2><p>{copy.contact[2]}</p>
        <a className="site-contact-link" href={`mailto:${CONTACT_EMAIL}`}><Icon name="link" />{CONTACT_EMAIL}<Icon name="arrowUp" /></a>
        <div className="site-social-note"><span>{copy.contact[3]}</span><span>{copy.contact[4]}</span></div>
      </section>
    </main>

    <footer className="site-footer"><a className="site-brand" href="#inicio" aria-label="Gym Book Training, home"><span className="site-brand-mark"><Icon name="dumbbell" /></span><span className="site-wordmark"><span>gym book</span><small>training</small></span></a><span>{copy.footer[0]}</span><div><a href="#legal">{copy.footer[1]}</a><a href="#contacto">{copy.nav[2]}</a><span>© {new Date().getFullYear()} Gym Book Training</span></div></footer>
  </div>
}
