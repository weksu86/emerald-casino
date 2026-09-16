"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";
import { useSharedSoundEnabled } from "../lib/useSoundSettings";
import AnimatedBalance from "../components/AnimatedBalance";

type Suit = "♠" | "♥" | "♦" | "♣";

type Card = {
  rank: string;
  suit: Suit;
  value: number;
  joker?: boolean;
};

const suits: Suit[] = ["♠", "♥", "♦", "♣"];

const ranks = [
  { rank: "2", value: 2 },
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 11 },
  { rank: "Q", value: 12 },
  { rank: "K", value: 13 },
  { rank: "A", value: 14 },
];

const payouts: Record<string, number> = {
  "Royal Flush": 200,
  "Five of a Kind": 100,
  "Straight Flush": 50,
  "Four of a Kind": 30,
  "Full House": 10,
  Flush: 6,
  Straight: 4,
  "Three of a Kind": 3,
  "Two Pair": 2,
  "Jacks or Better": 1,
};

const handValues: Record<string, number> = {
  "No Hand": 0,
  "Jacks or Better": 1,
  "Two Pair": 2,
  "Three of a Kind": 3,
  Straight: 4,
  Flush: 5,
  "Full House": 6,
  "Four of a Kind": 7,
  "Straight Flush": 8,
  "Royal Flush": 9,
  "Five of a Kind": 10,
};

function makeDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const item of ranks) {
      deck.push({
        rank: item.rank,
        suit,
        value: item.value,
      });
    }
  }

  deck.push({
    rank: "JOKER",
    suit: "♠",
    value: 0,
    joker: true,
  });

  return deck;
}

function shuffle(cards: Card[]): Card[] {
  const deck = [...cards];

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }

  return deck;
}


type SoundName =
  | "ui-click"
  | "ui-hover"
  | "card-flip"
  | "card-deal"
  | "chip-bet"
  | "win"
  | "loss";

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function playSynthSound(name: SoundName) {
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

    case "card-flip":
      noise(now, 0.075, 0.038, 1450, 7200);
      tone(760, now + 0.045, 0.045, 0.012, "triangle", 520);
      noise(now + 0.062, 0.026, 0.018, 2600, 9000);
      break;

    case "card-deal":
      noise(now, 0.058, 0.046, 520, 5200);
      tone(230, now + 0.018, 0.042, 0.012, "triangle", 170);
      noise(now + 0.038, 0.025, 0.014, 1800, 7000);
      break;

    case "chip-bet":
      tone(1580, now, 0.055, 0.026, "sine", 1390);
      tone(2310, now + 0.012, 0.06, 0.016, "sine", 1980);
      noise(now, 0.026, 0.012, 3200, 10000);
      break;

    case "win":
      tone(659.25, now, 0.13, 0.028);
      tone(830.61, now + 0.065, 0.15, 0.031);
      tone(987.77, now + 0.13, 0.18, 0.035);
      tone(1318.51, now + 0.195, 0.22, 0.022, "triangle");
      tone(1975.53, now + 0.21, 0.14, 0.012);
      break;

    case "loss":
      tone(392, now, 0.105, 0.018, "sine", 349.23);
      tone(293.66, now + 0.07, 0.15, 0.015, "sine", 261.63);
      break;
  }

  window.setTimeout(() => {
    void ctx.close();
  }, 900);
}

