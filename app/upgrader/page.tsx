"use client";

import { useState } from "react";
import Link from "next/link";
import { useEmeralds } from "../context/EmeraldContext";

const options = [
  { id: 1, label: "100 → 200", cost: 100, reward: 200, chance: 50 },
  { id: 2, label: "500 → 1 000", cost: 500, reward: 1000, chance: 50 },
  { id: 3, label: "1 → 1 000", cost: 1, reward: 1000, chance: 1 },
];

export default function UpgraderPage() {
  const { balance, removeEmeralds, addEmeralds } = useEmeralds();

  const [selected, setSelected] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

  const currentOption =
    selected < options.length
      ? options[selected]
      : {
          id: 4,
          label: `ALL IN → ${balance * 3}`,
          cost: balance,
          reward: balance * 3,
          chance: 33,
        };

  function spin() {
    if (spinning || currentOption.cost <= 0) return;
    if (balance < currentOption.cost) return;

    const { chance, reward, cost } = currentOption;

    const won = Math.random() * 100 < chance;

    if (!removeEmeralds(cost)) return;

    setResult(null);
    setSpinning(true);

    const greenDegrees = chance * 3.6;

    /*
      conic-gradient:
      0° = oikea
      90° = alas
      180° = vasen
      270° = ylös

      Osoitin on ylhäällä eli 270°.

      Valitaan kohta siitä sektorista, jonka tuloksen
      haluamme näyttää, ja pyöritetään se osoittimen alle.
    */

    let landingAngle: number;

    if (won) {
      // Valitaan varmasti vihreän alueen sisältä.
      if (greenDegrees <= 4) {
        landingAngle = greenDegrees / 2;
      } else {
        landingAngle =
          2 + Math.random() * (greenDegrees - 4);
      }
    } else {
      // Valitaan varmasti harmaan alueen sisältä.
      const grayDegrees = 360 - greenDegrees;

      if (grayDegrees <= 4) {
        landingAngle = greenDegrees + grayDegrees / 2;
      } else {
        landingAngle =
          greenDegrees +
          2 +
          Math.random() * (grayDegrees - 4);
      }
    }

    /*
      Jos lähdekohta on landingAngle ja sen pitää päätyä
      ylös (270°), tarvittava pyöritys on:

      270 - landingAngle
    */
    const desiredRotation =
      270 - landingAngle;

    const currentAngle =
      ((rotation % 360) + 360) % 360;

    const desiredAngle =
      ((desiredRotation % 360) + 360) % 360;

    let additionalRotation =
      desiredAngle - currentAngle;

    if (additionalRotation < 0) {
      additionalRotation += 360;
    }

    // 5 täyttä kierrosta + tarkka lopetuskohta
    const finalRotation =
      rotation + 1800 + additionalRotation;

    setRotation(finalRotation);

    setTimeout(() => {
      if (won) {
        addEmeralds(reward);
        setResult("win");
      } else {
        setResult("lose");
      }

      setSpinning(false);
    }, 3000);
  }

  return (
    <main className="min-h-screen bg-[#050807] text-white">
      <header className="border-b border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-black tracking-wide">
            💎 EMERALD
            <span className="ml-2 text-xs font-bold text-emerald-400">
              DEMO CASINO
            </span>
          </Link>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
            <span className="mr-2 text-sm text-gray-400">
              BALANCE
            </span>

            <span className="font-black text-emerald-400">
              {balance.toLocaleString()} E
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight">
            UPGRADER
          </h1>

          <p className="mt-2 text-gray-500">
            Upgrade your Emeralds
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="mb-5 text-lg font-bold">
              Choose upgrade
            </h2>

            <div className="space-y-3">
              {options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => {
                    if (!spinning) {
                      setSelected(index);
                      setResult(null);
                    }
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected === index
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {option.label}
                    </span>

                    <span className="text-sm text-emerald-400">
                      {option.chance}%
                    </span>
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  if (!spinning) {
                    setSelected(options.length);
                    setResult(null);
                  }
                }}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selected === options.length
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    ALL IN → {balance * 3}
                  </span>

                  <span className="text-sm text-emerald-400">
                    33%
                  </span>
                </div>
              </button>
            </div>

            <button
              onClick={spin}
              disabled={
                spinning ||
                currentOption.cost <= 0 ||
                balance < currentOption.cost
              }
              className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {spinning ? "SPINNING..." : "UPGRADE"}
            </button>

            {result && !spinning && (
              <div
                className={`mt-5 text-center text-2xl font-black ${
                  result === "win"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {result === "win" ? "YOU WIN" : "YOU LOSE"}
              </div>
            )}
          </div>

          <div className="flex min-h-[500px] items-center justify-center">
            <div className="relative">
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-2">
                <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-white" />
              </div>

              <div
                className="h-[390px] w-[390px] rounded-full border-[14px] border-gray-700"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 3s cubic-bezier(0.12, 0.8, 0.18, 1)"
                    : "none",
                  background: `conic-gradient(
                    #10b981 0deg ${currentOption.chance * 3.6}deg,
                    #374151 ${currentOption.chance * 3.6}deg 360deg
                  )`,
                }}
              >
                <div className="m-8 flex h-[306px] w-[306px] items-center justify-center rounded-full border-[10px] border-gray-700 bg-[#050807]">
                  <div className="text-center">
                    <div className="text-5xl font-black text-emerald-400">
                      {currentOption.chance}%
                    </div>

                    <div className="mt-2 text-sm font-bold text-gray-500">
                      WIN CHANCE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}