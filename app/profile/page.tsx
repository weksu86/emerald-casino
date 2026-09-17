"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { useEmeralds } from "../context/EmeraldContext";
import AnimatedBalance from "../components/AnimatedBalance";
import { useSharedSoundEnabled } from "../lib/useSoundSettings";

type Profile = {
  user_id: string;
  username: string;
  peak_balance: number;
};

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function playUiSound(
  type: "click" | "hover"
) {
  if (typeof window === "undefined") return;

  const AudioContextClass =
    window.AudioContext ||
    (window as WebkitWindow).webkitAudioContext;

  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle";

  oscillator.frequency.setValueAtTime(
    type === "click" ? 1450 : 1280,
    ctx.currentTime
  );

  oscillator.frequency.exponentialRampToValueAtTime(
    type === "click" ? 1050 : 1510,
    ctx.currentTime + 0.04
  );

  gain.gain.setValueAtTime(
    0.0001,
    ctx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    type === "click" ? 0.022 : 0.01,
    ctx.currentTime + 0.006
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + 0.05
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(
    ctx.currentTime + 0.06
  );

  window.setTimeout(() => {
    void ctx.close();
  }, 150);
}

export default function ProfilePage() {
  const supabase = createClient();

  const {
    balance,
    peakBalance,
    claimedSkinIds,
    depositedSkinIds,
    stats,
  } = useEmeralds();

  const [soundEnabled] =
    useSharedSoundEnabled();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  function sound(
    type: "click" | "hover"
  ) {
    if (!soundEnabled) return;
    playUiSound(type);
  }

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setError(
          "Player session not found."
        );
        setLoading(false);
        return;
      }

      const {
        data,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "user_id, username, peak_balance"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError(
          "Player profile not found."
        );
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, []);

  const displayPeak = Math.max(
    peakBalance,
    profile?.peak_balance ?? 0
  );

  const initials =
    profile?.username
      ?.slice(0, 2)
      .toUpperCase() ?? "CS";

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">

      {/* HEADER */}
      <header className="border-b border-[#6C2BD9]/30 bg-[#0B0B0F]">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-4">

          <Link
            href="/"
            onMouseEnter={() =>
              sound("hover")
            }
            onClick={() =>
              sound("click")
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
                onMouseEnter={() =>
                  sound("hover")
                }
                onClick={() =>
                  sound("click")
                }
                className="transition hover:text-white"
              >
                Home
              </Link>

              <Link
                href="/joker-poker"
                onMouseEnter={() =>
                  sound("hover")
                }
                onClick={() =>
                  sound("click")
                }
                className="transition hover:text-white"
              >
                Joker Poker
              </Link>

              <Link
                href="/blackjack"
                onMouseEnter={() =>
                  sound("hover")
                }
                onClick={() =>
                  sound("click")
                }
                className="transition hover:text-white"
              >
                Blackjack
              </Link>

              <Link
                href="/mines"
                onMouseEnter={() =>
                  sound("hover")
                }
                onClick={() =>
                  sound("click")
                }
                className="transition hover:text-white"
              >
                Mines
              </Link>

              <Link
                href="/case"
                onMouseEnter={() =>
                  sound("hover")
                }
                onClick={() =>
                  sound("click")
                }
                className="transition hover:text-white"
              >
                Case
              </Link>

              <Link
                href="/leaderboard"
                onMouseEnter={() =>
                  sound("hover")
                }
                onClick={() =>
                  sound("click")
                }
                className="transition hover:text-white"
              >
                Leaderboard
              </Link>

            </nav>

            <nav className="ml-auto mr-6 flex items-center gap-3">

              <Link
                href="/deposit"
                onMouseEnter={() =>
                  sound("hover")
                }
                onClick={() =>
                  sound("click")
                }
                className="rounded-lg border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2 text-xs font-black text-gray-300 transition hover:border-[#6C2BD9] hover:text-white"
              >
                DEPOSIT
              </Link>

              <Link
                href="/withdraw"
                onMouseEnter={() =>
                  sound("hover")
                }
                onClick={() =>
                  sound("click")
                }
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
      <section className="mx-auto max-w-5xl px-5 py-10">

        <div className="text-center">

          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-[#6C2BD9]">
            CS ACE
          </div>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            PLAYER PROFILE
          </h1>

          <p className="mt-2 text-xs text-gray-600">
            Your CS ACE player statistics.
          </p>

        </div>

        {loading && (
          <div className="mt-10 rounded-3xl border border-[#6C2BD9]/30 bg-[#111116] p-12 text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#6C2BD9]/30 border-t-[#F5C542]" />

            <div className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-gray-600">
              LOADING PROFILE
            </div>

          </div>
        )}

        {!loading && error && (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-500/25 bg-red-500/5 p-6 text-center">

            <div className="text-xs font-black text-red-400">
              {error}
            </div>

            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-[#6C2BD9] px-6 py-3 text-xs font-black text-white"
            >
              BACK HOME
            </Link>

          </div>
        )}

        {!loading &&
          !error &&
          profile && (
            <>
              {/* PROFILE HERO */}
              <div className="relative mt-8 overflow-hidden rounded-[28px] border border-[#6C2BD9]/45 bg-[#111116] p-6 shadow-[0_0_60px_rgba(108,43,217,0.12)] md:p-8">

                <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6C2BD9]/20 blur-[90px]" />

                <div className="relative flex flex-col items-center text-center">

                  {/* AVATAR */}
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#F5C542]/40 bg-[radial-gradient(circle_at_center,#351765,#211038,#0B0B0F)] text-3xl font-black text-[#F5C542] shadow-[0_0_35px_rgba(108,43,217,0.25)]">
                    {initials}
                  </div>

                  <div className="mt-5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">
                    PLAYER
                  </div>

                  <h2 className="mt-1 break-all text-3xl font-black text-white md:text-4xl">
                    {profile.username}
                  </h2>

                  <div className="mt-3 rounded-full border border-[#20C997]/25 bg-[#20C997]/5 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-[#20C997]">
                    ● ACTIVE PLAYER
                  </div>

                </div>

              </div>

              {/* MAIN STATS */}
              <div className="mt-4 grid gap-4 md:grid-cols-2">

                {/* CURRENT */}
                <div className="relative overflow-hidden rounded-2xl border border-[#6C2BD9]/30 bg-[#111116] p-6">

                  <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-[#6C2BD9]/10 blur-[45px]" />

                  <div className="relative">

                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">
                      CURRENT BALANCE
                    </div>

                    <div className="mt-3 text-3xl font-black text-[#F5C542]">
                      💎{" "}
                      {balance.toLocaleString(
                        "en-US"
                      )}
                    </div>

                    <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-gray-700">
                      AVAILABLE EMERALDS
                    </div>

                  </div>

                </div>

                {/* PEAK */}
                <div className="relative overflow-hidden rounded-2xl border border-[#F5C542]/25 bg-[#111116] p-6">

                  <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-[#F5C542]/10 blur-[45px]" />

                  <div className="relative">

                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">
                      PEAK BALANCE
                    </div>

                    <div className="mt-3 text-3xl font-black text-[#F5C542]">
                      👑{" "}
                      {displayPeak.toLocaleString(
                        "en-US"
                      )}
                    </div>

                    <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-gray-700">
                      ALL-TIME RECORD
                    </div>

                  </div>

                </div>

              </div>

              {/* SKIN STATS */}
              <div className="mt-4 grid gap-4 md:grid-cols-2">

                <div className="rounded-2xl border border-white/5 bg-[#111116] p-6">

                  <div className="flex items-center justify-between">

                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                        CLAIMED SKINS
                      </div>

                      <div className="mt-2 text-3xl font-black text-white">
                        {
                          claimedSkinIds.length
                        }
                      </div>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#20C997]/20 bg-[#20C997]/5 text-2xl">
                      📦
                    </div>

                  </div>

                </div>

                <div className="rounded-2xl border border-white/5 bg-[#111116] p-6">

                  <div className="flex items-center justify-between">

                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                        DEPOSITED SKINS
                      </div>

                      <div className="mt-2 text-3xl font-black text-white">
                        {
                          depositedSkinIds.length
                        }
                      </div>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#6C2BD9]/25 bg-[#6C2BD9]/5 text-2xl">
                      💰
                    </div>

                  </div>

                </div>

              </div>

              {/* GAME STATS */}
              <div className="mt-4 rounded-2xl border border-[#6C2BD9]/25 bg-[#111116] p-6">

                <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[#6C2BD9]">
                  GAME STATISTICS
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                  <div className="rounded-xl border border-white/5 bg-[#09090D] p-4">
                    <div className="text-[8px] font-black uppercase tracking-wider text-gray-700">
                      GAMES PLAYED
                    </div>
                    <div className="mt-2 text-xl font-black text-white">
                      🎮 {stats.gamesPlayed.toLocaleString("en-US")}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#09090D] p-4">
                    <div className="text-[8px] font-black uppercase tracking-wider text-gray-700">
                      TOTAL WON
                    </div>
                    <div className="mt-2 text-xl font-black text-[#F5C542]">
                      💎 {stats.totalWon.toLocaleString("en-US")}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#09090D] p-4">
                    <div className="text-[8px] font-black uppercase tracking-wider text-gray-700">
                      MINES BIGGEST WIN
                    </div>
                    <div className="mt-2 text-xl font-black text-[#20C997]">
                      💣 {stats.minesBiggestWin.toLocaleString("en-US")}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#09090D] p-4">
                    <div className="text-[8px] font-black uppercase tracking-wider text-gray-700">
                      JOKER POKER BIGGEST WIN
                    </div>
                    <div className="mt-2 text-xl font-black text-[#20C997]">
                      🃏 {stats.jokerPokerBiggestWin.toLocaleString("en-US")}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#09090D] p-4">
                    <div className="text-[8px] font-black uppercase tracking-wider text-gray-700">
                      BLACKJACK BIGGEST WIN
                    </div>
                    <div className="mt-2 text-xl font-black text-[#20C997]">
                      ♠️ {stats.blackjackBiggestWin.toLocaleString("en-US")}
                    </div>
                  </div>

                </div>

              </div>

              {/* PLAYER RECORD */}
              <div className="mt-4 rounded-2xl border border-white/5 bg-[#111116] p-6">

                <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[#6C2BD9]">
                  PLAYER RECORD
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-xl border border-white/5 bg-[#09090D] p-4">

                    <div className="text-[8px] font-black uppercase tracking-wider text-gray-700">
                      USERNAME
                    </div>

                    <div className="mt-2 truncate text-sm font-black text-white">
                      {profile.username}
                    </div>

                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#09090D] p-4">

                    <div className="text-[8px] font-black uppercase tracking-wider text-gray-700">
                      PEAK
                    </div>

                    <div className="mt-2 text-sm font-black text-[#F5C542]">
                      💎{" "}
                      {displayPeak.toLocaleString(
                        "en-US"
                      )}
                    </div>

                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#09090D] p-4">

                    <div className="text-[8px] font-black uppercase tracking-wider text-gray-700">
                      STATUS
                    </div>

                    <div className="mt-2 text-sm font-black text-[#20C997]">
                      ACTIVE
                    </div>

                  </div>

                </div>

              </div>

              {/* BUTTONS */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">

                <Link
                  href="/"
                  onMouseEnter={() =>
                    sound("hover")
                  }
                  onClick={() =>
                    sound("click")
                  }
                  className="rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-6 py-3 text-xs font-black text-white transition hover:border-[#6C2BD9]"
                >
                  ← HOME
                </Link>

                <Link
                  href="/mines"
                  onMouseEnter={() =>
                    sound("hover")
                  }
                  onClick={() =>
                    sound("click")
                  }
                  className="rounded-xl bg-[#F5C542] px-6 py-3 text-xs font-black text-[#09090D] transition hover:brightness-110"
                >
                  PLAY MINES →
                </Link>

              </div>
            </>
          )}

      </section>

    </main>
  );
}