import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import abi from '@/app/abi/abi.json'

const CONTRACT_ADDRESS = '0x1aeD17F70c778b889d8C09200Eb3E9da76779AA8'
const RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address || !ethers.isAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 })
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL, {
      name: 'worldchain',
      chainId: 480,
    })

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider)
    const now = Math.floor(Date.now() / 1000)

    // Invited Hangouts
    const [
      invitedIds,
      invitedNames,
      invitedCreators,
      invitedWrdAmounts,
      invitedStartTimes,
	  // eslint-disable-next-line @typescript-eslint/no-unused-vars
      invitedEndTimes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
      invitedIsClosed,
      invitedParticipantCounts,
    ] = await contract.getUserInvitedHangoutsDetails(address)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invited = invitedIds.map((id: any, i: number) => ({
      id: id.toString(),
      title: invitedNames[i],
      creator: invitedCreators[i],
      status: 'invited',
      timestamp: `Starts at ${new Date(Number(invitedStartTimes[i]) * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`,
      stake: `${ethers.formatEther(invitedWrdAmounts[i])} WRD`,
      stakeAmount: Number(ethers.formatEther(invitedWrdAmounts[i])),
      participants: Number(invitedParticipantCounts[i]),
    }))

    // Participated Hangouts
    const [
      partIds,
      partNames,
      partCreators,
      partWrdAmounts,
      partStartTimes,
      partEndTimes,
      partIsClosed,
      partParticipantCounts,
    ] = await contract.getUserParticipatedHangoutsDetails(address)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active: any[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const past: any[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    partIds.forEach((id: any, i: number) => {
      const start = Number(partStartTimes[i])
      const end = Number(partEndTimes[i])
      const isClosed = partIsClosed[i]

      const baseData = {
        id: id.toString(),
        title: partNames[i],
        creator: partCreators[i],
        stake: `${ethers.formatEther(partWrdAmounts[i])} WRD`,
        stakeAmount: Number(ethers.formatEther(partWrdAmounts[i])),
        participants: Number(partParticipantCounts[i]),
      }

      if (isClosed && now > end) {
        past.push({
          ...baseData,
          status: 'completed',
          timestamp: `Ended at ${new Date(end * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}`,
        })
      } else if (now < start) {
        active.push({
          ...baseData,
          status: 'active',
          timestamp: `Starts at ${new Date(start * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}`,
        })
      } else {
        active.push({
          ...baseData,
          status: 'active',
          timestamp: 'Ongoing',
        })
      }
    })

    return NextResponse.json({
      invited,
      active,
      past,
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error reading contract:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
