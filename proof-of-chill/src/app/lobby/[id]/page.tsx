'use client'

import { MiniKit } from '@worldcoin/minikit-js'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import abi from '@/app/abi/abi.json'

type Participant = {
  username?: string
  address: string
}

type Hangout = {
  id: string
  title: string
  stake: string
  startTime: string
  endTime: string
  isClosed: boolean
  participants: Participant[]
  invited: string[]
}

export default function LobbyPage() {
  const { id } = useParams()
  const router = useRouter()

  const [hangout, setHangout] = useState<Hangout | null>(null)
  const [inviteInput, setInviteInput] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchHangout = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/hangout-details?id=${id}`)
        const data = await res.json()

        if (res.ok) {
          const fetchedParticipants: Participant[] = await Promise.all(
            data.participants.map(async (addr: string) => {
              try {
                const user = await MiniKit.getUserByAddress(addr)
                return {
                  address: addr,
                  username: user?.username || undefined,
                }
              } catch {
                return { address: addr }
              }
            })
          )

          setHangout({
            id: data.id,
            title: data.title,
            stake: `${data.stake} WRD`,
            startTime: new Date(data.startTime * 1000).toLocaleString(),
            endTime: new Date(data.endTime * 1000).toLocaleString(),
            isClosed: data.isClosed,
            participants: fetchedParticipants,
            invited: data.invited,
          })
        } else {
          setMessage(`Error: ${data.error}`)
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setMessage('❌ Failed to load hangout')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchHangout()
  }, [id])

  const handleInvite = async () => {
    if (!inviteInput.trim() || !hangout?.id) return

    try {
      const contractAddress = '0x1aeD17F70c778b889d8C09200Eb3E9da76779AA8'
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: abi,
            functionName: 'inviteToHangout',
            args: [hangout.id, inviteInput],
          },
        ],
      })
      setMessage(`✅ Invite sent to ${inviteInput}`)
      setInviteInput('')
    } catch (error) {
      console.error(error)
      setMessage('❌ Failed to send invite')
    }
  }

  const handleEndHangout = async () => {
    if (!hangout?.id) return

    try {
      const contractAddress = '0x1aeD17F70c778b889d8C09200Eb3E9da76779AA8'
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: abi,
            functionName: 'closeHangout',
            args: [hangout.id],
          },
        ],
      })
      setMessage(`✅ Hangout closed`)
    } catch (error) {
      console.error(error)
      setMessage('❌ Failed to close hangout')
    }
  }

  const handleKick =  async(address: string) => {
    const contractAddress = '0x1aeD17F70c778b889d8C09200Eb3E9da76779AA8'

    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: contractAddress,
          abi: abi,
          functionName: 'voteOut',
          args: [hangout?.id,address],
        },
      ],
    })
    setMessage(JSON.stringify(finalPayload))
  }

  const cardStyle =
    'bg-white border-2 border-black p-4 rounded-pixel shadow-pixel text-left'

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-4 text-text-main font-pixel">
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="btn-secondary btn-sm">
            ← Back
          </button>
          <button onClick={handleEndHangout} className="btn-alert btn-sm">
            🔥 End Hangout
          </button>
        </div>

        <h1 className="text-3xl text-primary mb-6 text-center">🏰 Hangout Lobby</h1>

        {hangout ? (
          <>
            <div className={`${cardStyle} mb-6 text-center`}>
              <h2 className="text-xl">{hangout.title}</h2>
              <p className="text-sm text-text-light">🕒 {hangout.startTime} → {hangout.endTime}</p>
              <p className="text-sm text-text-light">
                💰 {hangout.stake} · 👥 {hangout.participants.length} participants
              </p>
              <p className="text-sm text-text-light">
                {hangout.isClosed ? '🔒 Closed' : '🟢 Open'}
              </p>
            </div>

            <section className="space-y-4 mb-6">
              {hangout.participants.map((p) => (
                <div key={p.address} className={`${cardStyle} text-center`}>
                  <h3 className="text-lg">{p.username ?? 'Anonymous'}</h3>
                  <p className="text-sm text-text-light">🧾 {p.address}</p>
                  <button
                    onClick={() => handleKick(p.address)}
                    className="btn-kick btn-sm mt-2"
                  >
                    🗳️ Vote Kick
                  </button>
                </div>
              ))}
            </section>

            <div className={`${cardStyle} flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-[20px]`}>
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Enter address or username"
                className="flex-grow p-3 border-2 border-black rounded-pixel text-sm font-pixel bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 text-center"
              />
              <button onClick={handleInvite} className="btn-success btn-sm">
                📨 Invite
              </button>
            </div>
          </>
        ) : (
          <p className="text-text-light text-center">
            {loading ? '⏳ Loading...' : 'Hangout not found.'}
          </p>
        )}

        {message && (
          <div className="bg-yellow-300 text-black font-mono text-sm p-2 border-2 border-black rounded mt-4 text-center">
            DEBUG: {message}
          </div>
        )}
      </div>
    </main>
  )
}
