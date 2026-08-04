import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

const ProfileContext = createContext();

// Loads the current user's full profiles row (email/display_name/avatar_url/
// job_title/phone/hobby) — nothing did this before; AuthContext only ever
// exposed the raw Supabase auth user (email + id, nothing else). Only
// mounted inside AuthGate, so `user` is always set by the time this runs.
export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("profiles")
      .select("id, email, display_name, avatar_url, job_title, phone, hobby")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Error loading profile:", error);
        setProfile(data || null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Own-device edits stay optimistic; a Realtime echo of the same row
  // would otherwise just overwrite this with (functionally) the same data
  // a moment later — same reasoning as every other context's mutations.
  const updateProfile = async (fields) => {
    if (!user) return { error: "not signed in" };
    setProfile((prev) => (prev ? { ...prev, ...fields } : prev));
    const { error } = await supabase.from("profiles").update(fields).eq("id", user.id);
    if (error) console.error("Error updating profile:", error);
    return { error };
  };

  const value = { profile, loading, updateProfile };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
