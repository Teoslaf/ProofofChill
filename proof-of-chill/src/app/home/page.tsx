'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Hangout = {
  id: string
  title: string
  status: 'invited' | 'active' | 'completed'
  timestamp: string
  stake: string
  participants: number
}

export default function HomePage() {
  const router = useRouter()

  const [invited, setInvited] = useState<Hangout[]>([])
  const [active, setActive] = useState<Hangout[]>([])
  const [past, setPast] = useState<Hangout[]>([])
  const [hasMounted, setHasMounted] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const load = async () => {
      const stored = localStorage.getItem('wallet_verified')
      let isVerified = false
      let address = ''

      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          const now = Math.floor(Date.now() / 1000)
          isVerified = parsed.verified === true && parsed.expires > now
          address = parsed.address
        } catch { }
      }

      // if (!isVerified || !address) {
      //   router.push('/')
      //   return
      // }

      try {
        const res = await fetch(`/api/invited-hangouts?address=${address}`)
        const data = await res.json()

        setInvited(data.invited ?? [])
        setActive(data.active ?? [])
        setPast(data.past ?? [])

        const total = (data.invited?.length || 0) + (data.active?.length || 0) + (data.past?.length || 0)
        setMessage(`Fetched ${total} hangouts.`)
      } catch (err: any) {
        console.error('Fetch error:', err)
        setMessage('Failed to fetch hangouts')
      }
    }

    if (hasMounted) load()
  }, [hasMounted, router])

  if (!hasMounted) return null

  const sectionStyle = 'space-y-2 mb-6'
  const cardStyle =
    'bg-white border-2 border-black p-4 rounded-pixel shadow-pixel text-left'

  return (
    <main className="min-h-screen bg-bg p-4 text-text-main font-pixel">
      <h1 className="text-3xl text-primary mb-2">👋 Welcome to Hangouts</h1>

      <div className="mb-6">
        <button
          onClick={() => router.push('/create-hangout')}
          className="bg-primary text-white px-4 py-2 border-2 border-black rounded-pixel shadow-pixel text-sm"
        >
          ➕ Create
        </button>
      </div>

      {/* Invited Hangouts */}
      <section className={sectionStyle}>
        <h2 className="text-xl text-alert">🎉 Invited Hangouts</h2>
        {invited.length === 0 ? (
          <p className="text-text-light">No invitations right now.</p>
        ) : (
          invited.map(h => (
            <div key={h.id} className={cardStyle}>
              <h3 className="text-lg">{h.title}</h3>
              <p className="text-sm text-text-light">⏰ {h.timestamp}</p>
              <p className="text-sm text-text-light">
                💰 {h.stake} · 👥 {h.participants}
              </p>
              <button className="mt-2 bg-success px-3 py-1 border-2 border-black rounded-pixel text-sm">
                Join
              </button>
            </div>
          ))
        )}
      </section>

      {/* Active Hangouts */}
      <section className={sectionStyle}>
        <h2 className="text-xl text-success">🕹️ Active Hangouts</h2>
        {active.length === 0 ? (
          <p className="text-text-light">You're not in any active hangouts.</p>
        ) : (
          active.map(h => (
            <div key={h.id} className={cardStyle}>
              <h3 className="text-lg">{h.title}</h3>
              <p className="text-sm text-text-light">🟢 {h.timestamp}</p>
              <p className="text-sm text-text-light">
                💰 {h.stake} · 👥 {h.participants}
              </p>
              <button
                onClick={() => router.push(`/lobby/${h.id}`)}
                className="mt-2 bg-primary px-3 py-1 border-2 border-black rounded-pixel text-sm text-white"
              >
                Enter Lobby
              </button>

            </div>
          ))
        )}
      </section>

      {/* Past Hangouts */}
      <section className={sectionStyle}>
        <h2 className="text-xl text-secondary">📜 Past Hangouts</h2>
        {past.length === 0 ? (
          <p className="text-text-light">No past hangouts yet.</p>
        ) : (
          past.map(h => (
            <div key={h.id} className={cardStyle}>
              <h3 className="text-lg">{h.title}</h3>
              <p className="text-sm text-text-light">📅 {h.timestamp}</p>
              <p className="text-sm text-text-light">
                💰 {h.stake} · 👥 {h.participants}
              </p>
            </div>
          ))
        )}
      </section>

      <div className="bg-yellow-300 text-black font-mono text-sm p-2 border-2 border-black rounded mt-4">
        DEBUG: {message}
      </div>
    </main>
  )
}
