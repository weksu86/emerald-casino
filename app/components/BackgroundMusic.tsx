"use client";

import { useEffect, useRef } from "react";

const MUSIC_STORAGE_KEY = "cs-ace-music-enabled";
const MUSIC_EVENT = "cs-ace-music-change";

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export default function BackgroundMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioScheduledSourceNode[]>([]);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopMusic = () => {
    if (pulseTimerRef.current) {
      clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }

    for (const source of sourcesRef.current) {
      try { source.stop(); } catch {}
    }
    sourcesRef.current = [];

    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }
  };

  const startMusic = async () => {
    if (ctxRef.current || typeof window === "undefined") return;

    const AudioContextClass =
      window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.12;
    master.connect(ctx.destination);

    [73.42, 110, 146.83, 220].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = index % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = 650 + index * 130;
      gain.gain.value = index === 0 ? 0.13 : 0.075;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();
      sourcesRef.current.push(osc);
    });

    const pulse = () => {
      if (!ctxRef.current) return;
      const current = ctxRef.current;
      const now = current.currentTime;
      const osc = current.createOscillator();
      const gain = current.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(293.66, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.4);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.025, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 2.2);
    };

    pulse();
    pulseTimerRef.current = setInterval(pulse, 7000);
  };

  useEffect(() => {
    const sync = () => {
      const enabled =
        window.localStorage.getItem(MUSIC_STORAGE_KEY) === "true";

      if (enabled) void startMusic();
      else stopMusic();
    };

    sync();
    window.addEventListener(MUSIC_EVENT, sync);
    window.addEventListener("storage", sync);

    // Browser autoplay policy: if music was saved ON, start after first gesture.
    const resumeAfterGesture = () => {
      if (window.localStorage.getItem(MUSIC_STORAGE_KEY) === "true") {
        void startMusic();
      }
    };
    window.addEventListener("pointerdown", resumeAfterGesture);
    window.addEventListener("keydown", resumeAfterGesture);

    return () => {
      window.removeEventListener(MUSIC_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("pointerdown", resumeAfterGesture);
      window.removeEventListener("keydown", resumeAfterGesture);
      stopMusic();
    };
  }, []);

  return null;
}
