"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "../../lib/supabase/client";

type GameType =
  | "mines"
  | "joker-poker"
  | "blackjack";

type GameStats = {
  gamesPlayed: number;
  totalWon: number;
  minesBiggestWin: number;
  jokerPokerBiggestWin: number;
  blackjackBiggestWin: number;
};

type EmeraldContextType = {
  balance: number;
  peakBalance: number;
  claimedSkinIds: number[];
  depositedSkinIds: number[];
  stats: GameStats;

  addEmeralds: (amount: number) => void;
  removeEmeralds: (amount: number) => boolean;

  claimSkin: (
    skinId: number,
    amount: number
  ) => boolean;

  depositSkin: (
    skinId: number,
    amount: number
  ) => boolean;

  recordGameResult: (
    game: GameType,
    winAmount: number
  ) => void;
};

const BALANCE_KEY = "cs-ace-balance";
const PEAK_KEY = "cs-ace-peak-balance";
const CLAIMED_KEY = "cs-ace-claimed-skins";
const DEPOSITED_KEY = "cs-ace-deposited-skins";
const STATS_KEY = "cs-ace-game-stats";

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  totalWon: 0,
  minesBiggestWin: 0,
  jokerPokerBiggestWin: 0,
  blackjackBiggestWin: 0,
};

const EmeraldContext =
  createContext<EmeraldContextType | undefined>(
    undefined
  );

