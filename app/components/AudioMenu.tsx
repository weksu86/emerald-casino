"use client";

import { useEffect, useRef, useState } from "react";
import { useSharedSoundEnabled } from "../lib/useSoundSettings";

const MUSIC_STORAGE_KEY = "cs-ace-music-enabled";
const MUSIC_EVENT = "cs-ace-music-change";

function readMusicSetting() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUSIC_STORAGE_KEY) === "true";
}

export default function AudioMenu() {
  const [soundEnabled, setSoundEnabled] = useSharedSoundEnabled();
  const [musicEnabled, setMusicEnabledState] = useState(false);
  const [open, setOpen] = useState(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Luodaan taustamusiikki vain kerran.
  useEffect(() => {
    const music = new Audio("/audio/cs-ace-music.mp3");

    music.loop = true;
    music.volume = 0.22;
    music.preload = "auto";

    musicRef.current = music;

    const enabled = readMusicSetting();
    setMusicEnabledState(enabled);

    if (enabled) {
      music.play().catch(() => {
        // Selain voi estää automaattisen toiston,
        // kunnes käyttäjä klikkaa sivua.
      });
    }

    const sync = () => {
      const nextEnabled = readMusicSetting();

      setMusicEnabledState(nextEnabled);

      if (nextEnabled) {
        music.play().catch(() => {});
      } else {
        music.pause();
      }
    };

    window.addEventListener("storage", sync);
    window.addEventListener(MUSIC_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(MUSIC_EVENT, sync);

      music.pause();
      musicRef.current = null;

      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const setMusicEnabled = (enabled: boolean) => {
    setMusicEnabledState(enabled);

    window.localStorage.setItem(
      MUSIC_STORAGE_KEY,
      enabled ? "true" : "false"
    );

    if (enabled) {
      musicRef.current?.play().catch(() => {});
    } else {
      musicRef.current?.pause();
    }

    window.dispatchEvent(new Event(MUSIC_EVENT));
  };

  const showMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    setOpen(true);
  };

  const hideMenuSoon = () => {
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 180);
  };

  const speaker =
    soundEnabled || musicEnabled ? "🔊" : "🔇";

  return (
    <div
      className="fixed right-5 top-5 z-[300]"
      onMouseEnter={showMenu}
      onMouseLeave={hideMenuSoon}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#6C2BD9]/50 bg-[#15131D]/95 text-lg shadow-[0_0_24px_rgba(108,43,217,0.20)] backdrop-blur-md transition hover:border-[#F5C542]/70 hover:shadow-[0_0_28px_rgba(245,197,66,0.12)]"
        aria-label="Audio settings"
        title="Audio settings"
      >
        {speaker}
      </button>

      <div
        className={`absolute right-0 top-full pt-2 transition duration-150 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="w-72 overflow-hidden rounded-2xl border border-[#6C2BD9]/45 bg-[#101016]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_35px_rgba(108,43,217,0.12)] backdrop-blur-xl">
          <div className="mb-4 border-b border-white/5 pb-3">
            <div className="text-[9px] font-black uppercase tracking-[0.35em] text-[#6C2BD9]">
              CS ACE
            </div>

            <div className="mt-1 text-sm font-black text-white">
              AUDIO
            </div>
          </div>

          <AudioRow
            label="SOUND EFFECTS"
            description="Games & interface"
            enabled={soundEnabled}
            onToggle={() =>
              setSoundEnabled(!soundEnabled)
            }
          />

          <div className="my-2 h-px bg-white/5" />

          <AudioRow
            label="MUSIC"
            description="Background music"
            enabled={musicEnabled}
            onToggle={() =>
              setMusicEnabled(!musicEnabled)
            }
          />
        </div>
      </div>
    </div>
  );
}

function AudioRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.035]"
    >
      <div>
        <div className="text-xs font-black text-gray-200">
          {label}
        </div>

        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-600">
          {description}
        </div>
      </div>

      <div
        className={`relative h-7 w-12 rounded-full border transition ${
          enabled
            ? "border-[#F5C542]/60 bg-[#F5C542]/15"
            : "border-gray-700 bg-[#09090D]"
        }`}
      >
        <div
          className={`absolute top-1 h-[18px] w-[18px] rounded-full transition ${
            enabled
              ? "left-[25px] bg-[#F5C542] shadow-[0_0_12px_rgba(245,197,66,0.55)]"
              : "left-1 bg-gray-600"
          }`}
        />
      </div>
    </button>
  );
}