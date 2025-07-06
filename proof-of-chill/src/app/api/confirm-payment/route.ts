import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload
  token: string // the JWT sent from the frontend
}

export async function POST(req: NextRequest) {
  const { payload, token } = (await req.json()) as IRequestPayload

  try {
    // ✅ Verify token
    const { payload: jwtPayload } = await jwtVerify(
      token,
      new TextEncoder().encode('HAKATONSECRET')
    )

    const referenceFromJWT = jwtPayload.reference

    // ✅ Check that the reference matches
    if (payload.reference !== referenceFromJWT) {
      return NextResponse.json({ success: false, error: 'Invalid reference' }, { status: 400 })
    }

    // ✅ Confirm the transaction from Worldcoin API
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.APP_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
        },
      }
    )

    const transaction = await response.json()

    if (transaction.reference === referenceFromJWT && transaction.status !== 'failed') {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false })
    }
  } catch (error) {
    console.error('❌ Token verification failed:', error)
    return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 })
  }
}
