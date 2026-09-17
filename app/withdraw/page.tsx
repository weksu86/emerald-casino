"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";
import { useSharedSoundEnabled } from "../lib/useSoundSettings";
import AnimatedBalance from "../components/AnimatedBalance";


type WithdrawSound = "ui-click" | "ui-hover" | "withdraw" | "error";

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function playWithdrawSound(name: WithdrawSound) {
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

    case "withdraw":
      // Same premium CS ACE family: metallic start + clean descending cash-out cue.
      tone(1760, now, 0.07, 0.022, "sine", 1500);
      tone(1318.51, now + 0.055, 0.13, 0.028);
      tone(987.77, now + 0.12, 0.16, 0.03);
      tone(783.99, now + 0.19, 0.21, 0.024, "triangle");
      noise(now, 0.04, 0.01, 3200, 9500);
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

type WithdrawItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  wear: string;
  rarity: string;
  rarityColor: string;
};

const withdrawItems: WithdrawItem[] = [
  {
    id: 1,
    name: "AK-47 | Redline",
    price: 1000,
    image: "/skins/ak47-redline.png",
    wear: "Field-Tested",
    rarity: "Classified",
    rarityColor: "#D32CE6",
  },
  {
    id: 2,
    name: "AWP | Asiimov",
    price: 750,
    image: "/skins/awp-asiimov.png",
    wear: "Field-Tested",
    rarity: "Covert",
    rarityColor: "#EB4B4B",
  },
  {
    id: 3,
    name: "M4A1-S | Printstream",
    price: 500,
    image: "/skins/m4a1s-printstream.png",
    wear: "Minimal Wear",
    rarity: "Covert",
    rarityColor: "#EB4B4B",
  },
  {
    id: 4,
    name: "Desert Eagle | Printstream",
    price: 350,
    image: "/skins/deagle-printstream.png",
    wear: "Minimal Wear",
    rarity: "Covert",
    rarityColor: "#EB4B4B",
  },
  {
    id: 5,
    name: "USP-S | Kill Confirmed",
    price: 250,
    image: "/skins/usp-kill-confirmed.png",
    wear: "Field-Tested",
    rarity: "Covert",
    rarityColor: "#EB4B4B",
  },
  {
    id: 6,
    name: "Butterfly Knife | Gamma Doppler",
    price: 50000,
    image: "/skins/butterfly-gamma-doppler.png",
    wear: "Factory New",
    rarity: "Covert",
    rarityColor: "#F5C542",
  },
];

