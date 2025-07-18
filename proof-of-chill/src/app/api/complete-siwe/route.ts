import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { verifySiweMessage } from '@worldcoin/minikit-js'

export async function POST(req: NextRequest) {
  const { payload, nonce } = await req.json()

  const cookieStore = await cookies()
  const storedNonce = cookieStore.get('siwe')?.value
  if (!storedNonce || nonce !== storedNonce) {
    return NextResponse.json({
      status: 'error',
      isValid: false,
      message: 'Nonce mismatch',
    })
  }

  try {
    const { isValid } = await verifySiweMessage(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload as any,
      nonce
    )

    return NextResponse.json({
        status: 'success',
        isValid,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
        address: (payload as any).result?.address || (payload as any).address
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      isValid: false,
      message: err.message,
    })
  }
}
