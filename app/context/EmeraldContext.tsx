"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type EmeraldContextType = {
  balance: number;
  peakBalance: number;
  claimedSkinIds: number[];
  depositedSkinIds: number[];

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
};

const BALANCE_KEY = "cs-ace-balance";
const PEAK_KEY = "cs-ace-peak-balance";
const CLAIMED_KEY = "cs-ace-claimed-skins";
const DEPOSITED_KEY = "cs-ace-deposited-skins";

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

  const [loaded, setLoaded] = useState(false);

  // Load saved player data once.
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
    } catch {
      setBalance(0);
      setPeakBalance(0);
      setClaimedSkinIds([]);
      setDepositedSkinIds([]);
    }

    setLoaded(true);
  }, []);

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

  return (
    <EmeraldContext.Provider
      value={{
        balance,
        peakBalance,
        claimedSkinIds,
        depositedSkinIds,
        addEmeralds,
        removeEmeralds,
        claimSkin,
        depositSkin,
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