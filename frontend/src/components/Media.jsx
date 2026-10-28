import { useEffect, useState } from 'react'
import { imgSrc, gifSrc } from '../lib/exercises.js'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'

// Big autoplaying animation; tap toggles to the still frame. `compact` shrinks it (superset cards).
// Custom exercises have no media — the animation stays blank by design (issue #11).
// `minimizable` (workout view) adds a persistent minimize/expand control so the animation stops
// eating the screen; the chosen size is saved to settings and carries across exercises and
// future workouts (issue #12).
export default function Media({ ex, id, compact, minimizable }) {
  const [playing, setPlaying] = useState(true)
  const [failed, setFailed] = useState(false)
  const gifSize = useStore(s => s.S.gifSize)
  const body = useStore(s => s.S.body === 'female' ? 'female' : 'male')
  const update = useStore(s => s.update)
  const gif = gifSrc(ex, body)
  const img = imgSrc(ex, body)
  useEffect(() => { setPlaying(true); setFailed(false) }, [ex?.id, gif, img])
  if (!gif && !img) return null
  if (failed) return <div className={'exmedia media-missing' + (compact ? ' compact' : '')}><Icon name="dumbbell" /><span>{ex.n}</span></div>
  const mini = minimizable && gifSize === 'mini'
  const toggleSize = e => { e.stopPropagation(); update(s => { s.gifSize = mini ? 'full' : 'mini' }) }
  return (
    <div className={'exmedia' + (compact ? ' compact' : '') + (mini ? ' mini' : '')} id={id} onClick={() => setPlaying(p => !p)}>
      <img decoding="async" src={playing && gif ? gif : img || gif} alt={ex.n} onError={() => {
        if (playing && gif && img) setPlaying(false)
        else setFailed(true)
      }} />
      {minimizable && (
        <button className="giftoggle" onClick={toggleSize}>
          <Icon name={mini ? 'expand' : 'minimize'} />{mini ? t('Expand') : t('Minimize')}
        </button>
      )}
      {!mini && (
        <span className="gifhint">
          <Icon name={playing ? 'pause' : 'play'} />{playing ? t('tap to pause') : t('tap to play')}
        </span>
      )}
    </div>
  )
}

export function Thumb({ ex, eager = false }) {
  const body = useStore(s => s.S.body === 'female' ? 'female' : 'male')
  const img = imgSrc(ex, body)
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [ex?.id, img])
  if (!img) return <div className="thumb thumb-x"><Icon name="dumbbell" /></div>
  if (failed) return <div className="thumb thumb-x"><Icon name="dumbbell" /></div>
  return <img className="thumb" loading={eager ? 'eager' : 'lazy'} decoding="async" src={img} alt="" onError={() => setFailed(true)} />
}
