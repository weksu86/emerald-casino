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
  { rank: "J", value: 10 },
  { rank: "Q", value: 10 },
  { rank: "K", value: 10 },
  { rank: "A", value: 11 },
];

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
    // Tight premium UI tap: bright transient, almost no tail.
    case "ui-click":
      tone(1450, now, 0.032, 0.022, "triangle", 1050);
      noise(now, 0.025, 0.012, 3500, 9000);
      break;

    // Very light futuristic hover tick matching the CS ACE UI.
    case "ui-hover":
      tone(1280, now, 0.035, 0.010, "triangle", 1510);
      break;

    // Soft card "swish" + tiny snap at the end.
    case "card-flip":
      noise(now, 0.075, 0.038, 1450, 7200);
      tone(760, now + 0.045, 0.045, 0.012, "triangle", 520);
      noise(now + 0.062, 0.026, 0.018, 2600, 9000);
      break;

    // Short paper/table contact, deliberately not bass-heavy.
    case "card-deal":
      noise(now, 0.058, 0.046, 520, 5200);
      tone(230, now + 0.018, 0.042, 0.012, "triangle", 170);
      noise(now + 0.038, 0.025, 0.014, 1800, 7000);
      break;

    // Small metallic poker-chip contact.
    case "chip-bet":
      tone(1580, now, 0.055, 0.026, "sine", 1390);
      tone(2310, now + 0.012, 0.06, 0.016, "sine", 1980);
      noise(now, 0.026, 0.012, 3200, 10000);
      break;

    // Compact premium win chord: bright, clean and restrained.
    case "win":
      tone(659.25, now, 0.13, 0.028);
      tone(830.61, now + 0.065, 0.15, 0.031);
      tone(987.77, now + 0.13, 0.18, 0.035);
      tone(1318.51, now + 0.195, 0.22, 0.022, "triangle");
      tone(1975.53, now + 0.21, 0.14, 0.012);
      break;

    // Neutral downward cue, no dramatic "failure" sound.
    case "loss":
      tone(392, now, 0.105, 0.018, "sine", 349.23);
      tone(293.66, now + 0.07, 0.15, 0.015, "sine", 261.63);
      break;
  }

  window.setTimeout(() => {
    void ctx.close();
  }, 900);
}

function handValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    total += card.value;

    if (card.rank === "A") {
      aces++;
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

function PlayingCard({
  card,
  hidden = false,
  animationClass = "card-enter",
}: {
  card: Card;
  hidden?: boolean;
  animationClass?: string;
}) {
  if (hidden) {
    return (
      <div className={`${animationClass} relative h-28 w-[68px] shrink-0 rounded-xl border-2 border-[#6C2BD9] bg-[#21113d] shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:h-32 sm:w-[80px]`}>
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
    );
  }

  const red =
    card.suit === "♥" || card.suit === "♦";

  const textClass = red
    ? "text-red-500"
    : "text-black";

  return (
    <div className={`${animationClass} relative h-28 w-[68px] shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:h-32 sm:w-[80px]`}>

      {/* VASEN YLÄKULMA */}
      <div
        className={
          "absolute left-2 top-2 z-10 text-left text-base font-black leading-none " +
          textClass
        }
      >
        <div>{card.rank}</div>
        <div className="mt-1">{card.suit}</div>
      </div>

      {/* KESKIMMÄINEN MAA */}
      <div
        className={
          "flex h-full items-center justify-center text-3xl " +
          textClass
        }
      >
        {card.suit}
      </div>

      {/* OIKEA ALAKULMA TARKOITUKSELLA TYHJÄ */}

    </div>
  );
}

export default function BlackjackPage() {
  const { balance, removeEmeralds, addEmeralds } =
    useEmeralds();

  const [playerCards, setPlayerCards] =
    useState<Card[]>([]);

  const [dealerCards, setDealerCards] =
    useState<Card[]>([]);

  const [deck, setDeck] = useState<Card[]>([]);

  const [bet, setBet] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState("");
  const [win, setWin] = useState(0);

  const [showWinAnimation, setShowWinAnimation] =
    useState(false);

  const [actionBusy, setActionBusy] = useState(false);
  const [dealerHoleRevealed, setDealerHoleRevealed] = useState(false);
  const [dealerHoleFlipping, setDealerHoleFlipping] = useState(false);
  const [playerDealVisible, setPlayerDealVisible] = useState(0);
  const [dealerDealVisible, setDealerDealVisible] = useState(0);

  const wait = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const [soundEnabled] = useSharedSoundEnabled();
  const playSound = useCallback((name: SoundName) => {
    if (soundEnabled) playSynthSound(name);
  }, [soundEnabled]);

  async function startGame() {
    if (playing || actionBusy) return;

    if (bet <= 0 || bet > balance) {
      setResult("Not enough Emeralds");
      return;
    }

    const success = removeEmeralds(bet);
    if (!success) {
      setResult("Not enough Emeralds");
      return;
    }

    const shuffled = shuffle(makeDeck());
    const player = [shuffled[0], shuffled[2]];
    const dealer = [shuffled[1], shuffled[3]];
    const remaining = shuffled.slice(4);

    playSound("chip-bet");
    setActionBusy(true);
    setDealerHoleRevealed(false);
    setDealerHoleFlipping(false);
    setPlayerDealVisible(0);
    setDealerDealVisible(0);
    setPlayerCards(player);
    setDealerCards(dealer);
    setDeck(remaining);
    setPlaying(true);
    setResult("");
    setWin(0);
    setShowWinAnimation(false);

    // Casino-style initial deal: player -> dealer -> player -> dealer.
    await wait(90);
    setPlayerDealVisible(1); playSound("card-deal");
    await wait(145);
    setDealerDealVisible(1); playSound("card-deal");
    await wait(145);
    setPlayerDealVisible(2); playSound("card-deal");
    await wait(145);
    setDealerDealVisible(2); playSound("card-deal");
    await wait(210);

    setActionBusy(false);

    if (isBlackjack(player)) {
      await revealDealerHole();
      finishRound(player, dealer, bet, remaining);
    }
  }

  async function hit() {
    if (!playing || actionBusy || deck.length === 0) return;

    setActionBusy(true);
    const card = deck[0];
    const newPlayerCards = [...playerCards, card];
    const newDeck = deck.slice(1);

    setPlayerCards(newPlayerCards);
    setDeck(newDeck);
    playSound("card-deal");
    await wait(260);
    setActionBusy(false);

    if (handValue(newPlayerCards) > 21) {
      finishRound(newPlayerCards, dealerCards, bet, newDeck);
    }
  }

  async function revealDealerHole() {
    if (dealerHoleRevealed) return;

    setDealerHoleFlipping(true);
    playSound("card-flip");
    await wait(150);
    setDealerHoleRevealed(true);
    await wait(170);
    setDealerHoleFlipping(false);
  }

  async function stand() {
    if (!playing || actionBusy) return;

    setActionBusy(true);
    await revealDealerHole();

    let newDealerCards = [...dealerCards];
    let newDeck = [...deck];

    while (handValue(newDealerCards) < 17 && newDeck.length > 0) {
      const nextCard = newDeck[0];
      newDealerCards = [...newDealerCards, nextCard];
      newDeck = newDeck.slice(1);

      setDealerCards(newDealerCards);
      setDeck(newDeck);
      playSound("card-deal");
      await wait(300);
    }

    setActionBusy(false);
    finishRound(playerCards, newDealerCards, bet, newDeck);
  }

  async function doubleDown() {
    if (
      !playing ||
      actionBusy ||
      deck.length === 0 ||
      playerCards.length !== 2
    ) {
      return;
    }

    if (balance < bet) {
      setResult("Not enough Emeralds to double");
      return;
    }

    const success = removeEmeralds(bet);
    if (!success) return;

    setActionBusy(true);

    const newBet = bet * 2;
    setBet(newBet);

    const card = deck[0];
    const newPlayerCards = [...playerCards, card];
    let remainingDeck = deck.slice(1);

    setPlayerCards(newPlayerCards);
    setDeck(remainingDeck);
    playSound("card-deal");
    await wait(280);

    if (handValue(newPlayerCards) > 21) {
      setActionBusy(false);
      finishRound(newPlayerCards, dealerCards, newBet, remainingDeck);
      return;
    }

    await revealDealerHole();

    let newDealerCards = [...dealerCards];

    while (handValue(newDealerCards) < 17 && remainingDeck.length > 0) {
      const nextCard = remainingDeck[0];
      newDealerCards = [...newDealerCards, nextCard];
      remainingDeck = remainingDeck.slice(1);

      setDealerCards(newDealerCards);
      setDeck(remainingDeck);
      playSound("card-deal");
      await wait(300);
    }

    setActionBusy(false);
    finishRound(newPlayerCards, newDealerCards, newBet, remainingDeck);
  }

  function finishRound(
    player: Card[],
    dealer: Card[],
    currentBet: number,
    remainingDeck: Card[]
  ) {
    const playerValue = handValue(player);
    const dealerValue = handValue(dealer);

    let payout = 0;
    let message = "";

    if (playerValue > 21) {
      message = "BUST";
    } else if (isBlackjack(player)) {
      payout = currentBet * 2.5;
      message = "BLACKJACK";
    } else if (
      dealerValue > 21 ||
      playerValue > dealerValue
    ) {
      payout = currentBet * 2;
      message = "YOU WIN";
    } else if (
      playerValue === dealerValue
    ) {
      payout = currentBet;
      message = "PUSH";
    } else {
      message = "DEALER WINS";
    }

    setDeck(remainingDeck);
    setPlaying(false);
    setResult(message);
    setWin(payout);

    if (payout > 0) {
      addEmeralds(payout);

      if (message !== "PUSH") {
        playSound("win");
        setShowWinAnimation(true);

        setTimeout(() => {
          setShowWinAnimation(false);
        }, 1900);
      }
    }
  }

  function newGame() {
    setPlayerCards([]);
    setDealerCards([]);
    setDeck([]);
    setPlaying(false);
    setResult("");
    setWin(0);
    setShowWinAnimation(false);
    setActionBusy(false);
    setDealerHoleRevealed(false);
    setDealerHoleFlipping(false);
    setPlayerDealVisible(0);
    setDealerDealVisible(0);
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

  const playerValue = handValue(playerCards);
  const dealerValue = handValue(dealerCards);

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">

      {/* WIN ANIMATION */}
      {showWinAnimation && win > 0 && (
        <div className="win-screen pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">

          <div className="win-backdrop absolute inset-0 bg-[#08080C]/72 backdrop-blur-[3px]" />

          <div className="win-glow absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#20C997]/15 blur-[95px]" />

          <div className="win-ring win-ring-1 absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#20C997]/80" />
          <div className="win-ring win-ring-2 absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#F5C542]/70" />

          <span className="particle particle-1">💎</span>
          <span className="particle particle-2">✦</span>
          <span className="particle particle-3">💎</span>
          <span className="particle particle-4">✦</span>
          <span className="particle particle-5">💎</span>
          <span className="particle particle-6">✦</span>

          <div className="win-content relative z-10 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.5em] text-[#6C2BD9]">
              CS ACE
            </div>

            <div className="win-title mt-2 text-[12px] font-black uppercase tracking-[0.42em] text-[#20C997]">
              WIN
            </div>

            <div className="win-result mt-3 text-4xl font-black uppercase text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.18)] md:text-6xl">
              {result}
            </div>

            <div className="win-payout mx-auto mt-5 w-fit rounded-2xl border border-[#F5C542]/35 bg-[#15131D]/95 px-9 py-4 shadow-[0_0_45px_rgba(245,197,66,0.14)]">
              <div className="text-[8px] font-black uppercase tracking-[0.32em] text-gray-500">
                PAYOUT
              </div>

              <div className="mt-1 text-3xl font-black text-[#F5C542] md:text-4xl">
                +💎 {win.toLocaleString("en-US")}
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
                className="font-bold text-white"
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
            BLACKJACK
          </h1>

          <p className="mt-1 text-[11px] text-gray-600">
            Beat the dealer and reach 21
          </p>

        </div>

        {/* TABLE */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#6C2BD9]/50 bg-[#111116] shadow-[0_0_60px_rgba(108,43,217,0.12)]">

          <div className="absolute left-1/2 top-0 z-20 h-[2px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#F5C542] to-transparent" />

          <div className="relative bg-[radial-gradient(ellipse_at_center,#351765,#1d1033_45%,#0B0B0F_100%)]">

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[330px] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#6C2BD9]/15" />

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#F5C542]/5" />

            {/* DEALER */}
            <div className="relative min-h-[205px] px-4 py-5 text-center">

              <div className="mb-3 flex items-center justify-center gap-3">

                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#F5C542]/40" />

                <div className="text-[9px] font-black uppercase tracking-[0.35em] text-[#F5C542]">
                  DEALER
                </div>

                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#F5C542]/40" />

              </div>

              <div className="flex min-h-[135px] items-center justify-center gap-2">

                {dealerCards.length === 0 ? (
                  <div className="flex h-28 w-[68px] items-center justify-center rounded-xl border border-dashed border-[#6C2BD9]/30 text-[9px] font-bold uppercase tracking-widest text-gray-700 sm:h-32 sm:w-[80px]">
                    READY
                  </div>
                ) : (
                  dealerCards.map((card, index) => {
                    const visible =
                      index >= 2 || index < dealerDealVisible;

                    return (
                      <div
                        key={index}
                        className="h-28 w-[68px] shrink-0 sm:h-32 sm:w-[80px]"
                      >
                        {visible && (
                          <PlayingCard
                            card={card}
                            hidden={
                              playing &&
                              index === 1 &&
                              !dealerHoleRevealed
                            }
                            animationClass={
                              index === 1 && dealerHoleFlipping
                                ? dealerHoleRevealed
                                  ? "card-flip-in"
                                  : "card-flip-out"
                                : index >= 2
                                ? "card-slide-dealer"
                                : "card-deal-table"
                            }
                          />
                        )}
                      </div>
                    );
                  })
                )}

              </div>

              <div className="mt-2 h-8">

                {dealerCards.length > 0 &&
                  !playing && (
                    <div className="mx-auto flex w-fit items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-1">

                      <span className="text-[8px] font-black uppercase tracking-wider text-gray-600">
                        HAND
                      </span>

                      <span
                        className={`text-lg font-black ${
                          dealerValue > 21
                            ? "text-[#E0525F]"
                            : "text-white"
                        }`}
                      >
                        {dealerValue}
                      </span>

                    </div>
                  )}

              </div>
            </div>

            {/* CENTER DIVIDER */}
            <div className="relative flex items-center justify-center">

              <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-[#6C2BD9]/50 to-transparent" />

              <div className="relative z-10 rounded-full border border-[#6C2BD9]/40 bg-[#12091f] px-4 py-1 text-[7px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
                CS ACE TABLE
              </div>

            </div>

            {/* PLAYER */}
            <div className="relative min-h-[225px] bg-[radial-gradient(ellipse_at_center,#421b7d,#25103f_45%,#12091f_100%)] px-4 py-5 text-center shadow-[inset_0_0_70px_rgba(108,43,217,0.15)]">

              <div className="mb-3 flex items-center justify-center gap-3">

                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#F5C542]/40" />

                <div className="text-[9px] font-black uppercase tracking-[0.35em] text-[#F5C542]">
                  YOU
                </div>

                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#F5C542]/40" />

              </div>

              <div className="flex min-h-[135px] items-center justify-center gap-2">

                {playerCards.length === 0 ? (
                  <div className="flex h-28 w-[68px] items-center justify-center rounded-xl border border-dashed border-[#6C2BD9]/30 text-[9px] font-bold uppercase tracking-widest text-gray-700 sm:h-32 sm:w-[80px]">
                    READY
                  </div>
                ) : (
                  playerCards.map((card, index) => {
                    const visible =
                      index >= 2 || index < playerDealVisible;

                    return (
                      <div
                        key={index}
                        className="h-28 w-[68px] shrink-0 sm:h-32 sm:w-[80px]"
                      >
                        {visible && (
                          <PlayingCard
                            card={card}
                            animationClass={
                              index >= 2
                                ? "card-slide-player"
                                : "card-deal-table"
                            }
                          />
                        )}
                      </div>
                    );
                  })
                )}

              </div>

              <div className="mt-2 flex h-8 items-center justify-center gap-3">

                {playerCards.length > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-1">

                    <span className="text-[8px] font-black uppercase tracking-wider text-gray-600">
                      HAND
                    </span>

                    <span
                      className={
                        "text-lg font-black " +
                        (playerValue > 21
                          ? "text-[#E0525F]"
                          : playerValue === 21
                            ? "text-[#F5C542]"
                            : "text-white")
                      }
                    >
                      {playerValue}
                    </span>

                  </div>
                )}

              </div>

              <div className="mt-2 h-8">

                {result && (
                  <div
                    className={
                      win > 0 &&
                      result !== "PUSH"
                        ? "text-xl font-black text-[#20C997]"
                        : result === "PUSH"
                          ? "text-xl font-black text-[#F5C542]"
                          : "text-xl font-black text-[#E0525F]"
                    }
                  >
                    {result}
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* CONTROLS */}
          <div className="border-t border-[#6C2BD9]/30 bg-[#09090D] px-4 py-5">

            <div className="mx-auto max-w-4xl">

              <div className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">
                BET AMOUNT
              </div>

              <div className="mt-2 flex items-center justify-center gap-3">

                <div className="relative">

                  <input
                    type="text"
                    inputMode="numeric"
                    value={bet}
                    disabled={playing}
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
                    {balance.toLocaleString(
                      "en-US"
                    )}{" "}
                    💎
                  </div>

                </div>

              </div>

              {!playing && !result && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">

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
                        disabled={
                          balance <= 0
                        }
                        className="rounded-lg border border-[#6C2BD9]/30 bg-[#15131D] px-3 py-1.5 text-[10px] font-black text-gray-400 transition hover:border-[#6C2BD9] hover:text-white disabled:opacity-30"
                      >
                        {amount.toLocaleString(
                          "en-US"
                        )}
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

              <div className="mt-4 flex items-center gap-3">

                <span className="w-8 text-left text-[10px] font-black text-gray-700">
                  0
                </span>

                <input
                  type="range"
                  min="0"
                  max={Math.max(
                    balance,
                    1
                  )}
                  step="1"
                  value={Math.min(
                    bet,
                    balance
                  )}
                  disabled={
                    playing ||
                    balance <= 0
                  }
                  onChange={(event) =>
                    setBet(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="h-2 w-full cursor-pointer accent-[#F5C542]"
                />

                <span className="w-14 text-right text-[9px] font-black uppercase tracking-wider text-[#F5C542]">
                  ALL IN
                </span>

              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-5 flex min-h-[48px] flex-wrap items-center justify-center gap-2">

                {!playing && !result && (
                  <button
                    type="button"
                    onMouseEnter={() => playSound("ui-hover")}
                    onClick={() => { playSound("ui-click"); void startGame(); }}
                    disabled={
                      bet <= 0 ||
                      bet > balance
                    }
                    className="h-[48px] min-w-[180px] rounded-xl bg-[#6C2BD9] px-10 text-sm font-black text-white shadow-[0_0_30px_rgba(108,43,217,0.20)] transition hover:bg-[#7d3be8] hover:shadow-[0_0_40px_rgba(108,43,217,0.3)] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    DEAL — 💎{" "}
                    {bet.toLocaleString(
                      "en-US"
                    )}
                  </button>
                )}

                {playing && (
                  <>
                    <button
                      type="button"
                      onMouseEnter={() => playSound("ui-hover")}
                    onClick={() => { playSound("ui-click"); void hit(); }}
                      disabled={actionBusy}
                      className="h-[48px] min-w-[105px] rounded-xl bg-[#6C2BD9] px-6 text-sm font-black text-white shadow-[0_0_20px_rgba(108,43,217,0.18)] transition hover:bg-[#7d3be8]"
                    >
                      HIT
                    </button>

                    <button
                      type="button"
                      onMouseEnter={() => playSound("ui-hover")}
                    onClick={() => { playSound("ui-click"); void stand(); }}
                      disabled={actionBusy}
                      className="h-[48px] min-w-[105px] rounded-xl bg-[#F5C542] px-6 text-sm font-black text-black shadow-[0_0_20px_rgba(245,197,66,0.15)] transition hover:bg-[#ffd45e]"
                    >
                      STAND
                    </button>

                    <button
                      type="button"
                      onMouseEnter={() => playSound("ui-hover")}
                    onClick={() => { playSound("ui-click"); void doubleDown(); }}
                      disabled={actionBusy || 
                        playerCards.length !==
                          2 ||
                        balance < bet
                      }
                      className="h-[48px] min-w-[105px] rounded-xl border border-[#F5C542]/50 bg-[#15131D] px-6 text-sm font-black text-[#F5C542] transition hover:border-[#F5C542] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      DOUBLE
                    </button>
                  </>
                )}

                {!playing && result && (
                  <button
                    type="button"
                    onMouseEnter={() => playSound("ui-hover")}
                    onClick={() => { playSound("ui-click"); newGame(); }}
                    className="h-[48px] min-w-[180px] rounded-xl bg-[#6C2BD9] px-10 text-sm font-black text-white shadow-[0_0_30px_rgba(108,43,217,0.20)] transition hover:bg-[#7d3be8]"
                  >
                    NEW GAME
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* RULES */}
        <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-white/5 bg-[#111116] px-5 py-3">

          <span className="text-[10px] font-black text-[#F5C542]">
            BLACKJACK 2.5x
          </span>

          <span className="hidden text-gray-800 sm:block">
            •
          </span>

          <span className="text-[10px] font-black text-[#F5C542]">
            NORMAL WIN 2x
          </span>

          <span className="hidden text-gray-800 sm:block">
            •
          </span>

          <span className="text-[10px] font-black text-[#F5C542]">
            DEALER STANDS ON 17
          </span>

        </div>

        <div className="mx-auto mt-4 max-w-2xl text-center text-[9px] font-bold uppercase tracking-[0.2em] text-gray-800">
          VIRTUAL EMERALDS • DEMO GAME • NO REAL MONEY
        </div>

      </section>

      {/* ANIMATIONS */}
      <style jsx>{`
        .card-enter {
          animation: cardEnter 0.32s
            cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }


        .card-deal-table {
          animation: cardDealTable 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: center;
        }

        .card-slide-player {
          animation: cardSlidePlayer 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .card-slide-dealer {
          animation: cardSlideDealer 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .card-flip-out {
          animation: cardFlipOut 0.15s ease-in both;
          transform-origin: center;
          backface-visibility: hidden;
        }

        .card-flip-in {
          animation: cardFlipIn 0.17s ease-out both;
          transform-origin: center;
          backface-visibility: hidden;
        }

        .win-screen {
          animation: winScreen 0.16s ease-out both;
        }

        .win-backdrop {
          animation: winBackdrop 0.18s ease-out both;
        }

        .win-content {
          animation: winContent 0.46s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .win-title {
          animation: winTitle 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both;
        }

        .win-result {
          animation: winResult 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
        }

        .win-payout {
          animation: winPayout 0.48s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both;
        }

        .win-glow {
          animation: glowReveal 0.85s ease-out both;
        }

        .win-ring-1 {
          animation: ringExpand 0.8s ease-out both;
        }

        .win-ring-2 {
          animation: ringExpand 0.9s ease-out 0.12s both;
        }

        .particle {
          position: absolute;
          left: 50%;
          top: 50%;
          font-size: 22px;
          opacity: 0;
        }

        .particle-1 {
          --x: -250px;
          --y: -145px;
          animation: particleMove 0.9s ease-out 0.05s both;
        }

        .particle-2 {
          --x: 250px;
          --y: -150px;
          animation: particleMove 0.85s ease-out 0.1s both;
        }

        .particle-3 {
          --x: -285px;
          --y: 65px;
          animation: particleMove 0.95s ease-out 0.03s both;
        }

        .particle-4 {
          --x: 285px;
          --y: 65px;
          animation: particleMove 0.9s ease-out 0.13s both;
        }

        .particle-5 {
          --x: -185px;
          --y: 190px;
          animation: particleMove 1s ease-out 0.08s both;
        }

        .particle-6 {
          --x: 190px;
          --y: 190px;
          animation: particleMove 0.95s ease-out 0.06s both;
        }

        @keyframes cardDealTable {
          0% {
            opacity: 0;
            transform: translate(95px, -58px) rotate(7deg) scale(0.82);
          }
          72% {
            opacity: 1;
            transform: translate(-3px, 2px) rotate(-1deg) scale(1.025);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
        }

        @keyframes cardSlidePlayer {
          0% {
            opacity: 0;
            transform: translate(85px, -38px) rotate(6deg) scale(0.84);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
        }

        @keyframes cardSlideDealer {
          0% {
            opacity: 0;
            transform: translate(85px, 35px) rotate(6deg) scale(0.84);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
        }

        @keyframes cardFlipOut {
          from {
            opacity: 1;
            transform: perspective(700px) rotateY(0deg);
          }
          to {
            opacity: 0.9;
            transform: perspective(700px) rotateY(90deg);
          }
        }

        @keyframes cardFlipIn {
          from {
            opacity: 0.9;
            transform: perspective(700px) rotateY(-90deg);
          }
          to {
            opacity: 1;
            transform: perspective(700px) rotateY(0deg);
          }
        }

        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(-20px)
              scale(0.88);
          }

          to {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        @keyframes winScreen {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes winBackdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes winContent {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.84);
          }
          70% {
            opacity: 1;
            transform: translateY(-2px) scale(1.035);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes winTitle {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.85);
            letter-spacing: 0.2em;
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            letter-spacing: 0.42em;
          }
        }

        @keyframes winResult {
          0% {
            opacity: 0;
            transform: scale(0.72);
          }
          70% {
            opacity: 1;
            transform: scale(1.06);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes winPayout {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.9);
          }
          70% {
            opacity: 1;
            transform: translateY(-2px) scale(1.03);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes glowReveal {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.35);
          }
          45% {
            opacity: 1;
          }
          100% {
            opacity: 0.55;
            transform: translate(-50%, -50%) scale(1.08);
          }
        }

        @keyframes ringExpand {
          0% {
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(0.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(3.2);
          }
        }

        @keyframes particleMove {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.35);
          }
          18% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(
                calc(-50% + var(--x)),
                calc(-50% + var(--y))
              )
              scale(1.15)
              rotate(35deg);
          }
        }
      `}</style>

    </main>
  );
}