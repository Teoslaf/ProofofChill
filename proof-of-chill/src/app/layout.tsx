import './globals.css'
import { VT323 } from 'next/font/google'
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';

const vt323 = VT323({
  subsets: ['latin'],
  weight: '400',
})

export const metadata = {
  title: 'Hangouts',
  description: 'Stay chill. Stake ETH. No phones.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={vt323.className}>
      <MiniKitProvider>
        <body className="bg-bg text-text-main">{children}</body>
      </MiniKitProvider>
    </html>
  )
}
