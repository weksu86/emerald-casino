"use client";

import Link from "next/link";
import { useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";

type Suit = "♠" | "♥" | "♦" | "♣";

type Card = {
  rank: string;
  suit: Suit;
};

const suits: Suit[] = ["♠", "♥", "♦", "♣"];

const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }

  return deck.sort(() => Math.random() - 0.5);
}

function getValue(cards: Card[]) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === "A") {
      total += 11;
      aces++;
    } else if (
      card.rank === "K" ||
      card.rank === "Q" ||
      card.rank === "J"
    ) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function isBlackjack(cards: Card[]) {
  return cards.length === 2 && getValue(cards) === 21;
}

function PlayingCard({
  card,
  hidden = false,
}: {
  card?: Card;
  hidden?: boolean;
}) {
  if (hidden) {
    return (
      <div className="relative h-36 w-24 overflow-hidden rounded-2xl border-2 border-emerald-400 bg-[#063d28] shadow-[0_15px_35px_rgba(0,0,0,0.45)] sm:h-44 sm:w-30">
        <div className="absolute inset-2 rounded-xl border border-emerald-400/40 bg-[#082719]" />

        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          💎
        </div>
      </div>
    );
  }

  if (!card) return null;

  const red =
    card.suit === "♥" || card.suit === "♦";

  return (
    <div
      className={`relative h-36 w-24 rounded-2xl border border-gray-300 bg-white p-3 shadow-[0_15px_35px_rgba(0,0,0,0.45)] sm:h-44 sm:w-30 ${
        red ? "text-red-500" : "text-gray-900"
      }`}
    >
      {/* YLÄKULMA */}
      <div className="absolute left-3 top-3 text-center leading-none">
        <div className="text-xl font-black">
          {card.rank}
        </div>
        <div className="mt-1 text-lg font-bold">
          {card.suit}
        </div>
      </div>

      {/* KESKELTÄ MAA */}
      <div className="absolute inset-0 flex items-center justify-center text-5xl">
        {card.suit}
      </div>

      {/* ALAKULMA - EI ENÄÄ KÄÄNNETTYNÄ */}
      <div className="absolute bottom-3 right-3 text-center leading-none">
        <div className="text-xl font-black">
          {card.rank}
        </div>
        <div className="mt-1 text-lg font-bold">
          {card.suit}
        </div>
      </div>
    </div>
  );
}

