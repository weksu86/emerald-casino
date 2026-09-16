"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";

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
  index,
}: {
  card: Card;
  held: boolean;
  onHold: () => void;
  index: number;
}) {
  const animationStyle = {
    animationDelay: `${index * 90}ms`,
  };

  if (card.joker) {
    const jokerClass = held
      ? "card-deal relative h-28 w-[68px] shrink-0 -translate-y-2 overflow-hidden rounded-xl border-2 border-[#F5C542] bg-[#17121f] shadow-[0_0_28px_rgba(245,197,66,0.25)] transition-all sm:h-32 sm:w-[80px]"
      : "card-deal relative h-28 w-[68px] shrink-0 overflow-hidden rounded-xl border-2 border-[#6C2BD9] bg-[#17121f] shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-all hover:-translate-y-1 sm:h-32 sm:w-[80px]";

    return (
      <button
        type="button"
        onClick={onHold}
        className={jokerClass}
        style={animationStyle}
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
    ? "card-deal relative h-28 w-[68px] shrink-0 -translate-y-2 overflow-hidden rounded-xl border-2 border-[#F5C542] bg-white shadow-[0_0_28px_rgba(245,197,66,0.25)] transition-all sm:h-32 sm:w-[80px]"
    : "card-deal relative h-28 w-[68px] shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-all hover:-translate-y-1 sm:h-32 sm:w-[80px]";

  return (
    <button
      type="button"
      onClick={onHold}
      className={cardClass}
      style={animationStyle}
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
  const [result, setResult] = useState("");
  const [win, setWin] = useState(0);

  const [showWinAnimation, setShowWinAnimation] =
    useState(false);

  function deal() {
    if (playing) return;

    if (balance < bet || bet <= 0) {
      setResult("Not enough Emeralds");
      return;
    }

    const success = removeEmeralds(bet);

    if (!success) {
      setResult("Not enough Emeralds");
      return;
    }

    const deck = shuffle(makeDeck());

    setCards(deck.slice(0, 5));

    setHeld([
      false,
      false,
      false,
      false,
      false,
    ]);

    setPlaying(true);
    setResult("");
    setWin(0);
    setShowWinAnimation(false);
  }

  function holdCard(index: number) {
    if (!playing) return;

    setHeld((current) =>
      current.map((value, i) => {
        if (i === index) {
          return !value;
        }

        return value;
      })
    );
  }

  function draw() {
    if (!playing) return;

    const deck = shuffle(makeDeck());

    const used = new Set(
      cards.map((card) => {
        if (card.joker) {
          return "JOKER";
        }

        return card.rank + card.suit;
      })
    );

    const available = deck.filter((card) => {
      const id = card.joker
        ? "JOKER"
        : card.rank + card.suit;

      return !used.has(id);
    });

    let replacementIndex = 0;

    const newCards = cards.map(
      (card, index) => {
        if (held[index]) {
          return card;
        }

        const replacement =
          available[replacementIndex];

        replacementIndex++;

        return replacement;
      }
    );

    const hand = evaluate(newCards);
    const multiplier = payouts[hand] || 0;
    const payout = bet * multiplier;

    setCards(newCards);
    setPlaying(false);
    setResult(hand);
    setWin(payout);

    if (payout > 0) {
      addEmeralds(payout);
      setShowWinAnimation(true);

      setTimeout(() => {
        setShowWinAnimation(false);
      }, 2800);
    } else {
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
        <div className="win-screen pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#08080C]/90 backdrop-blur-md">

          <div className="win-glow absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#20C997]/10 blur-[120px]" />

          <div className="win-ring absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#20C997]" />

          <span className="particle particle-1">💎</span>
          <span className="particle particle-2">✦</span>
          <span className="particle particle-3">🃏</span>
          <span className="particle particle-4">✦</span>
          <span className="particle particle-5">💎</span>
          <span className="particle particle-6">🃏</span>

          <div className="win-content relative z-10 text-center">

            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[#6C2BD9]">
              CS ACE
            </div>

            <div className="mt-2 text-[12px] font-black uppercase tracking-[0.4em] text-[#20C997]">
              WINNING HAND
            </div>

            <div className="mt-5 text-4xl font-black uppercase text-white md:text-6xl">
              {result}
            </div>

            <div className="mx-auto mt-6 w-fit rounded-2xl border border-[#F5C542]/40 bg-[#15131D] px-10 py-5 shadow-[0_0_50px_rgba(245,197,66,0.12)]">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
                PAYOUT
              </div>

              <div className="mt-1 text-4xl font-black text-[#F5C542]">
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

              <Link href="/" className="transition hover:text-white">
                Home
              </Link>

              <Link
                href="/joker-poker"
                className="font-bold text-white"
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

          <div className="ml-auto rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 md:ml-0">

            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              BALANCE
            </div>

            <div className="font-black text-[#F5C542]">
              💎 {balance.toLocaleString("en-US")}
            </div>

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

                  {cards.map((card, index) => (
                    <PlayingCard
                      key={index}
                      card={card}
                      held={held[index]}
                      onHold={() => holdCard(index)}
                      index={index}
                    />
                  ))}

                </div>
              )}

            </div>

            <div className="relative mt-4 min-h-[45px] text-center">

              {playing && (
                <>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F5C542]">
                    SELECT CARDS TO HOLD
                  </div>

                  <div className="mt-1 text-[10px] text-gray-600">
                    Click a card to keep it
                  </div>
                </>
              )}

              {!playing && result && (
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
                    {balance.toLocaleString("en-US")} 💎
                  </div>
                </div>

              </div>

              {/* QUICK BETS - KIINTEÄ KORKEUS */}
              <div className="mt-3 h-[31px]">

                {!playing && !result && (
                  <div className="flex h-full items-center justify-center gap-2">

                    {[100, 250, 500, 1000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() =>
                          setBet(Math.min(amount, balance))
                        }
                        disabled={balance <= 0}
                        className="rounded-lg border border-[#6C2BD9]/30 bg-[#15131D] px-3 py-1.5 text-[10px] font-black text-gray-400 transition hover:border-[#6C2BD9] hover:text-white disabled:opacity-30"
                      >
                        {amount.toLocaleString("en-US")}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setBet(balance)}
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
                  disabled={playing || balance <= 0}
                  onChange={(event) =>
                    setBet(Number(event.target.value))
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
                      onClick={deal}
                      disabled={bet <= 0 || bet > balance}
                      className="absolute inset-0 h-full w-full rounded-xl bg-[#6C2BD9] text-sm font-black text-white shadow-[0_0_30px_rgba(108,43,217,0.20)] transition-colors hover:bg-[#7d3be8] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      DEAL — 💎 {bet.toLocaleString("en-US")}
                    </button>
                  )}

                  {playing && (
                    <button
                      type="button"
                      onClick={draw}
                      className="absolute inset-0 h-full w-full rounded-xl bg-[#F5C542] text-sm font-black text-black shadow-[0_0_25px_rgba(245,197,66,0.18)] transition-colors hover:bg-[#ffd45e]"
                    >
                      DRAW
                    </button>
                  )}

                  {!playing && result && (
                    <button
                      type="button"
                      onClick={newGame}
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
          opacity: 0;
          animation: cardDeal 0.38s
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .win-screen {
          animation: screenIn 0.25s ease-out both;
        }

        .win-content {
          animation: winContent 0.65s
            cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .win-glow {
          animation: glowReveal 1.5s ease-out both;
        }

        .win-ring {
          animation: ringExpand 1.2s ease-out both;
        }

        .particle {
          position: absolute;
          left: 50%;
          top: 50%;
          font-size: 24px;
          opacity: 0;
        }

        .particle-1 {
          --x: -300px;
          --y: -180px;
          animation: particleMove 1.2s ease-out 0.1s both;
        }

        .particle-2 {
          --x: 300px;
          --y: -190px;
          animation: particleMove 1.1s ease-out 0.15s both;
        }

        .particle-3 {
          --x: -350px;
          --y: 70px;
          animation: particleMove 1.25s ease-out 0.05s both;
        }

        .particle-4 {
          --x: 350px;
          --y: 70px;
          animation: particleMove 1.15s ease-out 0.2s both;
        }

        .particle-5 {
          --x: -230px;
          --y: 240px;
          animation: particleMove 1.3s ease-out 0.12s both;
        }

        .particle-6 {
          --x: 240px;
          --y: 240px;
          animation: particleMove 1.2s ease-out 0.08s both;
        }

        @keyframes cardDeal {
          0% {
            opacity: 0;
            transform: translate(-55px, -35px)
              rotate(-8deg)
              scale(0.82);
          }

          65% {
            opacity: 1;
            transform: translate(3px, 2px)
              rotate(1deg)
              scale(1.03);
          }

          100% {
            opacity: 1;
            transform: translate(0, 0)
              rotate(0deg)
              scale(1);
          }
        }

        @keyframes screenIn {
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
            transform: scale(0.8);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes glowReveal {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.25);
          }

          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes ringExpand {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.15);
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(4);
          }
        }

        @keyframes particleMove {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.4);
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
              scale(1.3)
              rotate(45deg);
          }
        }
      `}</style>

    </main>
  );
}