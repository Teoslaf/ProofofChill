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

const dummyHangouts: Hangout[] = [
  {
    id: '1',
    title: '🍕 Pizza Vibes',
    status: 'invited',
    timestamp: 'Today at 8:00 PM',
    stake: '0.01 ETH',
    participants: 3,
  },
  {
    id: '2',
    title: '🎮 Chill LAN',
    status: 'active',
    timestamp: 'Ongoing',
    stake: '0.02 ETH',
    participants: 5,
  },
  {
    id: '3',
    title: '🔥 Rooftop Relax',
    status: 'completed',
    timestamp: 'Last Friday',
    stake: '0.015 ETH',
    participants: 4,
  },
]

export default function HomePage() {
  const router = useRouter()
  const [hangouts, setHangouts] = useState<Hangout[]>([])
  const [hasMounted, setHasMounted] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (hasMounted) {
      const stored = localStorage.getItem('worldID_verified')
      let isVerified = false

      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          const now = Math.floor(Date.now() / 1000)
          isVerified = parsed.verified === true && parsed.expires > now
        } catch (e) {
          isVerified = false
        }
      }
//TODO CHANGE THIS
      isVerified = true;

      if (!isVerified) {
        router.push('/')
      } else {
        setHangouts(dummyHangouts)
      }
    }
  }, [hasMounted, router])

  if (!hasMounted) return null

  const sectionStyle = 'space-y-2 mb-6'
  const cardStyle =
    'bg-white border-2 border-black p-4 rounded-pixel shadow-pixel text-left'

  return (
    <main className="min-h-screen bg-bg p-4 text-text-main font-pixel relative">
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
        {hangouts.filter((h) => h.status === 'invited').length === 0 ? (
          <p className="text-text-light">No invitations right now.</p>
        ) : (
          hangouts
            .filter((h) => h.status === 'invited')
            .map((h) => (
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
        {hangouts.filter((h) => h.status === 'active').length === 0 ? (
          <p className="text-text-light">You're not in any active hangouts.</p>
        ) : (
          hangouts
            .filter((h) => h.status === 'active')
            .map((h) => (
              <div key={h.id} className={cardStyle}>
                <h3 className="text-lg">{h.title}</h3>
                <p className="text-sm text-text-light">🟢 {h.timestamp}</p>
                <p className="text-sm text-text-light">
                  💰 {h.stake} · 👥 {h.participants}
                </p>
                <button className="mt-2 bg-primary px-3 py-1 border-2 border-black rounded-pixel text-sm text-white">
                  Enter Lobby
                </button>
              </div>
            ))
        )}
      </section>

      {/* Completed Hangouts */}
      <section className={sectionStyle}>
        <h2 className="text-xl text-secondary">📜 Past Hangouts</h2>
        {hangouts.filter((h) => h.status === 'completed').length === 0 ? (
          <p className="text-text-light">No past hangouts yet.</p>
        ) : (
          hangouts
            .filter((h) => h.status === 'completed')
            .map((h) => (
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
