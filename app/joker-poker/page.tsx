"use client";

import Link from "next/link";
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
  { rank: "A", value: 14 },
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
];

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
  "Jacks or Better": 1,
};

const handOrder = [
  "No Hand",
  "Jacks or Better",
  "Two Pair",
  "Three of a Kind",
  "Straight",
  "Flush",
  "Full House",
  "Four of a Kind",
  "Straight Flush",
  "Royal Flush",
];

function createDeck(): Card[] {
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

  return deck.sort(() => Math.random() - 0.5);
}

function evaluateNormalHand(cards: Card[]): string {
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
    const pairValue = Array.from(
      counts.entries()
    ).find(([, count]) => count === 2)?.[0];

    if (
      pairValue !== undefined &&
      pairValue >= 11
    ) {
      return "Jacks or Better";
    }
  }

  return "No Hand";
}

function evaluateHand(cards: Card[]): string {
  if (cards.length !== 5) {
    return "No Hand";
  }

  const joker = cards.find((card) => card.joker);

  if (!joker) {
    return evaluateNormalHand(cards);
  }

  const normalCards = cards.filter(
    (card) => !card.joker
  );

  let bestHand = "No Hand";
  let bestScore = 0;

  const replacementDeck = createDeck().filter(
    (card) => !card.joker
  );

  for (const replacement of replacementDeck) {
    const testHand = evaluateNormalHand([
      ...normalCards,
      replacement,
    ]);

    const score = handOrder.indexOf(testHand);

    if (score > bestScore) {
      bestScore = score;
      bestHand = testHand;
    }
  }

  return bestHand;
}

