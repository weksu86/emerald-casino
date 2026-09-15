"use client";

import Link from "next/link";
import { useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";

type Upgrade = {
  id: number;
  bet: number;
  target: number;
  label: string;
  chance: number;
  allIn?: boolean;
};

const upgrades: Upgrade[] = [
  {
    id: 1,
    bet: 100,
    target: 200,
    label: "100 → 200",
    chance: 50,
  },
  {
    id: 2,
    bet: 500,
    target: 1000,
    label: "500 → 1 000",
    chance: 50,
  },
  {
    id: 3,
    bet: 1,
    target: 1000,
    label: "1 → 1 000",
    chance: 1,
  },
];

export default function UpgraderPage() {
  const { balance, addEmeralds, removeEmeralds } = useEmeralds();

  const [selectedId, setSelectedId] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");

  const allInUpgrade: Upgrade = {
    id: 4,
    bet: balance,
    target: balance * 3,
    label: "ALL IN → 3×",
    chance: 33,
    allIn: true,
  };

  const selectedUpgrade =
    selectedId === 4
      ? allInUpgrade
      : upgrades.find((upgrade) => upgrade.id === selectedId) ??
        upgrades[0];

  function selectUpgrade(id: number) {
    if (spinning) return;

    setSelectedId(id);
    setResult("");
  }

  function play() {
    const bet = selectedUpgrade.bet;
    const target = selectedUpgrade.target;
    const chance = selectedUpgrade.chance;

    if (spinning || bet <= 0 || balance < bet) {
      setResult("Not enough Emeralds.");
      return;
    }

    const paid = removeEmeralds(bet);

    if (!paid) {
      setResult("Not enough Emeralds.");
      return;
    }

    setSpinning(true);
    setResult("");

    const won = Math.random() * 100 < chance;

    setRotation(
      (current) => current + 1800 + Math.random() * 360
    );

    setTimeout(() => {
      if (won) {
        addEmeralds(target);

        setResult(
          `WIN! +${target.toLocaleString("en-US")} Emeralds`
        );
      } else {
        setResult(
          `LOSE! -${bet.toLocaleString("en-US")} Emeralds`
        );
      }

      setSpinning(false);
    }, 2500);
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
              <Link href="/" className="hover:text-white">
                Home
              </Link>

              <Link
                href="/upgrader"
                className="text-white"
              >
                Upgrader
              </Link>

              <Link
                href="/blackjack"
                className="hover:text-white"
              >
                Blackjack
              </Link>
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

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-10 text-center">
          <div className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-emerald-500">
            Emerald
          </div>

          <h1 className="text-5xl font-black">
            Upgrader
          </h1>

          <p className="mt-3 text-gray-500">
            Choose your upgrade.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* WHEEL */}
          <div className="rounded-3xl border border-emerald-900/50 bg-[#0b1812] p-8">
            <div className="relative mx-auto flex h-[360px] w-[360px] items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-[18px] border-gray-700"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 2500ms cubic-bezier(0.15, 0.8, 0.2, 1)"
                    : "none",
                  background: `conic-gradient(
                    #10b981 0deg ${
                      selectedUpgrade.chance * 3.6
                    }deg,
                    #374151 ${
                      selectedUpgrade.chance * 3.6
                    }deg 360deg
                  )`,
                }}
              >
                <div className="absolute inset-5 rounded-full border-[12px] border-gray-600 bg-[#101b16]" />
              </div>

              {/* POINTER */}
              <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
                <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-white" />
              </div>

              {/* CENTER */}
              <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-gray-700 bg-[#0b1812]">
                <div className="text-center">
                  <div className="text-xs uppercase tracking-widest text-gray-500">
                    Chance
                  </div>

                  <div className="text-3xl font-black text-white">
                    {selectedUpgrade.chance}%
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              {result ? (
                <div
                  className={`text-2xl font-black ${
                    result.startsWith("WIN")
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {result}
                </div>
              ) : (
                <div className="text-gray-500">
                  Choose an upgrade and spin the wheel.
                </div>
              )}
            </div>
          </div>

          {/* CONTROLS */}
          <div className="rounded-3xl border border-emerald-900/50 bg-[#0b1812] p-7">
            <h2 className="text-2xl font-black">
              Choose Upgrade
            </h2>

            <div className="mt-6 space-y-3">
              {upgrades.map((upgrade) => {
                const selected =
                  selectedId === upgrade.id;

                return (
                  <button
                    key={upgrade.id}
                    onClick={() =>
                      selectUpgrade(upgrade.id)
                    }
                    disabled={spinning}
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-950/40"
                        : "border-gray-800 bg-[#08110c] hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black">
                        {upgrade.label}
                      </span>

                      <span className="font-bold text-emerald-400">
                        {upgrade.chance}%
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-gray-500">
                      Bet 💎{" "}
                      {upgrade.bet.toLocaleString("en-US")}
                      {" → "}
                      💎{" "}
                      {upgrade.target.toLocaleString(
                        "en-US"
                      )}
                    </div>
                  </button>
                );
              })}

              {/* ALL IN */}
              <button
                onClick={() => selectUpgrade(4)}
                disabled={spinning || balance <= 0}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  selectedId === 4
                    ? "border-emerald-500 bg-emerald-950/40"
                    : "border-gray-800 bg-[#08110c] hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black">
                    ALL IN → 3×
                  </span>

                  <span className="font-bold text-emerald-400">
                    33%
                  </span>
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  Bet 💎{" "}
                  {balance.toLocaleString("en-US")}
                  {" → "}
                  💎{" "}
                  {(balance * 3).toLocaleString(
                    "en-US"
                  )}
                </div>
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-800 bg-[#08110c] p-5">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  Bet
                </span>

                <span className="font-bold">
                  💎{" "}
                  {selectedUpgrade.bet.toLocaleString(
                    "en-US"
                  )}
                </span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-gray-500">
                  Target
                </span>

                <span className="font-bold">
                  💎{" "}
                  {selectedUpgrade.target.toLocaleString(
                    "en-US"
                  )}
                </span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-gray-500">
                  Chance
                </span>

                <span className="font-bold text-emerald-400">
                  {selectedUpgrade.chance}%
                </span>
              </div>
            </div>

            <button
              onClick={play}
              disabled={
                spinning ||
                balance <= 0 ||
                balance < selectedUpgrade.bet
              }
              className="mt-6 w-full rounded-xl bg-emerald-500 py-4 text-lg font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {spinning ? "SPINNING..." : "UPGRADE"}
            </button>

            {balance < selectedUpgrade.bet &&
              balance > 0 && (
                <p className="mt-3 text-center text-xs text-red-400">
                  Not enough Emeralds for this bet.
                </p>
              )}
          </div>
        </div>
      </section>
    </main>
  );
}