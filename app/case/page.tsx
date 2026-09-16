"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";
import { useSharedSoundEnabled } from "../lib/useSoundSettings";
import AnimatedBalance from "../components/AnimatedBalance";


type CaseSound =
  | "ui-click"
  | "ui-hover"
  | "spin-start"
  | "reel-tick"
  | "spin-end"
  | "win"
  | "big-win"
  | "error";

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function playCaseSound(name: CaseSound) {
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
    const length = Math.max(
      1,
      Math.floor(ctx.sampleRate * duration)
    );

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

    case "spin-start":
      tone(430, now, 0.075, 0.022, "triangle", 760);
      tone(880, now + 0.045, 0.09, 0.018, "sine", 1280);
      noise(now, 0.07, 0.016, 2100, 8500);
      break;

    case "reel-tick":
      tone(1550, now, 0.026, 0.012, "triangle", 1180);
      noise(now, 0.02, 0.006, 3900, 9000);
      break;

    case "spin-end":
      tone(920, now, 0.075, 0.025, "triangle", 610);
      tone(520, now + 0.055, 0.11, 0.02, "sine", 390);
      noise(now, 0.045, 0.01, 1800, 6500);
      break;

    case "win":
      tone(659.25, now, 0.13, 0.028);
      tone(830.61, now + 0.065, 0.15, 0.031);
      tone(987.77, now + 0.13, 0.18, 0.035);
      tone(1318.51, now + 0.195, 0.22, 0.022, "triangle");
      tone(1975.53, now + 0.21, 0.14, 0.012);
      break;

    case "big-win":
      tone(523.25, now, 0.16, 0.025);
      tone(659.25, now + 0.07, 0.18, 0.03);
      tone(783.99, now + 0.14, 0.2, 0.034);
      tone(1046.5, now + 0.21, 0.24, 0.038);
      tone(1318.51, now + 0.29, 0.3, 0.03, "triangle");
      tone(2093, now + 0.34, 0.22, 0.018);
      noise(now + 0.28, 0.09, 0.008, 3500, 10000);
      break;

    case "error":
      tone(420, now, 0.075, 0.02, "square", 360);
      tone(310, now + 0.07, 0.11, 0.018, "triangle", 270);
      break;
  }

  window.setTimeout(() => {
    void ctx.close();
  }, 1000);
}

type CaseItem = {
  id: number;
  name: string;
  value: number;
  chance: number;
  image: string;
  rarity: string;
  rarityColor: string;
};

const CASE_PRICE = 1000;

const caseItems: CaseItem[] = [
  {
    id: 1,
    name: "M4A1-S | Printstream",
    value: 500,
    chance: 38,
    image: "/skins/m4a1s-printstream.png",
    rarity: "Mil-Spec",
    rarityColor: "#4B69FF",
  },
  {
    id: 2,
    name: "AWP | Asiimov",
    value: 750,
    chance: 29,
    image: "/skins/awp-asiimov.png",
    rarity: "Restricted",
    rarityColor: "#8847FF",
  },
  {
    id: 3,
    name: "AK-47 | Redline",
    value: 1000,
    chance: 20,
    image: "/skins/ak47-redline.png",
    rarity: "Classified",
    rarityColor: "#D32CE6",
  },
  {
    id: 4,
    name: "USP-S | Kill Confirmed",
    value: 2500,
    chance: 8,
    image: "/skins/usp-kill-confirmed.png",
    rarity: "Covert",
    rarityColor: "#EB4B4B",
  },
  {
    id: 5,
    name: "Desert Eagle | Printstream",
    value: 5000,
    chance: 4,
    image: "/skins/deagle-printstream.png",
    rarity: "Covert",
    rarityColor: "#EB4B4B",
  },
  {
    id: 6,
    name: "Butterfly Knife | Gamma Doppler",
    value: 50000,
    chance: 1,
    image: "/skins/butterfly-gamma-doppler.png",
    rarity: "Rare Special Item",
    rarityColor: "#F5C542",
  },
];

function pickWinner(): CaseItem {
  const roll = Math.random() * 100;
  let total = 0;

  for (const item of caseItems) {
    total += item.chance;

    if (roll < total) {
      return item;
    }
  }

  return caseItems[0];
}

function randomItem(): CaseItem {
  return caseItems[Math.floor(Math.random() * caseItems.length)];
}

