"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Profile = {
  user_id: string;
  username: string;
  peak_balance: number;
};

export default function PlayerProfile() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function initializePlayer() {
      setLoading(true);

      let {
        data: { user },
      } = await supabase.auth.getUser();

      // Ensimmäinen käynti -> anonymous account.
      if (!user) {
        const { data, error } =
          await supabase.auth.signInAnonymously();

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        user = data.user;
      }

      if (!user) {
        setError("Could not create player.");
        setLoading(false);
        return;
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id, username, peak_balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        setProfile(existingProfile);
      }

      setLoading(false);
    }

    initializePlayer();
  }, []);

  async function createProfile() {
    const cleanUsername = username.trim();

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (cleanUsername.length > 16) {
      setError("Username can be max 16 characters.");
      return;
    }

    if (!/^[A-Za-z0-9_]+$/.test(cleanUsername)) {
      setError(
        "Use only letters, numbers and underscore."
      );
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Player session not found.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        username: cleanUsername,
        peak_balance: 0,
      })
      .select(
        "user_id, username, peak_balance"
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        setError("Username is already taken.");
      } else {
        setError(error.message);
      }

      setSaving(false);
      return;
    }

    setProfile(data);
    setSaving(false);

    window.dispatchEvent(
      new Event("cs-ace-profile-ready")
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#08080D]">
        <div className="text-xs font-black tracking-[0.3em] text-[#6C2BD9]">
          CS ACE
        </div>
      </div>
    );
  }

  if (profile) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#08080D]/95 p-6 backdrop-blur-xl">
      <div className="w-full max-w-md rounded-3xl border border-[#6C2BD9]/40 bg-[#111116] p-8 shadow-[0_0_80px_rgba(108,43,217,0.15)]">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#6C2BD9]">
          CS ACE
        </div>

        <h1 className="mt-3 text-3xl font-black text-white">
          CHOOSE YOUR NAME
        </h1>

        <p className="mt-3 text-xs leading-5 text-gray-500">
          This will be your name on the CS ACE
          leaderboard.
        </p>

        <input
          value={username}
          maxLength={16}
          autoFocus
          onChange={(event) => {
            setUsername(event.target.value);
            setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              createProfile();
            }
          }}
          placeholder="Username"
          className="mt-6 w-full rounded-xl border border-[#6C2BD9]/35 bg-[#09090D] px-4 py-4 text-sm font-black text-white outline-none placeholder:text-gray-700 focus:border-[#F5C542]/60"
        />

        <div className="mt-2 text-[9px] font-bold text-gray-600">
          3–16 characters • letters • numbers • _
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={createProfile}
          className="mt-6 w-full rounded-xl bg-[#F5C542] px-5 py-4 text-xs font-black text-[#09090D] transition hover:brightness-110 disabled:opacity-50"
        >
          {saving
            ? "CREATING PLAYER..."
            : "START PLAYING"}
        </button>
      </div>
    </div>
  );
}