function normalHand(cards: Card[]): string {
  if (cards.length !== 5) {
    return "No Hand";
  }

  const values = cards
    .map((card) => card.value)
    .sort((a, b) => a - b);

  const counts: Record<number, number> = {};

  for (const value of values) {
    counts[value] = (counts[value] || 0) + 1;
  }

  const frequencies = Object.values(counts).sort(
    (a, b) => b - a
  );

  const flush = cards.every(
    (card) => card.suit === cards[0].suit
  );

  const unique = Array.from(new Set(values));

  let straight = false;

  if (
    unique.length === 5 &&
    unique[4] - unique[0] === 4
  ) {
    straight = true;
  }

  if (unique.join(",") === "2,3,4,5,14") {
    straight = true;
  }

  if (frequencies[0] === 5) {
    return "Five of a Kind";
  }

  if (straight && flush) {
    if (unique.join(",") === "10,11,12,13,14") {
      return "Royal Flush";
    }

    return "Straight Flush";
  }

  if (frequencies[0] === 4) {
    return "Four of a Kind";
  }

  if (
    frequencies[0] === 3 &&
    frequencies[1] === 2
  ) {
    return "Full House";
  }

  if (flush) {
    return "Flush";
  }

  if (straight) {
    return "Straight";
  }

  if (frequencies[0] === 3) {
    return "Three of a Kind";
  }

  if (
    frequencies[0] === 2 &&
    frequencies[1] === 2
  ) {
    return "Two Pair";
  }

  if (frequencies[0] === 2) {
    for (const value of Object.keys(counts)) {
      if (
        counts[Number(value)] === 2 &&
        Number(value) >= 11
      ) {
        return "Jacks or Better";
      }
    }
  }

  return "No Hand";
}

function evaluate(cards: Card[]): string {
  const joker = cards.find((card) => card.joker);

  if (!joker) {
    return normalHand(cards);
  }

  const normalCards = cards.filter(
    (card) => !card.joker
  );

  let best = "No Hand";

  for (const suit of suits) {
    for (const rank of ranks) {
      const testCard: Card = {
        rank: rank.rank,
        suit,
        value: rank.value,
      };

      const result = normalHand([
        ...normalCards,
        testCard,
      ]);

      if (handValues[result] > handValues[best]) {
        best = result;
      }
    }
  }

  return best;
}

