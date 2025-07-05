'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  MiniKit,
  VerifyCommandInput,
  VerificationLevel,
  ISuccessResult,
} from '@worldcoin/minikit-js'

export default function LandingPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')

  useEffect(() => {
    const isVerified = localStorage.getItem('worldID_verified') === 'true'
    if (isVerified) {
      router.push('/home')
    }
  }, [router])

  const handleVerify = async () => {
    if (!MiniKit.isInstalled()) {
      alert('World App not detected. Please open this app inside World App.')
      return
    }

    const verifyPayload: VerifyCommandInput = {
      action: 'hangout', // Make sure this matches your registered action ID
      verification_level: VerificationLevel.Orb,
    }

    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload)
      setMessage(JSON.stringify(finalPayload))
      if (finalPayload.status === 'error') {
        console.error('❌ Verification error:', finalPayload)
        alert('Verification failed or was cancelled.')
        return
      }

      // Send result to your backend
      const verifyResponse = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: 'hangout',
        }),
      })

      const verifyJson = await verifyResponse.json()

      if (verifyJson?.status == 200) {
        setMessage("Verified")
        localStorage.setItem('worldID_verified', 'true')
        router.push('/home')
      } else {
        alert('Verification backend rejected the proof.')
      }
    } catch (err) {
      console.error('🛑 Unexpected error:', err)
      alert('Something went wrong during verification.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <h1 className="text-4xl font-pixel text-primary shadow-pixel">
          👾 Hangouts
        </h1>
        <p className="text-text-light text-xl font-pixel">
          Stay chill. Stake ETH. No phones.
        </p>

        <button
          onClick={handleVerify}
          className="font-pixel bg-primary text-white text-xl px-6 py-3 border-2 border-black rounded-pixel shadow-pixel hover:translate-y-1 transition-all"
        >
          Sign in with World ID
        </button>
      </div>
      <div className="bg-yellow-300 text-black font-mono text-sm p-2 border-2 border-black rounded mt-4">
        DEBUG: {message}
      </div>
    </main>
  )
}
