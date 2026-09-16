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
}: {
  card: Card;
  hidden?: boolean;
}) {
  if (hidden) {
    return (
      <div className="card-enter relative h-28 w-[68px] shrink-0 rounded-xl border-2 border-[#6C2BD9] bg-[#21113d] shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:h-32 sm:w-[80px]">
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
    <div className="card-enter relative h-28 w-[68px] shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:h-32 sm:w-[80px]">

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

  function startGame() {
    if (playing) return;

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

    const player = [
      shuffled[0],
      shuffled[2],
    ];

    const dealer = [
      shuffled[1],
      shuffled[3],
    ];

    setPlayerCards(player);
    setDealerCards(dealer);
    setDeck(shuffled.slice(4));
    setPlaying(true);
    setResult("");
    setWin(0);
    setShowWinAnimation(false);

    if (isBlackjack(player)) {
      finishRound(
        player,
        dealer,
        bet,
        shuffled.slice(4)
      );
    }
  }

  function hit() {
    if (!playing || deck.length === 0) return;

    const card = deck[0];

    const newPlayerCards = [
      ...playerCards,
      card,
    ];

    const newDeck = deck.slice(1);

    setPlayerCards(newPlayerCards);
    setDeck(newDeck);

    if (handValue(newPlayerCards) > 21) {
      finishRound(
        newPlayerCards,
        dealerCards,
        bet,
        newDeck
      );
    }
  }

  function stand() {
    if (!playing) return;

    let newDealerCards = [...dealerCards];
    let newDeck = [...deck];

    while (
      handValue(newDealerCards) < 17 &&
      newDeck.length > 0
    ) {
      newDealerCards = [
        ...newDealerCards,
        newDeck[0],
      ];

      newDeck = newDeck.slice(1);
    }

    setDealerCards(newDealerCards);
    setDeck(newDeck);

    finishRound(
      playerCards,
      newDealerCards,
      bet,
      newDeck
    );
  }

  function doubleDown() {
    if (
      !playing ||
      deck.length === 0 ||
      playerCards.length !== 2
    ) {
      return;
    }

    if (balance < bet) {
      setResult(
        "Not enough Emeralds to double"
      );
      return;
    }

    const success = removeEmeralds(bet);

    if (!success) return;

    const newBet = bet * 2;

    setBet(newBet);

    const card = deck[0];

    const newPlayerCards = [
      ...playerCards,
      card,
    ];

    const newDeck = deck.slice(1);

    setPlayerCards(newPlayerCards);
    setDeck(newDeck);

    if (handValue(newPlayerCards) > 21) {
      finishRound(
        newPlayerCards,
        dealerCards,
        newBet,
        newDeck
      );

      return;
    }

    let newDealerCards = [...dealerCards];
    let remainingDeck = [...newDeck];

    while (
      handValue(newDealerCards) < 17 &&
      remainingDeck.length > 0
    ) {
      newDealerCards = [
        ...newDealerCards,
        remainingDeck[0],
      ];

      remainingDeck =
        remainingDeck.slice(1);
    }

    setDealerCards(newDealerCards);
    setDeck(remainingDeck);

    finishRound(
      newPlayerCards,
      newDealerCards,
      newBet,
      remainingDeck
    );
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
        setShowWinAnimation(true);

        setTimeout(() => {
          setShowWinAnimation(false);
        }, 2800);
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

      {/* WIN SCREEN */}
      {showWinAnimation && win > 0 && (
        <div className="win-screen pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#08080C]/90 backdrop-blur-md">

          <div className="win-glow absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#20C997]/10 blur-[120px]" />

          <div className="win-ring absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#20C997]" />

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

          <div className="win-content relative z-10 text-center">

            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[#6C2BD9]">
              CS ACE
            </div>

            <div className="mt-2 text-[12px] font-black uppercase tracking-[0.4em] text-[#20C997]">
              ROUND WON
            </div>

            <div className="mt-5 text-5xl font-black text-white md:text-7xl">
              {result}
            </div>

            <div className="mx-auto mt-6 w-fit rounded-2xl border border-[#F5C542]/40 bg-[#15131D] px-10 py-5 shadow-[0_0_50px_rgba(245,197,66,0.12)]">

              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
                PAYOUT
              </div>

              <div className="mt-1 text-4xl font-black text-[#F5C542]">
                +💎{" "}
                {win.toLocaleString("en-US")}
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

              <Link
                href="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <Link
                href="/joker-poker"
                className="transition hover:text-white"
              >
                Joker Poker
              </Link>

              <Link
                href="/blackjack"
                className="font-bold text-white"
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
              💎{" "}
              {balance.toLocaleString("en-US")}
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
                  dealerCards.map(
                    (card, index) => (
                      <PlayingCard
                        key={index}
                        card={card}
                        hidden={
                          playing &&
                          index === 1
                        }
                      />
                    )
                  )
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
                  playerCards.map(
                    (card, index) => (
                      <PlayingCard
                        key={index}
                        card={card}
                      />
                    )
                  )
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
                        onClick={() =>
                          setBet(
                            Math.min(
                              amount,
                              balance
                            )
                          )
                        }
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
                    onClick={() =>
                      setBet(balance)
                    }
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
                    onClick={startGame}
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
                      onClick={hit}
                      className="h-[48px] min-w-[105px] rounded-xl bg-[#6C2BD9] px-6 text-sm font-black text-white shadow-[0_0_20px_rgba(108,43,217,0.18)] transition hover:bg-[#7d3be8]"
                    >
                      HIT
                    </button>

                    <button
                      type="button"
                      onClick={stand}
                      className="h-[48px] min-w-[105px] rounded-xl bg-[#F5C542] px-6 text-sm font-black text-black shadow-[0_0_20px_rgba(245,197,66,0.15)] transition hover:bg-[#ffd45e]"
                    >
                      STAND
                    </button>

                    <button
                      type="button"
                      onClick={doubleDown}
                      disabled={
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
                    onClick={newGame}
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

        .win-screen {
          animation: screenIn 0.25s ease-out
            both;
        }

        .win-content {
          animation: winContent 0.65s
            cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .win-glow {
          animation: glowReveal 1.5s ease-out
            both;
        }

        .win-ring {
          animation: ringExpand 1.2s ease-out
            both;
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
          animation: particleMove 1.2s
            ease-out 0.1s both;
        }

        .particle-2 {
          --x: 300px;
          --y: -190px;
          animation: particleMove 1.1s
            ease-out 0.15s both;
        }

        .particle-3 {
          --x: -350px;
          --y: 70px;
          animation: particleMove 1.25s
            ease-out 0.05s both;
        }

        .particle-4 {
          --x: 350px;
          --y: 70px;
          animation: particleMove 1.15s
            ease-out 0.2s both;
        }

        .particle-5 {
          --x: -230px;
          --y: 240px;
          animation: particleMove 1.3s
            ease-out 0.12s both;
        }

        .particle-6 {
          --x: 240px;
          --y: 240px;
          animation: particleMove 1.2s
            ease-out 0.08s both;
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
            transform: translate(-50%, -50%)
              scale(0.25);
          }

          to {
            opacity: 1;
            transform: translate(-50%, -50%)
              scale(1.1);
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
              scale(4);
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
              scale(1.3)
              rotate(45deg);
          }
        }
      `}</style>

    </main>
  );
}