export default function BlackjackPage() {
  const { balance, addEmeralds, removeEmeralds } =
    useEmeralds();

  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);

  const [bet, setBet] = useState(100);
  const [activeBet, setActiveBet] = useState(0);

  const [playing, setPlaying] = useState(false);
  const [dealerHidden, setDealerHidden] = useState(true);

  const [status, setStatus] = useState(
    "Choose your bet to start."
  );

  const [gameFinished, setGameFinished] =
    useState(false);

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

  function startGame() {
    if (playing) return;

    if (bet <= 0) {
      setStatus("Choose a valid bet.");
      return;
    }

    if (bet > balance) {
      setStatus("Not enough Emeralds.");
      return;
    }

    if (!removeEmeralds(bet)) {
      setStatus("Not enough Emeralds.");
      return;
    }

    const newDeck = createDeck();

    const playerCards = [
      newDeck[0],
      newDeck[2],
    ];

    const dealerCards = [
      newDeck[1],
      newDeck[3],
    ];

    setDeck(newDeck.slice(4));
    setPlayer(playerCards);
    setDealer(dealerCards);
    setActiveBet(bet);
    setDealerHidden(true);
    setPlaying(true);
    setGameFinished(false);

    if (isBlackjack(playerCards)) {
      const payout = Math.floor(bet * 2.5);

      addEmeralds(payout);

      setDealerHidden(false);
      setPlaying(false);
      setGameFinished(true);
      setStatus("Blackjack!");

      return;
    }

    setStatus("Your turn.");
  }

  function hit() {
    if (!playing || deck.length === 0) return;

    const newCard = deck[0];
    const remaining = deck.slice(1);

    const newPlayer = [...player, newCard];

    setPlayer(newPlayer);
    setDeck(remaining);

    const value = getValue(newPlayer);

    if (value > 21) {
      setDealerHidden(false);
      setPlaying(false);
      setGameFinished(true);
      setStatus("Bust.");

      return;
    }

    if (value === 21) {
      finishRound(
        newPlayer,
        dealer,
        remaining,
        activeBet
      );

      return;
    }

    setStatus("Your turn.");
  }

  function stand() {
    if (!playing) return;

    finishRound(
      player,
      dealer,
      deck,
      activeBet
    );
  }

  function finishRound(
    playerCards: Card[],
    dealerCards: Card[],
    currentDeck: Card[],
    roundBet: number
  ) {
    let finalDealer = [...dealerCards];
    let remaining = [...currentDeck];

    while (getValue(finalDealer) < 17) {
      const next = remaining[0];

      if (!next) break;

      finalDealer.push(next);
      remaining = remaining.slice(1);
    }

    const playerValue = getValue(playerCards);
    const dealerValue = getValue(finalDealer);

    setPlayer(playerCards);
    setDealer(finalDealer);
    setDeck(remaining);
    setDealerHidden(false);
    setPlaying(false);
    setGameFinished(true);

    if (playerValue > 21) {
      setStatus("Bust.");
      return;
    }

    if (dealerValue > 21) {
      addEmeralds(roundBet * 2);
      setStatus("Dealer busted.");
      return;
    }

    if (playerValue > dealerValue) {
      addEmeralds(roundBet * 2);
      setStatus("You win.");
      return;
    }

    if (playerValue < dealerValue) {
      setStatus("Dealer wins.");
      return;
    }

    addEmeralds(roundBet);
    setStatus("Push.");
  }

  function doubleDown() {
    if (!playing || player.length !== 2) {
      return;
    }

    if (balance < activeBet) {
      setStatus("Not enough Emeralds to double.");
      return;
    }

    if (!removeEmeralds(activeBet)) {
      setStatus("Not enough Emeralds to double.");
      return;
    }

    const newBet = activeBet * 2;

    setActiveBet(newBet);

    if (deck.length === 0) return;

    const newCard = deck[0];
    const remaining = deck.slice(1);

    const newPlayer = [...player, newCard];

    setPlayer(newPlayer);
    setDeck(remaining);

    if (getValue(newPlayer) > 21) {
      setDealerHidden(false);
      setPlaying(false);
      setGameFinished(true);
      setStatus("Double — Bust.");
      return;
    }

    finishRound(
      newPlayer,
      dealer,
      remaining,
      newBet
    );
  }

  function newGame() {
    setPlayer([]);
    setDealer([]);
    setDeck([]);
    setActiveBet(0);
    setPlaying(false);
    setDealerHidden(true);
    setGameFinished(false);
    setStatus("Choose your bet to start.");
  }

  const playerValue =
    player.length > 0 ? getValue(player) : 0;

  const dealerValue =
    dealer.length > 0
      ? dealerHidden
        ? "?"
        : getValue(dealer)
      : 0;

  const betOptions = [25, 50, 100, 250, 500];

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
            <Link href="/" className="hover:text-white">
              Home
            </Link>

            <Link
              href="/upgrader"
              className="hover:text-white"
            >
              Upgrader
            </Link>

            <Link
              href="/blackjack"
              className="font-bold text-white"
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
            Blackjack
          </h1>

          <p className="mt-3 text-gray-500">
            Beat the dealer. Reach 21.
          </p>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-emerald-900/50 bg-[#07130d] shadow-2xl">
          <div className="relative min-h-[650px] overflow-hidden bg-[radial-gradient(circle_at_center,#174b31_0%,#0b291a_42%,#06100a_100%)] px-4 py-10 md:px-10">

            <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-emerald-500/20 bg-black/20 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500">
              Emerald Blackjack
            </div>

            <div className="pt-10 text-center">
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Dealer
                </span>

                {dealer.length > 0 && (
                  <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-black">
                    {dealerValue}
                  </span>
                )}
              </div>

              <div className="flex min-h-[185px] justify-center gap-3">
                {dealer.length === 0 ? (
                  <div className="flex items-center text-sm text-gray-700">
                    Dealer is waiting...
                  </div>
                ) : (
                  dealer.map((card, index) => (
                    <PlayingCard
                      key={`${card.rank}${card.suit}${index}`}
                      card={card}
                      hidden={
                        dealerHidden && index === 1
                      }
                    />
                  ))
                )}
              </div>
            </div>

            <div className="mx-auto my-9 flex max-w-2xl items-center gap-4">
              <div className="h-px flex-1 bg-emerald-400/10" />

              <div className="rounded-full border border-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-500/50">
                VS
              </div>

              <div className="h-px flex-1 bg-emerald-400/10" />
            </div>

            <div className="text-center">
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  You
                </span>

                {player.length > 0 && (
                  <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-black text-emerald-400">
                    {playerValue}
                  </span>
                )}
              </div>

              <div className="flex min-h-[185px] justify-center gap-3">
                {player.length === 0 ? (
                  <div className="flex items-center text-sm text-gray-700">
                    Choose your bet below
                  </div>
                ) : (
                  player.map((card, index) => (
                    <PlayingCard
                      key={`${card.rank}${card.suit}${index}`}
                      card={card}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-900/40 bg-[#08120d] p-6 md:p-10">
            <div className="mx-auto max-w-4xl">

              <div className="mb-7 text-center">
                <div className="text-sm text-gray-500">
                  {status}
                </div>

                {activeBet > 0 && (
                  <div className="mt-2 text-xs text-gray-700">
                    Active bet: 💎{" "}
                    {activeBet.toLocaleString("en-US")}
                  </div>
                )}
              </div>

              {!playing && !gameFinished && (
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
                          {amount}
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
                      💎 {bet.toLocaleString("en-US")}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {gameFinished ? (
                  <button
                    onClick={newGame}
                    className="rounded-2xl bg-emerald-500 px-14 py-4 font-black text-black transition hover:bg-emerald-400"
                  >
                    NEW GAME
                  </button>
                ) : !playing ? (
                  <button
                    onClick={startGame}
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
                  <>
                    <button
                      onClick={hit}
                      className="rounded-2xl border border-emerald-700 bg-[#0d2117] px-9 py-4 font-black transition hover:border-emerald-400 hover:bg-[#10301f]"
                    >
                      HIT
                    </button>

                    <button
                      onClick={stand}
                      className="rounded-2xl border border-gray-700 bg-[#111814] px-9 py-4 font-black transition hover:border-gray-500"
                    >
                      STAND
                    </button>

                    <button
                      onClick={doubleDown}
                      disabled={
                        player.length !== 2 ||
                        balance < activeBet
                      }
                      className="rounded-2xl border border-emerald-700 bg-emerald-950/40 px-9 py-4 font-black text-emerald-400 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      DOUBLE
                    </button>
                  </>
                )}
              </div>

              <div className="mx-auto mt-9 grid max-w-3xl grid-cols-1 gap-3 text-center sm:grid-cols-3">
                <div className="rounded-xl border border-gray-900 bg-[#060d09] p-4">
                  <div className="font-bold text-gray-400">
                    BLACKJACK
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    2.5× payout
                  </div>
                </div>

                <div className="rounded-xl border border-gray-900 bg-[#060d09] p-4">
                  <div className="font-bold text-gray-400">
                    DEALER
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Stands on 17
                  </div>
                </div>

                <div className="rounded-xl border border-gray-900 bg-[#060d09] p-4">
                  <div className="font-bold text-gray-400">
                    PUSH
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Bet returned
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