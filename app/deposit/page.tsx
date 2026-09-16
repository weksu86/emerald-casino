"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";
import { useSharedSoundEnabled } from "../lib/useSoundSettings";
import AnimatedBalance from "../components/AnimatedBalance";


type DepositSound = "ui-click" | "ui-hover" | "deposit" | "error";

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function playDepositSound(name: DepositSound) {
  if (typeof window === "undefined") return;

  const AudioContextClass =
    window.AudioContext || (window as WebkitWindow).webkitAudioContext;

  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const now = ctx.currentTime + 0.008;
  const master = ctx.createGain();
  master.gain.value = 0.72;
  master.connect(ctx.destination);

  const tone = (
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
    endFrequency?: number
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);

    if (endFrequency) {
      osc.frequency.exponentialRampToValueAtTime(
        endFrequency,
        start + duration
      );
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      start + Math.min(0.008, duration * 0.2)
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + duration
    );

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  const noise = (
    start: number,
    duration: number,
    volume: number,
    highpass: number,
    lowpass = 12000
  ) => {
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const envelope = Math.pow(1 - i / length, 1.8);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    const hp = ctx.createBiquadFilter();
    const lp = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    hp.type = "highpass";
    hp.frequency.value = highpass;
    lp.type = "lowpass";
    lp.frequency.value = lowpass;

    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + duration
    );

    source.connect(hp);
    hp.connect(lp);
    lp.connect(gain);
    gain.connect(master);
    source.start(start);
  };

  switch (name) {
    case "ui-click":
      tone(1450, now, 0.032, 0.022, "triangle", 1050);
      noise(now, 0.025, 0.012, 3500, 9000);
      break;

    case "ui-hover":
      tone(1280, now, 0.035, 0.010, "triangle", 1510);
      break;

    case "deposit":
      // Bright ascending counterpart to the Withdraw sound.
      tone(987.77, now, 0.11, 0.025);
      tone(1318.51, now + 0.06, 0.13, 0.029);
      tone(1760, now + 0.125, 0.16, 0.031);
      tone(2093, now + 0.19, 0.2, 0.022, "triangle");
      noise(now + 0.19, 0.045, 0.01, 3400, 10000);
      break;

    case "error":
      tone(420, now, 0.075, 0.02, "square", 360);
      tone(310, now + 0.07, 0.11, 0.018, "triangle", 270);
      break;
  }

  window.setTimeout(() => {
    void ctx.close();
  }, 850);
}

type DepositItem = {
  id: number;
  name: string;
  value: number;
  image: string;
  wear: string;
  rarity: string;
  rarityColor: string;
};

const depositItems: DepositItem[] = [
  {
    id: 1,
    name: "AK-47 | Redline",
    value: 1000,
    image: "/skins/ak47-redline.png",
    wear: "Field-Tested",
    rarity: "Classified",
    rarityColor: "#D32CE6",
  },
  {
    id: 2,
    name: "AWP | Asiimov",
    value: 750,
    image: "/skins/awp-asiimov.png",
    wear: "Field-Tested",
    rarity: "Covert",
    rarityColor: "#EB4B4B",
  },
  {
    id: 3,
    name: "M4A1-S | Printstream",
    value: 500,
    image: "/skins/m4a1s-printstream.png",
    wear: "Minimal Wear",
    rarity: "Covert",
    rarityColor: "#EB4B4B",
  },
];

