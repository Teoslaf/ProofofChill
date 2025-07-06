import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'

export async function POST() {
  const uuid = crypto.randomUUID().replace(/-/g, '')

  const secret = new TextEncoder().encode('HAKATONSECRET')
  const token = await new SignJWT({ reference: uuid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m') // token valid for 10 minutes
    .sign(secret)

  return NextResponse.json({ token })
}
