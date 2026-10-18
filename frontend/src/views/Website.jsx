import { useEffect } from 'react'
import { getLang, LANGS, useLang, setLang } from '../lib/i18n.js'
import Icon from '../components/Icon.jsx'
import { WEBSITE_COPY } from './websiteCopy.js'
import './Website.css'

const CONTACT_EMAIL = 'xsebas23@gmail.com'
const APK_URL = import.meta.env.VITE_ANDROID_APK_URL || ''
const PUBLIC_SITE_URL = 'https://gymbooktraining.com/'
const LANGUAGE_KEY = 'gymbook_site_lang'
const FEATURE_ICONS = ['calendar', 'dumbbell', 'chart', 'star']

export default function Website() {
  const languageVersion = useLang()
  const language = getLang()
  const copy = WEBSITE_COPY[language] || WEBSITE_COPY.en

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

  const featureCopy = copy.features[4]
  const legalCopy = copy.legal[3]
  const phone = copy.phone

  return <div className="site">
    <header className="site-nav">
      <a className="site-brand" href="#inicio" aria-label="GYMBOOK, home"><span className="site-brand-mark"><Icon name="dumbbell" /></span>gymbook</a>
      <nav aria-label={copy.nav[0]}>
        <a href="#funciones">{copy.nav[0]}</a>
        <a href="#legal">{copy.nav[1]}</a>
        <a href="#contacto">{copy.nav[2]}</a>
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
        <div className="site-hero-art" aria-label="GYMBOOK app preview">
          <div className="site-orbit orbit-one" /><div className="site-orbit orbit-two" />
          <div className="site-phone">
            <div className="site-phone-camera" />
            <div className="site-phone-head"><span>gymbook</span><Icon name="gear" /></div>
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
          {legalCopy.map((item, i) => <a key={item[0]} href={`/#/legal/${['terms', 'privacy', 'collection'][i]}`}><span className="site-legal-icon"><Icon name={['clipboard', 'shield', 'list'][i]} /></span><span><strong>{item[0]}</strong><small>{item[1]}</small></span><Icon name="chevronRight" /></a>)}
        </div>
      </section>

      <section className="site-contact" id="contacto">
        <span className="site-eyebrow">{copy.contact[0]}</span><h2>{copy.contact[1]}</h2><p>{copy.contact[2]}</p>
        <a className="site-contact-link" href={`mailto:${CONTACT_EMAIL}`}><Icon name="link" />{CONTACT_EMAIL}<Icon name="arrowUp" /></a>
        <div className="site-social-note"><span>{copy.contact[3]}</span><span>{copy.contact[4]}</span></div>
      </section>
    </main>

    <footer className="site-footer"><a className="site-brand" href="#inicio"><span className="site-brand-mark"><Icon name="dumbbell" /></span>gymbook</a><span>{copy.footer[0]}</span><div><a href="#legal">{copy.footer[1]}</a><a href="#contacto">{copy.nav[2]}</a><span>© {new Date().getFullYear()} GYMBOOK</span></div></footer>
  </div>
}
