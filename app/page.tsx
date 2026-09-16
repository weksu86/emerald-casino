"use client";

import Link from "next/link";
import { useEmeralds } from "./context/EmeraldContext";

export default function Home() {
  const { balance } = useEmeralds();

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">
      {/* HEADER */}
      <header className="border-b border-[#6C2BD9]/30 bg-[#0B0B0F]">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-4">
          <Link
            href="/"
            className="shrink-0 text-xl font-black text-[#F5C542]"
          >
            💎 EMERALD
          </Link>

          <div className="hidden flex-1 items-center md:flex">
            {/* GAMES */}
            <nav className="ml-10 flex items-center gap-6 text-sm text-gray-500">
              <Link
                href="/"
                className="font-bold text-white"
              >
                Home
              </Link>

              <Link
                href="/joker-poker"
                className="transition hover:text-white"
              >
                Joker Poker
              </Link>

              <Link
                href="/blackjack"
                className="transition hover:text-white"
              >
                Blackjack
              </Link>
            </nav>

            {/* DEPOSIT / WITHDRAW */}
            <nav className="ml-auto mr-6 flex items-center gap-3">
              <Link
                href="/deposit"
                className="rounded-lg border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 text-xs font-black text-gray-300 transition hover:border-[#6C2BD9] hover:text-white"
              >
                DEPOSIT
              </Link>

              <Link
                href="/withdraw"
                className="rounded-lg border border-[#F5C542]/30 bg-[#15131D] px-4 py-2 text-xs font-black text-[#F5C542] transition hover:border-[#F5C542]"
              >
                WITHDRAW
              </Link>
            </nav>
          </div>

          {/* BALANCE */}
          <div className="ml-auto rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 md:ml-0">
            <div className="text-[9px] font-bold text-gray-500">
              BALANCE
            </div>

            <div className="font-black text-[#F5C542]">
              💎 {balance.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* HERO */}
        <div className="rounded-3xl border border-[#6C2BD9]/40 bg-[radial-gradient(circle_at_top,#29134f,#151020,#0B0B0F)] px-6 py-14 text-center shadow-[0_0_60px_rgba(108,43,217,0.12)]">
          <div className="text-sm font-black uppercase tracking-[0.4em] text-[#6C2BD9]">
            Emerald Casino
          </div>

          <h1 className="mt-3 text-5xl font-black tracking-tight text-white md:text-7xl">
            PLAY WITH
            <span className="block text-[#F5C542]">
              EMERALDS
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-gray-500">
            Welcome to Emerald. Try our casino games
            using virtual Emeralds in this demo.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/joker-poker"
              className="rounded-xl bg-[#6C2BD9] px-7 py-3 text-sm font-black text-white transition hover:bg-[#7d3be8]"
            >
              PLAY JOKER POKER
            </Link>

            <Link
              href="/blackjack"
              className="rounded-xl border border-[#F5C542]/40 bg-[#15131D] px-7 py-3 text-sm font-black text-[#F5C542] transition hover:border-[#F5C542]"
            >
              PLAY BLACKJACK
            </Link>
          </div>
        </div>

        {/* GAMES */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {/* JOKER POKER */}
          <div className="rounded-2xl border border-[#6C2BD9]/30 bg-[#111116] p-6">
            <div className="text-3xl">
              🃏
            </div>

            <h2 className="mt-4 text-lg font-black">
              JOKER POKER
            </h2>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Hold your cards, draw once and try to
              hit the biggest hands.
            </p>

            <Link
              href="/joker-poker"
              className="mt-5 inline-block text-xs font-black text-[#F5C542] transition hover:text-white"
            >
              PLAY NOW →
            </Link>
          </div>

          {/* BLACKJACK */}
          <div className="rounded-2xl border border-[#6C2BD9]/30 bg-[#111116] p-6">
            <div className="text-3xl">
              ♠️
            </div>

            <h2 className="mt-4 text-lg font-black">
              BLACKJACK
            </h2>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Play classic blackjack against the
              dealer using virtual Emeralds.
            </p>

            <Link
              href="/blackjack"
              className="mt-5 inline-block text-xs font-black text-[#F5C542] transition hover:text-white"
            >
              PLAY NOW →
            </Link>
          </div>

          {/* POKER COMING SOON */}
          <div className="rounded-2xl border border-[#6C2BD9]/20 bg-[#111116] p-6 opacity-50">
            <div className="text-3xl">
              🂡
            </div>

            <h2 className="mt-4 text-lg font-black">
              POKER
            </h2>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Coming soon.
            </p>

            <span className="mt-5 inline-block text-xs font-black text-gray-600">
              COMING SOON
            </span>
          </div>
        </div>

        {/* DEMO NOTICE */}
        <div className="mt-8 rounded-2xl border border-[#6C2BD9]/20 bg-[#111116] px-6 py-5 text-center">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#F5C542]">
            💎 Emeralds
          </div>

          <p className="mt-2 text-xs text-gray-600">
            This is a demo using virtual currency.
            No real-money deposits, withdrawals or
            Steam item transfers are connected.
          </p>
        </div>
      </section>
    </main>
  );
}