"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import AnimatedBalance from "../components/AnimatedBalance";

type LeaderboardPlayer = {
  user_id: string;
  username: string;
  peak_balance: number;
  games_played: number;
  total_won: number;
  mines_biggest_win: number;
  joker_poker_biggest_win: number;
  blackjack_biggest_win: number;
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<
    LeaderboardPlayer[]
  >([]);

  const [myUserId, setMyUserId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (
          !cancelled &&
          user
        ) {
          setMyUserId(user.id);
        }

        const {
          data,
          error: leaderboardError,
        } = await supabase
          .from("profiles")
          .select(
            `
              user_id,
              username,
              peak_balance,
              games_played,
              total_won,
              mines_biggest_win,
              joker_poker_biggest_win,
              blackjack_biggest_win
            `
          )
          .order(
            "peak_balance",
            {
              ascending: false,
            }
          );

        if (cancelled) return;

        if (leaderboardError) {
          setError(
            leaderboardError.message
          );
          setLoading(false);
          return;
        }

        const cleanPlayers =
          (data ?? []).map(
            (player) => ({
              user_id:
                player.user_id,

              username:
                player.username,

              peak_balance:
                Number(
                  player.peak_balance
                ) || 0,

              games_played:
                Number(
                  player.games_played
                ) || 0,

              total_won:
                Number(
                  player.total_won
                ) || 0,

              mines_biggest_win:
                Number(
                  player.mines_biggest_win
                ) || 0,

              joker_poker_biggest_win:
                Number(
                  player.joker_poker_biggest_win
                ) || 0,

              blackjack_biggest_win:
                Number(
                  player.blackjack_biggest_win
                ) || 0,
            })
          );

        setPlayers(cleanPlayers);
      } catch {
        if (!cancelled) {
          setError(
            "Could not load leaderboard."
          );
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  function getRankIcon(
    index: number
  ) {
    if (index === 0) {
      return "👑";
    }

    if (index === 1) {
      return "🥈";
    }

    if (index === 2) {
      return "🥉";
    }

    return "";
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F2F2F2]">

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
                className="transition hover:text-white"
              >
                Blackjack
              </Link>

              <Link
                href="/mines"
                className="transition hover:text-white"
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
                className="font-bold text-white"
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

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-10">

        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/35 bg-[radial-gradient(circle_at_top,#29134f,#151020,#0B0B0F)] p-8 shadow-[0_0_60px_rgba(108,43,217,0.12)]">

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6C2BD9]/20 blur-[80px]" />

          <div className="relative">

            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#6C2BD9]">
              CS ACE
            </div>

            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              LEADERBOARD
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
              All players ranked by their
              all-time Peak Emerald Balance.
            </p>

            <div className="mt-6 inline-flex rounded-full border border-[#F5C542]/25 bg-[#F5C542]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#F5C542]">
              👑 {players.length} PLAYERS
            </div>

          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-6 rounded-2xl border border-[#6C2BD9]/25 bg-[#111116] px-6 py-16 text-center">

            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6C2BD9]">
              LOADING LEADERBOARD...
            </div>

          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/5 px-6 py-6 text-sm font-bold text-red-400">
            {error}
          </div>
        )}

        {/* PLAYERS */}
        {!loading &&
          !error &&
          players.length > 0 && (
            <div className="mt-6 space-y-3">

              {players.map(
                (
                  player,
                  index
                ) => {
                  const isYou =
                    player.user_id ===
                    myUserId;

                  const rankIcon =
                    getRankIcon(index);

                  return (
                    <div
                      key={
                        player.user_id
                      }
                      className={`relative overflow-hidden rounded-2xl border p-5 transition ${
                        index === 0
                          ? "border-[#F5C542]/45 bg-[#F5C542]/[0.05] shadow-[0_0_35px_rgba(245,197,66,0.06)]"
                          : isYou
                            ? "border-[#6C2BD9]/55 bg-[#6C2BD9]/[0.07]"
                            : "border-[#6C2BD9]/20 bg-[#111116]"
                      }`}
                    >

                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

                        {/* RANK + PLAYER */}
                        <div className="flex min-w-[260px] items-center gap-4">

                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-xl font-black ${
                              index === 0
                                ? "border-[#F5C542]/40 bg-[#F5C542]/10 text-[#F5C542]"
                                : "border-[#6C2BD9]/30 bg-[#6C2BD9]/10 text-white"
                            }`}
                          >
                            #{index + 1}
                          </div>

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#6C2BD9]/30 bg-[#6C2BD9]/10 text-lg font-black text-white">
                            {player.username
                              .slice(
                                0,
                                1
                              )
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">

                            <div className="flex items-center gap-2">

                              <Link
                                href={`/player/${encodeURIComponent(
                                  player.username
                                )}`}
                                className="truncate text-base font-black text-white transition hover:text-[#F5C542]"
                              >
                                {player.username}
                              </Link>

                              {rankIcon && (
                                <span>
                                  {
                                    rankIcon
                                  }
                                </span>
                              )}

                              {isYou && (
                                <span className="rounded-full border border-[#6C2BD9]/40 bg-[#6C2BD9]/10 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-[#A78BFA]">
                                  YOU
                                </span>
                              )}

                            </div>

                            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                              PLAYER
                            </div>

                          </div>

                        </div>

                        {/* PEAK */}
                        <div className="min-w-[170px]">

                          <div className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                            PEAK BALANCE
                          </div>

                          <div className="mt-1 text-xl font-black text-[#F5C542]">
                            💎{" "}
                            {player.peak_balance.toLocaleString(
                              "en-US"
                            )}
                          </div>

                        </div>

                        {/* STATS */}
                        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

                          <Stat
                            label="Games"
                            value={
                              player.games_played
                            }
                          />

                          <Stat
                            label="Total Won"
                            value={
                              player.total_won
                            }
                            emerald
                          />

                          <Stat
                            label="Mines"
                            value={
                              player.mines_biggest_win
                            }
                            icon="💣"
                          />

                          <Stat
                            label="Joker Poker"
                            value={
                              player.joker_poker_biggest_win
                            }
                            icon="🃏"
                          />

                          <Stat
                            label="Blackjack"
                            value={
                              player.blackjack_biggest_win
                            }
                            icon="♠️"
                          />

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        {!loading &&
          !error &&
          players.length === 0 && (
            <div className="mt-6 rounded-2xl border border-[#6C2BD9]/25 bg-[#111116] px-6 py-16 text-center">

              <div className="text-xl font-black text-white">
                No players yet
              </div>

            </div>
          )}

        <div className="mt-8 text-center">

          <Link
            href="/"
            className="inline-flex rounded-xl border border-[#6C2BD9]/35 bg-[#15131D] px-6 py-3 text-xs font-black text-white transition hover:border-[#6C2BD9]"
          >
            ← BACK HOME
          </Link>

        </div>

      </section>

    </main>
  );
}

function Stat({
  label,
  value,
  icon,
  emerald = false,
}: {
  label: string;
  value: number;
  icon?: string;
  emerald?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#09090D] px-3 py-3">

      <div className="text-[7px] font-black uppercase tracking-wider text-gray-700">
        {label}
      </div>

      <div
        className={`mt-1 truncate text-sm font-black ${
          emerald
            ? "text-[#F5C542]"
            : "text-white"
        }`}
      >
        {icon && `${icon} `}
        {emerald && "💎 "}
        {value.toLocaleString(
          "en-US"
        )}
      </div>

    </div>
  );
}