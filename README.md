# 🧩 Hangouts dApp

**Hangouts** is a decentralized social coordination app built on the Worldcoin ecosystem. It allows users to create, join, and manage hangouts using WRLD tokens as stake-based participation.

## Features

- 📅 Create time-bound hangouts with WRLD staking
- 📨 Invite users via wallet address or username
- 🔐 Smart contract enforcement of participation
- 🏰 Enter lobbies to see participants and manage interactions
- 🗳️ Vote to kick users from a hangout
- 💳 Worldcoin MiniKit payment integration

## Tech Stack

- **Next.js** (App Router)
- **Worldcoin MiniKit SDK**
- **Ethers.js** for smart contract interaction
- **Tailwind CSS** with custom 16-bit pixel UI
- **Solidity** smart contract on World Chain

## Smart Contract Functions

- `createHangout(name, amount, start, end)`
- `joinHangout(id, amount)`
- `inviteToHangout(id, user)`
- `getHangoutDetails(id)`
- `getUserInvitedHangoutsDetails(address)`

## License

MIT
