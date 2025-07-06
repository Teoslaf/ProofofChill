'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import { parseUnits } from 'ethers'
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
      const normalizedStake = stake.replace(',', '.') // ✅ allow comma input
      const wrdAmount = parseUnits(normalizedStake, 18)
      const startTime = Math.floor(new Date(time).getTime() / 1000)
      const durationSeconds = parseInt(duration, 10) * 60
      const endTime = startTime + durationSeconds

      const contractAddress = '0x1aeD17F70c778b889d8C09200Eb3E9da76779AA8'

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: abi,
            functionName: 'createHangout',
            args: [title, wrdAmount, startTime, endTime],
          },
        ],
      })

      setMessage(`✅ Submitted: ${JSON.stringify(finalPayload)}`)
      router.push('/home')
    } catch (error: any) {
      console.error('❌ Transaction failed:', error)
      setMessage(`❌ Error: ${error.message || JSON.stringify(error)}`)
      alert('Transaction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-6 text-text-main font-pixel">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl text-primary mb-8 text-center">🎉 Create a New Hangout</h1>

                        <form onSubmit={handleSubmit} className="space-y-12 w-full">
          <div className="space-y-3">
            <label className="block text-sm font-pixel text-text-main text-center">Hangout Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-4 border-2 border-black rounded-pixel text-base font-pixel bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 text-center"
              placeholder="Enter hangout title..."
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-pixel text-text-main text-center">Stake (WRD)</label>
            <input
              type="text"
              inputMode="decimal"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              required
              placeholder="e.g. 0.01"
              className="w-full p-4 border-2 border-black rounded-pixel text-base font-pixel bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 text-center"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-pixel text-text-main text-center">Start Time</label>
            <input
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full p-4 border-2 border-black rounded-pixel text-base font-pixel bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 text-center"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-pixel text-text-main text-center">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              placeholder="e.g. 30"
              className="w-full p-4 border-2 border-black rounded-pixel text-base font-pixel bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 text-center"
            />
          </div>

        <div className="flex flex-row gap-4 mt-[20px]">
          <button
            onClick={() => router.back()}
            type="button"
            className="btn-secondary btn-lg flex-1"
          >
            ← Back
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary btn-lg flex-1 ${loading ? 'btn-loading' : ''}`}
          >
            {loading ? '⏳ Creating...' : '✅ Create Hangout'}
          </button>
        </div>
      </form>
      </div>
    </main>
  )
}