export default function WithdrawPage() {
  const { balance, removeEmeralds } = useEmeralds();

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [soundEnabled] = useSharedSoundEnabled();

  const playSound = (name: WithdrawSound) => {
    if (!soundEnabled) return;
    playWithdrawSound(name);
  };


  const [withdrawingId, setWithdrawingId] =
    useState<number | null>(null);

  const [withdrawnItem, setWithdrawnItem] =
    useState<WithdrawItem | null>(null);

  const [
    showWithdrawAnimation,
    setShowWithdrawAnimation,
  ] = useState(false);

  function withdraw(item: WithdrawItem) {
    if (withdrawingId !== null) return;

    if (balance < item.price) {
      playSound("error");
      setSuccess(false);
      setMessage("Not enough Emeralds.");
      return;
    }

    setWithdrawingId(item.id);
    setMessage("");

    setTimeout(() => {
      const paid = removeEmeralds(item.price);

      if (!paid) {
        playSound("error");
        setSuccess(false);
        setMessage("Not enough Emeralds.");
        setWithdrawingId(null);
        return;
      }

      setSuccess(true);
      playSound("withdraw");

      setMessage(
        `${item.name} withdrawn — DEMO ONLY`
      );

      setWithdrawnItem(item);
      setShowWithdrawAnimation(true);
      setWithdrawingId(null);

      setTimeout(() => {
        setShowWithdrawAnimation(false);
      }, 2800);

      setTimeout(() => {
        setMessage("");
      }, 3000);
    }, 700);
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">

      {/* WITHDRAW SUCCESS ANIMATION */}
      {showWithdrawAnimation && withdrawnItem && (
        <div className="withdraw-reveal fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#08080C]/95 backdrop-blur-xl">

          <div
            className="withdraw-glow absolute left-1/2 top-1/2 h-[750px] w-[750px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
            style={{
              backgroundColor:
                withdrawnItem.rarityColor + "25",
            }}
          />

          <div
            className="withdraw-ring absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              borderColor:
                withdrawnItem.rarityColor,
            }}
          />

          <div className="withdraw-flash absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5C542]/30 blur-[30px]" />

          <span className="particle particle-1">💎</span>
          <span className="particle particle-2">✦</span>
          <span className="particle particle-3">💎</span>
          <span className="particle particle-4">✦</span>
          <span className="particle particle-5">💎</span>
          <span className="particle particle-6">✦</span>
          <span className="particle particle-7">💎</span>
          <span className="particle particle-8">✦</span>

          <div className="withdraw-content relative z-20 flex flex-col items-center text-center">

            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[#6C2BD9]">
              CS ACE
            </div>

            <div className="mt-2 text-[12px] font-black uppercase tracking-[0.4em] text-[#20C997]">
              WITHDRAW SUCCESSFUL
            </div>

            <div className="relative mt-7">

              <div
                className="item-halo absolute -inset-14 rounded-full blur-[55px]"
                style={{
                  backgroundColor:
                    withdrawnItem.rarityColor + "30",
                }}
              />

              <div
                className="item-card relative flex h-56 w-72 items-center justify-center overflow-hidden rounded-[34px] border-2 bg-[radial-gradient(circle_at_center,#351765,#181020,#09090D)]"
                style={{
                  borderColor:
                    withdrawnItem.rarityColor,
                  boxShadow: `0 0 80px ${withdrawnItem.rarityColor}35`,
                }}
              >
                <div
                  className="absolute bottom-0 left-0 h-[5px] w-full"
                  style={{
                    backgroundColor:
                      withdrawnItem.rarityColor,
                    boxShadow: `0 0 20px ${withdrawnItem.rarityColor}`,
                  }}
                />

                <Image
                  src={withdrawnItem.image}
                  alt={withdrawnItem.name}
                  width={420}
                  height={280}
                  className="relative z-10 h-[170px] w-[92%] object-contain drop-shadow-[0_18px_25px_rgba(0,0,0,0.75)]"
                  priority
                />
              </div>
            </div>

            <div
              className="mt-6 text-[10px] font-black uppercase tracking-[0.3em]"
              style={{
                color:
                  withdrawnItem.rarityColor,
              }}
            >
              {withdrawnItem.rarity}
            </div>

            <h2 className="mt-2 max-w-xl px-5 text-3xl font-black text-white md:text-5xl">
              {withdrawnItem.name}
            </h2>

            <div className="mt-2 text-sm font-bold text-gray-500">
              {withdrawnItem.wear}
            </div>

            <div className="value-reveal mt-6 rounded-2xl border border-[#F5C542]/30 bg-[#15131D] px-8 py-4 shadow-[0_0_40px_rgba(245,197,66,0.10)]">

              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
                EMERALDS SPENT
              </div>

              <div className="mt-1 text-3xl font-black text-[#F5C542]">
                − 💎{" "}
                {withdrawnItem.price.toLocaleString(
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

              <Link
                onMouseEnter={() => playSound("ui-hover")}
                onClick={() => playSound("ui-click")}
                href="/leaderboard"
                className="transition hover:text-white"
              >
                Leaderboard
              </Link>

            </nav>

            <nav className="ml-auto mr-6 flex items-center gap-3">

              <Link
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => playSound("ui-click")}
                href="/deposit"
                className="rounded-lg border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 text-xs font-black text-gray-300 transition hover:border-[#6C2BD9] hover:text-white"
              >
                DEPOSIT
              </Link>

              <Link
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => playSound("ui-click")}
                href="/withdraw"
                className="rounded-lg border border-[#F5C542] bg-[#F5C542] px-4 py-2 text-xs font-black text-black shadow-[0_0_18px_rgba(245,197,66,0.15)]"
              >
                WITHDRAW
              </Link>

            </nav>
          </div>

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
            WITHDRAW
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
            Exchange your demo Emeralds for demo skins.
          </p>

        </div>

        {/* BALANCE CARD */}
        <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-2xl border border-[#6C2BD9]/50 bg-[radial-gradient(circle_at_top,#321761,#171020,#0B0B0F)] p-7 text-center shadow-[0_0_50px_rgba(108,43,217,0.12)]">

          <div className="absolute left-1/2 top-0 h-[1px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#F5C542] to-transparent" />

          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
            CS ACE WALLET
          </div>

          <div className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
            AVAILABLE BALANCE
          </div>

          <div className="mt-2 text-4xl md:text-5xl">
            <AnimatedBalance />
          </div>

        </div>

        {/* MESSAGE */}
        <div className="mx-auto mt-4 h-16 max-w-xl">

          {message && (
            <div
              className={`rounded-xl border px-5 py-3 text-center text-sm font-black ${
                success
                  ? "border-[#20C997]/40 bg-[#10251f] text-[#20C997]"
                  : "border-[#E0525F]/40 bg-[#291215] text-[#E0525F]"
              }`}
            >
              {message}
            </div>
          )}

        </div>

        {/* SECTION TITLE */}
        <div className="mb-5 mt-3">

          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
            CS ACE MARKET
          </div>

          <div className="mt-1 flex items-end justify-between">

            <h2 className="text-2xl font-black">
              CHOOSE YOUR SKIN
            </h2>

            <div className="hidden text-[10px] font-bold uppercase tracking-widest text-gray-700 sm:block">
              {withdrawItems.length} ITEMS
            </div>

          </div>
        </div>

        {/* SKINS */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {withdrawItems.map((item) => {
            const canAfford =
              balance >= item.price;

            const withdrawing =
              withdrawingId === item.id;

            return (
              <div
                key={item.id}
                className="skin-card group relative overflow-hidden rounded-2xl border bg-[#111116] transition duration-300 hover:-translate-y-1"
                style={{
                  borderColor:
                    item.rarityColor + "55",
                }}
              >

                {/* RARITY TOP LINE */}
                <div
                  className="absolute left-0 top-0 z-20 h-[3px] w-full"
                  style={{
                    backgroundColor:
                      item.rarityColor,
                    boxShadow: `0 0 14px ${item.rarityColor}`,
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
                          PRICE
                        </div>

                        <div className="mt-1 text-2xl font-black text-[#F5C542]">
                          💎{" "}
                          {item.price.toLocaleString(
                            "en-US"
                          )}
                        </div>

                      </div>

                      <div
                        className={`rounded-lg border px-3 py-2 text-[9px] font-black uppercase tracking-wider ${
                          canAfford
                            ? "border-[#20C997]/25 bg-[#10251f] text-[#20C997]"
                            : "border-[#E0525F]/20 bg-[#291215] text-[#E0525F]"
                        }`}
                      >
                        {canAfford
                          ? "AVAILABLE"
                          : "LOCKED"}
                      </div>

                    </div>

                    <button
                      type="button"
                      onMouseEnter={() => playSound("ui-hover")}
                      onClick={() => {
                        playSound("ui-click");
                        withdraw(item);
                      }}
                      disabled={
                        !canAfford ||
                        withdrawingId !== null
                      }
                      className={`mt-5 w-full rounded-xl py-3.5 text-sm font-black transition ${
                        canAfford
                          ? "bg-[#6C2BD9] text-white shadow-[0_0_25px_rgba(108,43,217,0.18)] hover:bg-[#7d3be8] hover:shadow-[0_0_35px_rgba(108,43,217,0.3)]"
                          : "cursor-not-allowed border border-gray-800 bg-[#0B0B0F] text-gray-700"
                      } disabled:opacity-50`}
                    >
                      {withdrawing
                        ? "WITHDRAWING..."
                        : canAfford
                          ? `WITHDRAW — 💎 ${item.price.toLocaleString(
                              "en-US"
                            )}`
                          : "NOT ENOUGH EMERALDS"}
                    </button>

                  </div>
                </div>

                {/* BOTTOM RARITY LINE */}
                <div
                  className="absolute bottom-0 left-0 h-[3px] w-full opacity-80"
                  style={{
                    backgroundColor:
                      item.rarityColor,
                  }}
                />

              </div>
            );
          })}

        </div>

        {/* DEMO NOTICE */}
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-[#F5C542]/20 bg-[#15131D] px-6 py-5 text-center">

          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5C542]">
            DEMO WITHDRAWAL
          </div>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            Withdrawals on this page use virtual Emeralds
            only. No real Steam items, money or external
            transfers are processed.
          </p>

        </div>

      </section>

      <style jsx>{`
        .withdraw-reveal {
          animation: screenIn 0.25s ease-out both;
        }

        .withdraw-glow {
          animation: glowReveal 1.4s ease-out both;
        }

        .withdraw-ring {
          animation: ringExpand 1.1s ease-out both;
        }

        .withdraw-flash {
          animation: flash 0.7s ease-out both;
        }

        .withdraw-content {
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