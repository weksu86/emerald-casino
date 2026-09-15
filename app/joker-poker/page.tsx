"use client";

import { useState } from "react";
import Link from "next/link";
import { useEmeralds } from "../context/EmeraldContext";

type Suit = "♠" | "♥" | "♦" | "♣";

type Card = {
  rank: string;
  suit: Suit;
  value: number;
};

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

const suits: Suit[] = ["♠", "♥", "♦", "♣"];

const betOptions = [25, 50, 100, 250, 500];

const payouts: Record<string, number> = {
  "Royal Flush": 100,
  "Straight Flush": 50,
  "Four of a Kind": 25,
  "Full House": 9,
  Flush: 6,
  Straight: 4,
  "Three of a Kind": 3,
  "Two Pair": 2,
  Pair: 1,
};

function createDeck(): Card[] {
  return suits.flatMap((suit) =>
    ranks.map((item) => ({
      rank: item.rank,
      suit,
      value: item.value,
    }))
  );
}

function shuffle(deck: Card[]): Card[] {
  const copy = [...deck];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function evaluateHand(cards: Card[]): string {
  if (cards.length !== 5) {
    return "No Hand";
  }

  const values = cards
    .map((card) => card.value)
    .sort((a, b) => a - b);

  const counts = new Map<number, number>();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const frequencies = Array.from(counts.values()).sort(
    (a, b) => b - a
  );

  const flush = cards.every(
    (card) => card.suit === cards[0].suit
  );

  const uniqueValues = [...new Set(values)];

  let straight = false;

  if (
    uniqueValues.length === 5 &&
    uniqueValues[4] - uniqueValues[0] === 4
  ) {
    straight = true;
  }

  // A-2-3-4-5
  if (
    uniqueValues.length === 5 &&
    uniqueValues.join(",") === "2,3,4,5,14"
  ) {
    straight = true;
  }

  if (straight && flush) {
    const royal =
      uniqueValues.join(",") === "10,11,12,13,14";

    return royal ? "Royal Flush" : "Straight Flush";
  }

  if (frequencies[0] === 4) {
    return "Four of a Kind";
  }

  if (frequencies[0] === 3 && frequencies[1] === 2) {
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

  if (frequencies[0] === 2 && frequencies[1] === 2) {
    return "Two Pair";
  }

  if (frequencies[0] === 2) {
    return "Pair";
  }

  return "No Hand";
}

export default function JokerPokerPage() {
  const { balance, removeEmeralds, addEmeralds } =
    useEmeralds();

  const [cards, setCards] = useState<Card[]>([]);

  const [held, setHeld] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  const [bet, setBet] = useState(25);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  function deal() {
    if (playing) return;
    if (balance < bet) return;

    if (!removeEmeralds(bet)) return;

    const deck = shuffle(createDeck());

    setCards(deck.slice(0, 5));
    setHeld([false, false, false, false, false]);
    setResult(null);
    setWinAmount(0);
    setPlaying(true);
  }

  function toggleHold(index: number) {
    if (!playing) return;

    setHeld((current) =>
      current.map((value, i) =>
        i === index ? !value : value
      )
    );
  }

  function draw() {
    if (!playing || cards.length !== 5) return;

    const deck = shuffle(createDeck());

    const used = new Set(
      cards.map((card) => `${card.rank}${card.suit}`)
    );

    const replacementCards = deck.filter(
      (card) => !used.has(`${card.rank}${card.suit}`)
    );

    let replacementIndex = 0;

    const newCards = cards.map((card, index) => {
      if (held[index]) {
        return card;
      }

      const replacement =
        replacementCards[replacementIndex];

      replacementIndex++;

      return replacement;
    });

    setCards(newCards);
    setPlaying(false);

    const hand = evaluateHand(newCards);
    const multiplier = payouts[hand] || 0;
    const winnings = bet * multiplier;

    setResult(hand);
    setWinAmount(winnings);

    if (winnings > 0) {
      addEmeralds(winnings);
    }
  }

  function resetGame() {
    setCards([]);
    setHeld([false, false, false, false, false]);
    setPlaying(false);
    setResult(null);
    setWinAmount(0);
  }

  return (
    <main className="min-h-screen bg-[#050807] text-white">
      <header className="border-b border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-black tracking-wide"
          >
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

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight">
            JOKER POKER
          </h1>

          <p className="mt-2 text-gray-500">
            Hold your cards and draw
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-10">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Current Bet
                </div>

                <div className="mt-1 text-2xl font-black text-emerald-400">
                  {bet.toLocaleString()} E
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {betOptions.map((amount) => (
                  <button
                    key={amount}
                    disabled={playing || balance < amount}
                    onClick={() => setBet(amount)}
                    className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                      bet === amount
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/[0.05]"
                    } disabled:cursor-not-allowed disabled:opacity-30`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
              {cards.length === 5
                ? cards.map((card, index) => {
                    const red =
                      card.suit === "♥" ||
                      card.suit === "♦";

                    return (
                      <button
                        key={`${card.rank}-${card.suit}-${index}`}
                        onClick={() => toggleHold(index)}
                        className={`relative aspect-[2/3] rounded-2xl border-2 bg-white p-3 text-left shadow-xl transition ${
                          held[index]
                            ? "border-emerald-400 -translate-y-3"
                            : "border-white/20"
                        }`}
                      >
                        <div
                          className={`text-2xl font-black ${
                            red
                              ? "text-red-500"
                              : "text-black"
                          }`}
                        >
                          {card.rank}
                        </div>

                        <div
                          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl ${
                            red
                              ? "text-red-500"
                              : "text-black"
                          }`}
                        >
                          {card.suit}
                        </div>

                        <div
                          className={`absolute bottom-3 right-3 rotate-180 text-2xl font-black ${
                            red
                              ? "text-red-500"
                              : "text-black"
                          }`}
                        >
                          {card.rank}
                        </div>

                        {held[index] && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">
                            HOLD
                          </div>
                        )}
                      </button>
                    );
                  })
                : Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="aspect-[2/3] rounded-2xl border-2 border-dashed border-white/10 bg-black/20"
                    />
                  ))}
            </div>

            <div className="mt-10 text-center">
              {!playing && !result && (
                <button
                  onClick={deal}
                  disabled={balance < bet}
                  className="rounded-2xl bg-emerald-500 px-12 py-4 font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  DEAL
                </button>
              )}

              {playing && (
                <button
                  onClick={draw}
                  className="rounded-2xl bg-emerald-500 px-12 py-4 font-black text-black transition hover:bg-emerald-400"
                >
                  DRAW
                </button>
              )}

              {result && (
                <div>
                  <div className="text-3xl font-black text-emerald-400">
                    {result}
                  </div>

                  {winAmount > 0 ? (
                    <div className="mt-2 text-lg font-bold text-white">
                      +{winAmount.toLocaleString()} E
                    </div>
                  ) : (
                    <div className="mt-2 text-gray-500">
                      No payout
                    </div>
                  )}

                  <button
                    onClick={resetGame}
                    className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-10 py-3 font-black transition hover:bg-white/[0.08]"
                  >
                    NEW GAME
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-lg font-black">
              PAYTABLE
            </h2>

            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              {Object.entries(payouts).map(
                ([hand, multiplier]) => (
                  <div
                    key={hand}
                    className="flex justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <span className="text-gray-400">
                      {hand}
                    </span>

                    <span className="font-black text-emerald-400">
                      {multiplier}x
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}