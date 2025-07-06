'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from '@worldcoin/minikit-js'
import abi from '@/app/abi/abi.json'
import { parseUnits } from 'ethers'

type Hangout = {
  id: string
  title: string
  status: 'invited' | 'active' | 'completed'
  timestamp: string
  stake: string
  stakeAmount: number
  participants: number
  creator?: string
}

export default function HomePage() {
  const router = useRouter()

  const [invited, setInvited] = useState<Hangout[]>([])
  const [active, setActive] = useState<Hangout[]>([])
  const [past, setPast] = useState<Hangout[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const loadHangouts = async () => {
    const stored = localStorage.getItem('wallet_verified')
    let address = ''

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const now = Math.floor(Date.now() / 1000)
        const isVerified = parsed.verified === true && parsed.expires > now
        if (isVerified) address = parsed.address
      } catch {}
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/invited-hangouts?address=${address}`)
      const data = await res.json()

      setInvited(data.invited ?? [])
      setActive(data.active ?? [])
      setPast(data.past ?? [])

      const total =
        (data.invited?.length || 0) +
        (data.active?.length || 0) +
        (data.past?.length || 0)
      setMessage(`Fetched ${total} hangouts.`)
    } catch (err) {
      console.error('Fetch error:', err)
      setMessage('Failed to fetch hangouts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasMounted) {
      loadHangouts()
    }
  }, [hasMounted])

  const handleJoin = async (hangoutId: string, amount: number) => {
    try {
      setMessage(`Joining hangout ${hangoutId} with ${amount} WRD`)

      const initRes = await fetch('/api/initiate-payment', { method: 'POST' })
      const { token } = await initRes.json()

      const decoded = JSON.parse(atob(token.split('.')[1]))
      const reference = decoded.reference

      const payPayload: PayCommandInput = {
        reference,
        to: '0x1aeD17F70c778b889d8C09200Eb3E9da76779AA8',
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(amount, Tokens.WLD).toString(),
          },
        ],
        description: 'Stake to join the hangout',
      }

      if (!MiniKit.isInstalled()) {
        alert('MiniKit is not installed.')
        return
      }

      const { finalPayload } = await MiniKit.commandsAsync.pay(payPayload)
      setMessage(JSON.stringify(finalPayload))

      if (finalPayload.status === 'success') {
        const confirmRes = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: finalPayload, token }),
        })

        const result = await confirmRes.json()
        setMessage(JSON.stringify(result))

        if (result.success) {
          const amountBigInt = parseUnits(amount.toString(), 18)
          await MiniKit.commandsAsync.sendTransaction({
            transaction: [
              {
                address: '0x1aeD17F70c778b889d8C09200Eb3E9da76779AA8',
                abi,
                functionName: 'joinHangout',
                args: [hangoutId, amountBigInt],
              },
            ],
          })

          await loadHangouts()
        }
      }
    } catch (err) {
      console.error('Join error:', err)
      setMessage('❌ Join failed')
    }
  }

  if (!hasMounted) return null

  const sectionStyle = 'space-y-2 mb-6'
  const cardStyle =
    'bg-white border-2 border-black p-4 rounded-pixel shadow-pixel text-left'

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-4 text-text-main font-pixel">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl text-primary mb-6 text-center">👋 Welcome to Hangouts</h1>

        <div className="mb-8 text-center">
          <button
            onClick={() => router.push('/create-hangout')}
            className="btn-primary btn-sm btn-icon"
          >
            ➕ Create
          </button>
        </div>

        <section className={sectionStyle}>
          <h2 className="text-xl text-alert text-center">🎉 Invited Hangouts</h2>
          {invited.length === 0 ? (
            <p className="text-text-light text-center">No invitations right now.</p>
          ) : (
            <div className="space-y-4">
              {invited.map((h) => (
                <div key={h.id} className={`${cardStyle} text-center`}>
                  <h3 className="text-lg">{h.title}</h3>
                  <p className="text-sm text-text-light">⏰ {h.timestamp}</p>
                  <p className="text-sm text-text-light">
                    💰 {h.stake} · 👥 {h.participants}
                  </p>
                  <button
                    onClick={() => handleJoin(h.id, h.stakeAmount)}
                    className="btn-success btn-sm mt-2"
                  >
                    🎮 Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={sectionStyle}>
          <h2 className="text-xl text-success text-center">🕹️ Active Hangouts</h2>
          {active.length === 0 ? (
            <p className="text-text-light text-center">You're not in any active hangouts.</p>
          ) : (
            <div className="space-y-4">
              {active.map((h) => (
                <div key={h.id} className={`${cardStyle} text-center`}>
                  <h3 className="text-lg">{h.title}</h3>
                  <p className="text-sm text-text-light">🟢 {h.timestamp}</p>
                  <p className="text-sm text-text-light">
                    💰 {h.stake} · 👥 {h.participants}
                  </p>
                  <button
                    onClick={() => router.push(`/lobby/${h.id}`)}
                    className="btn-primary btn-sm mt-2"
                  >
                    🏰 Enter Lobby
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={sectionStyle}>
          <h2 className="text-xl text-secondary text-center">📜 Past Hangouts</h2>
          {past.length === 0 ? (
            <p className="text-text-light text-center">No past hangouts yet.</p>
          ) : (
            <div className="space-y-4">
              {past.map((h) => (
                <div key={h.id} className={`${cardStyle} text-center`}>
                  <h3 className="text-lg">{h.title}</h3>
                  <p className="text-sm text-text-light">📅 {h.timestamp}</p>
                  <p className="text-sm text-text-light">
                    💰 {h.stake} · 👥 {h.participants}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="bg-yellow-300 text-black font-mono text-sm p-2 border-2 border-black rounded mt-4 text-center">
          {loading ? '⏳ Loading hangouts...' : `DEBUG: ${message}`}
        </div>
      </div>
    </main>
  )
}
