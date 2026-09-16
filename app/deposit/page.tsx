"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";

type DepositItem = {
  id: number;
  name: string;
  value: number;
  image: string;
  wear: string;
  rarity: string;
};

const depositItems: DepositItem[] = [
  {
    id: 1,
    name: "AK-47 | Redline",
    value: 1000,
    image: "/skins/ak47-redline.png",
    wear: "Field-Tested",
    rarity: "Classified",
  },
  {
    id: 2,
    name: "AWP | Asiimov",
    value: 750,
    image: "/skins/awp-asiimov.png",
    wear: "Field-Tested",
    rarity: "Covert",
  },
  {
    id: 3,
    name: "M4A1-S | Printstream",
    value: 500,
    image: "/skins/m4a1s-printstream.png",
    wear: "Minimal Wear",
    rarity: "Covert",
  },
];

export default function DepositPage() {
  const {
    balance,
    depositedSkinIds,
    depositSkin,
  } = useEmeralds();

  const [depositingId, setDepositingId] =
    useState<number | null>(null);

  const [depositedItem, setDepositedItem] =
    useState<DepositItem | null>(null);

  const [
    showDepositAnimation,
    setShowDepositAnimation,
  ] = useState(false);

  const [message, setMessage] = useState("");

  function deposit(item: DepositItem) {
    if (depositingId !== null) return;

    if (depositedSkinIds.includes(item.id)) {
      return;
    }

    setDepositingId(item.id);
    setMessage("");

    setTimeout(() => {
      const deposited = depositSkin(
        item.id,
        item.value
      );

      if (!deposited) {
        setDepositingId(null);
        return;
      }

      setDepositedItem(item);
      setShowDepositAnimation(true);

      setMessage(
        `${item.name} deposited — +${item.value.toLocaleString(
          "en-US"
        )} Emeralds`
      );

      setDepositingId(null);

      setTimeout(() => {
        setShowDepositAnimation(false);
      }, 2800);

      setTimeout(() => {
        setMessage("");
      }, 3000);
    }, 700);
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">
      {/* FULL SCREEN DEPOSIT ANIMATION */}
      {showDepositAnimation && depositedItem && (
        <div className="deposit-reveal fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#0B0B0F]/95 backdrop-blur-md">
          <div className="deposit-glow absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6C2BD9]/25 blur-[120px]" />

          <div className="deposit-ring absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#F5C542]/70" />

          <div className="deposit-flash absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5C542]/30 blur-[30px]" />

          <span className="particle particle-1">
            💎
          </span>

          <span className="particle particle-2">
            ✦
          </span>

          <span className="particle particle-3">
            💎
          </span>

          <span className="particle particle-4">
            ✦
          </span>

          <span className="particle particle-5">
            💎
          </span>

          <span className="particle particle-6">
            ✦
          </span>

          <span className="particle particle-7">
            💎
          </span>

          <span className="particle particle-8">
            ✦
          </span>

          <div className="deposit-content relative z-20 flex flex-col items-center text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.45em] text-[#20C997]">
              DEPOSIT SUCCESSFUL
            </div>

            <div className="relative mt-7">
              <div className="item-halo absolute -inset-8 rounded-full bg-[#6C2BD9]/30 blur-[45px]" />

              <div className="item-card relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-[40px] border-2 border-[#F5C542] bg-[radial-gradient(circle_at_center,#4a2087,#24103f,#0B0B0F)] shadow-[0_0_80px_rgba(245,197,66,0.3)]">
                <Image
                  src={depositedItem.image}
                  alt={depositedItem.name}
                  width={300}
                  height={220}
                  className="h-auto w-[90%] object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
                  priority
                />
              </div>
            </div>

            <h2 className="mt-7 max-w-xl px-5 text-3xl font-black text-white md:text-5xl">
              {depositedItem.name}
            </h2>

            <div className="mt-2 text-sm font-bold text-gray-500">
              {depositedItem.wear}
            </div>

            <div className="value-reveal mt-6 rounded-2xl border border-[#F5C542]/50 bg-[#15131D] px-8 py-4 shadow-[0_0_40px_rgba(245,197,66,0.18)]">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#20C997]">
                EMERALDS ADDED
              </div>

              <div className="mt-1 text-3xl font-black text-[#F5C542]">
                + 💎{" "}
                {depositedItem.value.toLocaleString(
                  "en-US"
                )}
              </div>
            </div>

            <div className="mt-7 text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">
              DEMO ONLY
            </div>
          </div>

          <style jsx>{`
            .deposit-reveal {
              animation: screenIn 0.25s ease-out both;
            }

            .deposit-glow {
              animation: glowReveal 1.4s ease-out
                both;
            }

            .deposit-ring {
              animation: ringExpand 1.1s ease-out
                both;
            }

            .deposit-flash {
              animation: flash 0.7s ease-out both;
            }

            .deposit-content {
              animation: contentReveal 0.65s
                cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .item-card {
              animation: itemReveal 0.75s
                cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .item-halo {
              animation: halo 1.8s ease-in-out
                infinite alternate;
            }

            .value-reveal {
              animation: valueReveal 0.55s ease-out
                0.35s both;
            }

            .particle {
              position: absolute;
              left: 50%;
              top: 50%;
              font-size: 24px;
              opacity: 0;
              color: #f5c542;
            }

            .particle-1 {
              --x: -280px;
              --y: -180px;
              animation: particleMove 1.1s ease-out
                0.1s both;
            }

            .particle-2 {
              --x: 260px;
              --y: -190px;
              animation: particleMove 1.2s ease-out
                0.15s both;
            }

            .particle-3 {
              --x: -330px;
              --y: 40px;
              animation: particleMove 1.25s ease-out
                0.05s both;
            }

            .particle-4 {
              --x: 340px;
              --y: 50px;
              animation: particleMove 1.1s ease-out
                0.2s both;
            }

            .particle-5 {
              --x: -230px;
              --y: 220px;
              animation: particleMove 1.3s ease-out
                0.12s both;
            }

            .particle-6 {
              --x: 230px;
              --y: 230px;
              animation: particleMove 1.2s ease-out
                0.08s both;
            }

            .particle-7 {
              --x: -80px;
              --y: -290px;
              animation: particleMove 1.15s ease-out
                0.18s both;
            }

            .particle-8 {
              --x: 100px;
              --y: 290px;
              animation: particleMove 1.25s ease-out
                0.14s both;
            }

            @keyframes screenIn {
              from {
                opacity: 0;
              }

              to {
                opacity: 1;
              }
            }

            @keyframes glowReveal {
              0% {
                opacity: 0;
                transform: translate(-50%, -50%)
                  scale(0.2);
              }

              45% {
                opacity: 1;
              }

              100% {
                opacity: 0.55;
                transform: translate(-50%, -50%)
                  scale(1.15);
              }
            }

            @keyframes ringExpand {
              0% {
                opacity: 1;
                transform: translate(-50%, -50%)
                  scale(0.15);
              }

              100% {
                opacity: 0;
                transform: translate(-50%, -50%)
                  scale(3.8);
              }
            }

            @keyframes flash {
              0% {
                opacity: 0;
                transform: translate(-50%, -50%)
                  scale(0.2);
              }

              25% {
                opacity: 1;
              }

              100% {
                opacity: 0;
                transform: translate(-50%, -50%)
                  scale(4);
              }
            }

            @keyframes contentReveal {
              from {
                opacity: 0;
                transform: scale(0.88);
              }

              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes itemReveal {
              0% {
                opacity: 0;
                transform: scale(0.35)
                  rotate(-6deg);
              }

              100% {
                opacity: 1;
                transform: scale(1)
                  rotate(0deg);
              }
            }

            @keyframes halo {
              from {
                opacity: 0.35;
                transform: scale(0.9);
              }

              to {
                opacity: 0.75;
                transform: scale(1.08);
              }
            }

            @keyframes valueReveal {
              from {
                opacity: 0;
                transform: translateY(20px);
              }

              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes particleMove {
              0% {
                opacity: 0;
                transform: translate(-50%, -50%)
                  scale(0.4);
              }

              15% {
                opacity: 1;
              }

              100% {
                opacity: 0;
                transform: translate(
                    calc(-50% + var(--x)),
                    calc(-50% + var(--y))
                  )
                  scale(1.2)
                  rotate(45deg);
              }
            }
          `}</style>
        </div>
      )}

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
            <nav className="ml-10 flex items-center gap-6 text-sm text-gray-500">
              <Link
                href="/"
                className="transition hover:text-white"
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

              <Link
                href="/case"
                className="transition hover:text-white"
              >
                Case
              </Link>
            </nav>

            <nav className="ml-auto mr-6 flex items-center gap-3">
              <Link
                href="/deposit"
                className="rounded-lg border border-[#6C2BD9] bg-[#6C2BD9] px-4 py-2 text-xs font-black text-white"
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

          <div className="ml-auto rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 md:ml-0">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              Balance
            </div>

            <div className="font-black text-[#F5C542]">
              💎 {balance.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6C2BD9]">
            Emerald Casino
          </div>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            DEPOSIT
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
            Deposit demo skins and receive virtual Emeralds.
          </p>
        </div>

        {/* BALANCE */}
        <div className="mx-auto mt-7 max-w-md rounded-2xl border border-[#6C2BD9]/40 bg-[radial-gradient(circle_at_top,#29134f,#151020,#0B0B0F)] p-6 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            Current Balance
          </div>

          <div className="mt-2 text-4xl font-black text-[#F5C542]">
            💎 {balance.toLocaleString("en-US")}
          </div>
        </div>

        {/* MESSAGE */}
        <div className="mx-auto mt-4 h-16 max-w-xl">
          {message && (
            <div className="rounded-xl border border-[#20C997]/40 bg-[#10251f] px-5 py-3 text-center text-sm font-black text-[#20C997]">
              {message}
            </div>
          )}
        </div>

        {/* ITEMS */}
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {depositItems.map((item) => {
            const depositing =
              depositingId === item.id;

            const deposited =
              depositedSkinIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-[#111116] transition ${
                  deposited
                    ? "border-[#20C997]/30 opacity-60"
                    : "border-[#6C2BD9]/30 hover:border-[#6C2BD9]/70"
                }`}
              >
                {/* REAL SKIN IMAGE */}
                <div className="relative flex h-36 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#351765,#24103f,#0B0B0F)]">
                  <div className="absolute h-24 w-40 rounded-full bg-[#6C2BD9]/20 blur-[45px]" />

                  <Image
                    src={item.image}
                    alt={item.name}
                    width={320}
                    height={200}
                    className="relative z-10 h-[115px] w-[90%] object-contain drop-shadow-[0_15px_20px_rgba(0,0,0,0.65)] transition duration-300 hover:scale-105"
                  />
                </div>

                <div className="p-5">
                  <div className="min-h-[48px]">
                    <h2 className="font-black">
                      {item.name}
                    </h2>

                    <div className="mt-1 text-xs text-gray-600">
                      {item.wear}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                        Deposit Value
                      </div>

                      <div className="mt-1 text-xl font-black text-[#F5C542]">
                        💎{" "}
                        {item.value.toLocaleString(
                          "en-US"
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#6C2BD9]/20 bg-[#15131D] px-3 py-2 text-[10px] font-bold text-gray-500">
                      {item.rarity}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deposit(item)}
                    disabled={
                      deposited ||
                      depositingId !== null
                    }
                    className={`mt-5 w-full rounded-xl py-3 text-sm font-black transition ${
                      deposited
                        ? "cursor-not-allowed border border-[#20C997]/30 bg-[#10251f] text-[#20C997]"
                        : "bg-[#6C2BD9] text-white hover:bg-[#7d3be8]"
                    } disabled:opacity-60`}
                  >
                    {deposited
                      ? "DEPOSITED"
                      : depositing
                        ? "DEPOSITING..."
                        : "DEPOSIT"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* DEMO NOTICE */}
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#F5C542]/20 bg-[#15131D] px-6 py-5 text-center">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#F5C542]">
            DEMO DEPOSIT
          </div>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            Deposits on this page use demo skins and virtual
            Emeralds only. No real Steam items, money or external
            transfers are processed.
          </p>
        </div>
      </section>
    </main>
  );
}