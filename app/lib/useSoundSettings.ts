"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cs-ace-sound-enabled";
const EVENT_NAME = "cs-ace-sound-change";

function readSoundSetting() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "false";
}

export function useSharedSoundEnabled() {
  const [soundEnabled, setSoundEnabledState] = useState(true);

  useEffect(() => {
    setSoundEnabledState(readSoundSetting());

    const sync = () => {
      setSoundEnabledState(readSoundSetting());
    };

    window.addEventListener("storage", sync);
    window.addEventListener(EVENT_NAME, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT_NAME, sync);
    };
  }, []);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        enabled ? "true" : "false"
      );
      window.dispatchEvent(new Event(EVENT_NAME));
    }
  };

  return [soundEnabled, setSoundEnabled] as const;
}
