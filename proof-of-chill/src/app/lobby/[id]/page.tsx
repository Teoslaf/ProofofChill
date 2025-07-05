'use client'

import { MiniKit } from '@worldcoin/minikit-js'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import abi from '@/app/abi/abi.json'

type Participant = {
  username: string
  address: string
}

type Hangout = {
  id: string
  title: string
  stake: string
  timestamp: string
  participants: number
}

export default function LobbyPage() {
  const { id } = useParams()
  const [hangout, setHangout] = useState<Hangout | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [inviteInput, setInviteInput] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Simulate loading hangout & participants
    setHangout({
      id: id as string,
      title: 'Legendary Pizza Party',
      stake: '10 WRD',
      timestamp: 'Ongoing',
      participants: 4,
    })

    setParticipants([
      { username: 'PlayerOne', address: '0x123...' },
      { username: 'PixelGoddess', address: '0x456...' },
      { username: 'RetroBoi', address: '0x789...' },
      { username: 'ZeldaLuvr', address: '0xabc...' },
    ])
  }, [id])

  const handleInvite =  async () => {
    if (!inviteInput.trim() || !hangout?.id) return
    const contractAddress = '0x98D36c698b6305e1f15be3A6aa333D5bDcD3e18E'
    const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: abi,
            functionName: 'inviteToHangout',
            args: [hangout.id, inviteInput],
          },
        ],
      })
    setMessage(`Invite sent to ${inviteInput}!`)
    setInviteInput('')
  }

  const handleKick = (username: string) => {
    setMessage(`Vote kick requested for ${username}`)
  }

  const cardStyle =
    'bg-white border-2 border-black p-4 rounded-pixel shadow-pixel text-left'

  return (
    <main className="min-h-screen bg-bg p-4 text-text-main font-pixel">
      <h1 className="text-3xl text-primary mb-4">🏰 Hangout Lobby</h1>

      {hangout && (
        <div className={`${cardStyle} mb-6`}>
          <h2 className="text-xl">{hangout.title}</h2>
          <p className="text-sm text-text-light">🕒 {hangout.timestamp}</p>
          <p className="text-sm text-text-light">
            💰 {hangout.stake} · 👥 {hangout.participants} participants
          </p>
        </div>
      )}

      <section className="space-y-4 mb-6">
        {participants.map((p) => (
          <div key={p.address} className={cardStyle}>
            <h3 className="text-lg">{p.username}</h3>
            <p className="text-sm text-text-light">🧾 {p.address}</p>
            <button
              onClick={() => handleKick(p.username)}
              className="mt-2 bg-alert px-3 py-1 border-2 border-black rounded-pixel text-sm text-white"
            >
              🗳️ Vote Kick
            </button>
          </div>
        ))}
      </section>

      <div className={`${cardStyle} flex items-center gap-2`}>
        <input
          type="text"
          value={inviteInput}
          onChange={(e) => setInviteInput(e.target.value)}
          placeholder="Enter address or username"
          className="flex-grow p-2 border-2 border-black rounded-pixel text-sm"
        />
        <button
          onClick={handleInvite}
          className="bg-success px-3 py-2 text-sm border-2 border-black rounded-pixel"
        >
          Invite
        </button>
      </div>

      {message && (
        <div className="bg-yellow-300 text-black font-mono text-sm p-2 border-2 border-black rounded mt-4">
          DEBUG: {message}
        </div>
      )}
    </main>
  )
}
