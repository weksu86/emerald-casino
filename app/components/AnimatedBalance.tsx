"use client";

import { useEffect, useRef, useState } from "react";
import { useEmeralds } from "../context/EmeraldContext";

export default function AnimatedBalance() {
  const { balance } = useEmeralds();
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [change, setChange] = useState(0);
  const [flashKey, setFlashKey] = useState(0);

  const previousBalanceRef = useRef(balance);
  const displayBalanceRef = useRef(balance);
  const frameRef = useRef<number | null>(null);
  const changeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    displayBalanceRef.current = displayBalance;
  }, [displayBalance]);

  useEffect(() => {
    const previousRealBalance = previousBalanceRef.current;
    const difference = balance - previousRealBalance;

    previousBalanceRef.current = balance;

    if (difference !== 0) {
      setChange(difference);
      setFlashKey((current) => current + 1);

      if (changeTimerRef.current) {
        clearTimeout(changeTimerRef.current);
      }

      changeTimerRef.current = setTimeout(() => {
        setChange(0);
      }, 1150);
    }

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    const from = displayBalanceRef.current;
    const to = balance;
    const distance = Math.abs(to - from);

    if (distance === 0) return;

    const duration = Math.min(900, Math.max(320, 320 + distance * 0.12));
    const startedAt = performance.now();

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (to - from) * eased);

      displayBalanceRef.current = next;
      setDisplayBalance(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        displayBalanceRef.current = to;
        setDisplayBalance(to);
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [balance]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      if (changeTimerRef.current) {
        clearTimeout(changeTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        key={flashKey}
        className={`font-black text-[#F5C542] transition ${
          change !== 0
            ? "drop-shadow-[0_0_10px_rgba(245,197,66,0.55)]"
            : ""
        }`}
      >
        💎 {displayBalance.toLocaleString("en-US")}
      </div>

      {change !== 0 && (
        <div
          key={`change-${flashKey}`}
          className={`pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap text-[10px] font-black ${
            change > 0
              ? "text-[#F5C542]"
              : "text-[#A78BFA]"
          }`}
          style={{
            animation: "csAceBalanceChange 1.15s ease-out forwards",
          }}
        >
          {change > 0 ? "+" : "−"}💎{" "}
          {Math.abs(change).toLocaleString("en-US")}
        </div>
      )}

      <style jsx>{`
        @keyframes csAceBalanceChange {
          0% {
            opacity: 0;
            transform: translateY(-2px) scale(0.94);
          }
          18% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          72% {
            opacity: 1;
            transform: translateY(2px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </div>
  );
}