export function EmeraldProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [balance, setBalance] = useState(0);
  const [peakBalance, setPeakBalance] = useState(0);

  const [claimedSkinIds, setClaimedSkinIds] =
    useState<number[]>([]);

  const [depositedSkinIds, setDepositedSkinIds] =
    useState<number[]>([]);

  const [stats, setStats] =
    useState<GameStats>(DEFAULT_STATS);

  const [loaded, setLoaded] = useState(false);

  // Load saved local player data once.
  useEffect(() => {
    try {
      const savedBalance = Number(
        localStorage.getItem(BALANCE_KEY) ?? "0"
      );

      const savedPeak = Number(
        localStorage.getItem(PEAK_KEY) ?? "0"
      );

      const savedClaimed = JSON.parse(
        localStorage.getItem(CLAIMED_KEY) ?? "[]"
      );

      const savedDeposited = JSON.parse(
        localStorage.getItem(DEPOSITED_KEY) ?? "[]"
      );

      const savedStats = JSON.parse(
        localStorage.getItem(STATS_KEY) ?? "{}"
      );

      setBalance(
        Number.isFinite(savedBalance)
          ? Math.max(0, savedBalance)
          : 0
      );

      setPeakBalance(
        Number.isFinite(savedPeak)
          ? Math.max(savedPeak, savedBalance, 0)
          : Math.max(savedBalance, 0)
      );

      setClaimedSkinIds(
        Array.isArray(savedClaimed)
          ? savedClaimed
          : []
      );

      setDepositedSkinIds(
        Array.isArray(savedDeposited)
          ? savedDeposited
          : []
      );

      setStats({
        gamesPlayed:
          Number.isFinite(savedStats?.gamesPlayed)
            ? Math.max(0, savedStats.gamesPlayed)
            : 0,

        totalWon:
          Number.isFinite(savedStats?.totalWon)
            ? Math.max(0, savedStats.totalWon)
            : 0,

        minesBiggestWin:
          Number.isFinite(savedStats?.minesBiggestWin)
            ? Math.max(0, savedStats.minesBiggestWin)
            : 0,

        jokerPokerBiggestWin:
          Number.isFinite(
            savedStats?.jokerPokerBiggestWin
          )
            ? Math.max(
                0,
                savedStats.jokerPokerBiggestWin
              )
            : 0,

        blackjackBiggestWin:
          Number.isFinite(
            savedStats?.blackjackBiggestWin
          )
            ? Math.max(
                0,
                savedStats.blackjackBiggestWin
              )
            : 0,
      });
    } catch {
      setBalance(0);
      setPeakBalance(0);
      setClaimedSkinIds([]);
      setDepositedSkinIds([]);
      setStats(DEFAULT_STATS);
    }

    setLoaded(true);
  }, []);

  // Load persistent game statistics from Supabase.
  useEffect(() => {
    if (!loaded) return;

    let cancelled = false;

    async function loadSupabaseStats() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (
          cancelled ||
          userError ||
          !user
        ) {
          return;
        }

        const {
          data,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "games_played, total_won, mines_biggest_win, joker_poker_biggest_win, blackjack_biggest_win"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (
          cancelled ||
          profileError ||
          !data
        ) {
          return;
        }

        const serverStats: GameStats = {
          gamesPlayed: Math.max(
            0,
            Number(data.games_played) || 0
          ),

          totalWon: Math.max(
            0,
            Number(data.total_won) || 0
          ),

          minesBiggestWin: Math.max(
            0,
            Number(data.mines_biggest_win) || 0
          ),

          jokerPokerBiggestWin: Math.max(
            0,
            Number(
              data.joker_poker_biggest_win
            ) || 0
          ),

          blackjackBiggestWin: Math.max(
            0,
            Number(
              data.blackjack_biggest_win
            ) || 0
          ),
        };

        setStats(serverStats);

        localStorage.setItem(
          STATS_KEY,
          JSON.stringify(serverStats)
        );
      } catch {
        // Keep local stats if Supabase is unavailable.
      }
    }

    void loadSupabaseStats();

    return () => {
      cancelled = true;
    };
  }, [loaded]);

  // Save current balance.
  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      BALANCE_KEY,
      String(balance)
    );
  }, [balance, loaded]);

  // Automatically maintain all-time peak.
  useEffect(() => {
    if (!loaded) return;

    if (balance > peakBalance) {
      setPeakBalance(balance);

      localStorage.setItem(
        PEAK_KEY,
        String(balance)
      );

      // Persist the new peak to Supabase.
      void (async () => {
        try {
          const supabase = createClient();

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (
            userError ||
            !user
          ) {
            return;
          }

          const {
            data: profile,
            error: profileError,
          } = await supabase
            .from("profiles")
            .select("peak_balance")
            .eq("user_id", user.id)
            .maybeSingle();

          if (
            profileError ||
            !profile
          ) {
            return;
          }

          const serverPeak = Math.max(
            0,
            Number(profile.peak_balance) || 0
          );

          if (balance <= serverPeak) {
            return;
          }

          const { error: updateError } =
            await supabase
              .from("profiles")
              .update({
                peak_balance: balance,
              })
              .eq("user_id", user.id);

          if (updateError) {
            console.error(
              "Could not save peak balance:",
              updateError.message
            );
          }
        } catch (error) {
          console.error(
            "Could not save peak balance:",
            error
          );
        }
      })();
    }
  }, [balance, peakBalance, loaded]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      CLAIMED_KEY,
      JSON.stringify(claimedSkinIds)
    );
  }, [claimedSkinIds, loaded]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      DEPOSITED_KEY,
      JSON.stringify(depositedSkinIds)
    );
  }, [depositedSkinIds, loaded]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STATS_KEY,
      JSON.stringify(stats)
    );
  }, [stats, loaded]);

  function addEmeralds(amount: number) {
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }

    setBalance(
      (current) => current + amount
    );
  }

  function removeEmeralds(amount: number) {
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return false;
    }

    if (balance < amount) {
      return false;
    }

    setBalance(
      (current) => current - amount
    );

    return true;
  }

  function claimSkin(
    skinId: number,
    amount: number
  ) {
    if (claimedSkinIds.includes(skinId)) {
      return false;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return false;
    }

    setClaimedSkinIds(
      (current) => [
        ...current,
        skinId,
      ]
    );

    setBalance(
      (current) => current + amount
    );

    return true;
  }

  function depositSkin(
    skinId: number,
    amount: number
  ) {
    if (
      depositedSkinIds.includes(skinId)
    ) {
      return false;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return false;
    }

    setDepositedSkinIds(
      (current) => [
        ...current,
        skinId,
      ]
    );

    setBalance(
      (current) => current + amount
    );

    return true;
  }

  function recordGameResult(
    game: GameType,
    winAmount: number
  ) {
    const safeWinAmount =
      Number.isFinite(winAmount)
        ? Math.max(0, Math.floor(winAmount))
        : 0;

    // Update UI immediately.
    setStats((current) => {
      const next: GameStats = {
        ...current,
        gamesPlayed:
          current.gamesPlayed + 1,
        totalWon:
          current.totalWon + safeWinAmount,
      };

      if (game === "mines") {
        next.minesBiggestWin = Math.max(
          current.minesBiggestWin,
          safeWinAmount
        );
      }

      if (game === "joker-poker") {
        next.jokerPokerBiggestWin = Math.max(
          current.jokerPokerBiggestWin,
          safeWinAmount
        );
      }

      if (game === "blackjack") {
        next.blackjackBiggestWin = Math.max(
          current.blackjackBiggestWin,
          safeWinAmount
        );
      }

      return next;
    });

    // Persist the same result to Supabase.
    void (async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          return;
        }

        const { error } =
          await supabase.rpc(
            "record_game_result",
            {
              p_game: game,
              p_win_amount: safeWinAmount,
            }
          );

        if (error) {
          console.error(
            "Could not save game statistics:",
            error.message
          );
        }
      } catch (error) {
        console.error(
          "Could not save game statistics:",
          error
        );
      }
    })();
  }

  return (
    <EmeraldContext.Provider
      value={{
        balance,
        peakBalance,
        claimedSkinIds,
        depositedSkinIds,
        stats,
        addEmeralds,
        removeEmeralds,
        claimSkin,
        depositSkin,
        recordGameResult,
      }}
    >
      {children}
    </EmeraldContext.Provider>
  );
}

export function useEmeralds() {
  const context = useContext(EmeraldContext);

  if (!context) {
    throw new Error(
      "useEmeralds must be used inside EmeraldProvider"
    );
  }

  return context;
}