function PlayingCard({
  card,
  held,
  onClick,
}: {
  card: Card;
  held: boolean;
  onClick: () => void;
}) {
  if (card.joker) {
    return (
      <button
        onClick={onClick}
        className={`relative h-36 w-24 overflow-visible rounded-2xl border-2 bg-gradient-to-br from-[#0c3b27] via-[#06170f] to-[#0c3b27] p-3 text-left shadow-[0_15px_35px_rgba(0,0,0,0.45)] transition sm:h-44 sm:w-30 ${
          held
            ? "-translate-y-3 border-emerald-400"
            : "border-emerald-500/50"
        }`}
      >
        <div className="absolute left-3 top-3 text-xl font-black text-emerald-400">
          🃏
        </div>

        <div className="absolute inset-0 flex items-center justify-center text-5xl">
          🃏
        </div>

        <div className="absolute bottom-3 right-3 rotate-180 text-xl font-black text-emerald-400">
          🃏
        </div>

        {held && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">
            HOLD
          </div>
        )}
      </button>
    );
  }

  const red =
    card.suit === "♥" || card.suit === "♦";

  return (
    <button
      onClick={onClick}
      className={`relative h-36 w-24 overflow-visible rounded-2xl border border-gray-300 bg-white p-3 text-left shadow-[0_15px_35px_rgba(0,0,0,0.45)] transition sm:h-44 sm:w-30 ${
        held ? "-translate-y-3 border-emerald-400 border-2" : ""
      } ${red ? "text-red-500" : "text-gray-900"}`}
    >
      <div className="absolute left-3 top-3 text-center leading-none">
        <div className="text-xl font-black">
          {card.rank}
        </div>

        <div className="mt-1 text-lg font-bold">
          {card.suit}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center text-5xl">
        {card.suit}
      </div>

      <div className="absolute bottom-3 right-3 text-center leading-none">
        <div className="text-xl font-black">
          {card.rank}
        </div>

        <div className="mt-1 text-lg font-bold">
          {card.suit}
        </div>
      </div>

      {held && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">
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
  const [winAmount, setWinAmount] = useState(0);

  function setBetAmount(amount: number) {
    if (playing) return;

    if (balance <= 0) {
      setBet(0);
      return;
    }

    setBet(Math.min(amount, balance));
  }

  function halfBet() {
    if (playing || balance <= 0) return;

    setBet(Math.max(1, Math.floor(balance / 2)));
  }

  function maxBet() {
    if (playing || balance <= 0) return;

    setBet(balance);
  }

  function deal() {
    if (playing) return;

    if (bet <= 0) {
      setResult("Choose a valid bet.");
      return;
    }

    if (bet > balance) {
      setResult("Not enough Emeralds.");
      return;
    }

    if (!removeEmeralds(bet)) {
      setResult("Not enough Emeralds.");
      return;
    }

    const newDeck = createDeck();

    setCards(newDeck.slice(0, 5));

    setHeld([
      false,
      false,
      false,
      false,
      false,
    ]);

    setResult("");
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

    const currentDeck = createDeck();

    const usedCards = new Set(
      cards.map((card) =>
        card.joker
          ? "JOKER"
          : `${card.rank}${card.suit}`
      )
    );

    const availableCards = currentDeck.filter(
      (card) => {
        const id = card.joker
          ? "JOKER"
          : `${card.rank}${card.suit}`;

        return !usedCards.has(id);
      }
    );

    let replacementIndex = 0;

    const newCards = cards.map((card, index) => {
      if (held[index]) {
        return card;
      }

      const replacement =
        availableCards[replacementIndex];

      replacementIndex++;

      return replacement;
    });

    const hand = evaluateHand(newCards);
    const multiplier = payouts[hand] || 0;
    const winnings = bet * multiplier;

    setCards(newCards);
    setPlaying(false);
    setResult(hand);
    setWinAmount(winnings);

    if (winnings > 0) {
      addEmeralds(winnings);
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
    setWinAmount(0);
  }

  return (
    <main className="min-h-screen bg-[#050b08] text-white">
      <header className="border-b border-emerald-900/40 bg-[#08120d]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link
            href="/"
            className="text-2xl font-black tracking-wide text-emerald-400"
          >
            💎 EMERALD
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-gray-500 md:flex">
            <Link
              href="/"
              className="hover:text-white"
            >
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
              className="hover:text-white"
            >
              Blackjack
            </Link>
          </nav>

          <div className="rounded-xl border border-emerald-800/50 bg-[#0c1a13] px-4 py-2">
            <div className="text-xs text-gray-500">
              BALANCE
            </div>

            <div className="font-black text-emerald-400">
              💎 {balance.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <div className="mb-8 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-500">
            Emerald Casino
          </div>

          <h1 className="mt-2 text-4xl font-black md:text-6xl">
            Joker Poker
          </h1>

          <p className="mt-3 text-gray-500">
            Hold your cards. Joker is wild.
          </p>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-emerald-900/50 bg-[#07130d] shadow-2xl">
          <div className="relative min-h-[620px] overflow-hidden bg-[radial-gradient(circle_at_center,#174b31_0%,#0b291a_42%,#06100a_100%)] px-4 py-10 md:px-10">

            <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-emerald-500/20 bg-black/20 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500">
              Emerald Joker Poker
            </div>

            <div className="pt-10 text-center">
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Your Hand
                </span>

                {cards.length > 0 && (
                  <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-black text-emerald-400">
                    {playing
                      ? "HOLD"
                      : result || ""}
                  </span>
                )}
              </div>

              <div className="flex min-h-[185px] flex-wrap justify-center gap-3">
                {cards.length === 0 ? (
                  <div className="flex items-center text-sm text-gray-700">
                    Choose your bet below
                  </div>
                ) : (
                  cards.map((card, index) => (
                    <PlayingCard
                      key={`${card.rank}${card.suit}${index}`}
                      card={card}
                      held={held[index]}
                      onClick={() =>
                        toggleHold(index)
                      }
                    />
                  ))
                )}
              </div>
            </div>

            <div className="mx-auto my-9 flex max-w-2xl items-center gap-4">
              <div className="h-px flex-1 bg-emerald-400/10" />

              <div className="rounded-full border border-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-500/50">
                🃏
              </div>

              <div className="h-px flex-1 bg-emerald-400/10" />
            </div>

            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                {playing
                  ? "Choose cards to hold"
                  : result
                    ? result
                    : "Joker is wild"}
              </div>

              {result && (
                <div className="mt-3">
                  {winAmount > 0 ? (
                    <div className="text-xl font-black text-emerald-400">
                      +💎{" "}
                      {winAmount.toLocaleString(
                        "en-US"
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      No payout
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-emerald-900/40 bg-[#08120d] p-6 md:p-10">
            <div className="mx-auto max-w-4xl">

              <div className="mb-7 text-center">
                <div className="text-sm text-gray-500">
                  {playing
                    ? "Hold the cards you want to keep."
                    : result
                      ? result
                      : "Choose your bet to start."}
                </div>

                {bet > 0 && (
                  <div className="mt-2 text-xs text-gray-700">
                    Current bet: 💎{" "}
                    {bet.toLocaleString("en-US")}
                  </div>
                )}
              </div>

              {!playing && !result && (
                <div className="mx-auto max-w-xl">
                  <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
                    Choose Bet
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {betOptions.map((amount) => {
                      const selected =
                        bet === amount;

                      const disabled =
                        amount > balance;

                      return (
                        <button
                          key={amount}
                          onClick={() =>
                            setBetAmount(amount)
                          }
                          disabled={disabled}
                          className={`rounded-xl border px-3 py-3 text-sm font-black transition ${
                            selected
                              ? "border-emerald-500 bg-emerald-500 text-black"
                              : "border-gray-800 bg-[#050b08] text-gray-400 hover:border-emerald-700 hover:text-white"
                          } ${
                            disabled
                              ? "cursor-not-allowed opacity-25"
                              : ""
                          }`}
                        >
                          💎 {amount}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={halfBet}
                      disabled={balance <= 0}
                      className="rounded-xl border border-gray-800 bg-[#050b08] py-3 text-sm font-black text-gray-400 transition hover:border-gray-600 hover:text-white disabled:opacity-30"
                    >
                      ½ BALANCE
                    </button>

                    <button
                      onClick={maxBet}
                      disabled={balance <= 0}
                      className="rounded-xl border border-gray-800 bg-[#050b08] py-3 text-sm font-black text-gray-400 transition hover:border-gray-600 hover:text-white disabled:opacity-30"
                    >
                      MAX
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl border border-gray-800 bg-[#050b08] p-5 text-center">
                    <div className="text-xs uppercase tracking-widest text-gray-600">
                      Selected Bet
                    </div>

                    <div className="mt-1 text-3xl font-black text-emerald-400">
                      💎{" "}
                      {bet.toLocaleString("en-US")}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-center">
                {result ? (
                  <button
                    onClick={newGame}
                    className="rounded-2xl bg-emerald-500 px-14 py-4 font-black text-black transition hover:bg-emerald-400"
                  >
                    NEW GAME
                  </button>
                ) : !playing ? (
                  <button
                    onClick={deal}
                    disabled={
                      balance <= 0 ||
                      bet <= 0 ||
                      bet > balance
                    }
                    className="rounded-2xl bg-emerald-500 px-14 py-4 font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    DEAL
                  </button>
                ) : (
                  <button
                    onClick={draw}
                    className="rounded-2xl bg-emerald-500 px-14 py-4 font-black text-black transition hover:bg-emerald-400"
                  >
                    DRAW
                  </button>
                )}
              </div>

              <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-3 text-center md:grid-cols-3">
                {Object.entries(payouts).map(
                  ([hand, multiplier]) => (
                    <div
                      key={hand}
                      className="rounded-xl border border-gray-900 bg-[#060d09] p-4"
                    >
                      <div className="font-bold text-gray-400">
                        {hand}
                      </div>

                      <div className="mt-1 text-xs font-black text-emerald-500">
                        {multiplier}×
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 text-center text-xs text-gray-600">
                🃏 Joker is wild and can substitute for
                any card.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}