function PlayingCard({
  card,
  held,
  onHold,
  animationClass = "",
}: {
  card: Card;
  held: boolean;
  onHold: () => void;
  animationClass?: string;
}) {
  if (card.joker) {
    const jokerClass = held
      ? `${animationClass} relative h-28 w-[68px] shrink-0 -translate-y-2 overflow-hidden rounded-xl border-2 border-[#F5C542] bg-[#17121f] shadow-[0_0_28px_rgba(245,197,66,0.25)] transition-all sm:h-32 sm:w-[80px]`
      : `${animationClass} relative h-28 w-[68px] shrink-0 overflow-hidden rounded-xl border-2 border-[#6C2BD9] bg-[#17121f] shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-all hover:-translate-y-1 sm:h-32 sm:w-[80px]`;

    return (
      <button
        type="button"
        onClick={onHold}
        className={jokerClass}
      >
        <img
          src="/cards/joker.png"
          alt="CS ACE Joker"
          className="absolute inset-0 h-full w-full object-fill"
        />

        {held && (
          <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-b-lg bg-[#F5C542] px-2 py-1 text-[9px] font-black text-black">
            HOLD
          </div>
        )}
      </button>
    );
  }

  const red =
    card.suit === "♥" || card.suit === "♦";

  const textClass = red
    ? "text-red-500"
    : "text-black";

  const cardClass = held
    ? `${animationClass} relative h-28 w-[68px] shrink-0 -translate-y-2 overflow-hidden rounded-xl border-2 border-[#F5C542] bg-white shadow-[0_0_28px_rgba(245,197,66,0.25)] transition-all sm:h-32 sm:w-[80px]`
    : `${animationClass} relative h-28 w-[68px] shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-all hover:-translate-y-1 sm:h-32 sm:w-[80px]`;

  return (
    <button
      type="button"
      onClick={onHold}
      className={cardClass}
    >
      <div
        className={
          "absolute left-2 top-2 z-10 text-left text-base font-black leading-none " +
          textClass
        }
      >
        <div>{card.rank}</div>
        <div className="mt-1">{card.suit}</div>
      </div>

      <div
        className={
          "flex h-full items-center justify-center text-3xl " +
          textClass
        }
      >
        {card.suit}
      </div>

      {held && (
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-b-lg bg-[#F5C542] px-2 py-1 text-[9px] font-black text-black">
          HOLD
        </div>
      )}
    </button>
  );
}

export default function JokerPokerPage() {
  const {
    balance,
    addEmeralds,
    removeEmeralds,
  } = useEmeralds();

  const [cards, setCards] = useState<Card[]>([]);

  const [held, setHeld] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  const [bet, setBet] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [dealing, setDealing] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [drawBackIndex, setDrawBackIndex] = useState<number | null>(null);
  const [result, setResult] = useState("");
  const [win, setWin] = useState(0);

  const [showWinAnimation, setShowWinAnimation] =
    useState(false);

  const [soundEnabled] = useSharedSoundEnabled();

  const playSound = useCallback(
    (name: SoundName) => {
      if (!soundEnabled) return;
      playSynthSound(name);
    },
    [soundEnabled]
  );

  async function deal() {
    if (playing || dealing || drawing) return;

    if (balance < bet || bet <= 0) {
      setResult("Not enough Emeralds");
      return;
    }

    const success = removeEmeralds(bet);

    if (!success) {
      setResult("Not enough Emeralds");
      return;
    }

    playSound("chip-bet");

    const deck = shuffle(makeDeck());
    const newHand = deck.slice(0, 5);

    setCards(newHand);
    setHeld([false, false, false, false, false]);
    setResult("");
    setWin(0);
    setShowWinAnimation(false);
    setDealing(true);
    setVisibleCount(0);

    for (let i = 0; i < 5; i++) {
      await new Promise<void>((resolve) => setTimeout(resolve, i === 0 ? 70 : 105));
      setAnimatingIndex(i);
      setVisibleCount(i + 1);
      playSound("card-deal");
      await new Promise<void>((resolve) => setTimeout(resolve, 115));
    }

    setAnimatingIndex(null);
    setDealing(false);
    setPlaying(true);
  }

  function holdCard(index: number) {
    if (!playing || dealing) return;

    setHeld((current) =>
      current.map((value, i) => {
        if (i === index) {
          return !value;
        }

        return value;
      })
    );
  }

  async function draw() {
    if (!playing || dealing || drawing) return;

    setDrawing(true);
    setPlaying(false);

    const deck = shuffle(makeDeck());
    const used = new Set(
      cards.map((card) => (card.joker ? "JOKER" : card.rank + card.suit))
    );

    const available = deck.filter((card) => {
      const id = card.joker ? "JOKER" : card.rank + card.suit;
      return !used.has(id);
    });

    let replacementIndex = 0;
    const finalCards = [...cards];
    const replaceIndices = held
      .map((isHeld, index) => (!isHeld ? index : -1))
      .filter((index) => index !== -1);

    for (const index of replaceIndices) {
      // 1) Vanha kortti kääntyy selkäpuolelle.
      setAnimatingIndex(index);
      playSound("card-flip");
      await new Promise<void>((resolve) => setTimeout(resolve, 150));

      // 2) Näytä täsmälleen Blackjackin CS ACE -korttitausta.
      setDrawBackIndex(index);
      setAnimatingIndex(null);
      await new Promise<void>((resolve) => setTimeout(resolve, 115));

      // 3) Vaihda uusi kortti taustan takana.
      const replacement = available[replacementIndex];
      replacementIndex++;
      finalCards[index] = replacement;

      setCards((current) =>
        current.map((card, cardIndex) =>
          cardIndex === index ? replacement : card
        )
      );

      // 4) Uusi kortti kääntyy selkäpuolelta etupuolelle.
      setDrawBackIndex(null);
      setAnimatingIndex(index);
      playSound("card-deal");
      await new Promise<void>((resolve) => setTimeout(resolve, 190));
      setAnimatingIndex(null);

      await new Promise<void>((resolve) => setTimeout(resolve, 45));
    }

    setDrawBackIndex(null);
    setAnimatingIndex(null);
    setDrawing(false);

    const hand = evaluate(finalCards);
    const multiplier = payouts[hand] || 0;
    const payout = bet * multiplier;

    setResult(hand);
    setWin(payout);

    if (payout > 0) {
      addEmeralds(payout);
      playSound("win");
      setShowWinAnimation(true);
      setTimeout(() => setShowWinAnimation(false), 1700);
    } else {
      playSound("loss");
      setShowWinAnimation(false);
    }
  }

  function newGame() {
    setCards([]);

    setHeld([
      false,
      false,
      false,
      false,
      false,
    ]);

    setPlaying(false);
    setDealing(false);
    setDrawing(false);
    setVisibleCount(5);
    setAnimatingIndex(null);
    setDrawBackIndex(null);
    setResult("");
    setWin(0);
    setShowWinAnimation(false);
  }

  function handleBetInput(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(
      event.target.value.replace(/\D/g, "")
    );

    if (value > balance) {
      setBet(balance);
      return;
    }

    setBet(value);
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">

      {/* WIN SCREEN */}
      {showWinAnimation && win > 0 && (
        <div className="win-screen pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
          <div className="win-flash absolute inset-0 bg-[#20C997]/5" />
          <div className="win-glow absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#20C997]/15 blur-[90px]" />

          <div className="win-content relative z-10 text-center">
            <div className="win-badge mx-auto w-fit rounded-full border border-[#20C997]/40 bg-[#0B0B0F]/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#20C997] shadow-[0_0_30px_rgba(32,201,151,0.18)]">
              WIN
            </div>

            <div className="mt-3 text-3xl font-black uppercase text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.12)] md:text-5xl">
              {result}
            </div>

            <div className="win-amount mt-3 text-4xl font-black text-[#F5C542] drop-shadow-[0_0_22px_rgba(245,197,66,0.35)] md:text-6xl">
              +💎 {win.toLocaleString("en-US")}
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
                className="font-bold text-white"
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
      <section className="mx-auto max-w-6xl px-4 py-7">

        <div className="mb-5 text-center">

          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-[#6C2BD9]">
            CS ACE
          </div>

          <h1 className="mt-1 text-3xl font-black md:text-4xl">
            JOKER POKER
          </h1>

          <p className="mt-1 text-[11px] text-gray-600">
            Hold your cards and draw once
          </p>

        </div>

        {/* GAME TABLE */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#6C2BD9]/50 bg-[#111116] shadow-[0_0_60px_rgba(108,43,217,0.12)]">

          <div className="absolute left-1/2 top-0 z-20 h-[2px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#F5C542] to-transparent" />

          {/* CARD AREA */}
          <div className="relative min-h-[350px] overflow-hidden bg-[radial-gradient(ellipse_at_center,#421b7d,#25103f_45%,#12091f_100%)] px-3 py-8 shadow-[inset_0_0_80px_rgba(108,43,217,0.18)] md:px-8">

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#6C2BD9]/15" />

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[205px] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#F5C542]/5" />

            <div className="relative flex min-h-[190px] items-center justify-center">

              {cards.length === 0 ? (
                <div className="text-center">
                  <div className="mx-auto flex h-28 w-[68px] items-center justify-center rounded-xl border border-dashed border-[#6C2BD9]/40 bg-black/10 text-2xl sm:h-32 sm:w-[80px]">
                    🃏
                  </div>

                  <div className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-gray-600">
                    SET YOUR BET AND PRESS DEAL
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {cards.map((card, index) => {
                    const hiddenDuringDeal = dealing && index >= visibleCount;
                    const isDrawAnimating = drawing && animatingIndex === index;
                    const isDealAnimating = dealing && animatingIndex === index;

                    return (
                      <div
                        key={index}
                        className="h-28 w-[68px] shrink-0 sm:h-32 sm:w-[80px]"
                      >
                        {!hiddenDuringDeal && (
                          drawBackIndex === index ? (
                            <div className="card-back-flip relative h-28 w-[68px] shrink-0 rounded-xl border-2 border-[#6C2BD9] bg-[#21113d] shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:h-32 sm:w-[80px]">
                              <div className="absolute inset-2 rounded-lg border border-[#F5C542]/30 bg-[radial-gradient(circle_at_center,#6C2BD9,#24103f,#10091d)]" />
                              <div className="absolute inset-[11px] rounded-md border border-white/5" />
                              <div className="relative flex h-full flex-col items-center justify-center">
                                <div className="text-2xl drop-shadow-[0_0_12px_rgba(245,197,66,0.55)]">
                                  💎
                                </div>
                                <div className="mt-1 text-[7px] font-black uppercase tracking-[0.25em] text-[#F5C542]">
                                  CS ACE
                                </div>
                              </div>
                            </div>
                          ) : (
                            <PlayingCard
                              key={`${card.rank}-${card.suit}-${index}`}
                              card={card}
                              held={held[index]}
                              onHold={() => holdCard(index)}
                              animationClass={
                                isDrawAnimating
                                  ? "card-flip-face"
                                  : isDealAnimating
                                  ? "card-deal"
                                  : ""
                              }
                            />
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* STATUS */}
            <div className="relative mt-4 min-h-[45px] text-center">

              {(dealing || drawing) && (
                <>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F5C542]">
                    {drawing ? "DRAWING CARDS" : "DEALING CARDS"}
                  </div>

                  <div className="mt-1 text-[10px] text-gray-600">
                    Good luck
                  </div>
                </>
              )}

              {playing && !dealing && !drawing && (
                <>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F5C542]">
                    SELECT CARDS TO HOLD
                  </div>

                  <div className="mt-1 text-[10px] text-gray-600">
                    Click a card to keep it
                  </div>
                </>
              )}

              {!playing && !dealing && !drawing && result && (
                <div
                  className={
                    win > 0
                      ? "text-2xl font-black uppercase text-[#20C997]"
                      : "text-2xl font-black uppercase text-[#E0525F]"
                  }
                >
                  {result}
                </div>
              )}

            </div>

            <div className="relative mx-auto mt-2 w-fit rounded-full border border-[#F5C542]/20 bg-black/20 px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.25em] text-[#F5C542]">
              🃏 JOKER IS WILD
            </div>

          </div>

          {/* CONTROLS */}
          <div className="border-t border-[#6C2BD9]/30 bg-[#09090D] px-4 py-5">

            <div className="mx-auto max-w-4xl">

              <div className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">
                BET AMOUNT
              </div>

              {/* BET */}
              <div className="mt-2 flex items-center justify-center gap-3">

                <div className="relative">

                  <input
                    type="text"
                    inputMode="numeric"
                    value={bet}
                    disabled={playing || dealing || drawing}
                    onChange={handleBetInput}
                    className="w-36 rounded-xl border border-[#6C2BD9]/50 bg-[#15131D] px-4 py-3 pr-9 text-center text-lg font-black text-[#F5C542] outline-none transition focus:border-[#F5C542] disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    💎
                  </span>

                </div>

                <div className="text-left">

                  <div className="text-[8px] font-black uppercase tracking-widest text-gray-700">
                    AVAILABLE
                  </div>

                  <div className="text-xs font-black text-gray-500">
                    {balance.toLocaleString("en-US")} 💎
                  </div>

                </div>

              </div>

              {/* QUICK BETS - TILA PYSYY AINA SAMANA */}
              <div className="mt-3 h-[31px]">

                {!playing && !result && !dealing && !drawing && (
                  <div className="flex h-full items-center justify-center gap-2">

                    {[100, 250, 500, 1000].map(
                      (amount) => (
                        <button
                          key={amount}
                          type="button"
                          onMouseEnter={() => playSound("ui-hover")}
                          onClick={() => {
                            playSound("ui-click");
                            setBet(
                              Math.min(
                                amount,
                                balance
                              )
                            );
                          }}
                          disabled={balance <= 0}
                          className="rounded-lg border border-[#6C2BD9]/30 bg-[#15131D] px-3 py-1.5 text-[10px] font-black text-gray-400 transition hover:border-[#6C2BD9] hover:text-white disabled:opacity-30"
                        >
                          {amount.toLocaleString("en-US")}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onMouseEnter={() => playSound("ui-hover")}
                      onClick={() => {
                        playSound("ui-click");
                        setBet(balance);
                      }}
                      disabled={balance <= 0}
                      className="rounded-lg border border-[#F5C542]/30 bg-[#15131D] px-3 py-1.5 text-[10px] font-black text-[#F5C542] transition hover:border-[#F5C542] disabled:opacity-30"
                    >
                      ALL IN
                    </button>

                  </div>
                )}

              </div>

              {/* SLIDER */}
              <div className="mt-4 flex items-center gap-3">

                <span className="w-8 text-left text-[10px] font-black text-gray-700">
                  0
                </span>

                <input
                  type="range"
                  min="0"
                  max={Math.max(balance, 1)}
                  step="1"
                  value={Math.min(bet, balance)}
                  disabled={
                    playing ||
                    dealing ||
                    drawing ||
                    balance <= 0
                  }
                  onChange={(event) =>
                    setBet(
                      Number(event.target.value)
                    )
                  }
                  className="h-2 w-full cursor-pointer accent-[#F5C542]"
                />

                <span className="w-14 text-right text-[9px] font-black uppercase tracking-wider text-[#F5C542]">
                  ALL IN
                </span>

              </div>

              {/* DEAL / DRAW / NEW GAME - KIINTEÄ PAIKKA */}
              <div className="mt-5 flex h-[48px] items-center justify-center">

                <div className="relative h-[48px] w-[220px]">

                  {!playing && !result && (
                    <button
                      type="button"
                      onMouseEnter={() => playSound("ui-hover")}
                      onClick={() => { playSound("ui-click"); void deal(); }}
                      disabled={
                        bet <= 0 ||
                        bet > balance ||
                        dealing ||
                        drawing
                      }
                      className="absolute inset-0 h-full w-full rounded-xl bg-[#6C2BD9] text-sm font-black text-white shadow-[0_0_30px_rgba(108,43,217,0.20)] transition-colors hover:bg-[#7d3be8] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {dealing
                        ? "DEALING..."
                        : `DEAL — 💎 ${bet.toLocaleString(
                            "en-US"
                          )}`}
                    </button>
                  )}

                  {playing && !dealing && !drawing && (
                    <button
                      type="button"
                      onMouseEnter={() => playSound("ui-hover")}
                      onClick={() => { playSound("ui-click"); void draw(); }}
                      className="absolute inset-0 h-full w-full rounded-xl bg-[#F5C542] text-sm font-black text-black shadow-[0_0_25px_rgba(245,197,66,0.18)] transition-colors hover:bg-[#ffd45e]"
                    >
                      DRAW
                    </button>
                  )}

                  {!playing &&
                    !dealing &&
                    !drawing &&
                    result && (
                      <button
                        type="button"
                        onMouseEnter={() => playSound("ui-hover")}
                      onClick={() => { playSound("ui-click"); newGame(); }}
                        className="absolute inset-0 h-full w-full rounded-xl bg-[#6C2BD9] text-sm font-black text-white shadow-[0_0_30px_rgba(108,43,217,0.20)] transition-colors hover:bg-[#7d3be8]"
                      >
                        NEW GAME
                      </button>
                    )}

                </div>

              </div>

            </div>
          </div>
        </div>

        {/* PAYTABLE */}
        <div className="mt-7">

          <div className="mb-4 text-center">

            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-[#6C2BD9]">
              CS ACE
            </div>

            <div className="mt-1 text-sm font-black uppercase tracking-[0.3em] text-[#F5C542]">
              PAYTABLE
            </div>

          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">

            {Object.entries(payouts).map(
              ([name, multiplier]) => {
                const active = result === name;

                return (
                  <div
                    key={name}
                    className={
                      active
                        ? "rounded-xl border-2 border-[#F5C542] bg-[#F5C542] px-4 py-3 text-center shadow-[0_0_25px_rgba(245,197,66,0.45)] transition-all duration-500"
                        : "rounded-xl border border-[#6C2BD9]/30 bg-[#111116] px-4 py-3 text-center transition-all duration-500"
                    }
                  >
                    <div
                      className={
                        active
                          ? "text-xs font-black text-black"
                          : "text-xs font-bold text-gray-400"
                      }
                    >
                      {name}
                    </div>

                    <div
                      className={
                        active
                          ? "mt-1 text-xl font-black text-black"
                          : "mt-1 text-xl font-black text-[#F5C542]"
                      }
                    >
                      {multiplier}x
                    </div>

                  </div>
                );
              }
            )}

          </div>

          <div className="mx-auto mt-5 max-w-2xl rounded-xl border border-white/5 bg-[#111116] px-5 py-3 text-center">

            <span className="text-[10px] font-black text-[#F5C542]">
              🃏 JOKER IS WILD
            </span>

            <span className="mx-3 text-gray-800">
              •
            </span>

            <span className="text-[10px] font-black text-gray-500">
              JOKER CAN REPRESENT ANY CARD
            </span>

          </div>

        </div>

        <div className="mx-auto mt-4 max-w-2xl text-center text-[9px] font-bold uppercase tracking-[0.2em] text-gray-800">
          VIRTUAL EMERALDS • DEMO GAME • NO REAL MONEY
        </div>

      </section>

      {/* ANIMATIONS */}
      <style jsx>{`
        .card-deal {
          animation: cardDeal 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          transform-origin: 50% 100%;
        }

        .card-flip-face {
          animation: cardFlipFace 0.19s ease-in-out both;
          transform-origin: center;
          backface-visibility: hidden;
        }

        .card-back-flip {
          animation: cardBackFlip 0.15s ease-out both;
          transform-origin: center;
          backface-visibility: hidden;
        }

        .win-screen {
          animation: winScreen 1.7s ease both;
          background: rgba(8, 8, 12, 0.28);
          backdrop-filter: blur(2px);
        }

        .win-flash {
          animation: winFlash 0.55s ease-out both;
        }

        .win-glow {
          animation: winGlow 1.35s ease-out both;
        }

        .win-content {
          animation: winContent 1.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .win-badge {
          animation: winBadge 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .win-amount {
          animation: winAmount 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
        }

        @keyframes cardDeal {
          0% {
            opacity: 0;
            transform: translate(95px, -70px) scale(0.82) rotate(5deg);
            filter: blur(1px);
          }
          72% {
            opacity: 1;
            transform: translate(-2px, 1px) scale(1.015) rotate(-0.5deg);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1) rotate(0);
            filter: blur(0);
          }
        }

        @keyframes cardFlipFace {
          0% {
            opacity: 1;
            transform: perspective(700px) rotateY(0deg);
          }
          100% {
            opacity: 0.92;
            transform: perspective(700px) rotateY(90deg);
          }
        }

        @keyframes cardBackFlip {
          0% {
            opacity: 0.92;
            transform: perspective(700px) rotateY(-90deg);
          }
          100% {
            opacity: 1;
            transform: perspective(700px) rotateY(0deg);
          }
        }

        @keyframes winScreen {
          0% { opacity: 0; }
          10% { opacity: 1; }
          82% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes winFlash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes winGlow {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.45); }
          28% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.22); }
        }

        @keyframes winContent {
          0% { opacity: 0; transform: scale(0.82) translateY(10px); }
          18% { opacity: 1; transform: scale(1.04) translateY(0); }
          28% { transform: scale(1); }
          82% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.97) translateY(-6px); }
        }

        @keyframes winBadge {
          0% { opacity: 0; transform: scale(0.65); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes winAmount {
          0% { opacity: 0; transform: scale(0.72); }
          65% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

    </main>
  );
}