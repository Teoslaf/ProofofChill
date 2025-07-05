'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import abi from '@/app/abi/abi.json'

export default function CreateHangoutPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [stake, setStake] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const wrdAmount = BigInt(parseFloat(stake) * 1e18)
      const startTime = Math.floor(new Date(time).getTime() / 1000)
      const durationSeconds = parseInt(duration, 10) * 60
      const endTime = startTime + durationSeconds

      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: process.env.CONTRACT_ADDRESS as string,
            abi: abi,
            functionName: 'createHangout',
            args: [title, wrdAmount, startTime, endTime],
          },
        ],
      })

      setMessage(JSON.stringify(finalPayload))
      router.push('/home')
    } catch (error) {
      setMessage(JSON.stringify(error))
      console.error('❌ Transaction failed:', error)
      alert('Transaction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg p-4 text-text-main font-pixel">
      <h1 className="text-2xl text-primary mb-4">🎉 Create a New Hangout</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block mb-1 text-sm">Hangout Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-2 border-2 border-black rounded-pixel text-base"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Stake (WRD)</label>
          <input
            type="number"
            inputMode="decimal"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            required
            className="w-full p-2 border-2 border-black rounded-pixel text-base"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Start Time</label>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full p-2 border-2 border-black rounded-pixel text-base"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            className="w-full p-2 border-2 border-black rounded-pixel text-base"
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => router.back()}
            type="button"
            className="bg-secondary text-white px-4 py-2 border-2 border-black rounded-pixel shadow-pixel text-sm"
          >
            ← Back
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-4 py-2 border-2 border-black rounded-pixel shadow-pixel text-sm"
          >
            {loading ? '⏳ Creating...' : '✅ Create Hangout'}
          </button>
        </div>
      </form>

      <div className="bg-yellow-300 text-black font-mono text-sm p-2 border-2 border-black rounded mt-4">
        DEBUG: {message}
      </div>
    </main>
  )
}
