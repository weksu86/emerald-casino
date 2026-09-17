"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";
import { useSharedSoundEnabled } from "../lib/useSoundSettings";
import AnimatedBalance from "../components/AnimatedBalance";

const TILE_COUNT = 25;
const HOUSE_FACTOR = 0.99;

type SoundName =
  | "ui-click"
  | "ui-hover"
  | "bet"
  | "gem"
  | "mine"
  | "cashout";

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function playSynthSound(name: SoundName) {
  if (typeof window === "undefined") return;

  const AudioContextClass =
    window.AudioContext ||
    (window as WebkitWindow).webkitAudioContext;

  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const now = ctx.currentTime + 0.008;

  const master = ctx.createGain();
  master.gain.value = 0.65;
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

  switch (name) {
    case "ui-click":
      tone(1450, now, 0.032, 0.022, "triangle", 1050);
      break;

    case "ui-hover":
      tone(1280, now, 0.035, 0.01, "triangle", 1510);
      break;

    case "bet":
      tone(420, now, 0.08, 0.035, "triangle", 300);
      tone(840, now + 0.035, 0.06, 0.018, "sine");
      break;

    case "gem":
      tone(760, now, 0.07, 0.025, "sine", 980);
      tone(
        1180,
        now + 0.035,
        0.09,
        0.02,
        "triangle",
        1480
      );
      break;

    case "mine":
      tone(125, now, 0.28, 0.07, "sawtooth", 55);
      tone(70, now + 0.03, 0.32, 0.06, "square", 42);
      break;

    case "cashout":
      tone(659.25, now, 0.11, 0.026);
      tone(830.61, now + 0.06, 0.13, 0.03);
      tone(987.77, now + 0.12, 0.16, 0.032);
      break;
  }

  window.setTimeout(() => {
    void ctx.close();
  }, 700);
}

function combination(n: number, k: number) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;

  const r = Math.min(k, n - k);
  let result = 1;

  for (let i = 1; i <= r; i++) {
    result = (result * (n - r + i)) / i;
  }

  return result;
}

function multiplierFor(
  mines: number,
  safePicks: number
) {
  if (safePicks <= 0) return 1;

  const safeTiles = TILE_COUNT - mines;

  if (safePicks > safeTiles) return 0;

  const survivalProbability =
    combination(safeTiles, safePicks) /
    combination(TILE_COUNT, safePicks);

  return HOUSE_FACTOR / survivalProbability;
}

function createMines(count: number) {
  const positions = Array.from(
    { length: TILE_COUNT },
    (_, index) => index
  );

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [positions[i], positions[j]] = [
      positions[j],
      positions[i],
    ];
  }

  return new Set(positions.slice(0, count));
}

