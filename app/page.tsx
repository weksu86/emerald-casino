"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import AnimatedBalance from "./components/AnimatedBalance";
import { useEmeralds } from "./context/EmeraldContext";
import { useSharedSoundEnabled } from "./lib/useSoundSettings";
import { createClient } from "../lib/supabase/client";

const DAILY_CASE_WAIT = 24 * 60 * 60 * 1000;
const DAILY_CASE_KEY = "cs-ace-daily-case-next";

const MINUTE_BONUS_WAIT = 60 * 1000;
const MINUTE_BONUS_AMOUNT = 500;
const MINUTE_BONUS_KEY = "cs-ace-minute-bonus-next";

type DailyCaseDrop = {
  name: string;
  chance: string;
  emeralds: number;
  icon: string;
};

const DAILY_CASE_DROPS: DailyCaseDrop[] = [
  {
    name: "M4A1-S | Printstream",
    chance: "90%",
    emeralds: 500,
    icon: "🔫",
  },
  {
    name: "Butterfly Knife | Gamma Doppler",
    chance: "10%",
    emeralds: 50000,
    icon: "🦋",
  },
];

type LeaderboardPlayer = {
  userId: string;
  nickname: string;
  peakBalance: number;
  isYou?: boolean;
};

export default function Home() {
  const [soundEnabled] = useSharedSoundEnabled();
  const { peakBalance, addEmeralds } = useEmeralds();
  const [caseReady, setCaseReady] = useState(false);
  const [caseRemaining, setCaseRemaining] = useState(0);
  const [caseOpening, setCaseOpening] = useState(false);
  const [caseResult, setCaseResult] = useState<DailyCaseDrop | null>(null);
  const [reelOffset, setReelOffset] = useState(0);
  const [reelItems, setReelItems] = useState<DailyCaseDrop[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [myUsername, setMyUsername] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [bonusReady, setBonusReady] = useState(false);
  const [bonusRemaining, setBonusRemaining] = useState(0);

  const refreshLeaderboard = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLeaderboardLoading(false); return; }
    setMyUserId(user.id);
    const { data: myProfile } = await supabase.from("profiles").select("username, peak_balance").eq("user_id", user.id).maybeSingle();
    if (myProfile) setMyUsername(myProfile.username);
    const { data } = await supabase.from("profiles").select("user_id, username, peak_balance, updated_at").order("peak_balance", { ascending: false }).order("updated_at", { ascending: true }).limit(3);
    setLeaderboard((data ?? []).map((p) => ({ userId: p.user_id, nickname: p.username, peakBalance: Number(p.peak_balance), isYou: p.user_id === user.id })));
    setLeaderboardLoading(false);
  };

  useEffect(() => {
    refreshLeaderboard();
    const ready = () => refreshLeaderboard();
    window.addEventListener("cs-ace-profile-ready", ready);
    return () => window.removeEventListener("cs-ace-profile-ready", ready);
  }, []);

  useEffect(() => {
    if (!myUserId || !myUsername) return;
    const sync = async () => {
      const supabase = createClient();
      const { data: profile } = await supabase.from("profiles").select("peak_balance").eq("user_id", myUserId).single();
      if (!profile) return;
      if (peakBalance > Number(profile.peak_balance)) {
        const { error } = await supabase.from("profiles").update({ peak_balance: peakBalance }).eq("user_id", myUserId);
        if (error) return;
      }
      await refreshLeaderboard();
    };
    sync();
  }, [peakBalance, myUserId, myUsername]);

  useEffect(() => {
    const updateMinuteBonus = () => {
      const stored = window.localStorage.getItem(MINUTE_BONUS_KEY);
      const nextClaim = stored ? Number(stored) : 0;
      const remaining = Math.max(0, nextClaim - Date.now());

      setBonusRemaining(remaining);
      setBonusReady(remaining <= 0);
    };

    updateMinuteBonus();
    const timer = window.setInterval(updateMinuteBonus, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const claimMinuteBonus = () => {
    if (!bonusReady) return;

    playUiSound("click");
    addEmeralds(MINUTE_BONUS_AMOUNT);

    const nextClaim = Date.now() + MINUTE_BONUS_WAIT;
    window.localStorage.setItem(MINUTE_BONUS_KEY, String(nextClaim));

    setBonusReady(false);
    setBonusRemaining(MINUTE_BONUS_WAIT);
  };

  const formatBonusTime = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    const updateDailyCase = () => {
      const stored = window.localStorage.getItem(DAILY_CASE_KEY);
      const nextOpen = stored ? Number(stored) : 0;
      const remaining = Math.max(0, nextOpen - Date.now());

      setCaseRemaining(remaining);
      setCaseReady(remaining <= 0);
    };

    updateDailyCase();
    const timer = window.setInterval(updateDailyCase, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const openDailyCase = () => {
    if (!caseReady || caseOpening) return;

    playUiSound("click");
    setCaseOpening(true);
    setCaseResult(null);
    setReelOffset(0);

    const roll = Math.random() * 100;
    const winningDrop =
      roll < 10 ? DAILY_CASE_DROPS[1] : DAILY_CASE_DROPS[0];

    const winnerIndex = 24;
    const items = Array.from({ length: 30 }, (_, index) => {
      if (index === winnerIndex) return winningDrop;
      return Math.random() < 0.1
        ? DAILY_CASE_DROPS[1]
        : DAILY_CASE_DROPS[0];
    });

    setReelItems(items);

    window.setTimeout(() => {
      // 176px card width + 12px gap. The center marker is aligned to the
      // winning card by translating the reel to the left.
      const itemStride = 188;
      const target = winnerIndex * itemStride;
      setReelOffset(target);
    }, 50);

    window.setTimeout(() => {
      addEmeralds(winningDrop.emeralds);
      setCaseResult(winningDrop);
      setCaseOpening(false);

      const nextOpen = Date.now() + DAILY_CASE_WAIT;
      window.localStorage.setItem(DAILY_CASE_KEY, String(nextOpen));
      setCaseReady(false);
      setCaseRemaining(DAILY_CASE_WAIT);
    }, 4300);
  };

  const formatCaseTime = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  const playUiSound = (type: "click" | "hover") => {
    if (!soundEnabled || typeof window === "undefined") return;

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime + 0.005;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";

    if (type === "hover") {
      osc.frequency.setValueAtTime(1280, now);
      osc.frequency.exponentialRampToValueAtTime(1510, now + 0.025);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.010, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    } else {
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.exponentialRampToValueAtTime(1050, now + 0.032);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.022, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);

    window.setTimeout(() => void ctx.close(), 150);
  };

  const soundProps = {
    onMouseEnter: () => playUiSound("hover"),
    onClick: () => playUiSound("click"),
  };

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">
      {/* HEADER */}
      <header className="border-b border-[#6C2BD9]/30 bg-[#0B0B0F]">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-4">
          <Link
              {...soundProps}
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
              {...soundProps}
                href="/"
                className="font-bold text-white"
              >
                Home
              </Link>

              <Link
              {...soundProps}
                href="/joker-poker"
                className="transition hover:text-white"
              >
                Joker Poker
              </Link>

              <Link
              {...soundProps}
                href="/blackjack"
                className="transition hover:text-white"
              >
                Blackjack
              </Link>

              <Link
              {...soundProps}
                href="/mines"
                className="transition hover:text-white"
              >
                Mines
              </Link>

              <Link
              {...soundProps}
                href="/case"
                className="transition hover:text-white"
              >
                Case
              </Link>
            </nav>

            {/* DEPOSIT / WITHDRAW */}
            <nav className="ml-auto mr-6 flex items-center gap-3">
              <Link
              {...soundProps}
                href="/deposit"
                className="rounded-lg border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 text-xs font-black text-gray-300 transition hover:border-[#6C2BD9] hover:text-white"
              >
                DEPOSIT
              </Link>

              <Link
              {...soundProps}
                href="/withdraw"
                className="rounded-lg border border-[#F5C542]/30 bg-[#15131D] px-4 py-2 text-xs font-black text-[#F5C542] transition hover:border-[#F5C542]"
              >
                WITHDRAW
              </Link>
            </nav>
          </div>

          {/* BALANCE */}
          <div className="ml-auto rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 md:ml-0">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              BALANCE
            </div>

            <AnimatedBalance />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* HERO */}
        <div className="rounded-3xl border border-[#6C2BD9]/40 bg-[radial-gradient(circle_at_top,#29134f,#151020,#0B0B0F)] px-6 py-14 text-center shadow-[0_0_60px_rgba(108,43,217,0.12)]">
          {/* LARGE CS ACE LOGO */}
          <Image
            src="/logo.png"
            alt="CS ACE"
            width={260}
            height={260}
            className="mx-auto h-44 w-44 object-contain md:h-52 md:w-52"
            priority
          />

          <div className="mt-4 text-sm font-black uppercase tracking-[0.4em] text-[#6C2BD9]">
            CS ACE
          </div>

          <h1 className="mt-3 text-5xl font-black tracking-tight text-white md:text-7xl">
            PLAY WITH
            <span className="block text-[#F5C542]">
              EMERALDS
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-gray-500">
            Welcome to CS ACE. Try our casino games using
            virtual Emeralds in this demo.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              {...soundProps}
              href="/joker-poker"
              className="rounded-xl bg-[#6C2BD9] px-7 py-3 text-sm font-black text-white transition hover:bg-[#7d3be8]"
            >
              PLAY JOKER POKER
            </Link>

            <Link
              {...soundProps}
              href="/blackjack"
              className="rounded-xl border border-[#F5C542]/40 bg-[#15131D] px-7 py-3 text-sm font-black text-[#F5C542] transition hover:border-[#F5C542]"
            >
              PLAY BLACKJACK
            </Link>

            <Link
              {...soundProps}
              href="/case"
              className="rounded-xl border border-[#6C2BD9]/50 bg-[#15131D] px-7 py-3 text-sm font-black text-white transition hover:border-[#6C2BD9] hover:bg-[#1c1726]"
            >
              OPEN CASE
            </Link>
          </div>
        </div>

        {/* MINUTE BONUS */}
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-[#111116] p-6 shadow-[0_0_45px_rgba(108,43,217,0.08)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#6C2BD9]/20 blur-[65px]" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
                CS ACE REWARDS
              </div>
              <h2 className="mt-2 text-2xl font-black text-white">
                MINUTE BONUS
              </h2>
              <p className="mt-2 text-xs text-gray-500">
                Claim 500 Emeralds every minute.
              </p>
            </div>

            <div className="w-full md:w-72">
              {bonusReady ? (
                <button
                  type="button"
                  onMouseEnter={() => playUiSound("hover")}
                  onClick={claimMinuteBonus}
                  className="w-full rounded-xl border border-[#F5C542]/60 bg-[#F5C542] px-6 py-4 text-xs font-black text-[#0B0B0F] shadow-[0_0_28px_rgba(245,197,66,0.16)] transition hover:shadow-[0_0_34px_rgba(245,197,66,0.25)]"
                >
                  CLAIM 💎 500
                </button>
              ) : (
                <div className="rounded-xl border border-[#6C2BD9]/35 bg-[#0B0B0F]/80 px-6 py-4 text-center">
                  <div className="text-[9px] font-black uppercase tracking-[0.28em] text-gray-600">
                    NEXT BONUS
                  </div>
                  <div className="mt-2 font-mono text-xl font-black tracking-wider text-[#F5C542]">
                    {formatBonusTime(bonusRemaining)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DAILY CASE */}
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-[#F5C542]/25 bg-[#111116] p-6 shadow-[0_0_45px_rgba(108,43,217,0.08)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#6C2BD9]/20 blur-[65px]" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[#F5C542]/[0.06] blur-[60px]" />

          <div className="relative">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
              CS ACE REWARDS
            </div>

            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">
                  DAILY CASE
                </h2>
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Open one free case every 24 hours. One of these two demo drops is guaranteed.
                </p>
              </div>

              <div className="rounded-full border border-[#6C2BD9]/30 bg-[#6C2BD9]/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#A78BFA]">
                1 FREE OPEN / 24H
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {DAILY_CASE_DROPS.map((drop, index) => (
                <div
                  key={drop.name}
                  className={`relative overflow-hidden rounded-2xl border p-5 ${
                    index === 1
                      ? "border-[#F5C542]/35 bg-[radial-gradient(circle_at_top_right,rgba(245,197,66,0.10),transparent_45%),#0B0B0F]"
                      : "border-[#6C2BD9]/30 bg-[radial-gradient(circle_at_top_right,rgba(108,43,217,0.12),transparent_45%),#0B0B0F]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/5 bg-white/[0.03]">
                        <Image
                          src={
                            drop.emeralds === 50000
                              ? "/skins/butterfly-gamma-doppler.png"
                              : "/skins/m4a1-printstream.png"
                          }
                          alt={drop.name}
                          fill
                          sizes="96px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">
                          {drop.name}
                        </div>
                        <div className="mt-1 text-xs font-black text-[#F5C542]">
                          💎 {drop.emeralds.toLocaleString("en-US")}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-[10px] font-black ${
                        index === 1
                          ? "border border-[#F5C542]/35 bg-[#F5C542]/10 text-[#F5C542]"
                          : "border border-[#6C2BD9]/35 bg-[#6C2BD9]/10 text-[#A78BFA]"
                      }`}
                    >
                      {drop.chance}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {(caseOpening || reelItems.length > 0) && (
                <div className="relative mb-5 overflow-hidden rounded-2xl border border-[#6C2BD9]/35 bg-[#08080C] py-5">
                  <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-full w-px -translate-x-1/2 bg-[#F5C542] shadow-[0_0_16px_rgba(245,197,66,0.85)]" />
                  <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 border-x-[8px] border-t-[10px] border-x-transparent border-t-[#F5C542]" />
                  <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 -translate-x-1/2 border-x-[8px] border-b-[10px] border-x-transparent border-b-[#F5C542]" />

                  <div
                    className="flex gap-3 pl-[calc(50%-88px)]"
                    style={{
                      transform: `translateX(-${reelOffset}px)`,
                      transition:
                        reelOffset > 0
                          ? "transform 4s cubic-bezier(0.08, 0.72, 0.12, 1)"
                          : "none",
                    }}
                  >
                    {reelItems.map((drop, index) => (
                      <div
                        key={`${drop.name}-${index}`}
                        className={`relative h-40 w-44 shrink-0 overflow-hidden rounded-xl border bg-[#111116] p-3 ${
                          drop.emeralds === 50000
                            ? "border-[#F5C542]/45"
                            : "border-[#6C2BD9]/35"
                        }`}
                      >
                        <div className="relative h-20 w-full">
                          <Image
                            src={
                              drop.emeralds === 50000
                                ? "/skins/butterfly-gamma-doppler.png"
                                : "/skins/m4a1-printstream.png"
                            }
                            alt={drop.name}
                            fill
                            sizes="176px"
                            className="object-contain"
                          />
                        </div>

                        <div className="mt-2 truncate text-[10px] font-black text-white">
                          {drop.name}
                        </div>
                        <div className="mt-1 text-[10px] font-black text-[#F5C542]">
                          💎 {drop.emeralds.toLocaleString("en-US")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {caseResult && (
                <div
                  className={`mb-4 rounded-2xl border p-5 text-center ${
                    caseResult.emeralds === 50000
                      ? "border-[#F5C542]/60 bg-[#F5C542]/10 shadow-[0_0_35px_rgba(245,197,66,0.12)]"
                      : "border-[#6C2BD9]/45 bg-[#6C2BD9]/10"
                  }`}
                >
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
                    DAILY CASE DROP
                  </div>
                  <div className="relative mx-auto mt-3 h-28 w-52">
                    <Image
                      src={
                        caseResult.emeralds === 50000
                          ? "/skins/butterfly-gamma-doppler.png"
                          : "/skins/m4a1-printstream.png"
                      }
                      alt={caseResult.name}
                      fill
                      sizes="208px"
                      className="object-contain"
                    />
                  </div>
                  <div className="mt-2 text-lg font-black text-white">
                    {caseResult.name}
                  </div>
                  <div className="mt-1 text-xl font-black text-[#F5C542]">
                    +💎 {caseResult.emeralds.toLocaleString("en-US")}
                  </div>
                </div>
              )}

              {caseReady ? (
                <button
                  type="button"
                  disabled={caseOpening}
                  onMouseEnter={() => !caseOpening && playUiSound("hover")}
                  onClick={openDailyCase}
                  className="w-full rounded-xl border border-[#F5C542]/60 bg-[#F5C542] px-6 py-4 text-xs font-black text-[#0B0B0F] shadow-[0_0_28px_rgba(245,197,66,0.16)] transition hover:shadow-[0_0_34px_rgba(245,197,66,0.25)] disabled:cursor-wait disabled:opacity-80"
                >
                  {caseOpening ? "OPENING CASE..." : "OPEN DAILY CASE"}
                </button>
              ) : (
                <div className="rounded-xl border border-[#6C2BD9]/35 bg-[#0B0B0F]/80 px-6 py-4 text-center">
                  <div className="text-[9px] font-black uppercase tracking-[0.28em] text-gray-600">
                    NEXT DAILY CASE
                  </div>
                  <div className="mt-2 font-mono text-xl font-black tracking-wider text-[#F5C542]">
                    {formatCaseTime(caseRemaining)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-[#111116] p-6 md:p-8">
          <div className="relative">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div><div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">CS ACE</div><h2 className="mt-2 text-2xl font-black text-white">LEADERBOARD</h2><p className="mt-2 text-xs text-gray-500">Top 3 players by all-time peak Emerald balance.</p></div>
              {myUsername && <div className="rounded-full border border-[#6C2BD9]/30 bg-[#6C2BD9]/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#A78BFA]">PLAYING AS {myUsername}</div>}
            </div>
            {leaderboardLoading ? <div className="mt-6 rounded-2xl border border-[#6C2BD9]/20 bg-[#0B0B0F] px-5 py-10 text-center text-[10px] font-black uppercase tracking-[0.25em] text-gray-600">Loading leaderboard...</div> : leaderboard.length === 0 ? <div className="mt-6 rounded-2xl border border-[#6C2BD9]/20 bg-[#0B0B0F] px-5 py-10 text-center text-sm font-black text-white">No players yet</div> : <div className="mt-6 grid gap-3 md:grid-cols-3">
              {leaderboard.map((player,index)=><div key={player.userId} className={`relative overflow-hidden rounded-2xl border p-5 ${index===0?"border-[#F5C542]/45 bg-[#F5C542]/[0.055]":"border-[#6C2BD9]/25 bg-[#0B0B0F]"}`}>
                <div className="flex items-center justify-between"><div className={`text-2xl font-black ${index===0?"text-[#F5C542]":index===1?"text-gray-300":"text-amber-700"}`}>#{index+1}</div><div className="text-xl">{index===0?"👑":index===1?"🥈":"🥉"}</div></div>
                <div className="mt-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#6C2BD9]/30 bg-[#6C2BD9]/10 text-sm font-black text-white">{player.nickname.slice(0,1).toUpperCase()}</div><div className="min-w-0"><div className="flex items-center gap-2"><div className="truncate text-sm font-black text-white">{player.nickname}</div>{player.isYou&&<span className="rounded-full border border-[#6C2BD9]/35 bg-[#6C2BD9]/10 px-2 py-0.5 text-[7px] font-black text-[#A78BFA]">YOU</span>}</div><div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">Peak Emerald Balance</div></div></div>
                <div className="mt-4 text-xl font-black text-[#F5C542]">💎 {player.peakBalance.toLocaleString("en-US")}</div>
              </div>)}
            </div>}
            {myUsername && <div className="mt-4 text-center text-[10px] font-bold text-gray-600">Your peak: <span className="font-black text-[#F5C542]">💎 {peakBalance.toLocaleString("en-US")}</span>{leaderboard.some((p)=>p.isYou)?" • You are currently in the Top 3":" • Reach a higher peak to enter the Top 3"}</div>}
          </div>
        </div>

        {/* GAMES */}
        <div className="mt-8">
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6C2BD9]">
              CS ACE
            </div>

            <h2 className="mt-1 text-2xl font-black">
              GAMES
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* JOKER POKER */}
            <div className="rounded-2xl border border-[#6C2BD9]/30 bg-[#111116] p-6 transition hover:border-[#6C2BD9]/70">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_center,#351765,#24103f,#0B0B0F)] text-4xl">
                🃏
              </div>

              <h2 className="mt-4 text-lg font-black">
                JOKER POKER
              </h2>

              <p className="mt-2 min-h-[40px] text-xs leading-5 text-gray-500">
                Hold your cards, draw once and try to hit the
                biggest hands.
              </p>

              <Link
              {...soundProps}
                href="/joker-poker"
                className="mt-5 inline-block text-xs font-black text-[#F5C542] hover:text-white"
              >
                PLAY NOW →
              </Link>
            </div>

            {/* BLACKJACK */}
            <div className="rounded-2xl border border-[#6C2BD9]/30 bg-[#111116] p-6 transition hover:border-[#6C2BD9]/70">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_center,#351765,#24103f,#0B0B0F)] text-4xl">
                ♠️
              </div>

              <h2 className="mt-4 text-lg font-black">
                BLACKJACK
              </h2>

              <p className="mt-2 min-h-[40px] text-xs leading-5 text-gray-500">
                Play classic blackjack against the dealer using
                virtual Emeralds.
              </p>

              <Link
              {...soundProps}
                href="/blackjack"
                className="mt-5 inline-block text-xs font-black text-[#F5C542] hover:text-white"
              >
                PLAY NOW →
              </Link>
            </div>

            {/* MINES */}
            <div className="relative overflow-hidden rounded-2xl border border-[#6C2BD9]/30 bg-[#111116] p-6 transition hover:border-[#6C2BD9]/70">
              <div className="pointer-events-none absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-[#6C2BD9]/15 blur-[50px]" />

              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_center,#351765,#24103f,#0B0B0F)] text-4xl">
                💣
              </div>

              <div className="relative">
                <div className="mt-4 flex items-center gap-2">
                  <h2 className="text-lg font-black">MINES</h2>
                  <span className="rounded-full border border-[#6C2BD9]/30 bg-[#6C2BD9]/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#A78BFA]">
                    NEW
                  </span>
                </div>

                <p className="mt-2 min-h-[40px] text-xs leading-5 text-gray-500">
                  Find the gems, avoid the mines and cash out before it is too late.
                </p>

                <Link
                  {...soundProps}
                  href="/mines"
                  className="mt-5 inline-block text-xs font-black text-[#F5C542] hover:text-white"
                >
                  PLAY NOW →
                </Link>
              </div>
            </div>

            {/* CS ACE CASE */}
            <div className="relative overflow-hidden rounded-2xl border border-[#F5C542]/30 bg-[#111116] p-6 transition hover:border-[#F5C542]/70">
              <div className="pointer-events-none absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-[#6C2BD9]/15 blur-[50px]" />

              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[radial-gradient(circle_at_center,#4a2087,#24103f,#0B0B0F)] text-4xl shadow-[0_0_25px_rgba(245,197,66,0.08)]">
                📦
              </div>

              <div className="relative">
                <div className="mt-4 flex items-center gap-2">
                  <h2 className="text-lg font-black">
                    CS ACE CASE
                  </h2>

                  <span className="rounded-full border border-[#F5C542]/30 bg-[#F5C542]/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#F5C542]">
                    NEW
                  </span>
                </div>

                <p className="mt-2 min-h-[40px] text-xs leading-5 text-gray-500">
                  Open the CS ACE Case and reveal a demo skin.
                  Rare drops are waiting.
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <Link
              {...soundProps}
                    href="/case"
                    className="text-xs font-black text-[#F5C542] hover:text-white"
                  >
                    OPEN CASE →
                  </Link>

                  <div className="text-xs font-black text-gray-500">
                    💎 1,000
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DEPOSIT / WITHDRAW */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
              {...soundProps}
            href="/deposit"
            className="group rounded-2xl border border-[#6C2BD9]/30 bg-[#111116] p-6 transition hover:border-[#6C2BD9]/70"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6C2BD9]">
              EMERALDS
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  DEPOSIT
                </h2>

                <p className="mt-2 text-xs text-gray-500">
                  Deposit demo skins for virtual Emeralds.
                </p>
              </div>

              <div className="text-3xl transition group-hover:scale-110">
                💎
              </div>
            </div>
          </Link>

          <Link
              {...soundProps}
            href="/withdraw"
            className="group rounded-2xl border border-[#F5C542]/20 bg-[#111116] p-6 transition hover:border-[#F5C542]/60"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5C542]">
              SKINS
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  WITHDRAW
                </h2>

                <p className="mt-2 text-xs text-gray-500">
                  Exchange virtual Emeralds for demo skins.
                </p>
              </div>

              <div className="text-3xl transition group-hover:scale-110">
                📦
              </div>
            </div>
          </Link>
        </div>

        {/* DEMO NOTICE */}
        <div className="mt-8 rounded-2xl border border-[#6C2BD9]/20 bg-[#111116] px-6 py-5 text-center">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#F5C542]">
            💎 Emeralds
          </div>

          <p className="mt-2 text-xs text-gray-600">
            This is a demo using virtual currency. No real-money
            deposits, withdrawals or Steam item transfers are
            connected.
          </p>
        </div>
      </section>


    </main>
  );
}