export default function CasePage() {
  const { balance, addEmeralds, removeEmeralds } = useEmeralds();

  const [opening, setOpening] = useState(false);
  const [winner, setWinner] = useState<CaseItem | null>(null);
  const [reel, setReel] = useState<CaseItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [spinEnabled, setSpinEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [showWin, setShowWin] = useState(false);
  const [soundEnabled] = useSharedSoundEnabled();

  const playSound = useCallback(
    (name: CaseSound) => {
      if (!soundEnabled) return;
      playCaseSound(name);
    },
    [soundEnabled]
  );

  const reelRef = useRef<HTMLDivElement | null>(null);
  const tickIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const spinTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWinTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideWinTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const messageTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setReel(
      Array.from({ length: 40 }, () => randomItem())
    );

    return () => {
      if (spinTimeoutRef.current)
        clearTimeout(spinTimeoutRef.current);

      if (showWinTimeoutRef.current)
        clearTimeout(showWinTimeoutRef.current);

      if (hideWinTimeoutRef.current)
        clearTimeout(hideWinTimeoutRef.current);

      if (messageTimeoutRef.current)
        clearTimeout(messageTimeoutRef.current);

      if (tickIntervalRef.current)
        clearInterval(tickIntervalRef.current);
    };
  }, []);

  function openCase() {
    if (opening) return;

    if (balance < CASE_PRICE) {
      playSound("error");
      setMessage("Not enough Emeralds to open this case.");

      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }

      messageTimeoutRef.current = setTimeout(() => {
        setMessage("");
      }, 2500);

      return;
    }

    const paid = removeEmeralds(CASE_PRICE);

    if (!paid) {
      playSound("error");
      return;
    }

    playSound("spin-start");

    if (spinTimeoutRef.current)
      clearTimeout(spinTimeoutRef.current);

    if (showWinTimeoutRef.current)
      clearTimeout(showWinTimeoutRef.current);

    if (hideWinTimeoutRef.current)
      clearTimeout(hideWinTimeoutRef.current);

    if (messageTimeoutRef.current)
      clearTimeout(messageTimeoutRef.current);

    if (tickIntervalRef.current)
      clearInterval(tickIntervalRef.current);

    setOpening(true);
    setWinner(null);
    setShowWin(false);
    setMessage("");

    /*
      Tämä resetoi rullan ennen jokaista avausta,
      jotta animaatio toimii myös toisella,
      kolmannella jne. spinillä.
    */
    setSpinEnabled(false);
    setOffset(0);

    const selectedWinner = pickWinner();

    const WIN_INDEX = 32;

    const newReel = Array.from(
      { length: 40 },
      () => randomItem()
    );

    newReel[WIN_INDEX] = selectedWinner;

    setReel(newReel);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const CARD_WIDTH = 164;

        const containerWidth =
          reelRef.current?.clientWidth ?? 900;

        const center = containerWidth / 2;

        const target =
          WIN_INDEX * CARD_WIDTH -
          center +
          CARD_WIDTH / 2;

        const randomStop =
          Math.floor(Math.random() * 50) - 25;

        setSpinEnabled(true);
        setOffset(-(target + randomStop));

        // Light reel ticks: quick at first, kept subtle so the spin is not noisy.
        let tickCount = 0;
        tickIntervalRef.current = setInterval(() => {
          tickCount += 1;
          if (tickCount <= 20) {
            playSound("reel-tick");
          } else if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
          }
        }, 115);
      });
    });

    spinTimeoutRef.current = setTimeout(() => {
      /*
        TÄRKEÄ:
        saldoon lisätään aina juuri voitetun
        skinin oma value.
      */
      const payout = selectedWinner.value;

      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }

      playSound("spin-end");

      setWinner(selectedWinner);
      addEmeralds(payout);
      setOpening(false);

      setMessage(
        `You won ${selectedWinner.name} — 💎 ${payout.toLocaleString(
          "en-US"
        )}`
      );

      showWinTimeoutRef.current = setTimeout(() => {
        setShowWin(true);

        if (selectedWinner.value >= 5000) {
          playSound("big-win");
        } else {
          playSound("win");
        }
      }, 250);

      hideWinTimeoutRef.current = setTimeout(() => {
        setShowWin(false);
      }, 3000);

      messageTimeoutRef.current = setTimeout(() => {
        setMessage("");
      }, 4000);
    }, 5200);
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">

      {/* WIN SCREEN */}
      {showWin && winner && (
        <div className="win-overlay pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#0B0B0F]/95 backdrop-blur-md">

          <div
            className="win-glow absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
            style={{
              backgroundColor: winner.rarityColor + "35",
            }}
          />

          <div
            className="win-ring absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              borderColor: winner.rarityColor,
            }}
          />

          <div className="win-content relative z-10 flex flex-col items-center text-center">

            <div
              className="text-[11px] font-black uppercase tracking-[0.45em]"
              style={{
                color: winner.rarityColor,
              }}
            >
              CASE OPENED
            </div>

            <div className="relative mt-7">

              <div
                className="absolute -inset-12 rounded-full blur-[55px]"
                style={{
                  backgroundColor:
                    winner.rarityColor + "35",
                }}
              />

              <div
                className="winner-card relative flex h-60 w-72 items-center justify-center overflow-hidden rounded-[36px] border-2 bg-[radial-gradient(circle_at_center,#351765,#151020,#0B0B0F)]"
                style={{
                  borderColor: winner.rarityColor,
                  boxShadow: `0 0 80px ${winner.rarityColor}45`,
                }}
              >
                <Image
                  src={winner.image}
                  alt={winner.name}
                  width={420}
                  height={280}
                  className="h-[170px] w-[90%] object-contain drop-shadow-[0_18px_25px_rgba(0,0,0,0.7)]"
                  priority
                />
              </div>
            </div>

            <div
              className="mt-6 text-xs font-black uppercase tracking-[0.3em]"
              style={{
                color: winner.rarityColor,
              }}
            >
              {winner.rarity}
            </div>

            <h2 className="mt-2 max-w-xl px-5 text-3xl font-black md:text-5xl">
              {winner.name}
            </h2>

            <div className="mt-5 rounded-2xl border border-[#F5C542]/40 bg-[#15131D] px-8 py-4">

              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
                VALUE
              </div>

              <div className="mt-1 text-3xl font-black text-[#F5C542]">
                💎{" "}
                {winner.value.toLocaleString(
                  "en-US"
                )}
              </div>

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
                className="font-bold text-white"
              >
                Case
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
                className="rounded-lg border border-[#F5C542]/30 bg-[#15131D] px-4 py-2 text-xs font-black text-[#F5C542] transition hover:border-[#F5C542]"
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
      <section className="mx-auto max-w-6xl px-4 py-8">

        {/* TITLE */}
        <div className="text-center">

          <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6C2BD9]">
            CS ACE
          </div>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            CS ACE CASE
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
            Open the case and reveal your demo skin.
          </p>

          {/* CS ACE CASE IMAGE */}
          <div className="mx-auto mt-5 flex justify-center">
            <Image
              src="/cases/cs-ace-case.png"
              alt="CS ACE Case"
              width={400}
              height={400}
              className="h-auto w-[240px] object-contain drop-shadow-[0_0_45px_rgba(108,43,217,0.50)] md:w-[300px]"
              priority
            />
          </div>

          {/* CASE PRICE */}
          <div className="mx-auto mt-3 flex w-fit items-center gap-3 rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-5 py-3">

            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
              CASE PRICE
            </span>

            <span className="font-black text-[#F5C542]">
              💎 {CASE_PRICE.toLocaleString("en-US")}
            </span>

          </div>
        </div>

        {/* CASE REEL */}
        <div
          ref={reelRef}
          className="relative mx-auto mt-7 h-[190px] max-w-5xl overflow-hidden rounded-2xl border border-[#6C2BD9]/40 bg-[#09090d] shadow-[0_0_50px_rgba(108,43,217,0.12)]"
        >

          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-28 bg-gradient-to-r from-[#09090d] to-transparent" />

          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-28 bg-gradient-to-l from-[#09090d] to-transparent" />

          <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-[2px] -translate-x-1/2 bg-[#F5C542] shadow-[0_0_15px_#F5C542]" />

          <div className="pointer-events-none absolute left-1/2 top-0 z-40 -translate-x-1/2 border-l-[9px] border-r-[9px] border-t-[13px] border-l-transparent border-r-transparent border-t-[#F5C542]" />

          <div className="pointer-events-none absolute bottom-0 left-1/2 z-40 -translate-x-1/2 border-b-[13px] border-l-[9px] border-r-[9px] border-b-[#F5C542] border-l-transparent border-r-transparent" />

          <div
            className="absolute left-0 top-[15px] flex gap-2"
            style={{
              transform: `translateX(${offset}px)`,
              transition: spinEnabled
                ? "transform 5s cubic-bezier(0.08, 0.72, 0.08, 1)"
                : "none",
            }}
          >

            {reel.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="relative h-[160px] w-[156px] shrink-0 overflow-hidden border bg-[#15151c]"
                style={{
                  borderColor:
                    item.rarityColor + "80",
                }}
              >

                <div
                  className="absolute bottom-0 left-0 h-[4px] w-full"
                  style={{
                    backgroundColor:
                      item.rarityColor,
                    boxShadow: `0 0 12px ${item.rarityColor}`,
                  }}
                />

                <div className="flex h-[112px] items-center justify-center bg-[radial-gradient(circle_at_center,#292336,#111116)] p-2">

                  <Image
                    src={item.image}
                    alt={item.name}
                    width={220}
                    height={130}
                    className="h-[90px] w-[95%] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.7)]"
                  />

                </div>

                <div className="px-2 pt-2">

                  <div className="truncate text-[10px] font-black">
                    {item.name}
                  </div>

                  <div
                    className="mt-1 text-[8px] font-bold uppercase"
                    style={{
                      color: item.rarityColor,
                    }}
                  >
                    {item.rarity}
                  </div>

                </div>
              </div>
            ))}

          </div>
        </div>

        {/* OPEN BUTTON */}
        <div className="mt-7 text-center">

          <button
            type="button"
            onMouseEnter={() => playSound("ui-hover")}
            onClick={() => { playSound("ui-click"); openCase(); }}
            disabled={
              opening ||
              balance < CASE_PRICE
            }
            className="min-w-[240px] rounded-xl bg-[#6C2BD9] px-10 py-4 text-sm font-black text-white shadow-[0_0_30px_rgba(108,43,217,0.25)] transition hover:bg-[#7d3be8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {opening
              ? "OPENING..."
              : balance < CASE_PRICE
                ? "NOT ENOUGH EMERALDS"
                : `OPEN CASE — 💎 ${CASE_PRICE.toLocaleString(
                    "en-US"
                  )}`}
          </button>

        </div>

        {/* MESSAGE */}
        <div className="mx-auto mt-4 h-14 max-w-xl">

          {message && (
            <div className="rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-5 py-3 text-center text-sm font-black text-[#F5C542]">
              {message}
            </div>
          )}

        </div>

        {/* CASE CONTENTS */}
        <div className="mt-8">

          <div className="mb-4 text-center">

            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
              CASE CONTENTS
            </div>

            <h2 className="mt-1 text-2xl font-black">
              POSSIBLE DROPS
            </h2>

          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {caseItems.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-2xl border bg-[#111116]"
                style={{
                  borderColor:
                    item.rarityColor + "55",
                }}
              >

                <div
                  className="absolute bottom-0 left-0 h-[4px] w-full"
                  style={{
                    backgroundColor:
                      item.rarityColor,
                  }}
                />

                <div className="relative flex h-32 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#292336,#111116,#0B0B0F)]">

                  <div
                    className="absolute h-20 w-32 rounded-full blur-[40px]"
                    style={{
                      backgroundColor:
                        item.rarityColor + "20",
                    }}
                  />

                  <Image
                    src={item.image}
                    alt={item.name}
                    width={300}
                    height={180}
                    className="relative z-10 h-[100px] w-[90%] object-contain drop-shadow-[0_15px_20px_rgba(0,0,0,0.65)]"
                  />

                </div>

                <div className="p-4">

                  <h3 className="text-sm font-black">
                    {item.name}
                  </h3>

                  <div className="mt-1 flex items-center justify-between">

                    <span
                      className="text-[9px] font-black uppercase tracking-wider"
                      style={{
                        color: item.rarityColor,
                      }}
                    >
                      {item.rarity}
                    </span>

                    <span className="text-xs font-black text-[#F5C542]">
                      {item.chance}%
                    </span>

                  </div>

                  <div className="mt-3 border-t border-white/5 pt-3">

                    <div className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
                      VALUE
                    </div>

                    <div className="mt-1 font-black text-[#F5C542]">
                      💎{" "}
                      {item.value.toLocaleString(
                        "en-US"
                      )}
                    </div>

                  </div>

                </div>
              </div>
            ))}

          </div>
        </div>

        {/* DEMO NOTICE */}
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#F5C542]/20 bg-[#15131D] px-6 py-5 text-center">

          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#F5C542]">
            DEMO CASE
          </div>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            Case openings use virtual Emeralds and demo
            items only. No real money, Steam items or
            external transfers are processed.
          </p>

        </div>

      </section>

      <style jsx>{`
        .win-overlay {
          animation: overlayIn 0.25s ease-out both;
        }

        .win-content {
          animation: winContent 0.65s
            cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .winner-card {
          animation: winnerReveal 0.7s
            cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .win-ring {
          animation: ringExpand 1.2s ease-out both;
        }

        .win-glow {
          animation: glowExpand 1.5s ease-out both;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes winContent {
          from {
            opacity: 0;
            transform: scale(0.85);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes winnerReveal {
          from {
            opacity: 0;
            transform: scale(0.45);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes ringExpand {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%)
              scale(0.2);
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -50%)
              scale(3.5);
          }
        }

        @keyframes glowExpand {
          from {
            opacity: 0;
            transform: translate(-50%, -50%)
              scale(0.3);
          }

          to {
            opacity: 1;
            transform: translate(-50%, -50%)
              scale(1);
          }
        }
      `}</style>

    </main>
  );
}