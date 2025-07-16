"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MiniKit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  WalletAuthInput,
} from "@worldcoin/minikit-js";

export default function LandingPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("wallet_verified");
    let isVerified = false;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Math.floor(Date.now() / 1000);
        isVerified = parsed.verified === true && parsed.expires > now;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        isVerified = false;
      }
    }

    if (isVerified) {
      router.push("/home");
    }
  }, [router]);

  const handleWalletAuth = async () => {
    if (!MiniKit.isInstalled()) {
      alert("World App not detected. Please open this app inside World App.");
      return;
    }

    try {
      const res = await fetch("/api/nonce");
      const { nonce } = await res.json();

      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        statement: "Log in to Hangouts",
      });

      if (finalPayload.status === "error") {
        console.error("❌ Wallet Auth error:", finalPayload);
        alert("Authentication failed or was cancelled.");
        return;
      }

      const response = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: finalPayload, nonce }),
      });

      const result = await response.json();
      if (result.status === "success" && result.isValid) {
        localStorage.setItem(
          "wallet_verified",
          JSON.stringify({
            verified: true,
            expires: Math.floor(Date.now() / 1000) + 3600, // 1hr validity
            address: result.address,
          })
        );
        setMessage(result.address);
        router.push("/home");
      } else {
        alert("Authentication backend rejected the proof.");
      }
    } catch (err) {
      console.error("🛑 Error during wallet auth:", err);
      alert("Unexpected error occurred.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
      <div className="text-center space-y-8 max-w-md w-full">
        <h1 className="text-4xl font-pixel text-primary shadow-pixel">
          👾 Hangouts
        </h1>
        <p className="text-text-light text-xl font-pixel">
          Stay social or pay the price
        </p>

        <button
          onClick={handleWalletAuth}
          className="btn-primary btn-lg btn-full btn-icon"
        >
          👛 Sign in with Wallet
        </button>
      </div>
    </main>
  );
}