export default function DepositPage() {
  const {
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
  const [soundEnabled] = useSharedSoundEnabled();

  const playSound = (name: DepositSound) => {
    if (!soundEnabled) return;
    playDepositSound(name);
  };


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
        playSound("error");
        setDepositingId(null);
        return;
      }

      setDepositedItem(item);
      playSound("deposit");
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

      {/* DEPOSIT SUCCESS */}
      {showDepositAnimation && depositedItem && (
        <div className="deposit-reveal fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#08080C]/95 backdrop-blur-xl">

          {/* BACKGROUND GLOW */}
          <div
            className="deposit-glow absolute left-1/2 top-1/2 h-[750px] w-[750px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
            style={{
              backgroundColor:
                depositedItem.rarityColor + "25",
            }}
          />

          {/* EXPANDING RING */}
          <div
            className="deposit-ring absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              borderColor:
                depositedItem.rarityColor,
            }}
          />

          {/* FLASH */}
          <div className="deposit-flash absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5C542]/30 blur-[30px]" />

          {/* PARTICLES */}
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

          {/* CONTENT */}
          <div className="deposit-content relative z-20 flex flex-col items-center text-center">

            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[#6C2BD9]">
              CS ACE
            </div>

            <div className="mt-2 text-[12px] font-black uppercase tracking-[0.4em] text-[#20C997]">
              DEPOSIT SUCCESSFUL
            </div>

            {/* SKIN */}
            <div className="relative mt-7">

              <div
                className="item-halo absolute -inset-14 rounded-full blur-[55px]"
                style={{
                  backgroundColor:
                    depositedItem.rarityColor +
                    "30",
                }}
              />

              <div
                className="item-card relative flex h-56 w-72 items-center justify-center overflow-hidden rounded-[34px] border-2 bg-[radial-gradient(circle_at_center,#351765,#181020,#09090D)]"
                style={{
                  borderColor:
                    depositedItem.rarityColor,

                  boxShadow: `0 0 80px ${depositedItem.rarityColor}35`,
                }}
              >

                <div
                  className="absolute bottom-0 left-0 h-[5px] w-full"
                  style={{
                    backgroundColor:
                      depositedItem.rarityColor,

                    boxShadow: `0 0 20px ${depositedItem.rarityColor}`,
                  }}
                />

                <Image
                  src={depositedItem.image}
                  alt={depositedItem.name}
                  width={420}
                  height={280}
                  className="relative z-10 h-[170px] w-[92%] object-contain drop-shadow-[0_18px_25px_rgba(0,0,0,0.75)]"
                  priority
                />

              </div>
            </div>

            {/* RARITY */}
            <div
              className="mt-6 text-[10px] font-black uppercase tracking-[0.3em]"
              style={{
                color:
                  depositedItem.rarityColor,
              }}
            >
              {depositedItem.rarity}
            </div>

            {/* NAME */}
            <h2 className="mt-2 max-w-xl px-5 text-3xl font-black text-white md:text-5xl">
              {depositedItem.name}
            </h2>

            <div className="mt-2 text-sm font-bold text-gray-500">
              {depositedItem.wear}
            </div>

            {/* EMERALDS */}
            <div className="value-reveal mt-6 rounded-2xl border border-[#20C997]/40 bg-[#10251f] px-8 py-4 shadow-[0_0_40px_rgba(32,201,151,0.15)]">

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

            <div className="mt-6 text-[9px] font-black uppercase tracking-[0.3em] text-gray-700">
              CS ACE • DEMO ONLY
            </div>

          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-[#6C2BD9]/30 bg-[#0B0B0F]">

        <div className="mx-auto flex max-w-6xl items-center px-5 py-4">

          <Link
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => playSound("ui-click")}
            href="/"
            className="flex shrink-0 items-center"
          >
            <Image
              src="/logo.png"
              alt="CS ACE"
              width={64}
              height={64}
              className="h-14 w-14 object-contain"
              priority
            />
          </Link>

          <div className="hidden flex-1 items-center md:flex">

            <nav className="ml-10 flex items-center gap-6 text-sm text-gray-500">

              <Link
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => playSound("ui-click")}
                href="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <Link
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => playSound("ui-click")}
                href="/joker-poker"
                className="transition hover:text-white"
              >
                Joker Poker
              </Link>

              <Link
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => playSound("ui-click")}
                href="/blackjack"
                className="transition hover:text-white"
              >
                Blackjack
              </Link>

              <Link
                onMouseEnter={() => playSound("ui-hover")}
                onClick={() => playSound("ui-click")}
                href="/mines"
                className="transition hover:text-white"
              >
                Mines
              </Link>

              <Link
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => playSound("ui-click")}
                href="/case"
                className="transition hover:text-white"
              >
                Case
              </Link>

            </nav>

            <nav className="ml-auto mr-6 flex items-center gap-3">

              <Link
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => playSound("ui-click")}
                href="/deposit"
                className="rounded-lg border border-[#6C2BD9] bg-[#6C2BD9] px-4 py-2 text-xs font-black text-white shadow-[0_0_18px_rgba(108,43,217,0.20)]"
              >
                DEPOSIT
              </Link>

              <Link
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => playSound("ui-click")}
                href="/withdraw"
                className="rounded-lg border border-[#F5C542]/30 bg-[#15131D] px-4 py-2 text-xs font-black text-[#F5C542] transition hover:border-[#F5C542]"
              >
                WITHDRAW
              </Link>

            </nav>
          </div>

          {/* BALANCE */}
          <div className="ml-auto rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 md:ml-0">

            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              BALANCE
            </div>

            <AnimatedBalance />

          </div>

        </div>
      </header>

      {/* PAGE */}
      <section className="mx-auto max-w-6xl px-4 py-10">

        {/* TITLE */}
        <div className="text-center">

          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#6C2BD9]">
            CS ACE
          </div>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            DEPOSIT
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
            Deposit demo skins and receive virtual Emeralds.
          </p>

        </div>

        {/* WALLET */}
        <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-2xl border border-[#6C2BD9]/50 bg-[radial-gradient(circle_at_top,#321761,#171020,#0B0B0F)] p-7 text-center shadow-[0_0_50px_rgba(108,43,217,0.12)]">

          <div className="absolute left-1/2 top-0 h-[1px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#F5C542] to-transparent" />

          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
            CS ACE WALLET
          </div>

          <div className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
            CURRENT BALANCE
          </div>

          <div className="mt-2 text-4xl md:text-5xl">
            <AnimatedBalance />
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

        {/* MARKET TITLE */}
        <div className="mb-5 mt-3">

          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
            CS ACE INVENTORY
          </div>

          <div className="mt-1 flex items-end justify-between">

            <h2 className="text-2xl font-black">
              CHOOSE A SKIN
            </h2>

            <div className="hidden text-[10px] font-bold uppercase tracking-widest text-gray-700 sm:block">
              {depositItems.length} ITEMS
            </div>

          </div>
        </div>

        {/* SKINS */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {depositItems.map((item) => {
            const depositing =
              depositingId === item.id;

            const deposited =
              depositedSkinIds.includes(
                item.id
              );

            return (
              <div
                key={item.id}
                className={`skin-card group relative overflow-hidden rounded-2xl border bg-[#111116] transition duration-300 ${
                  deposited
                    ? "opacity-60"
                    : "hover:-translate-y-1"
                }`}
                style={{
                  borderColor: deposited
                    ? "#20C99755"
                    : item.rarityColor + "55",
                }}
              >

                {/* RARITY TOP LINE */}
                <div
                  className="absolute left-0 top-0 z-20 h-[3px] w-full"
                  style={{
                    backgroundColor: deposited
                      ? "#20C997"
                      : item.rarityColor,

                    boxShadow: deposited
                      ? "0 0 14px #20C997"
                      : `0 0 14px ${item.rarityColor}`,
                  }}
                />

                {/* IMAGE */}
                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#351765,#1b102c,#0B0B0F)]">

                  <div
                    className="absolute h-28 w-44 rounded-full opacity-40 blur-[50px] transition duration-300 group-hover:opacity-70"
                    style={{
                      backgroundColor:
                        item.rarityColor,
                    }}
                  />

                  {/* RARITY BADGE */}
                  <div className="absolute left-4 top-4 z-20 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 backdrop-blur-md">

                    <span
                      className="text-[8px] font-black uppercase tracking-[0.2em]"
                      style={{
                        color:
                          item.rarityColor,
                      }}
                    >
                      {item.rarity}
                    </span>

                  </div>

                  {/* DEPOSITED BADGE */}
                  {deposited && (
                    <div className="absolute right-4 top-4 z-20 rounded-lg border border-[#20C997]/30 bg-[#10251f]/90 px-2.5 py-1">

                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#20C997]">
                        DEPOSITED
                      </span>

                    </div>
                  )}

                  <Image
                    src={item.image}
                    alt={item.name}
                    width={360}
                    height={220}
                    className="relative z-10 h-[135px] w-[92%] object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.75)] transition duration-300 group-hover:scale-105"
                  />

                </div>

                {/* INFO */}
                <div className="p-5">

                  <div className="min-h-[58px]">

                    <h3 className="text-base font-black text-white">
                      {item.name}
                    </h3>

                    <div className="mt-1 text-[11px] font-bold text-gray-600">
                      {item.wear}
                    </div>

                  </div>

                  <div className="mt-4 border-t border-white/5 pt-4">

                    <div className="flex items-end justify-between gap-3">

                      <div>

                        <div className="text-[8px] font-black uppercase tracking-[0.25em] text-gray-600">
                          DEPOSIT VALUE
                        </div>

                        <div className="mt-1 text-2xl font-black text-[#F5C542]">
                          💎{" "}
                          {item.value.toLocaleString(
                            "en-US"
                          )}
                        </div>

                      </div>

                      <div
                        className={`rounded-lg border px-3 py-2 text-[9px] font-black uppercase tracking-wider ${
                          deposited
                            ? "border-[#20C997]/25 bg-[#10251f] text-[#20C997]"
                            : "border-[#6C2BD9]/30 bg-[#15131D] text-[#A875FF]"
                        }`}
                      >
                        {deposited
                          ? "DONE"
                          : "AVAILABLE"}
                      </div>

                    </div>

                    {/* BUTTON */}
                    <button
                      type="button"
                      onMouseEnter={() => playSound("ui-hover")}
                      onClick={() => {
                        playSound("ui-click");
                        deposit(item);
                      }}
                      disabled={
                        deposited ||
                        depositingId !== null
                      }
                      className={`mt-5 w-full rounded-xl py-3.5 text-sm font-black transition ${
                        deposited
                          ? "cursor-not-allowed border border-[#20C997]/30 bg-[#10251f] text-[#20C997]"
                          : "bg-[#6C2BD9] text-white shadow-[0_0_25px_rgba(108,43,217,0.18)] hover:bg-[#7d3be8] hover:shadow-[0_0_35px_rgba(108,43,217,0.3)]"
                      } disabled:opacity-60`}
                    >
                      {deposited
                        ? "DEPOSITED"
                        : depositing
                          ? "DEPOSITING..."
                          : `DEPOSIT — + 💎 ${item.value.toLocaleString(
                              "en-US"
                            )}`}
                    </button>

                  </div>
                </div>

                {/* BOTTOM LINE */}
                <div
                  className="absolute bottom-0 left-0 h-[3px] w-full opacity-80"
                  style={{
                    backgroundColor: deposited
                      ? "#20C997"
                      : item.rarityColor,
                  }}
                />

              </div>
            );
          })}

        </div>

        {/* DEMO NOTICE */}
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-[#F5C542]/20 bg-[#15131D] px-6 py-5 text-center">

          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5C542]">
            DEMO DEPOSIT
          </div>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            Deposits on this page use demo skins and
            virtual Emeralds only. No real Steam items,
            money or external transfers are processed.
          </p>

        </div>

      </section>

      {/* ANIMATIONS */}
      <style jsx>{`
        .deposit-reveal {
          animation: screenIn 0.25s ease-out both;
        }

        .deposit-glow {
          animation: glowReveal 1.4s ease-out both;
        }

        .deposit-ring {
          animation: ringExpand 1.1s ease-out both;
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

    </main>
  );
}