export default function MinesPage() {
  const {
    balance,
    removeEmeralds,
    addEmeralds,
    recordGameResult,
  } = useEmeralds();

  const [soundEnabled] =
    useSharedSoundEnabled();

  const [bet, setBet] = useState(100);
  const [mineCount, setMineCount] = useState(3);

  const [minePositions, setMinePositions] =
    useState<Set<number>>(new Set());

  const [revealed, setRevealed] =
    useState<Set<number>>(new Set());

  const [playing, setPlaying] =
    useState(false);

  const [lost, setLost] =
    useState(false);

  const [cashedOut, setCashedOut] =
    useState(false);

  const [roundBet, setRoundBet] =
    useState(0);

  const [lastPayout, setLastPayout] =
    useState(0);

  const [showWinAnimation, setShowWinAnimation] =
    useState(false);

  const playSound = useCallback(
    (name: SoundName) => {
      if (soundEnabled) {
        playSynthSound(name);
      }
    },
    [soundEnabled]
  );

  const safePicks = useMemo(() => {
    let count = 0;

    for (const tile of revealed) {
      if (!minePositions.has(tile)) {
        count++;
      }
    }

    return count;
  }, [revealed, minePositions]);

  const currentMultiplier =
    multiplierFor(mineCount, safePicks);

  const nextMultiplier =
    multiplierFor(mineCount, safePicks + 1);

  const currentPayout =
    safePicks > 0
      ? Math.floor(
          roundBet * currentMultiplier
        )
      : 0;

  function startGame() {
    if (
      playing ||
      bet <= 0 ||
      bet > balance
    ) {
      return;
    }

    const success =
      removeEmeralds(bet);

    if (!success) return;

    playSound("bet");

    setMinePositions(
      createMines(mineCount)
    );

    setRevealed(new Set());

    setRoundBet(bet);
    setPlaying(true);
    setLost(false);
    setCashedOut(false);
    setLastPayout(0);
    setShowWinAnimation(false);
  }

  function revealTile(index: number) {
    if (
      !playing ||
      revealed.has(index)
    ) {
      return;
    }

    const nextRevealed =
      new Set(revealed);

    nextRevealed.add(index);
    setRevealed(nextRevealed);

    if (minePositions.has(index)) {
      playSound("mine");

      setLost(true);
      setPlaying(false);
      setLastPayout(0);
      recordGameResult("mines", 0);

      return;
    }

    playSound("gem");

    const newSafePicks =
      safePicks + 1;

    const totalSafeTiles =
      TILE_COUNT - mineCount;

    // Kaikki turvalliset ruudut löydetty.
    if (
      newSafePicks ===
      totalSafeTiles
    ) {
      const finalMultiplier =
        multiplierFor(
          mineCount,
          newSafePicks
        );

      const payout =
        Math.floor(
          roundBet *
            finalMultiplier
        );

      addEmeralds(payout);
      recordGameResult("mines", payout);

      setLastPayout(payout);
      setCashedOut(true);
      setPlaying(false);

      playSound("cashout");
      setShowWinAnimation(true);
      window.setTimeout(
        () => setShowWinAnimation(false),
        1700
      );
    }
  }

  function cashOut() {
    if (
      !playing ||
      safePicks <= 0
    ) {
      return;
    }

    const payout =
      Math.floor(
        roundBet *
          currentMultiplier
      );

    addEmeralds(payout);
    recordGameResult("mines", payout);

    setLastPayout(payout);
    setCashedOut(true);
    setPlaying(false);

    playSound("cashout");
    setShowWinAnimation(true);
    window.setTimeout(
      () => setShowWinAnimation(false),
      1700
    );
  }

  function resetRound() {
    playSound("ui-click");

    setMinePositions(new Set());
    setRevealed(new Set());

    setPlaying(false);
    setLost(false);
    setCashedOut(false);

    setRoundBet(0);
    setLastPayout(0);
    setShowWinAnimation(false);
  }

  function handleBetInput(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value =
      Number(
        event.target.value.replace(
          /\D/g,
          ""
        )
      );

    setBet(
      Math.min(value, balance)
    );
  }

  function setMines(
    value: number
  ) {
    if (playing) return;

    playSound("ui-click");

    setMineCount(
      Math.max(
        1,
        Math.min(24, value)
      )
    );
  }

  const roundFinished =
    lost || cashedOut;

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">

      {/* WIN SCREEN */}
      {showWinAnimation && lastPayout > 0 && (
        <div className="win-screen pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
          <div className="win-flash absolute inset-0 bg-[#20C997]/5" />
          <div className="win-glow absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#20C997]/15 blur-[90px]" />

          <div className="win-content relative z-10 text-center">
            <div className="win-badge mx-auto w-fit rounded-full border border-[#20C997]/40 bg-[#0B0B0F]/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#20C997] shadow-[0_0_30px_rgba(32,201,151,0.18)]">
              WIN
            </div>

            <div className="mt-3 text-3xl font-black uppercase text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.12)] md:text-5xl">
              CASH OUT
            </div>

            <div className="win-amount mt-3 text-4xl font-black text-[#F5C542] drop-shadow-[0_0_22px_rgba(245,197,66,0.35)] md:text-6xl">
              +💎 {lastPayout.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-[#6C2BD9]/30 bg-[#0B0B0F]">

        <div className="mx-auto flex max-w-6xl items-center px-5 py-4">

          <Link
            href="/"
            onMouseEnter={() =>
              playSound("ui-hover")
            }
            onClick={() =>
              playSound("ui-click")
            }
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
                className="transition hover:text-white"
              >
                Blackjack
              </Link>

              <Link
                href="/mines"
                className="font-bold text-white"
              >
                Mines
              </Link>

              <Link
                href="/case"
                className="transition hover:text-white"
              >
                Case
              </Link>

              <Link
                href="/leaderboard"
                className="transition hover:text-white"
              >
                Leaderboard
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
            MINES
          </h1>

          <p className="mt-1 text-[11px] text-gray-600">
            Find gems. Avoid mines.
            Cash out before it is too late.
          </p>

        </div>

        {/* MAIN GAME */}
        <div className="overflow-hidden rounded-[28px] border border-[#6C2BD9]/50 bg-[#111116] shadow-[0_0_60px_rgba(108,43,217,0.12)]">

          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#F5C542] to-transparent" />

          <div className="grid lg:grid-cols-[300px_1fr]">

            {/* CONTROL PANEL */}
            <aside className="order-2 border-t border-[#6C2BD9]/25 bg-[#09090D] p-5 lg:order-1 lg:border-r lg:border-t-0">

              {/* BET */}
              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-500">
                    BET AMOUNT
                  </label>

                  <span className="text-[9px] font-black text-gray-700">
                    💎{" "}
                    {balance.toLocaleString(
                      "en-US"
                    )}
                  </span>

                </div>

                <div className="relative">

                  <input
                    type="text"
                    inputMode="numeric"
                    value={bet}
                    disabled={playing}
                    onChange={
                      handleBetInput
                    }
                    className="w-full rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-3 pr-12 text-sm font-black text-white outline-none transition focus:border-[#F5C542] disabled:opacity-50"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm">
                    💎
                  </span>

                </div>

                <div className="mt-2 grid grid-cols-4 gap-2">

                  <button
                    type="button"
                    disabled={playing}
                    onClick={() => {
                      playSound("ui-click");

                      setBet(
                        Math.floor(
                          bet / 2
                        )
                      );
                    }}
                    className="rounded-lg border border-white/5 bg-[#15131D] py-2 text-[9px] font-black text-gray-500 hover:text-white disabled:opacity-30"
                  >
                    ½
                  </button>

                  <button
                    type="button"
                    disabled={playing}
                    onClick={() => {
                      playSound("ui-click");

                      setBet(
                        Math.min(
                          balance,
                          bet * 2
                        )
                      );
                    }}
                    className="rounded-lg border border-white/5 bg-[#15131D] py-2 text-[9px] font-black text-gray-500 hover:text-white disabled:opacity-30"
                  >
                    2×
                  </button>

                  <button
                    type="button"
                    disabled={playing}
                    onClick={() => {
                      playSound("ui-click");

                      setBet(
                        Math.min(
                          balance,
                          500
                        )
                      );
                    }}
                    className="rounded-lg border border-white/5 bg-[#15131D] py-2 text-[9px] font-black text-gray-500 hover:text-white disabled:opacity-30"
                  >
                    500
                  </button>

                  <button
                    type="button"
                    disabled={playing}
                    onClick={() => {
                      playSound("ui-click");
                      setBet(balance);
                    }}
                    className="rounded-lg border border-[#F5C542]/20 bg-[#15131D] py-2 text-[9px] font-black text-[#F5C542] disabled:opacity-30"
                  >
                    MAX
                  </button>

                </div>

              </div>

              {/* MINES */}
              <div className="mt-5">

                <label className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-500">
                  MINES
                </label>

                <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-[#6C2BD9]/40 bg-[#15131D]">

                  <button
                    type="button"
                    disabled={
                      playing ||
                      mineCount <= 1
                    }
                    onClick={() =>
                      setMines(
                        mineCount - 1
                      )
                    }
                    className="h-12 w-12 text-xl font-black text-gray-500 transition hover:bg-white/5 hover:text-white disabled:opacity-20"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={mineCount}
                    disabled={playing}
                    onChange={(event) =>
                      setMines(
                        Number(
                          event.target
                            .value || 1
                        )
                      )
                    }
                    className="h-12 min-w-0 flex-1 border-x border-white/5 bg-transparent text-center text-lg font-black text-[#F5C542] outline-none disabled:opacity-60"
                  />

                  <button
                    type="button"
                    disabled={
                      playing ||
                      mineCount >= 24
                    }
                    onClick={() =>
                      setMines(
                        mineCount + 1
                      )
                    }
                    className="h-12 w-12 text-xl font-black text-gray-500 transition hover:bg-white/5 hover:text-white disabled:opacity-20"
                  >
                    +
                  </button>

                </div>

                <input
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={mineCount}
                  disabled={playing}
                  onChange={(event) =>
                    setMines(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="mt-3 h-2 w-full cursor-pointer accent-[#6C2BD9] disabled:opacity-40"
                />

                <div className="mt-1 flex justify-between text-[8px] font-black text-gray-700">
                  <span>1</span>
                  <span>24</span>
                </div>

              </div>

              {/* STATS */}
              <div className="mt-5 grid grid-cols-2 gap-2">

                <div className="rounded-xl border border-white/5 bg-[#111116] p-3">

                  <div className="text-[8px] font-black uppercase tracking-wider text-gray-600">
                    GEMS
                  </div>

                  <div className="mt-1 text-lg font-black text-[#20C997]">
                    {TILE_COUNT -
                      mineCount}
                  </div>

                </div>

                <div className="rounded-xl border border-white/5 bg-[#111116] p-3">

                  <div className="text-[8px] font-black uppercase tracking-wider text-gray-600">
                    MINES
                  </div>

                  <div className="mt-1 text-lg font-black text-[#E0525F]">
                    {mineCount}
                  </div>

                </div>

              </div>

              {/* ACTION */}
              <div className="mt-5">

                {!playing &&
                  !roundFinished && (
                    <button
                      type="button"
                      disabled={
                        bet <= 0 ||
                        bet > balance
                      }
                      onClick={
                        startGame
                      }
                      className="h-12 w-full rounded-xl bg-[#6C2BD9] text-sm font-black text-white shadow-[0_0_30px_rgba(108,43,217,0.2)] transition hover:bg-[#7d3be8] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      BET — 💎{" "}
                      {bet.toLocaleString(
                        "en-US"
                      )}
                    </button>
                  )}

                {playing && (
                  <button
                    type="button"
                    disabled={
                      safePicks === 0
                    }
                    onClick={cashOut}
                    className="h-12 w-full rounded-xl bg-[#F5C542] text-sm font-black text-black shadow-[0_0_28px_rgba(245,197,66,0.15)] transition hover:bg-[#ffd45e] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {safePicks === 0
                      ? "REVEAL A TILE"
                      : `CASH OUT — 💎 ${currentPayout.toLocaleString(
                          "en-US"
                        )}`}
                  </button>
                )}

                {roundFinished && (
                  <button
                    type="button"
                    onClick={
                      resetRound
                    }
                    className="h-12 w-full rounded-xl bg-[#6C2BD9] text-sm font-black text-white transition hover:bg-[#7d3be8]"
                  >
                    NEW GAME
                  </button>
                )}

              </div>

            </aside>

            {/* BOARD */}
            <div className="order-1 relative min-h-[540px] bg-[radial-gradient(circle_at_center,#251044_0%,#140c22_48%,#0B0B0F_100%)] p-4 sm:p-7 lg:order-2">

              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6C2BD9]/10 blur-[90px]" />

              <div className="relative mx-auto flex h-full max-w-[620px] flex-col justify-center">

                {/* TOP STATS */}
                <div className="mb-4 grid grid-cols-3 gap-2">

                  <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-center">

                    <div className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-600">
                      MULTIPLIER
                    </div>

                    <div className="mt-1 text-sm font-black text-[#F5C542]">
                      {safePicks > 0
                        ? `${currentMultiplier.toFixed(
                            2
                          )}×`
                        : "1.00×"}
                    </div>

                  </div>

                  <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-center">

                    <div className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-600">
                      SAFE PICKS
                    </div>

                    <div className="mt-1 text-sm font-black text-[#20C997]">
                      {safePicks}
                    </div>

                  </div>

                  <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-center">

                    <div className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-600">
                      NEXT TILE
                    </div>

                    <div className="mt-1 text-sm font-black text-white">
                      {playing
                        ? `${nextMultiplier.toFixed(
                            2
                          )}×`
                        : "—"}
                    </div>

                  </div>

                </div>

                {/* 5x5 GRID */}
                <div className="grid grid-cols-5 gap-2 sm:gap-3">

                  {Array.from(
                    {
                      length:
                        TILE_COUNT,
                    },
                    (_, index) => {
                      const isRevealed =
                        revealed.has(
                          index
                        );

                      const isMine =
                        minePositions.has(
                          index
                        );

                      const showMine =
                        (isRevealed &&
                          isMine) ||
                        ((lost ||
                          cashedOut) &&
                          isMine);

                      const showGem =
                        isRevealed &&
                        !isMine;

                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={
                            !playing ||
                            isRevealed
                          }
                          onClick={() =>
                            revealTile(
                              index
                            )
                          }
                          className={[
                            "aspect-square min-h-[54px] rounded-xl border text-2xl font-black transition sm:rounded-2xl sm:text-3xl",

                            showMine
                              ? "mine-hit border-[#E0525F]/70 bg-[#E0525F]/15 shadow-[inset_0_0_30px_rgba(224,82,95,0.16),0_0_20px_rgba(224,82,95,0.12)]"

                              : showGem
                              ? "gem-hit border-[#20C997]/60 bg-[#20C997]/10 shadow-[inset_0_0_30px_rgba(32,201,151,0.12),0_0_18px_rgba(32,201,151,0.10)]"

                              : playing
                              ? "border-[#6C2BD9]/45 bg-[#21143A] shadow-[inset_0_-5px_0_rgba(0,0,0,0.24),0_6px_16px_rgba(0,0,0,0.22)] hover:-translate-y-0.5 hover:border-[#8B5CF6]/80 hover:bg-[#2A1850]"

                              : "border-[#6C2BD9]/25 bg-[#171020]",
                          ].join(" ")}
                        >

                          {showMine ? (
                            <span className="drop-shadow-[0_0_12px_rgba(224,82,95,0.55)]">
                              💣
                            </span>
                          ) : showGem ? (
                            <span className="drop-shadow-[0_0_12px_rgba(32,201,151,0.55)]">
                              💎
                            </span>
                          ) : (
                            <span className="text-[#6C2BD9]/20">
                              ◆
                            </span>
                          )}

                        </button>
                      );
                    }
                  )}

                </div>

                {/* RESULT */}
                <div className="mt-5 min-h-[74px] text-center">

                  {!playing &&
                    !roundFinished && (
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-700">
                        SET YOUR BET
                        AND MINES TO
                        START
                      </div>
                    )}

                  {playing && (
                    <div>

                      <div className="text-[9px] font-black uppercase tracking-[0.28em] text-gray-600">
                        CURRENT VALUE
                      </div>

                      <div className="mt-1 text-2xl font-black text-[#F5C542]">

                        {safePicks > 0
                          ? `💎 ${currentPayout.toLocaleString(
                              "en-US"
                            )}`
                          : "PICK A TILE"}

                      </div>

                    </div>
                  )}

                  {lost && (
                    <div className="result-pop">

                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E0525F]">
                        MINE HIT
                      </div>

                      <div className="mt-1 text-2xl font-black text-white">
                        −💎{" "}
                        {roundBet.toLocaleString(
                          "en-US"
                        )}
                      </div>

                    </div>
                  )}

                  {cashedOut && (
                    <div className="result-pop">

                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#20C997]">
                        CASHED OUT
                      </div>

                      <div className="mt-1 text-2xl font-black text-[#F5C542]">
                        +💎{" "}
                        {lastPayout.toLocaleString(
                          "en-US"
                        )}
                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* INFO */}
        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-white/5 bg-[#111116] px-5 py-3">

          <span className="text-[10px] font-black text-[#F5C542]">
            1–24 MINES
          </span>

          <span className="hidden text-gray-800 sm:block">
            •
          </span>

          <span className="text-[10px] font-black text-[#20C997]">
            CASH OUT ANY TIME
          </span>

          <span className="hidden text-gray-800 sm:block">
            •
          </span>

          <span className="text-[10px] font-black text-gray-500">
            MORE MINES = HIGHER
            MULTIPLIERS
          </span>

        </div>

        <div className="mx-auto mt-4 max-w-2xl text-center text-[9px] font-bold uppercase tracking-[0.2em] text-gray-800">
          VIRTUAL EMERALDS • DEMO GAME •
          NO REAL MONEY
        </div>

      </section>

      <style jsx>{`

        .gem-hit {
          animation:
            gemReveal 0.22s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            both;
        }

        .mine-hit {
          animation:
            mineReveal 0.32s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            both;
        }

        .result-pop {
          animation:
            resultPop 0.35s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            both;
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

        @keyframes gemReveal {
          0% {
            transform:
              scale(0.78);
            opacity: 0.5;
          }

          70% {
            transform:
              scale(1.06);
          }

          100% {
            transform:
              scale(1);
            opacity: 1;
          }
        }

        @keyframes mineReveal {
          0% {
            transform:
              scale(0.72)
              rotate(-5deg);
          }

          55% {
            transform:
              scale(1.1)
              rotate(3deg);
          }

          100% {
            transform:
              scale(1)
              rotate(0);
          }
        }

        @keyframes resultPop {
          from {
            opacity: 0;
            transform:
              translateY(8px)
              scale(0.94);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

      `}</style>

    </main>
  );
}