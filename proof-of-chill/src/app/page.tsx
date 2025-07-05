'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  MiniKit,
  WalletAuthInput,
  IWalletAuthSuccessResult,
} from '@worldcoin/minikit-js'

export default function LandingPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('wallet_verified')
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

    if (isVerified) {
      router.push('/home')
    }
  }, [router])

  const handleWalletAuth = async () => {
    if (!MiniKit.isInstalled()) {
      alert('World App not detected. Please open this app inside World App.')
      return
    }

    try {
      const res = await fetch('/api/nonce')
      const { nonce } = await res.json()

      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        statement: 'Log in to Hangouts',
      })

      if (finalPayload.status === 'error') {
        console.error('❌ Wallet Auth error:', finalPayload)
        alert('Authentication failed or was cancelled.')
        return
      }

      const response = await fetch('/api/complete-siwe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: finalPayload, nonce }),
      })

      const result = await response.json()
      if (result.status === 'success' && result.isValid) {
        localStorage.setItem(
          'wallet_verified',
          JSON.stringify({
            verified: true,
            expires: Math.floor(Date.now() / 1000) + 3600,// 1hr validity
            address: result.address
          })
        )
        setMessage(result.address)
        router.push('/home')
      } else {
        alert('Authentication backend rejected the proof.')
      }
    } catch (err) {
      console.error('🛑 Error during wallet auth:', err)
      alert('Unexpected error occurred.')
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
          onClick={handleWalletAuth}
          className="font-pixel bg-primary text-white text-xl px-6 py-3 border-2 border-black rounded-pixel shadow-pixel hover:translate-y-1 transition-all"
        >
          Sign in with Ethereum Wallet
        </button>
      </div>
      <div className="bg-yellow-300 text-black font-mono text-sm p-2 border-2 border-black rounded mt-4">
        DEBUG: {message}
      </div>
    </main>
  )
}
