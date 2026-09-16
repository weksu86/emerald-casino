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
      <div className="relative h-28 w-[68px] rounded-xl border-2 border-[#6C2BD9] bg-[#21113d] shadow-xl sm:h-32 sm:w-[80px]">
        <div className="absolute inset-2 rounded-lg border border-[#F5C542]/30 bg-[radial-gradient(circle_at_center,#6C2BD9,#24103f)]" />

        <div className="relative flex h-full items-center justify-center text-2xl text-[#F5C542]">
          💎
        </div>
      </div>
    );
  }

  const red = card.suit === "♥" || card.suit === "♦";
  const textClass = red ? "text-red-500" : "text-black";

  return (
    <div className="relative h-28 w-[68px] rounded-xl border-2 border-white bg-white shadow-xl sm:h-32 sm:w-[80px]">
      <div
        className={
          "absolute left-2 top-2 text-left text-base font-black leading-none " +
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
    </div>
  );
}

export default function BlackjackPage() {
  const { balance, removeEmeralds, addEmeralds } =
    useEmeralds();

  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
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

    const player = [shuffled[0], shuffled[2]];
    const dealer = [shuffled[1], shuffled[3]];

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
      setResult("Not enough Emeralds to double");
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

      remainingDeck = remainingDeck.slice(1);
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
    } else if (playerValue === dealerValue) {
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

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">
      {/* HEADER */}
      <header className="border-b border-[#6C2BD9]/30 bg-[#0B0B0F]">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-3">
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
            {/* GAMES */}
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

            {/* DEPOSIT / WITHDRAW */}
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

          {/* BALANCE */}
          <div className="ml-auto rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 md:ml-0">
            <div className="text-[9px] font-bold text-gray-500">
              BALANCE
            </div>

            <div className="font-black text-[#F5C542]">
              💎 {balance.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-3 text-center">
          <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#6C2BD9]">
            CS ACE
          </div>

          <h1 className="mt-1 text-3xl font-black">
            BLACKJACK
          </h1>

          <p className="mt-1 text-[11px] text-gray-600">
            Beat the dealer and reach 21
          </p>
        </div>

        {/* WIN ANIMATION */}
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

        {/* GAME */}
        <div className="overflow-hidden rounded-3xl border border-[#6C2BD9]/40 bg-[#111116]">
          <div className="bg-[radial-gradient(circle_at_center,#29134f,#170d29,#0B0B0F)]">
            {/* DEALER */}
            <div className="min-h-[190px] px-4 py-4 text-center">
              <div className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#F5C542]">
                DEALER
              </div>

              <div className="flex min-h-[135px] items-center justify-center gap-2">
                {dealerCards.length === 0 ? (
                  <div className="text-xs text-gray-600">
                    Waiting for game
                  </div>
                ) : (
                  dealerCards.map((card, index) => (
                    <PlayingCard
                      key={index}
                      card={card}
                      hidden={
                        playing && index === 1
                      }
                    />
                  ))
                )}
              </div>

              <div className="h-6">
                {dealerCards.length > 0 &&
                  !playing && (
                    <div className="text-lg font-black text-white">
                      {handValue(dealerCards)}
                    </div>
                  )}
              </div>
            </div>

            {/* YOU */}
            <div className="min-h-[210px] border-t border-[#6C2BD9]/40 bg-[radial-gradient(circle_at_center,#351765,#24103f,#12091f)] px-4 py-4 text-center shadow-[inset_0_0_50px_rgba(108,43,217,0.15)]">
              <div className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#F5C542]">
                YOU
              </div>

              <div className="flex min-h-[135px] items-center justify-center gap-2">
                {playerCards.length === 0 ? (
                  <div className="text-xs text-gray-600">
                    Waiting for game
                  </div>
                ) : (
                  playerCards.map((card, index) => (
                    <PlayingCard
                      key={index}
                      card={card}
                    />
                  ))
                )}
              </div>

              <div className="h-6">
                {playerCards.length > 0 && (
                  <div
                    className={
                      "text-lg font-black " +
                      (handValue(playerCards) > 21
                        ? "text-[#E0525F]"
                        : "text-white")
                    }
                  >
                    {handValue(playerCards)}
                  </div>
                )}
              </div>

              <div className="mt-1 h-7">
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
          <div className="border-t border-[#6C2BD9]/30 bg-[#0B0B0F] p-3">
            <div className="mx-auto max-w-5xl">
              <div className="mb-1 text-center text-[9px] font-bold uppercase tracking-widest text-gray-600">
                BET
              </div>

              <div className="flex items-center justify-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={bet}
                  disabled={playing}
                  onChange={handleBetInput}
                  className="w-32 rounded-xl border border-[#6C2BD9]/50 bg-[#15131D] px-3 py-2 text-center text-lg font-black text-[#F5C542] outline-none focus:border-[#F5C542]"
                />

                <span className="text-xs font-black text-gray-600">
                  / {balance.toLocaleString("en-US")} 💎
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <span className="w-8 text-left text-xs font-black text-gray-500">
                  0
                </span>

                <input
                  type="range"
                  min="0"
                  max={Math.max(balance, 1)}
                  step="1"
                  value={Math.min(bet, balance)}
                  disabled={
                    playing || balance <= 0
                  }
                  onChange={(event) =>
                    setBet(
                      Number(event.target.value)
                    )
                  }
                  className="h-2 w-full cursor-pointer accent-[#F5C542]"
                />

                <span className="w-12 text-right text-xs font-black text-[#F5C542]">
                  ALL IN
                </span>
              </div>

              {/* BUTTON AREA */}
              <div className="mt-3 flex h-[44px] items-center justify-center gap-2">
                {!playing && !result && (
                  <button
                    type="button"
                    onClick={startGame}
                    disabled={
                      bet <= 0 ||
                      bet > balance
                    }
                    className="h-[44px] min-w-[120px] rounded-xl bg-[#6C2BD9] px-8 text-sm font-black text-white hover:bg-[#7d3be8] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    DEAL
                  </button>
                )}

                {playing && (
                  <>
                    <button
                      type="button"
                      onClick={hit}
                      className="h-[44px] min-w-[100px] rounded-xl bg-[#6C2BD9] px-6 text-sm font-black text-white hover:bg-[#7d3be8]"
                    >
                      HIT
                    </button>

                    <button
                      type="button"
                      onClick={stand}
                      className="h-[44px] min-w-[100px] rounded-xl bg-[#F5C542] px-6 text-sm font-black text-black hover:bg-[#ffd45e]"
                    >
                      STAND
                    </button>

                    <button
                      type="button"
                      onClick={doubleDown}
                      disabled={
                        playerCards.length !== 2
                      }
                      className="h-[44px] min-w-[100px] rounded-xl border border-[#F5C542]/50 bg-[#15131D] px-6 text-sm font-black text-[#F5C542] hover:border-[#F5C542] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      DOUBLE
                    </button>
                  </>
                )}

                {!playing && result && (
                  <button
                    type="button"
                    onClick={newGame}
                    className="h-[44px] min-w-[120px] rounded-xl bg-[#6C2BD9] px-8 text-sm font-black text-white hover:bg-[#7d3be8]"
                  >
                    NEW GAME
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RULES */}
        <div className="mt-4 text-center">
          <span className="text-xs font-black text-[#F5C542]">
            BLACKJACK 2.5x
          </span>

          <span className="mx-3 text-gray-800">•</span>

          <span className="text-xs font-black text-[#F5C542]">
            NORMAL WIN 2x
          </span>

          <span className="mx-3 text-gray-800">•</span>

          <span className="text-xs font-black text-[#F5C542]">
            DEALER STANDS ON 17
          </span>
        </div>
      </section>
    </main>
  );
}