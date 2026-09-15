"use client";

import Link from "next/link";
import { useState } from "react";
import { useEmeralds } from "./context/EmeraldContext";

type Skin = {
  id: number;
  name: string;
  value: number;
  emoji: string;
  wear: string;
  rarity: string;
};

const skins: Skin[] = [
  {
    id: 1,
    name: "AK-47 | Redline",
    value: 1000,
    emoji: "🔫",
    wear: "Field-Tested",
    rarity: "Classified",
  },
  {
    id: 2,
    name: "AWP | Asiimov",
    value: 750,
    emoji: "🎯",
    wear: "Field-Tested",
    rarity: "Covert",
  },
  {
    id: 3,
    name: "M4A1-S | Printstream",
    value: 500,
    emoji: "🔫",
    wear: "Minimal Wear",
    rarity: "Covert",
  },
];

export default function Home() {
  const { balance, claimedSkinIds, claimSkin } = useEmeralds();
  const [message, setMessage] = useState("");

  const availableSkins = skins.filter(
    (skin) => !claimedSkinIds.includes(skin.id)
  );

  function handleClaim(skin: Skin) {
    const received = Math.round(skin.value * 0.91);

    const success = claimSkin(skin.id, received);

    if (!success) {
      setMessage(`${skin.name} has already been claimed.`);
      return;
    }

    setMessage(
      `${skin.name} claimed — +${received.toLocaleString(
        "en-US"
      )} Emeralds`
    );

    setTimeout(() => setMessage(""), 2500);
  }

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      <header className="border-b border-emerald-900/40 bg-[#091610]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-black tracking-wide text-emerald-400"
          >
            💎 EMERALD
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden gap-6 text-sm text-gray-400 md:flex">
              <Link
                href="/joker-poker"
                className="hover:text-white"
              >
                Joker Poker
              </Link>

              <Link
                href="/blackjack"
                className="hover:text-white"
              >
                Blackjack
              </Link>

              <span className="cursor-not-allowed text-gray-600">
                Poker
              </span>
            </nav>

            <div className="rounded-xl border border-emerald-800/50 bg-[#0d1c15] px-4 py-2">
              <span className="text-sm text-gray-400">
                Balance
              </span>

              <div className="font-bold text-emerald-400">
                💎 {balance.toLocaleString("en-US")}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="mb-5 inline-block rounded-full border border-emerald-800/50 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-400">
          DEMO CASINO
        </div>

        <h1 className="text-5xl font-black tracking-tight md:text-7xl">
          Welcome to{" "}
          <span className="text-emerald-400">
            Emerald
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          A dark Emerald-themed CS2 casino demo.
          Play with virtual Emeralds and try the
          available games.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/joker-poker"
            className="rounded-xl bg-emerald-500 px-7 py-3 font-bold text-black transition hover:bg-emerald-400"
          >
            Play Joker Poker
          </Link>

          <Link
            href="/blackjack"
            className="rounded-xl border border-emerald-800 bg-[#0d1c15] px-7 py-3 font-bold text-white transition hover:border-emerald-500"
          >
            Play Blackjack
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-8">
          <h2 className="text-3xl font-black">
            Games
          </h2>

          <p className="mt-2 text-gray-500">
            Choose a game and play with your Emerald
            balance.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Link
            href="/joker-poker"
            className="rounded-2xl border border-emerald-900/50 bg-[#0b1812] p-6 transition hover:border-emerald-500/60"
          >
            <div className="text-4xl">🃏</div>

            <h3 className="mt-4 text-xl font-bold">
              Joker Poker
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Hold your cards, draw new ones, and play
              Joker Poker with virtual Emeralds.
            </p>
          </Link>

          <Link
            href="/blackjack"
            className="rounded-2xl border border-emerald-900/50 bg-[#0b1812] p-6 transition hover:border-emerald-500/60"
          >
            <div className="text-4xl">🃏</div>

            <h3 className="mt-4 text-xl font-bold">
              Blackjack
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Beat the dealer and increase your Emerald
              balance.
            </p>
          </Link>

          <div className="rounded-2xl border border-gray-800 bg-[#0b1812] p-6 opacity-50">
            <div className="text-4xl">♠️</div>

            <h3 className="mt-4 text-xl font-bold">
              Poker
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Coming soon.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8">
          <h2 className="text-3xl font-black">
            Demo Inventory
          </h2>

          <p className="mt-2 text-gray-500">
            Claim each demo skin once. 9% demo fee is
            applied.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-emerald-800/50 bg-emerald-950/40 px-5 py-4 text-center font-semibold text-emerald-400">
            {message}
          </div>
        )}

        {availableSkins.length === 0 ? (
          <div className="rounded-2xl border border-emerald-900/50 bg-[#0b1812] p-10 text-center">
            <div className="text-4xl">✅</div>

            <h3 className="mt-4 text-xl font-bold">
              All demo skins claimed
            </h3>

            <p className="mt-2 text-gray-500">
              You have already claimed every available
              demo skin.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {availableSkins.map((skin) => {
              const received = Math.round(
                skin.value * 0.91
              );

              return (
                <div
                  key={skin.id}
                  className="rounded-2xl border border-emerald-900/50 bg-[#0b1812] p-6"
                >
                  <div className="flex items-center justify-center rounded-xl bg-[#101f17] py-10 text-7xl">
                    {skin.emoji}
                  </div>

                  <div className="mt-5">
                    <h3 className="font-bold">
                      {skin.name}
                    </h3>

                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Wear
                        </span>

                        <span>{skin.wear}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Rarity
                        </span>

                        <span>{skin.rarity}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Value
                        </span>

                        <span className="font-bold text-emerald-400">
                          💎{" "}
                          {skin.value.toLocaleString(
                            "en-US"
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          You receive
                        </span>

                        <span className="font-bold text-white">
                          💎{" "}
                          {received.toLocaleString(
                            "en-US"
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleClaim(skin)}
                      className="mt-5 w-full rounded-xl bg-emerald-500 py-3 font-bold text-black transition hover:bg-emerald-400"
                    >
                      Claim Skin
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}