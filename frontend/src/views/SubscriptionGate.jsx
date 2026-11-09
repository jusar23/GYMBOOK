import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import SubscriptionPaywall from './SubscriptionPaywall.jsx'

export default function SubscriptionGate({ user, status, refresh }) {
  const navigate = useNavigate()
  const signOut = useStore(s => s.signOut)
  return <SubscriptionPaywall
    user={user}
    status={status}
    refresh={refresh}
    fullScreen
    onSettings={() => navigate('/settings')}
    onSignOut={() => void signOut()}
  />
}

export function SubscriptionPlansSheet({ user, status, close, refresh }) {
  return <SubscriptionPaywall
    user={user}
    status={status}
    refresh={refresh}
    close={close}
    fullScreen={false}
  />
}
