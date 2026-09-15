"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type EmeraldContextType = {
  balance: number;
  claimedSkinIds: number[];
  addEmeralds: (amount: number) => void;
  removeEmeralds: (amount: number) => boolean;
  claimSkin: (skinId: number, amount: number) => boolean;
};

const EmeraldContext = createContext<EmeraldContextType | undefined>(
  undefined
);

export function EmeraldProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [balance, setBalance] = useState(0);
  const [claimedSkinIds, setClaimedSkinIds] = useState<number[]>([]);

  function addEmeralds(amount: number) {
    setBalance((current) => current + amount);
  }

  function removeEmeralds(amount: number) {
    if (balance < amount) {
      return false;
    }

    setBalance((current) => current - amount);
    return true;
  }

  function claimSkin(skinId: number, amount: number) {
    if (claimedSkinIds.includes(skinId)) {
      return false;
    }

    setClaimedSkinIds((current) => [...current, skinId]);
    setBalance((current) => current + amount);

    return true;
  }

  return (
    <EmeraldContext.Provider
      value={{
        balance,
        claimedSkinIds,
        addEmeralds,
        removeEmeralds,
        claimSkin,
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