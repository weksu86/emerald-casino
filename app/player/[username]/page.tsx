"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import AnimatedBalance from "../../components/AnimatedBalance";

type PublicPlayer = {
  user_id: string;
  username: string;
  peak_balance: number;
  games_played: number;
  total_won: number;
  mines_biggest_win: number;
  joker_poker_biggest_win: number;
  blackjack_biggest_win: number;
};

export default function PublicPlayerPage() {
  const params = useParams();

  const username =
    typeof params.username === "string"
      ? decodeURIComponent(params.username)
      : "";

  const [player, setPlayer] =
    useState<PublicPlayer | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [isYou, setIsYou] =
    useState(false);

  const [rank, setRank] =
    useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayer() {
      if (!username) {
        setError("Player not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const {
          data,
          error: profileError,
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
          .eq("username", username)
          .maybeSingle();

        if (cancelled) return;

        if (profileError) {
          setError(profileError.message);
          setLoading(false);
          return;
        }

        if (!data) {
          setError("Player not found.");
          setLoading(false);
          return;
        }

        const cleanPlayer: PublicPlayer = {
          user_id: data.user_id,

          username:
            data.username,

          peak_balance:
            Math.max(
              0,
              Number(data.peak_balance) || 0
            ),

          games_played:
            Math.max(
              0,
              Number(data.games_played) || 0
            ),

          total_won:
            Math.max(
              0,
              Number(data.total_won) || 0
            ),

          mines_biggest_win:
            Math.max(
              0,
              Number(
                data.mines_biggest_win
              ) || 0
            ),

          joker_poker_biggest_win:
            Math.max(
              0,
              Number(
                data.joker_poker_biggest_win
              ) || 0
            ),

          blackjack_biggest_win:
            Math.max(
              0,
              Number(
                data.blackjack_biggest_win
              ) || 0
            ),
        };

        setPlayer(cleanPlayer);

        const {
          count: playersAbove,
          error: rankError,
        } = await supabase
          .from("profiles")
          .select("user_id", {
            count: "exact",
            head: true,
          })
          .gt(
            "peak_balance",
            cleanPlayer.peak_balance
          );

        if (
          !cancelled &&
          !rankError
        ) {
          setRank(
            (playersAbove ?? 0) + 1
          );
        }

        if (user) {
          setIsYou(
            user.id === cleanPlayer.user_id
          );
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not load player."
          );
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadPlayer();

    return () => {
      cancelled = true;
    };
  }, [username]);

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

          <nav className="ml-10 hidden items-center gap-6 text-sm text-gray-500 md:flex">

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

          <div className="ml-auto rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-4 py-2">

            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              BALANCE
            </div>

            <AnimatedBalance />

          </div>

        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-4 py-10">

        {loading && (
          <div className="rounded-3xl border border-[#6C2BD9]/30 bg-[#111116] px-6 py-20 text-center">

            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6C2BD9]">
              LOADING PLAYER...
            </div>

          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-500/25 bg-[#111116] px-6 py-16 text-center">

            <div className="text-3xl">
              👤
            </div>

            <h1 className="mt-4 text-2xl font-black text-white">
              PLAYER NOT FOUND
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              {error}
            </p>

            <Link
              href="/leaderboard"
              className="mt-6 inline-flex rounded-xl bg-[#6C2BD9] px-6 py-3 text-xs font-black text-white transition hover:bg-[#7d3be8]"
            >
              ← LEADERBOARD
            </Link>

          </div>
        )}

        {!loading &&
          !error &&
          player && (
            <>
              {/* PLAYER HERO */}
              <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/35 bg-[radial-gradient(circle_at_top,#29134f,#151020,#0B0B0F)] p-8 shadow-[0_0_60px_rgba(108,43,217,0.12)] md:p-10">

                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6C2BD9]/20 blur-[90px]" />

                <div className="relative flex flex-col gap-6 md:flex-row md:items-center">

                  {/* AVATAR */}
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#6C2BD9]/45 bg-[#6C2BD9]/15 text-4xl font-black text-white shadow-[0_0_40px_rgba(108,43,217,0.15)]">

                    {player.username
                      .slice(0, 1)
                      .toUpperCase()}

                  </div>

                  <div className="min-w-0">

                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#6C2BD9]">
                      CS ACE PLAYER
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3">

                      <h1 className="break-all text-4xl font-black text-white md:text-5xl">
                        {player.username}
                      </h1>

                      {isYou && (
                        <span className="rounded-full border border-[#F5C542]/35 bg-[#F5C542]/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-[#F5C542]">
                          YOU
                        </span>
                      )}

                    </div>

                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-600">
                      Public Player Profile
                    </p>

                  </div>

                  {/* PEAK */}
                  <div className="md:ml-auto">

                    <div className="rounded-2xl border border-[#F5C542]/30 bg-[#F5C542]/[0.06] px-6 py-5">

                      {rank !== null && (
                        <div className="mb-3 inline-flex rounded-full border border-[#F5C542]/30 bg-[#F5C542]/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#F5C542]">
                          👑 RANK #{rank}
                        </div>
                      )}

                      <div className="text-[8px] font-black uppercase tracking-[0.25em] text-gray-600">
                        ALL-TIME PEAK
                      </div>

                      <div className="mt-2 text-2xl font-black text-[#F5C542] md:text-3xl">
                        💎{" "}
                        {player.peak_balance.toLocaleString(
                          "en-US"
                        )}
                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* MAIN STATS */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">

                <StatCard
                  label="GAMES PLAYED"
                  value={
                    player.games_played
                  }
                  icon="🎮"
                />

                <StatCard
                  label="TOTAL WON"
                  value={
                    player.total_won
                  }
                  icon="💎"
                  gold
                />

              </div>

              {/* GAME RECORDS */}
              <div className="mt-6 rounded-3xl border border-[#6C2BD9]/25 bg-[#111116] p-6 md:p-8">

                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
                  GAME RECORDS
                </div>

                <h2 className="mt-2 text-2xl font-black text-white">
                  BIGGEST WINS
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-3">

                  <GameRecord
                    game="MINES"
                    icon="💣"
                    value={
                      player.mines_biggest_win
                    }
                  />

                  <GameRecord
                    game="JOKER POKER"
                    icon="🃏"
                    value={
                      player.joker_poker_biggest_win
                    }
                  />

                  <GameRecord
                    game="BLACKJACK"
                    icon="♠️"
                    value={
                      player.blackjack_biggest_win
                    }
                  />

                </div>

              </div>

              {/* ACTIONS */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">

                <Link
                  href="/leaderboard"
                  className="rounded-xl border border-[#6C2BD9]/40 bg-[#15131D] px-6 py-3 text-xs font-black text-white transition hover:border-[#6C2BD9]"
                >
                  ← LEADERBOARD
                </Link>

                {isYou && (
                  <Link
                    href="/profile"
                    className="rounded-xl border border-[#F5C542]/35 bg-[#F5C542]/10 px-6 py-3 text-xs font-black text-[#F5C542] transition hover:border-[#F5C542]"
                  >
                    MY PROFILE →
                  </Link>
                )}

              </div>
            </>
          )}

      </section>

    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  gold = false,
}: {
  label: string;
  value: number;
  icon: string;
  gold?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#6C2BD9]/25 bg-[#111116] p-6">

      <div className="flex items-center justify-between">

        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">
            {label}
          </div>

          <div
            className={`mt-2 text-3xl font-black ${
              gold
                ? "text-[#F5C542]"
                : "text-white"
            }`}
          >
            {value.toLocaleString(
              "en-US"
            )}
          </div>
        </div>

        <div className="text-4xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

function GameRecord({
  game,
  icon,
  value,
}: {
  game: string;
  icon: string;
  value: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#6C2BD9]/25 bg-[#09090D] p-5">

      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#6C2BD9]/10 blur-[35px]" />

      <div className="relative">

        <div className="text-3xl">
          {icon}
        </div>

        <div className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
          {game}
        </div>

        <div className="mt-2 text-xl font-black text-[#F5C542]">
          💎{" "}
          {value.toLocaleString(
            "en-US"
          )}
        </div>

        <div className="mt-1 text-[8px] font-black uppercase tracking-wider text-gray-700">
          BIGGEST WIN
        </div>

      </div>

    </div>
  );
}