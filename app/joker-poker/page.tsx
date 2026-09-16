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

      if (
        handValues[result] >
        handValues[best]
      ) {
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
}: {
  card: Card;
  held: boolean;
  onHold: () => void;
}) {
  if (card.joker) {
    const jokerClass = held
      ? "relative h-32 w-[78px] -translate-y-2 rounded-xl border-2 border-[#F5C542] bg-[#17121f] shadow-xl sm:h-40 sm:w-[96px]"
      : "relative h-32 w-[78px] rounded-xl border-2 border-[#6C2BD9] bg-[#17121f] shadow-xl sm:h-40 sm:w-[96px]";

    return (
      <button
        type="button"
        onClick={onHold}
        className={jokerClass}
      >
        <div className="absolute left-2 top-2 text-[#F5C542]">
          🃏
        </div>

        <div className="flex h-full items-center justify-center text-4xl">
          🃏
        </div>

        {held && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F5C542] px-2 py-1 text-[9px] font-black text-black">
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
    ? "relative h-32 w-[78px] -translate-y-2 rounded-xl border-2 border-[#F5C542] bg-white shadow-xl sm:h-40 sm:w-[96px]"
    : "relative h-32 w-[78px] rounded-xl border-2 border-white bg-white shadow-xl sm:h-40 sm:w-[96px]";

  return (
    <button
      type="button"
      onClick={onHold}
      className={cardClass}
    >
      <div
        className={
          "absolute left-2 top-2 text-left text-lg font-black " +
          textClass
        }
      >
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>

      <div
        className={
          "flex h-full items-center justify-center text-4xl " +
          textClass
        }
      >
        {card.suit}
      </div>

      {held && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F5C542] px-2 py-1 text-[9px] font-black text-black">
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
      <header className="border-b border-[#6C2BD9]/30 bg-[#0B0B0F]">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-4">
          <Link
            href="/"
            className="shrink-0 text-xl font-black text-[#F5C542]"
          >
            💎 EMERALD
          </Link>

          <div className="hidden flex-1 items-center md:flex">
            <nav className="ml-10 flex items-center gap-6 text-sm text-gray-500">
              <Link
                href="/"
                className="transition hover:text-white"
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
                className="transition hover:text-white"
              >
                Blackjack
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
            <div className="text-[9px] text-gray-500">
              BALANCE
            </div>

            <div className="font-black text-[#F5C542]">
              💎 {balance.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6C2BD9]">
            Emerald Casino
          </div>

          <h1 className="mt-1 text-4xl font-black">
            JOKER POKER
          </h1>

          <p className="mt-1 text-xs text-gray-600">
            Hold your cards and draw once
          </p>
        </div>

        {showWinAnimation && win > 0 && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
            <div className="animate-bounce rounded-2xl border border-[#20C997]/50 bg-[#10251f] px-10 py-6 text-center shadow-[0_0_50px_rgba(32,201,151,0.35)]">
              <div className="text-[12px] font-black uppercase tracking-[0.3em] text-[#20C997]">
                WIN
              </div>

              <div className="mt-2 text-4xl font-black text-[#F5C542]">
                +💎 {win.toLocaleString("en-US")}
              </div>

              <div className="mt-1 text-xs font-bold text-[#20C997]">
                CONGRATULATIONS
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-[#6C2BD9]/40 bg-[#111116]">
          <div className="h-[360px] bg-[radial-gradient(circle_at_center,#29134f,#170d29,#0B0B0F)] px-3 py-10 md:px-8">
            <div className="flex h-full items-center justify-center gap-2 sm:gap-3">
              {cards.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Set your bet and press DEAL
                </div>
              ) : (
                cards.map((card, index) => (
                  <PlayingCard
                    key={index}
                    card={card}
                    held={held[index]}
                    onHold={() => holdCard(index)}
                  />
                ))
              )}
            </div>

            <div className="text-center">
              {playing && (
                <span className="text-xs font-bold text-gray-400">
                  Click cards to HOLD
                </span>
              )}

              {!playing && result && (
                <div
                  className={
                    win > 0
                      ? "text-2xl font-black text-[#20C997]"
                      : "text-2xl font-black text-[#E0525F]"
                  }
                >
                  {result}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#6C2BD9]/30 bg-[#0B0B0F] p-4">
            <div className="mx-auto max-w-5xl">
              <div className="mb-2 text-center text-[9px] font-bold uppercase tracking-widest text-gray-600">
                BET
              </div>

              <div className="flex items-center justify-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={bet}
                  disabled={playing}
                  onChange={handleBetInput}
                  className="w-40 rounded-xl border border-[#6C2BD9]/50 bg-[#15131D] px-4 py-3 text-center text-xl font-black text-[#F5C542] outline-none focus:border-[#F5C542]"
                />

                <span className="text-sm font-black text-gray-600">
                  / {balance.toLocaleString("en-US")} 💎
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <span className="w-8 text-left text-xs font-black text-gray-500">
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

                <span className="w-12 text-right text-xs font-black text-[#F5C542]">
                  ALL IN
                </span>
              </div>

              <div className="mt-3 flex justify-center">
                {!playing && !result && (
                  <button
                    type="button"
                    onClick={deal}
                    disabled={bet <= 0 || bet > balance}
                    className="rounded-xl bg-[#6C2BD9] px-12 py-3 text-sm font-black text-white hover:bg-[#7d3be8] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    DEAL
                  </button>
                )}

                {playing && (
                  <button
                    type="button"
                    onClick={draw}
                    className="rounded-xl bg-[#F5C542] px-12 py-3 text-sm font-black text-black hover:bg-[#ffd45e]"
                  >
                    DRAW
                  </button>
                )}

                {!playing && result && (
                  <button
                    type="button"
                    onClick={newGame}
                    className="rounded-xl bg-[#6C2BD9] px-10 py-3 text-sm font-black text-white hover:bg-[#7d3be8]"
                  >
                    NEW GAME
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-4 text-center text-sm font-black uppercase tracking-[0.3em] text-[#F5C542]">
            PAYTABLE
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
                        ? "rounded-xl border-2 border-[#F5C542] bg-[#F5C542] px-4 py-3 text-center shadow-[0_0_25px_rgba(245,197,66,0.65)] transition-all duration-500"
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

          <div className="mt-6 text-center">
            <div className="text-2xl font-black uppercase tracking-[0.25em] text-[#F5C542]">
              🃏 JOKER IS WILD
            </div>

            <div className="mt-1 text-xs font-bold text-gray-500">
              Joker can represent any card
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}