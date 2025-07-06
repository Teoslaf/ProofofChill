// /app/api/hangout-details/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import abi from '@/app/abi/abi.json'

const CONTRACT_ADDRESS = '0xB11746F70BA49Ac99E2b8242CFf5E07f22690e3F'
const RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing hangout ID' }, { status: 400 })
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider)
    const data = await contract.getHangoutDetails(id)

    const hangout = {
      id,
      title: data.name,
      creator: data.creator,
      stake: ethers.formatUnits(data.wrdAmount, 18),
      startTime: Number(data.startTime),
      endTime: Number(data.endTime),
      isClosed: data.isClosed,
      participants: data.participants,
      invited: data.invited,
    }

    return NextResponse.json(hangout)
  } catch (err: any) {
    console.error('Error fetching hangout details:', err)
    return NextResponse.json({ error: 'Failed to fetch hangout details' }, { status: 500 })
  }
}
