import Icon from './Icon.jsx'

export default function Brand({ className = '', showIcon = true }) {
  return <span className={`brand-lockup ${className}`.trim()} role="img" aria-label="GYMBOOK training">
    {showIcon && <span className="brand-lockup-mark" aria-hidden="true"><Icon name="dumbbell" /></span>}
    <span className="brand-lockup-name"><span className="brand-lockup-core">GYMBOOK</span><span className="brand-lockup-training">training</span></span>
  </span>
}
